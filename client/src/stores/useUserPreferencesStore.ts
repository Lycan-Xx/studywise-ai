
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';

export interface UserPreferences {
  id?: string;
  user_id?: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  email_notifications: boolean;
  push_notifications: boolean;
  study_reminders: boolean;
  difficulty_preference: 'easy' | 'medium' | 'hard';
  daily_goal_minutes: number;
  spaced_repetition_enabled: boolean;
  auto_play_audio: boolean;
  show_explanations: boolean;
}

interface UserPreferencesStore {
  preferences: UserPreferences | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  loadPreferences: () => Promise<void>;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  resetPreferences: () => Promise<void>;
}

export const useUserPreferencesStore = create<UserPreferencesStore>()(
  persist(
    (set, get) => ({
      preferences: null,
      loading: false,
      error: null,

      loadPreferences: async () => {
        set({ loading: true, error: null });
        
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('User not authenticated');

          const { data, error } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (error && error.code !== 'PGRST116') {
            throw error;
          }

          // If no preferences exist, create default ones
          if (!data) {
            const defaultPreferences: Partial<UserPreferences> = {
              user_id: user.id,
              theme: 'system',
              language: 'en',
              email_notifications: true,
              push_notifications: true,
              study_reminders: true,
              difficulty_preference: 'medium',
              daily_goal_minutes: 30,
              spaced_repetition_enabled: true,
              auto_play_audio: false,
              show_explanations: true,
            };

            const { data: newPrefs, error: insertError } = await supabase
              .from('user_preferences')
              .insert(defaultPreferences)
              .select()
              .single();

            if (insertError) throw insertError;
            set({ preferences: newPrefs, loading: false });
          } else {
            set({ preferences: data, loading: false });
          }
        } catch (error) {
          console.error('Error loading preferences:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load preferences',
            loading: false 
          });
        }
      },

      updatePreferences: async (updates: Partial<UserPreferences>) => {
        set({ loading: true, error: null });

        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('User not authenticated');

          const { data, error } = await supabase
            .from('user_preferences')
            .update(updates)
            .eq('user_id', user.id)
            .select()
            .single();

          if (error) throw error;

          set({ 
            preferences: data, 
            loading: false 
          });
        } catch (error) {
          console.error('Error updating preferences:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update preferences',
            loading: false 
          });
        }
      },

      resetPreferences: async () => {
        set({ loading: true, error: null });

        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('User not authenticated');

          const defaultPreferences = {
            theme: 'system' as const,
            language: 'en',
            email_notifications: true,
            push_notifications: true,
            study_reminders: true,
            difficulty_preference: 'medium' as const,
            daily_goal_minutes: 30,
            spaced_repetition_enabled: true,
            auto_play_audio: false,
            show_explanations: true,
          };

          const { data, error } = await supabase
            .from('user_preferences')
            .update(defaultPreferences)
            .eq('user_id', user.id)
            .select()
            .single();

          if (error) throw error;

          set({ 
            preferences: data,
            loading: false 
          });
        } catch (error) {
          console.error('Error resetting preferences:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to reset preferences',
            loading: false 
          });
        }
      },
    }),
    {
      name: 'user-preferences-store',
      partialize: (state) => ({ 
        preferences: state.preferences 
      }),
    }
  )
);
