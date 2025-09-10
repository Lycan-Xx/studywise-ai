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

// No initial mock data - start with empty library
const initialMockTests: SavedTest[] = [];

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
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Just set loading to false - tests are loaded from localStorage via persist middleware
            set({ isLoading: false }, false, 'loadTests/success');
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
            throw error;
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