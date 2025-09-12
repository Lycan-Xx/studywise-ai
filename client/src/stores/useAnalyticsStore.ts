
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface UserActivity {
  id: string;
  user_id: string;
  activity_type: string;
  resource_type?: string;
  resource_id?: string;
  metadata: Record<string, any>;
  duration_seconds?: number;
  created_at: string;
}

export interface LearningStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date?: string;
  total_study_days: number;
  created_at: string;
  updated_at: string;
}

export interface StudyGoal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  goal_type: 'daily' | 'weekly' | 'monthly' | 'custom';
  target_value: number;
  current_value: number;
  unit: string;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsData {
  totalTests: number;
  totalTestsTaken: number;
  averageScore: number;
  totalStudyTime: number; // in minutes
  testsThisWeek: number;
  testsThisMonth: number;
  streakData: LearningStreak | null;
  recentActivity: UserActivity[];
  performanceByDifficulty: Record<string, { average: number; count: number }>;
  performanceBySubject: Record<string, { average: number; count: number }>;
  weeklyProgress: { date: string; tests: number; score: number }[];
}

interface AnalyticsStore {
  analytics: AnalyticsData | null;
  activities: UserActivity[];
  streak: LearningStreak | null;
  goals: StudyGoal[];
  loading: boolean;
  error: string | null;

  // Actions
  loadAnalytics: () => Promise<void>;
  loadActivities: (limit?: number) => Promise<void>;
  loadStreak: () => Promise<void>;
  loadGoals: () => Promise<void>;
  
  // Activity tracking
  trackActivity: (
    activityType: string,
    resourceType?: string,
    resourceId?: string,
    metadata?: Record<string, any>,
    durationSeconds?: number
  ) => Promise<void>;

  // Goals management
  createGoal: (goal: Omit<StudyGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<StudyGoal>;
  updateGoal: (id: string, updates: Partial<StudyGoal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  updateGoalProgress: (goalId: string, additionalValue: number) => Promise<void>;

  // Streak management
  updateStreak: () => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsStore>((set, get) => ({
  analytics: null,
  activities: [],
  streak: null,
  goals: [],
  loading: false,
  error: null,

  loadAnalytics: async () => {
    set({ loading: true, error: null });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Load comprehensive analytics data
      const [testsData, resultsData, activitiesData, streakData] = await Promise.all([
        supabase
          .from('tests')
          .select('id, difficulty, subject, created_at')
          .eq('user_id', user.id)
          .eq('is_deleted', false),
        
        supabase
          .from('test_results')
          .select('percentage, time_taken, completed_at, test_id, tests(difficulty, subject)')
          .eq('user_id', user.id),
        
        supabase
          .from('user_activity')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10),
        
        supabase
          .from('learning_streaks')
          .select('*')
          .eq('user_id', user.id)
          .single()
      ]);

      if (testsData.error) throw testsData.error;
      if (resultsData.error) throw resultsData.error;
      if (activitiesData.error && activitiesData.error.code !== 'PGRST116') throw activitiesData.error;
      if (streakData.error && streakData.error.code !== 'PGRST116') throw streakData.error;

      const tests = testsData.data || [];
      const results = resultsData.data || [];
      const activities = activitiesData.data || [];
      const streak = streakData.data;

      // Calculate analytics
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const testsThisWeek = results.filter(r => new Date(r.completed_at) >= weekAgo).length;
      const testsThisMonth = results.filter(r => new Date(r.completed_at) >= monthAgo).length;

      const averageScore = results.length > 0 
        ? results.reduce((sum, r) => sum + r.percentage, 0) / results.length 
        : 0;

      const totalStudyTime = activities
        .filter(a => a.duration_seconds)
        .reduce((sum, a) => sum + (a.duration_seconds || 0), 0) / 60; // Convert to minutes

      // Performance by difficulty
      const performanceByDifficulty: Record<string, { average: number; count: number }> = {};
      results.forEach(result => {
        const difficulty = (result as any).tests?.difficulty || 'unknown';
        if (!performanceByDifficulty[difficulty]) {
          performanceByDifficulty[difficulty] = { average: 0, count: 0 };
        }
        performanceByDifficulty[difficulty].average += result.percentage;
        performanceByDifficulty[difficulty].count += 1;
      });

      Object.keys(performanceByDifficulty).forEach(key => {
        performanceByDifficulty[key].average /= performanceByDifficulty[key].count;
      });

      // Performance by subject
      const performanceBySubject: Record<string, { average: number; count: number }> = {};
      results.forEach(result => {
        const subject = (result as any).tests?.subject || 'General';
        if (!performanceBySubject[subject]) {
          performanceBySubject[subject] = { average: 0, count: 0 };
        }
        performanceBySubject[subject].average += result.percentage;
        performanceBySubject[subject].count += 1;
      });

      Object.keys(performanceBySubject).forEach(key => {
        performanceBySubject[key].average /= performanceBySubject[key].count;
      });

      // Weekly progress
      const weeklyProgress: { date: string; tests: number; score: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayResults = results.filter(r => {
          const resultDate = new Date(r.completed_at);
          return resultDate.toDateString() === date.toDateString();
        });

        weeklyProgress.push({
          date: date.toISOString().split('T')[0],
          tests: dayResults.length,
          score: dayResults.length > 0 
            ? dayResults.reduce((sum, r) => sum + r.percentage, 0) / dayResults.length
            : 0
        });
      }

      const analytics: AnalyticsData = {
        totalTests: tests.length,
        totalTestsTaken: results.length,
        averageScore: Math.round(averageScore * 100) / 100,
        totalStudyTime: Math.round(totalStudyTime),
        testsThisWeek,
        testsThisMonth,
        streakData: streak,
        recentActivity: activities,
        performanceByDifficulty,
        performanceBySubject,
        weeklyProgress
      };

      set({ 
        analytics,
        activities,
        streak,
        loading: false 
      });

    } catch (error) {
      console.error('Error loading analytics:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load analytics',
        loading: false
      });
    }
  },

  loadActivities: async (limit = 50) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_activity')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      set({ activities: data || [] });
    } catch (error) {
      console.error('Error loading activities:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load activities'
      });
    }
  },

  loadStreak: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('learning_streaks')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      set({ streak: data });
    } catch (error) {
      console.error('Error loading streak:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load streak'
      });
    }
  },

  loadGoals: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('study_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ goals: data || [] });
    } catch (error) {
      console.error('Error loading goals:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load goals'
      });
    }
  },

  trackActivity: async (activityType, resourceType, resourceId, metadata = {}, durationSeconds) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_activity')
        .insert({
          user_id: user.id,
          activity_type: activityType,
          resource_type: resourceType,
          resource_id: resourceId,
          metadata,
          duration_seconds: durationSeconds,
        });

      if (error) throw error;

      // Update streak if it's a study activity
      if (['test_taken', 'flashcard_reviewed', 'material_studied'].includes(activityType)) {
        await get().updateStreak();
      }

      // Reload activities
      await get().loadActivities(10);
    } catch (error) {
      console.error('Error tracking activity:', error);
    }
  },

  createGoal: async (goalData) => {
    set({ loading: true, error: null });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('study_goals')
        .insert({
          ...goalData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        goals: [data, ...state.goals],
        loading: false
      }));

      return data;
    } catch (error) {
      console.error('Error creating goal:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to create goal',
        loading: false
      });
      throw error;
    }
  },

  updateGoal: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('study_goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        goals: state.goals.map(goal => 
          goal.id === id ? { ...goal, ...data } : goal
        )
      }));
    } catch (error) {
      console.error('Error updating goal:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to update goal'
      });
    }
  },

  deleteGoal: async (id) => {
    try {
      const { error } = await supabase
        .from('study_goals')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        goals: state.goals.filter(goal => goal.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting goal:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to delete goal'
      });
    }
  },

  updateGoalProgress: async (goalId, additionalValue) => {
    try {
      const goal = get().goals.find(g => g.id === goalId);
      if (!goal) return;

      const newValue = goal.current_value + additionalValue;

      await get().updateGoal(goalId, { current_value: newValue });
    } catch (error) {
      console.error('Error updating goal progress:', error);
    }
  },

  updateStreak: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      const { streak } = get();

      if (!streak) return;

      const lastActivityDate = streak.last_activity_date;
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      let newStreak = streak.current_streak;
      let newLongest = streak.longest_streak;
      let newTotalDays = streak.total_study_days;

      if (lastActivityDate === today) {
        // Already counted today, no change
        return;
      } else if (lastActivityDate === yesterday || !lastActivityDate) {
        // Continue streak or start new one
        newStreak += 1;
        newTotalDays += 1;
        newLongest = Math.max(newLongest, newStreak);
      } else {
        // Streak broken
        newStreak = 1;
        newTotalDays += 1;
      }

      const { error } = await supabase
        .from('learning_streaks')
        .update({
          current_streak: newStreak,
          longest_streak: newLongest,
          last_activity_date: today,
          total_study_days: newTotalDays,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      set(state => ({
        streak: state.streak ? {
          ...state.streak,
          current_streak: newStreak,
          longest_streak: newLongest,
          last_activity_date: today,
          total_study_days: newTotalDays,
        } : null
      }));

    } catch (error) {
      console.error('Error updating streak:', error);
    }
  },
}));
