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
  clearAllResults: () => void;

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
        // Initial state - start with empty results (no mock data)
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

            console.log('🎯 Saving result to results store:', newResult.testTitle, newResult.score);
            console.log('🎯 Result data:', JSON.stringify(newResult, null, 2));

            set(state => {
              const newResults = [...state.testResults, newResult];
              console.log('🎯 Updated results count:', newResults.length);
              console.log('🎯 All results:', newResults.map(r => ({ id: r.id, title: r.testTitle, score: r.score })));
              
              // Verify localStorage persistence
              try {
                const stored = localStorage.getItem('studywise-results');
                console.log('🎯 Current localStorage before update:', stored);
              } catch (e) {
                console.error('🎯 Error reading localStorage:', e);
              }

              return {
                testResults: newResults,
                currentResult: newResult,
                isLoading: false
              };
            }, false, 'saveResult/success');

            // Verify localStorage after update
            setTimeout(() => {
              try {
                const stored = localStorage.getItem('studywise-results');
                console.log('🎯 localStorage after update:', stored);
              } catch (e) {
                console.error('🎯 Error reading localStorage after update:', e);
              }
            }, 100);

          } catch (error) {
            console.error('🎯 Error saving result:', error);
            set({
              error: error instanceof Error ? error.message : 'Failed to save result',
              isLoading: false
            }, false, 'saveResult/error');
          }
        },

        loadResults: async () => {
          set({ isLoading: true, error: null }, false, 'loadResults/start');
          
          try {
            // Check localStorage directly
            const stored = localStorage.getItem('studywise-results');
            console.log('🎯 Loading results from localStorage:', stored);
            
            if (stored) {
              try {
                const parsed = JSON.parse(stored);
                console.log('🎯 Parsed localStorage data:', parsed);
                if (parsed.state && parsed.state.testResults) {
                  console.log('🎯 Found testResults in localStorage:', parsed.state.testResults.length, 'results');
                }
              } catch (e) {
                console.error('🎯 Error parsing localStorage:', e);
              }
            }
            
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 300));
            
            set({ isLoading: false }, false, 'loadResults/success');
          } catch (error) {
            console.error('🎯 Error loading results:', error);
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

        clearAllResults: () => {
          set({ testResults: [], currentResult: null }, false, 'clearAllResults');
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
          const results = get().testResults;
          console.log('Getting recent results from', results.length, 'total results');

          if (results.length === 0) return [];

          const sorted = [...results] // Create a copy to avoid mutating original array
            .sort((a, b) => {
              const dateA = new Date(a.completedAt).getTime();
              const dateB = new Date(b.completedAt).getTime();
              console.log('Comparing dates:', a.completedAt, 'vs', b.completedAt, '->', dateB - dateA);
              return dateB - dateA;
            })
            .slice(0, 10);

          console.log('Recent results count:', sorted.length);
          console.log('Recent results data:', sorted.map(r => ({ id: r.id, title: r.testTitle, score: r.score })));
          return sorted;
        },

        getScoreHistory: (testId) => {
          const results = testId 
            ? get().getResultsByTestId(testId)
            : get().testResults;
          
          return results
            .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())
            .map(result => ({
              date: result.completedAt.split('T')[0],
              score: result.score // Score is already a percentage
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
