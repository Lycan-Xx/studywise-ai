import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import type { TestConfig, Question } from '@/types';
import { aiService, type GenerateQuestionsOptions } from '@/services/aiService';
import { ApiService } from '@/services/apiService';

// New interfaces for course-based testing
export interface TestSession {
  id: string;
  testId: string;
  courseId: string;
  moduleId: string;
  moduleTitle: string;
  questions: Question[];
  answers: Record<string, string>;
  startTime: number;
  endTime: number | null;
  totalTime: number | null;
  questionsCount: number;
}

export interface TestResult {
  id: string;
  testId: string;
  courseId: string;
  moduleId: string;
  moduleTitle: string;
  userId: string;
  score: number;
  maxScore: number;
  percentage: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number;
  questionResults: Array<{
    questionId: string;
    question: string;
    selectedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    questionType: 'mcq' | 'truefalse';
  }>;
  aiAnalysis?: {
    id: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    nextFocusAreas: string[];
    generatedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface TestStore {
  // Legacy state (kept for backward compatibility)
  currentConfig: TestConfig | null;
  notes: string;
  generatedQuestions: Question[];
  isGenerating: boolean;
  error: string | null;
  questionCache: Record<string, { questions: Question[]; timestamp: number }>;

  // New course-based test state
  currentTest: TestSession | null;
  currentQuestion: Question | null;
  currentQuestionIndex: number;
  testResult: TestResult | null;
  isSubmitting: boolean;

  // Legacy actions
  updateConfig: (config: Partial<TestConfig>) => void;
  setConfig: (config: TestConfig) => void;
  setNotes: (notes: string) => void;
  generateQuestions: (config: TestConfig, notes: string) => Promise<{ usedCache: boolean }>;
  setQuestions: (questions: Question[]) => void;
  clearTest: () => void;
  setError: (error: string | null) => void;
  clearCache: () => void;

  // New test actions
  initializeTest: (courseId: string, moduleId: string, moduleTitle: string, questions: Question[]) => void;
  setAnswer: (questionId: string, answer: string) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  goToQuestion: (index: number) => void;
  submitTest: (testId: string, totalTime: number) => Promise<TestResult>;
  setTestResult: (result: TestResult) => void;
  requestAIAnalysis: (testId: string) => Promise<void>;
  resetNewTest: () => void;
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
      id: String(i),
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
        currentTest: null,
        currentQuestion: null,
        currentQuestionIndex: 0,
        testResult: null,
        isSubmitting: false,

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
                id: String(index + 1), // Use sequential IDs for internal use
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
        },

        // New course-based test actions
        initializeTest: (courseId, moduleId, moduleTitle, questions) => {
          const testSession: TestSession = {
            id: `test-${Date.now()}`,
            testId: `test-${Date.now()}`,
            courseId,
            moduleId,
            moduleTitle,
            questions,
            answers: {},
            startTime: Date.now(),
            endTime: null,
            totalTime: null,
            questionsCount: questions.length,
          };

          set({
            currentTest: testSession,
            currentQuestion: questions[0] || null,
            currentQuestionIndex: 0,
            error: null,
          }, false, 'initializeTest');
        },

        setAnswer: (questionId, answer) => {
          set((state) => {
            if (!state.currentTest) return state;

            return {
              currentTest: {
                ...state.currentTest,
                answers: {
                  ...state.currentTest.answers,
                  [questionId]: answer,
                },
              },
            };
          }, false, 'setAnswer');
        },

        nextQuestion: () => {
          set((state) => {
            if (!state.currentTest) return state;

            const nextIndex = state.currentQuestionIndex + 1;
            if (nextIndex < state.currentTest.questions.length) {
              return {
                currentQuestionIndex: nextIndex,
                currentQuestion: state.currentTest.questions[nextIndex],
              };
            }

            return state;
          }, false, 'nextQuestion');
        },

        previousQuestion: () => {
          set((state) => {
            const prevIndex = state.currentQuestionIndex - 1;
            if (prevIndex >= 0 && state.currentTest) {
              return {
                currentQuestionIndex: prevIndex,
                currentQuestion: state.currentTest.questions[prevIndex],
              };
            }

            return state;
          }, false, 'previousQuestion');
        },

        goToQuestion: (index) => {
          set((state) => {
            if (!state.currentTest || index < 0 || index >= state.currentTest.questions.length) {
              return state;
            }

            return {
              currentQuestionIndex: index,
              currentQuestion: state.currentTest.questions[index],
            };
          }, false, 'goToQuestion');
        },

        submitTest: async (testId, totalTime) => {
          set({ isSubmitting: true, error: null });

          try {
            const { currentTest } = get();
            if (!currentTest) throw new Error('No active test session');

            const answers = currentTest.answers;

            const result = await ApiService.submitTest({
              testId,
              answers,
              timeSpent: totalTime,
            });

            set({
              testResult: result,
              isSubmitting: false,
            }, false, 'submitTest');

            return result;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to submit test';
            set({ error: errorMessage, isSubmitting: false });
            throw error;
          }
        },

        setTestResult: (result) => {
          set({ testResult: result }, false, 'setTestResult');
        },

        requestAIAnalysis: async (testId) => {
          set({ isGenerating: true, error: null });

          try {
            const analysis = await ApiService.requestAIAnalysis(testId);
            set((state) => {
              if (!state.testResult || state.testResult.testId !== testId) return state;

              return {
                testResult: {
                  ...state.testResult,
                  aiAnalysis: analysis,
                },
                isGenerating: false,
              };
            }, false, 'requestAIAnalysis');
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to request analysis';
            set({ error: errorMessage, isGenerating: false });
            throw error;
          }
        },

        resetNewTest: () => {
          set({
            currentTest: null,
            currentQuestion: null,
            currentQuestionIndex: 0,
            testResult: null,
            error: null,
          }, false, 'resetNewTest');
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
