import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { TestResult, Question } from '@/types';

interface ResultsStore {
  testResults: TestResult[];
  currentResult: TestResult | null;
  isLoading: boolean;
  error: string | null;
  totalTestsTaken: number;
  averageScore: number;
  bestScore: number;
  recentResults: TestResult[];

  // Actions
  saveResult: (result: TestResult) => void;
  setCurrentResult: (result: TestResult | null) => void;
  clearResults: () => void;
  loadResults: () => void;
  getResultById: (id: string) => TestResult | undefined;
  updateStats: () => void;
}

export const useResultsStore = create<ResultsStore>()(
  persist(
    (set, get) => ({
      testResults: [],
      currentResult: null,
      isLoading: true,
      error: null,
      totalTestsTaken: 0,
      averageScore: 0,
      bestScore: 0,
      recentResults: [],

      saveResult: (result: TestResult) => {
        console.log("🎯 Saving result to results store:", result.testTitle, result.score);
        console.log("🎯 Result data:", JSON.stringify(result, null, 2));

        set((state) => {
          const newResults = [...state.testResults, result];
          const stats = calculateStats(newResults);

          const newState = {
            ...state,
            testResults: newResults,
            currentResult: result,
            isLoading: false,
            error: null,
            ...stats,
          };

          console.log("🎯 Updated results count:", newResults.length);
          console.log("🎯 All results:", newResults);

          return newState;
        });

        // Log localStorage state before and after
        const before = localStorage.getItem('results-store');
        console.log("🎯 Current localStorage before update:", before);

        // Force a re-render by accessing the state
        setTimeout(() => {
          const after = localStorage.getItem('results-store');
          console.log("🎯 localStorage after update:", after);
        }, 100);
      },

      setCurrentResult: (result: TestResult | null) => {
        set({ currentResult: result });
      },

      clearResults: () => {
        set({
          testResults: [],
          currentResult: null,
          totalTestsTaken: 0,
          averageScore: 0,
          bestScore: 0,
          recentResults: [],
          error: null,
        });
      },

      loadResults: () => {
        const state = get();
        const stats = calculateStats(state.testResults);
        set({
          isLoading: false,
          ...stats
        });
      },

      updateStats: () => {
        const state = get();
        const stats = calculateStats(state.testResults);
        set(stats);
      },

      getResultById: (id: string) => {
        const state = get();
        return state.testResults.find(result => result.id === id || result.testId === id);
      },
    }),
    {
      name: 'results-store',
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log("🎯 Store rehydrated with", state.testResults.length, "results");
          state.loadResults();
        }
      },
    }
  )
);

function calculateStats(results: TestResult[]) {
  if (results.length === 0) {
    return {
      totalTestsTaken: 0,
      averageScore: 0,
      bestScore: 0,
      recentResults: [],
    };
  }

  const totalScore = results.reduce((sum, result) => sum + result.score, 0);
  const averageScore = Math.round(totalScore / results.length);
  const bestScore = Math.max(...results.map(r => r.score));
  const recentResults = results
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .slice(0, 5);

  return {
    totalTestsTaken: results.length,
    averageScore,
    bestScore,
    recentResults,
  };
}