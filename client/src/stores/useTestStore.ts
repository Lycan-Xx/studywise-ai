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

// Mock question generation function (will be replaced with AI later)
const mockGenerateQuestions = (config: TestConfig, notes: string): Question[] => {
  const mcqQuestions = [
    {
      question: "What is the main function of the mitochondria in a cell?",
      options: ["Protein synthesis", "Energy production", "Waste disposal", "Cell division"],
      correctAnswer: "Energy production"
    },
    {
      question: "Which of the following is NOT a characteristic of a well-designed user interface?",
      options: ["Consistency", "Clarity", "Efficiency", "Complexity"],
      correctAnswer: "Complexity"
    },
    {
      question: "What is the primary purpose of photosynthesis in plants?",
      options: ["Water absorption", "Converting sunlight to energy", "Root growth", "Seed production"],
      correctAnswer: "Converting sunlight to energy"
    },
    {
      question: "Which programming paradigm focuses on objects and classes?",
      options: ["Functional programming", "Object-oriented programming", "Procedural programming", "Logic programming"],
      correctAnswer: "Object-oriented programming"
    },
    {
      question: "What is the chemical symbol for gold?",
      options: ["Go", "Gd", "Au", "Ag"],
      correctAnswer: "Au"
    }
  ];

  const trueFalseQuestions = [
    {
      question: "User experience design focuses primarily on visual aesthetics rather than functionality.",
      options: ["True", "False"],
      correctAnswer: "False"
    },
    {
      question: "The mitochondria is known as the powerhouse of the cell.",
      options: ["True", "False"],
      correctAnswer: "True"
    },
    {
      question: "JavaScript is a compiled programming language.",
      options: ["True", "False"],
      correctAnswer: "False"
    },
    {
      question: "Water boils at 100 degrees Celsius at sea level.",
      options: ["True", "False"],
      correctAnswer: "True"
    },
    {
      question: "The Earth is the third planet from the Sun.",
      options: ["True", "False"],
      correctAnswer: "True"
    }
  ];

  const questionPool = config.questionType === 'mcq' ? mcqQuestions : trueFalseQuestions;
  const questions: Question[] = [];

  // Generate more realistic source text snippets
  const sampleParagraphs = [
    "Mitochondria are membrane-bound organelles found in most eukaryotic cells. They are often called the 'powerhouses' of the cell because they generate most of the cell's supply of adenosine triphosphate (ATP), which is used as a source of chemical energy.",
    "User interface design principles emphasize clarity, consistency, and efficiency over complexity. A well-designed interface should be intuitive and help users accomplish their goals without unnecessary confusion or cognitive load.",
    "Photosynthesis is the process by which plants convert light energy, usually from the sun, into chemical energy stored in glucose. This process is fundamental to life on Earth as it produces the oxygen we breathe.",
    "Object-oriented programming (OOP) is a programming paradigm based on the concept of objects, which can contain data (attributes) and code (methods). This approach allows for better code organization and reusability.",
    "Gold is a chemical element with the symbol Au (from Latin aurum) and atomic number 79. It is a dense, soft, malleable metal that has been valued by humans throughout history."
  ];

  for (let i = 1; i <= config.numberOfQuestions; i++) {
    const questionData = questionPool[(i - 1) % questionPool.length];
    const paragraphIndex = (i - 1) % sampleParagraphs.length;
    const sourceText = sampleParagraphs[paragraphIndex];

    // Calculate realistic source text snippets
    const noteChunks = Math.ceil(notes.length / 500);
    const chunkIndex = (i - 1) % noteChunks;
    const sourceOffset = Math.floor((notes.length * chunkIndex) / noteChunks);

    questions.push({
      id: i,
      type: config.questionType,
      question: questionData.question,
      options: questionData.options,
      correctAnswer: questionData.correctAnswer,
      sourceText: sourceText,
      sourceOffset: sourceOffset,
      sourceLength: sourceText.length
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

            // Fallback to mock questions if AI fails
            const generatedQuestions = mockGenerateQuestions(config, notes);
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
