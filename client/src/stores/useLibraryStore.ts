
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';

export interface Test {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  subject?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question_count: number;
  question_types: string[];
  tags: string[];
  metadata: Record<string, any>;
  version: number;
  is_deleted: boolean;
  estimated_duration?: number;
  passing_score: number;
  created_at: string;
  updated_at: string;
}

export interface StudyMaterial {
  id: string;
  user_id: string;
  title: string;
  content: string;
  file_type?: string;
  file_url?: string;
  file_size?: number;
  file_metadata: Record<string, any>;
  tags: string[];
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface CollectionItem {
  id: string;
  collection_id: string;
  item_type: 'test' | 'flashcard_deck' | 'study_material';
  item_id: string;
  order_index: number;
  added_at: string;
}

interface LibraryStore {
  tests: Test[];
  studyMaterials: StudyMaterial[];
  collections: Collection[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  selectedTags: string[];
  selectedCategory: string | null;

  // Actions
  loadTests: () => Promise<void>;
  loadStudyMaterials: () => Promise<void>;
  loadCollections: () => Promise<void>;
  
  // Test actions
  createTest: (test: Partial<Test>) => Promise<Test>;
  updateTest: (id: string, updates: Partial<Test>) => Promise<void>;
  deleteTest: (id: string) => Promise<void>;
  
  // Study material actions
  createStudyMaterial: (material: Partial<StudyMaterial>) => Promise<StudyMaterial>;
  updateStudyMaterial: (id: string, updates: Partial<StudyMaterial>) => Promise<void>;
  deleteStudyMaterial: (id: string) => Promise<void>;
  
  // Collection actions
  createCollection: (collection: Omit<Collection, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<Collection>;
  updateCollection: (id: string, updates: Partial<Collection>) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  addToCollection: (collectionId: string, itemType: CollectionItem['item_type'], itemId: string) => Promise<void>;
  removeFromCollection: (collectionId: string, itemId: string) => Promise<void>;
  
  // Search and filter
  setSearchQuery: (query: string) => void;
  setSelectedTags: (tags: string[]) => void;
  setSelectedCategory: (categoryId: string | null) => void;
  searchContent: (query: string) => Promise<{ tests: Test[]; materials: StudyMaterial[] }>;
  
  // Getters
  getFilteredTests: () => Test[];
  getFilteredMaterials: () => StudyMaterial[];
  getAllTags: () => string[];
}

export const useLibraryStore = create<LibraryStore>()(
  persist(
    (set, get) => ({
      tests: [],
      studyMaterials: [],
      collections: [],
      loading: false,
      error: null,
      searchQuery: '',
      selectedTags: [],
      selectedCategory: null,

      loadTests: async () => {
        set({ loading: true, error: null });

        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('User not authenticated');

          const { data, error } = await supabase
            .from('tests')
            .select(`
              *,
              test_categories (
                category_id,
                categories (
                  id,
                  name,
                  color
                )
              )
            `)
            .eq('user_id', user.id)
            .eq('is_deleted', false)
            .order('updated_at', { ascending: false });

          if (error) throw error;

          set({ tests: data || [], loading: false });
        } catch (error) {
          console.error('Error loading tests:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to load tests',
            loading: false
          });
        }
      },

      loadStudyMaterials: async () => {
        set({ loading: true, error: null });

        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('User not authenticated');

          const { data, error } = await supabase
            .from('study_materials')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_deleted', false)
            .order('updated_at', { ascending: false });

          if (error) throw error;

          set({ studyMaterials: data || [], loading: false });
        } catch (error) {
          console.error('Error loading study materials:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to load study materials',
            loading: false
          });
        }
      },

      loadCollections: async () => {
        set({ loading: true, error: null });

        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('User not authenticated');

          const { data, error } = await supabase
            .from('collections')
            .select(`
              *,
              collection_items (
                id,
                item_type,
                item_id,
                order_index
              )
            `)
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false });

          if (error) throw error;

          set({ collections: data || [], loading: false });
        } catch (error) {
          console.error('Error loading collections:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to load collections',
            loading: false
          });
        }
      },

      createTest: async (testData) => {
        set({ loading: true, error: null });

        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('User not authenticated');

          const { data, error } = await supabase
            .from('tests')
            .insert({
              ...testData,
              user_id: user.id,
            })
            .select()
            .single();

          if (error) throw error;

          set(state => ({
            tests: [data, ...state.tests],
            loading: false
          }));

          return data;
        } catch (error) {
          console.error('Error creating test:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to create test',
            loading: false
          });
          throw error;
        }
      },

      updateTest: async (id, updates) => {
        set({ loading: true, error: null });

        try {
          const { data, error } = await supabase
            .from('tests')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

          if (error) throw error;

          set(state => ({
            tests: state.tests.map(test => 
              test.id === id ? { ...test, ...data } : test
            ),
            loading: false
          }));
        } catch (error) {
          console.error('Error updating test:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to update test',
            loading: false
          });
        }
      },

      deleteTest: async (id) => {
        set({ loading: true, error: null });

        try {
          const { error } = await supabase
            .from('tests')
            .update({ is_deleted: true })
            .eq('id', id);

          if (error) throw error;

          set(state => ({
            tests: state.tests.filter(test => test.id !== id),
            loading: false
          }));
        } catch (error) {
          console.error('Error deleting test:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to delete test',
            loading: false
          });
        }
      },

      createStudyMaterial: async (materialData) => {
        set({ loading: true, error: null });

        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('User not authenticated');

          const { data, error } = await supabase
            .from('study_materials')
            .insert({
              ...materialData,
              user_id: user.id,
            })
            .select()
            .single();

          if (error) throw error;

          set(state => ({
            studyMaterials: [data, ...state.studyMaterials],
            loading: false
          }));

          return data;
        } catch (error) {
          console.error('Error creating study material:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to create study material',
            loading: false
          });
          throw error;
        }
      },

      updateStudyMaterial: async (id, updates) => {
        set({ loading: true, error: null });

        try {
          const { data, error } = await supabase
            .from('study_materials')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

          if (error) throw error;

          set(state => ({
            studyMaterials: state.studyMaterials.map(material => 
              material.id === id ? { ...material, ...data } : material
            ),
            loading: false
          }));
        } catch (error) {
          console.error('Error updating study material:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to update study material',
            loading: false
          });
        }
      },

      deleteStudyMaterial: async (id) => {
        set({ loading: true, error: null });

        try {
          const { error } = await supabase
            .from('study_materials')
            .update({ is_deleted: true })
            .eq('id', id);

          if (error) throw error;

          set(state => ({
            studyMaterials: state.studyMaterials.filter(material => material.id !== id),
            loading: false
          }));
        } catch (error) {
          console.error('Error deleting study material:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to delete study material',
            loading: false
          });
        }
      },

      createCollection: async (collectionData) => {
        set({ loading: true, error: null });

        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('User not authenticated');

          const { data, error } = await supabase
            .from('collections')
            .insert({
              ...collectionData,
              user_id: user.id,
            })
            .select()
            .single();

          if (error) throw error;

          set(state => ({
            collections: [data, ...state.collections],
            loading: false
          }));

          return data;
        } catch (error) {
          console.error('Error creating collection:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to create collection',
            loading: false
          });
          throw error;
        }
      },

      updateCollection: async (id, updates) => {
        set({ loading: true, error: null });

        try {
          const { data, error } = await supabase
            .from('collections')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

          if (error) throw error;

          set(state => ({
            collections: state.collections.map(collection => 
              collection.id === id ? { ...collection, ...data } : collection
            ),
            loading: false
          }));
        } catch (error) {
          console.error('Error updating collection:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to update collection',
            loading: false
          });
        }
      },

      deleteCollection: async (id) => {
        set({ loading: true, error: null });

        try {
          const { error } = await supabase
            .from('collections')
            .delete()
            .eq('id', id);

          if (error) throw error;

          set(state => ({
            collections: state.collections.filter(collection => collection.id !== id),
            loading: false
          }));
        } catch (error) {
          console.error('Error deleting collection:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to delete collection',
            loading: false
          });
        }
      },

      addToCollection: async (collectionId, itemType, itemId) => {
        set({ loading: true, error: null });

        try {
          // Get current max order index
          const { data: existingItems } = await supabase
            .from('collection_items')
            .select('order_index')
            .eq('collection_id', collectionId)
            .order('order_index', { ascending: false })
            .limit(1);

          const maxOrder = existingItems?.[0]?.order_index ?? -1;

          const { error } = await supabase
            .from('collection_items')
            .insert({
              collection_id: collectionId,
              item_type: itemType,
              item_id: itemId,
              order_index: maxOrder + 1,
            });

          if (error) throw error;

          // Reload collections to get updated data
          await get().loadCollections();
        } catch (error) {
          console.error('Error adding to collection:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to add to collection',
            loading: false
          });
        }
      },

      removeFromCollection: async (collectionId, itemId) => {
        set({ loading: true, error: null });

        try {
          const { error } = await supabase
            .from('collection_items')
            .delete()
            .eq('collection_id', collectionId)
            .eq('item_id', itemId);

          if (error) throw error;

          // Reload collections to get updated data
          await get().loadCollections();
        } catch (error) {
          console.error('Error removing from collection:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to remove from collection',
            loading: false
          });
        }
      },

      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },

      setSelectedTags: (tags) => {
        set({ selectedTags: tags });
      },

      setSelectedCategory: (categoryId) => {
        set({ selectedCategory: categoryId });
      },

      searchContent: async (query) => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('User not authenticated');

          const [testsResult, materialsResult] = await Promise.all([
            supabase
              .from('tests')
              .select('*')
              .eq('user_id', user.id)
              .eq('is_deleted', false)
              .textSearch('search_vector', query),
            
            supabase
              .from('study_materials')
              .select('*')
              .eq('user_id', user.id)
              .eq('is_deleted', false)
              .textSearch('search_vector', query)
          ]);

          if (testsResult.error) throw testsResult.error;
          if (materialsResult.error) throw materialsResult.error;

          return {
            tests: testsResult.data || [],
            materials: materialsResult.data || []
          };
        } catch (error) {
          console.error('Error searching content:', error);
          throw error;
        }
      },

      getFilteredTests: () => {
        const { tests, searchQuery, selectedTags, selectedCategory } = get();
        
        return tests.filter(test => {
          // Search query filter
          if (searchQuery && !test.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
              !test.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
          }
          
          // Tags filter
          if (selectedTags.length > 0 && !selectedTags.some(tag => test.tags.includes(tag))) {
            return false;
          }
          
          // Category filter (would need to check test_categories relationship)
          // This is a simplified version
          if (selectedCategory) {
            // Implementation would check the test_categories relationship
            return true; // Placeholder
          }
          
          return true;
        });
      },

      getFilteredMaterials: () => {
        const { studyMaterials, searchQuery, selectedTags } = get();
        
        return studyMaterials.filter(material => {
          // Search query filter
          if (searchQuery && !material.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
              !material.content.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
          }
          
          // Tags filter
          if (selectedTags.length > 0 && !selectedTags.some(tag => material.tags.includes(tag))) {
            return false;
          }
          
          return true;
        });
      },

      getAllTags: () => {
        const { tests, studyMaterials } = get();
        const allTags = new Set<string>();
        
        tests.forEach(test => test.tags.forEach(tag => allTags.add(tag)));
        studyMaterials.forEach(material => material.tags.forEach(tag => allTags.add(tag)));
        
        return Array.from(allTags).sort();
      },
    }),
    {
      name: 'library-store',
      partialize: (state) => ({
        searchQuery: state.searchQuery,
        selectedTags: state.selectedTags,
        selectedCategory: state.selectedCategory,
      }),
    }
  )
);
