
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface Category {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  created_at: string;
  updated_at: string;
}

interface CategoriesStore {
  categories: Category[];
  loading: boolean;
  error: string | null;

  // Actions
  loadCategories: () => Promise<void>;
  createCategory: (category: Omit<Category, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<Category>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  getCategoryById: (id: string) => Category | undefined;
}

export const useCategoriesStore = create<CategoriesStore>((set, get) => ({
  categories: [],
  loading: false,
  error: null,

  loadCategories: async () => {
    set({ loading: true, error: null });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;

      set({ categories: data || [], loading: false });
    } catch (error) {
      console.error('Error loading categories:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load categories',
        loading: false
      });
    }
  },

  createCategory: async (categoryData) => {
    set({ loading: true, error: null });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('categories')
        .insert({
          ...categoryData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        categories: [...state.categories, data],
        loading: false
      }));

      return data;
    } catch (error) {
      console.error('Error creating category:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to create category',
        loading: false
      });
      throw error;
    }
  },

  updateCategory: async (id, updates) => {
    set({ loading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        categories: state.categories.map(cat => 
          cat.id === id ? { ...cat, ...data } : cat
        ),
        loading: false
      }));
    } catch (error) {
      console.error('Error updating category:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to update category',
        loading: false
      });
    }
  },

  deleteCategory: async (id) => {
    set({ loading: true, error: null });

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        categories: state.categories.filter(cat => cat.id !== id),
        loading: false
      }));
    } catch (error) {
      console.error('Error deleting category:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to delete category',
        loading: false
      });
    }
  },

  getCategoryById: (id) => {
    return get().categories.find(cat => cat.id === id);
  },
}));
