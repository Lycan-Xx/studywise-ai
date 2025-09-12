
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'reminder';
  is_read: boolean;
  action_url?: string;
  metadata: Record<string, any>;
  created_at: string;
}

interface NotificationsStore {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;

  // Actions
  loadNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  
  // Real-time subscription
  subscribeToNotifications: () => void;
  unsubscribeFromNotifications: () => void;

  // Helper methods
  getUnreadNotifications: () => Notification[];
  getNotificationsByType: (type: Notification['type']) => Notification[];
}

export const useNotificationsStore = create<NotificationsStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,

  loadNotifications: async () => {
    set({ loading: true, error: null });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const notifications = data || [];
      const unreadCount = notifications.filter(n => !n.is_read).length;

      set({ 
        notifications,
        unreadCount,
        loading: false 
      });

    } catch (error) {
      console.error('Error loading notifications:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load notifications',
        loading: false
      });
    }
  },

  markAsRead: async (id) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;

      set(state => {
        const updatedNotifications = state.notifications.map(n => 
          n.id === id ? { ...n, is_read: true } : n
        );
        return {
          notifications: updatedNotifications,
          unreadCount: updatedNotifications.filter(n => !n.is_read).length
        };
      });

    } catch (error) {
      console.error('Error marking notification as read:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to mark notification as read'
      });
    }
  },

  markAllAsRead: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, is_read: true })),
        unreadCount: 0
      }));

    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to mark all notifications as read'
      });
    }
  },

  deleteNotification: async (id) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => {
        const notification = state.notifications.find(n => n.id === id);
        const filteredNotifications = state.notifications.filter(n => n.id !== id);
        return {
          notifications: filteredNotifications,
          unreadCount: notification && !notification.is_read 
            ? state.unreadCount - 1 
            : state.unreadCount
        };
      });

    } catch (error) {
      console.error('Error deleting notification:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to delete notification'
      });
    }
  },

  clearAllNotifications: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      set({
        notifications: [],
        unreadCount: 0
      });

    } catch (error) {
      console.error('Error clearing all notifications:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to clear all notifications'
      });
    }
  },

  subscribeToNotifications: () => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;

      supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            // Reload notifications when changes occur
            get().loadNotifications();
          }
        )
        .subscribe();
    });
  },

  unsubscribeFromNotifications: () => {
    supabase.removeAllChannels();
  },

  getUnreadNotifications: () => {
    return get().notifications.filter(n => !n.is_read);
  },

  getNotificationsByType: (type) => {
    return get().notifications.filter(n => n.type === type);
  },
}));

// Auto-subscribe when store is created
useNotificationsStore.getState().subscribeToNotifications();
