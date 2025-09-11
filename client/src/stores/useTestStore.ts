import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import type { TestConfig, Question } from '@/types';
import { aiService, type GenerateQuestionsOptions } from '@/services/aiService';

interface TestStore {
  // State
  currentConfig: TestConfig | null;
  notes: string;
  generatedQuestions: Question[];
  isGenerating: boolean;
  error: string | null;
  questionCache: Record<string, { questions: Question[]; timestamp: number }>;

  // Actions
  updateConfig: (config: Partial<TestConfig>) => void;
  setConfig: (config: TestConfig) => void;
  setNotes: (notes: string) => void;
  generateQuestions: (config: TestConfig, notes: string) => Promise<{ usedCache: boolean }>;
  setQuestions: (questions: Question[]) => void;
  clearTest: () => void;
  setError: (error: string | null) => void;
  clearCache: () => void;
}

// Helper function to generate cache key
const generateCacheKey = (config: TestConfig, notes: string): string => {
  // Create a hash of the notes content and relevant config properties
  const relevantConfig = {
    questionType: config.questionType,
    numberOfQuestions: config.numberOfQuestions,
    difficulty: config.difficulty,
    topics: config.topics
  };

  // Simple hash function that can handle Unicode characters
  const simpleHash = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  };

  const cacheString = JSON.stringify({
    config: relevantConfig,
    notesHash: simpleHash(notes).substring(0, 10) // Use simple hash and truncate
  });

  return simpleHash(cacheString).substring(0, 16); // Return a 16-character hash
};

// Production-ready error handling for question generation
const createErrorQuestions = (config: TestConfig, errorMessage: string): Question[] => {
  const questions: Question[] = [];

  for (let i = 1; i <= config.numberOfQuestions; i++) {
    questions.push({
      id: i,
      type: config.questionType,
      question: `Unable to generate question ${i}. ${errorMessage}`,
      options: config.questionType === 'mcq' ? ['Option A', 'Option B', 'Option C', 'Option D'] : ['True', 'False'],
      correctAnswer: config.questionType === 'mcq' ? 'Option A' : 'True',
      sourceText: 'Error occurred during question generation',
      sourceOffset: 0,
      sourceLength: 0
    });
  }

  return questions;
};

export const useTestStore = create<TestStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentConfig: null,
        notes: "",
        generatedQuestions: [],
        isGenerating: false,
        error: null,
        questionCache: {},

        // Actions
        updateConfig: (updates) => {
          const currentConfig = get().currentConfig;
          const newConfig = currentConfig ? { ...currentConfig, ...updates } : updates as TestConfig;
          set({ currentConfig: newConfig }, false, 'updateConfig');
        },

        setConfig: (config) => {
          set({ currentConfig: config }, false, 'setConfig');
        },

        setNotes: (notes) => {
          // Clear cache when notes change to ensure fresh questions are generated
          set({ notes, questionCache: {} }, false, 'setNotes');
        },

        generateQuestions: async (config: TestConfig, notes: string) => {
          const { setError, setQuestions, questionCache } = get();

          // Generate cache key based on notes content and config
          const cacheKey = generateCacheKey(config, notes);

          // Check if we have cached questions that are less than 24 hours old
          const cachedEntry = questionCache[cacheKey];
          const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

          if (cachedEntry && (Date.now() - cachedEntry.timestamp) < CACHE_DURATION) {
            console.log('Using cached questions for key:', cacheKey);
            setQuestions(cachedEntry.questions);
            set({ isGenerating: false, error: null });
            return { usedCache: true };
          }

          set({ isGenerating: true, error: null });

          try {
            console.log('Starting question generation with config:', config);
            console.log('Notes length:', notes.length);

            const aiResponse = await aiService.generateQuestions({
              content: notes,
              difficulty: config.difficulty || 'medium', // Default to medium if not set
              questionCount: config.numberOfQuestions,
              questionTypes: [config.questionType],
              subject: config.title, // Use title as subject for AI generation
              focus: config.topics
            });

            console.log('AI Response received:', aiResponse);

            // Convert AI response to internal format
            const convertedQuestions = aiResponse.questions.map((q, index) => {
              let options = q.options || [];

              // Ensure True/False questions have the correct options
              if (config.questionType === 'true-false' && (!options || options.length === 0)) {
                options = ['True', 'False'];
              }

              return {
                id: index + 1, // Use sequential IDs for internal use
                type: config.questionType, // Use the config type (mcq or true-false)
                question: q.question,
                options: options,
                correctAnswer: Array.isArray(q.correctAnswer) ? q.correctAnswer[0] : q.correctAnswer || '',
                sourceText: q.sourceText || 'Generated from your content',
                sourceOffset: 0, // Default offset
                sourceLength: q.sourceText?.length || 0 // Length of source text
              };
            });

            // Cache the generated questions
            set(state => ({
              questionCache: {
                ...state.questionCache,
                [cacheKey]: {
                  questions: convertedQuestions,
                  timestamp: Date.now()
                }
              }
            }), false, 'cacheQuestions');

            setQuestions(convertedQuestions);
            return { usedCache: false };
          } catch (error) {
            console.error('Failed to generate questions:', error);
            setError(`Failed to generate questions: ${error instanceof Error ? error.message : 'Unknown error'}`);

            // Create error questions if AI fails
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            const generatedQuestions = createErrorQuestions(config, errorMessage);
            setQuestions(generatedQuestions);

            // Also cache the fallback questions
            set(state => ({
              questionCache: {
                ...state.questionCache,
                [cacheKey]: {
                  questions: generatedQuestions,
                  timestamp: Date.now()
                }
              }
            }), false, 'cacheFallbackQuestions');

            return { usedCache: false };
          } finally {
            set({ isGenerating: false });
          }
        },

        setQuestions: (questions) => {
          set({ generatedQuestions: questions }, false, 'setQuestions');
        },

        clearTest: () => {
          set({
            currentConfig: null,
            generatedQuestions: [],
            isGenerating: false,
            error: null
          }, false, 'clearTest');
        },

        setError: (error) => {
          set({ error }, false, 'setError');
        },

        clearCache: () => {
          set({ questionCache: {} }, false, 'clearCache');
        }
      }),
      {
        name: 'studywise-test',
        storage: createJSONStorage(() => localStorage),
      }
    ),
    { name: 'test-store' }
  )
);
