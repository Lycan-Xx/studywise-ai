import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { TestResult, Question } from '@/types';
import { supabase } from '@/lib/supabase';

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
  devtools(
    (set, get) => ({
      testResults: [],
      currentResult: null,
      isLoading: false,
      error: null,
      totalTestsTaken: 0,
      averageScore: 0,
      bestScore: 0,
      recentResults: [],

      saveResult: async (result: TestResult) => {
        console.log("🎯 Saving result to database:", result.testTitle, result.score);

        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('User not authenticated');

          // First, ensure the test exists in the database
          let testId = result.testId;

          // Check if test exists, if not create it
          const { data: existingTest } = await supabase
            .from('tests')
            .select('id')
            .eq('id', testId)
            .single();

          if (!existingTest) {
            // Create a minimal test entry
            const { data: newTest, error: testError } = await supabase
              .from('tests')
              .insert({
                id: testId,
                user_id: user.id,
                title: result.testTitle,
                description: 'Generated test',
                question_count: result.totalQuestions,
                question_types: ['mcq'], // Default
                metadata: {
                  questions: result.questions,
                  generated: true
                }
              })
              .select()
              .single();

            if (testError) {
              console.error('Error creating test:', testError);
              // Continue with saving result even if test creation fails
            } else {
              console.log('Created test in database:', newTest.id);
            }
          }

          // Save result to database
          const { data: savedResult, error: resultError } = await supabase
            .from('test_results')
            .insert({
              user_id: user.id,
              test_id: testId,
              score: result.score,
              total_questions: result.totalQuestions,
              correct_answers: Object.keys(result.correctAnswers).length,
              time_spent: result.timeSpent,
              user_answers: result.userAnswers,
              correct_answers_data: result.correctAnswers,
              insights: result.aiInsight ? { ai_insight: result.aiInsight } : {},
              completed_at: result.completedAt
            })
            .select()
            .single();

          if (resultError) {
            console.error('Error saving result to database:', resultError);
            // If database save fails, still update local state for immediate feedback
            set((state) => {
              const newResults = [...state.testResults, result];
              const stats = calculateStats(newResults);

              return {
                ...state,
                testResults: newResults,
                currentResult: result,
                isLoading: false,
                error: `Database save failed: ${resultError.message}. Results saved locally.`,
                ...stats,
              };
            });
            return;
          }

          console.log('Result saved to database:', savedResult.id);

          // Update local state
          set((state) => {
            const newResults = [...state.testResults, { ...result, id: savedResult.id }];
            const stats = calculateStats(newResults);

            return {
              ...state,
              testResults: newResults,
              currentResult: { ...result, id: savedResult.id },
              isLoading: false,
              error: null,
              ...stats,
            };
          });

        } catch (error) {
          console.error('Failed to save result:', error);
          // Even if database fails, update local state
          set((state) => {
            const newResults = [...state.testResults, result];
            const stats = calculateStats(newResults);

            return {
              ...state,
              testResults: newResults,
              currentResult: result,
              isLoading: false,
              error: error instanceof Error ? `Database error: ${error.message}. Results saved locally.` : 'Failed to save result',
              ...stats,
            };
          });
        }
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

      loadResults: async () => {
        set({ isLoading: true, error: null });

        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            set({ isLoading: false });
            return;
          }

          // Load results from database - try with basic columns first
          const { data: resultsData, error } = await supabase
            .from('test_results')
            .select(`
              id,
              test_id,
              score,
              total_questions,
              time_spent,
              user_answers,
              correct_answers_data,
              insights,
              completed_at,
              tests!inner (
                title
              )
            `)
            .eq('user_id', user.id)
            .order('completed_at', { ascending: false });

          if (error) {
            console.error('Database query error:', error);
            // If table doesn't exist or has wrong schema, fall back to empty results
            set({
              testResults: [],
              isLoading: false,
              error: 'Database schema not properly set up. Please run the database migrations.',
              totalTestsTaken: 0,
              averageScore: 0,
              bestScore: 0,
              recentResults: []
            });
            return;
          }

          // Transform database results to client format
          const testResults: TestResult[] = resultsData.map(row => ({
            id: row.id,
            testId: row.test_id,
            testTitle: (row.tests as any)?.title || 'Unknown Test',
            userAnswers: row.user_answers || {},
            correctAnswers: row.correct_answers_data || {},
            score: row.score,
            totalQuestions: row.total_questions,
            timeSpent: row.time_spent,
            completedAt: row.completed_at,
            questions: [], // We don't store questions in results, could load separately if needed
            aiInsight: row.insights?.ai_insight
          }));

          const stats = calculateStats(testResults);

          set({
            testResults,
            isLoading: false,
            error: null,
            ...stats
          });

          console.log("🎯 Loaded", testResults.length, "results from database");

        } catch (error) {
          console.error('Error loading results:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to load results',
            isLoading: false,
            testResults: [],
            totalTestsTaken: 0,
            averageScore: 0,
            bestScore: 0,
            recentResults: []
          });
        }
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
    { name: 'results-store' }
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
