import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { TestConfig, Question } from '@/types';

interface TestStore {
  // State
  currentConfig: TestConfig | null;
  generatedQuestions: Question[];
  isGenerating: boolean;
  error: string | null;

  // Actions
  updateConfig: (config: Partial<TestConfig>) => void;
  setConfig: (config: TestConfig) => void;
  generateQuestions: (config: TestConfig, notes: string) => Promise<void>;
  setQuestions: (questions: Question[]) => void;
  clearTest: () => void;
  setError: (error: string | null) => void;
}

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
    
    // Calculate realistic source position
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
    (set, get) => ({
      // Initial state
      currentConfig: null,
      generatedQuestions: [],
      isGenerating: false,
      error: null,

      // Actions
      updateConfig: (updates) => {
        const currentConfig = get().currentConfig;
        const newConfig = currentConfig ? { ...currentConfig, ...updates } : updates as TestConfig;
        set({ currentConfig: newConfig }, false, 'updateConfig');
      },

      setConfig: (config) => {
        set({ currentConfig: config }, false, 'setConfig');
      },

      generateQuestions: async (config, notes) => {
        set({ isGenerating: true, error: null }, false, 'generateQuestions/start');
        
        try {
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          const questions = mockGenerateQuestions(config, notes);
          set({ 
            generatedQuestions: questions, 
            isGenerating: false 
          }, false, 'generateQuestions/success');
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to generate questions',
            isGenerating: false 
          }, false, 'generateQuestions/error');
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
      }
    }),
    { name: 'test-store' }
  )
);