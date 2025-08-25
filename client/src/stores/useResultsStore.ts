import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { TestResult, Question } from '@/types';

interface ResultsStore {
  // State
  testResults: TestResult[];
  currentResult: TestResult | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  saveResult: (result: Omit<TestResult, 'id' | 'completedAt'>) => Promise<void>;
  loadResults: () => Promise<void>;
  getResultById: (resultId: string) => TestResult | null;
  getResultsByTestId: (testId: string) => TestResult[];
  deleteResult: (resultId: string) => Promise<void>;
  setCurrentResult: (result: TestResult | null) => void;

  // Analytics getters
  get totalTestsTaken(): number;
  get averageScore(): number;
  get bestScore(): number;
  get recentResults(): TestResult[];
  getScoreHistory: (testId?: string) => { date: string; score: number }[];
}

export const useResultsStore = create<ResultsStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        testResults: [],
        currentResult: null,
        isLoading: false,
        error: null,

        // Actions
        saveResult: async (resultData) => {
          set({ isLoading: true, error: null }, false, 'saveResult/start');
          
          try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 300));
            
            const newResult: TestResult = {
              ...resultData,
              id: Date.now().toString(),
              completedAt: new Date().toISOString()
            };
            
            set(state => ({ 
              testResults: [...state.testResults, newResult],
              currentResult: newResult,
              isLoading: false 
            }), false, 'saveResult/success');
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to save result',
              isLoading: false 
            }, false, 'saveResult/error');
          }
        },

        loadResults: async () => {
          set({ isLoading: true, error: null }, false, 'loadResults/start');
          
          try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 300));
            
            set({ isLoading: false }, false, 'loadResults/success');
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to load results',
              isLoading: false 
            }, false, 'loadResults/error');
          }
        },

        getResultById: (resultId) => {
          return get().testResults.find(result => result.id === resultId) || null;
        },

        getResultsByTestId: (testId) => {
          return get().testResults.filter(result => result.testId === testId);
        },

        deleteResult: async (resultId) => {
          set({ isLoading: true, error: null }, false, 'deleteResult/start');
          
          try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 300));
            
            set(state => ({ 
              testResults: state.testResults.filter(result => result.id !== resultId),
              isLoading: false 
            }), false, 'deleteResult/success');
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to delete result',
              isLoading: false 
            }, false, 'deleteResult/error');
          }
        },

        setCurrentResult: (result) => {
          set({ currentResult: result }, false, 'setCurrentResult');
        },

        // Analytics getters
        get totalTestsTaken() {
          return get().testResults.length;
        },

        get averageScore() {
          const results = get().testResults;
          if (results.length === 0) return 0;
          
          const totalScore = results.reduce((sum, result) => sum + result.score, 0);
          return Math.round((totalScore / results.length) * 100) / 100;
        },

        get bestScore() {
          const results = get().testResults;
          if (results.length === 0) return 0;
          
          return Math.max(...results.map(result => result.score));
        },

        get recentResults() {
          return get().testResults
            .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
            .slice(0, 10);
        },

        getScoreHistory: (testId) => {
          const results = testId 
            ? get().getResultsByTestId(testId)
            : get().testResults;
          
          return results
            .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())
            .map(result => ({
              date: result.completedAt.split('T')[0],
              score: (result.score / result.totalQuestions) * 100
            }));
        }
      }),
      {
        name: 'studywise-results',
        storage: createJSONStorage(() => localStorage),
      }
    ),
    { name: 'results-store' }
  )
);