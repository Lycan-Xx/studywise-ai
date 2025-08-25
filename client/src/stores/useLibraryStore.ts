import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { SavedTest } from '@/types';

interface LibraryStore {
  // State
  savedTests: SavedTest[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadTests: () => Promise<void>;
  saveTest: (test: Omit<SavedTest, 'id' | 'createdDate'>) => Promise<void>;
  deleteTest: (testId: string) => Promise<void>;
  updateTest: (testId: string, updates: Partial<SavedTest>) => Promise<void>;
  getTestById: (testId: string) => SavedTest | null;
  
  // Computed getters
  get testCount(): number;
  get recentTests(): SavedTest[];
}

// Initial mock data
const initialMockTests: SavedTest[] = [
  {
    id: "1",
    title: "History Test 1",
    subject: "History",
    createdDate: "2024-01-15",
    questionCount: 15,
    config: {
      subject: "History",
      topics: "World War II, Cold War",
      questionType: 'mcq',
      numberOfQuestions: 15
    },
    questions: [],
    notes: "Lorem Ipsum Text:\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.\n\nExcepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.\n\nNemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.\n\nThe text is a standard Lorem Ipsum placeholder text used in design and typography to demonstrate the visual form of a document or a typeface without relying on meaningful content. It's derived from Cicero's \"de Finibus Bonorum et Malorum\" (The Extremes of Good and Evil), written in 45 BC.",
    gradient: "from-green-600 to-green-700",
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=128&q=80"
  },
  {
    id: "2",
    title: "Math Test 2",
    subject: "Math",
    createdDate: "2024-01-16",
    questionCount: 20,
    config: {
      subject: "Math",
      topics: "Algebra, Calculus",
      questionType: 'mcq',
      numberOfQuestions: 20
    },
    questions: [],
    notes: "Mathematics Study Notes:\n\nAlgebra fundamentals including linear equations, quadratic formulas, and polynomial operations. Key concepts include solving for unknown variables, graphing linear functions, and understanding the relationship between algebraic expressions and their geometric representations.\n\nCalculus basics covering derivatives and integrals. The derivative represents the rate of change of a function, while integrals calculate the area under curves. These concepts are fundamental to understanding motion, optimization problems, and advanced mathematical modeling.",
    gradient: "from-orange-400 to-orange-500",
    image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=128&q=80"
  },
  {
    id: "3",
    title: "Science Test 3",
    subject: "Science",
    createdDate: "2024-01-17",
    questionCount: 18,
    config: {
      subject: "Science",
      topics: "Biology, Chemistry",
      questionType: 'true-false',
      numberOfQuestions: 18
    },
    questions: [],
    notes: "Biology and Chemistry Notes:\n\nCell structure and function: Prokaryotic vs eukaryotic cells, organelles and their functions, cell membrane transport mechanisms. The mitochondria is the powerhouse of the cell, responsible for ATP production through cellular respiration.\n\nChemical bonding: Ionic, covalent, and metallic bonds. Understanding electron configuration and how atoms interact to form compounds. The periodic table organization helps predict element properties and bonding behavior.",
    gradient: "from-green-400 to-green-500",
    image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=128&q=80"
  }
];

export const useLibraryStore = create<LibraryStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        savedTests: [],
        isLoading: false,
        error: null,

        // Actions
        loadTests: async () => {
          set({ isLoading: true, error: null }, false, 'loadTests/start');
          
          try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // If no tests in storage, use initial mock data
            const currentTests = get().savedTests;
            if (currentTests.length === 0) {
              set({ 
                savedTests: initialMockTests, 
                isLoading: false 
              }, false, 'loadTests/success');
            } else {
              set({ isLoading: false }, false, 'loadTests/success');
            }
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to load tests',
              isLoading: false 
            }, false, 'loadTests/error');
          }
        },

        saveTest: async (testData) => {
          set({ isLoading: true, error: null }, false, 'saveTest/start');
          
          try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 300));
            
            const newTest: SavedTest = {
              ...testData,
              id: Date.now().toString(),
              createdDate: new Date().toISOString().split('T')[0]
            };
            
            set(state => ({ 
              savedTests: [...state.savedTests, newTest],
              isLoading: false 
            }), false, 'saveTest/success');
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to save test',
              isLoading: false 
            }, false, 'saveTest/error');
          }
        },

        deleteTest: async (testId) => {
          set({ isLoading: true, error: null }, false, 'deleteTest/start');
          
          try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 300));
            
            set(state => ({ 
              savedTests: state.savedTests.filter(test => test.id !== testId),
              isLoading: false 
            }), false, 'deleteTest/success');
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to delete test',
              isLoading: false 
            }, false, 'deleteTest/error');
          }
        },

        updateTest: async (testId, updates) => {
          set({ isLoading: true, error: null }, false, 'updateTest/start');
          
          try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 300));
            
            set(state => ({ 
              savedTests: state.savedTests.map(test => 
                test.id === testId ? { ...test, ...updates } : test
              ),
              isLoading: false 
            }), false, 'updateTest/success');
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to update test',
              isLoading: false 
            }, false, 'updateTest/error');
          }
        },

        getTestById: (testId) => {
          return get().savedTests.find(test => test.id === testId) || null;
        },

        // Computed getters
        get testCount() {
          return get().savedTests.length;
        },

        get recentTests() {
          return get().savedTests
            .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
            .slice(0, 5);
        }
      }),
      {
        name: 'studywise-library',
        storage: createJSONStorage(() => localStorage),
      }
    ),
    { name: 'library-store' }
  )
);