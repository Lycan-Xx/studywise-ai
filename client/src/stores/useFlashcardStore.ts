
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface FlashcardDeck {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  color: string;
  is_public: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Flashcard {
  id: string;
  user_id: string;
  deck_id: string;
  front: string;
  back: string;
  difficulty: 'easy' | 'medium' | 'hard';
  next_review: string;
  review_count: number;
  ease_factor: number;
  interval_days: number;
  last_reviewed?: string;
  created_at: string;
  updated_at: string;
}

export interface FlashcardReview {
  id: string;
  user_id: string;
  flashcard_id: string;
  quality: number; // 0-5 SM-2 algorithm quality
  response_time?: number;
  reviewed_at: string;
}

interface FlashcardStore {
  decks: FlashcardDeck[];
  flashcards: Flashcard[];
  currentDeck: FlashcardDeck | null;
  currentCard: Flashcard | null;
  reviewQueue: Flashcard[];
  loading: boolean;
  error: string | null;

  // Deck actions
  loadDecks: () => Promise<void>;
  createDeck: (deck: Omit<FlashcardDeck, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<FlashcardDeck>;
  updateDeck: (id: string, updates: Partial<FlashcardDeck>) => Promise<void>;
  deleteDeck: (id: string) => Promise<void>;
  setCurrentDeck: (deck: FlashcardDeck | null) => void;

  // Flashcard actions
  loadFlashcards: (deckId: string) => Promise<void>;
  createFlashcard: (flashcard: Omit<Flashcard, 'id' | 'user_id' | 'next_review' | 'review_count' | 'ease_factor' | 'interval_days' | 'created_at' | 'updated_at'>) => Promise<Flashcard>;
  updateFlashcard: (id: string, updates: Partial<Flashcard>) => Promise<void>;
  deleteFlashcard: (id: string) => Promise<void>;

  // Review actions
  loadReviewQueue: (deckId?: string) => Promise<void>;
  reviewCard: (cardId: string, quality: number, responseTime?: number) => Promise<void>;
  setCurrentCard: (card: Flashcard | null) => void;
  getNextReviewCard: () => Flashcard | null;

  // Spaced repetition helpers
  calculateNextReview: (quality: number, currentInterval: number, easeFactor: number) => {
    newInterval: number;
    newEaseFactor: number;
    nextReviewDate: Date;
  };
}

export const useFlashcardStore = create<FlashcardStore>((set, get) => ({
  decks: [],
  flashcards: [],
  currentDeck: null,
  currentCard: null,
  reviewQueue: [],
  loading: false,
  error: null,

  // Deck actions
  loadDecks: async () => {
    set({ loading: true, error: null });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('flashcard_decks')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;

      set({ decks: data || [], loading: false });
    } catch (error) {
      console.error('Error loading decks:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load decks',
        loading: false
      });
    }
  },

  createDeck: async (deckData) => {
    set({ loading: true, error: null });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('flashcard_decks')
        .insert({
          ...deckData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        decks: [...state.decks, data],
        loading: false
      }));

      return data;
    } catch (error) {
      console.error('Error creating deck:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to create deck',
        loading: false
      });
      throw error;
    }
  },

  updateDeck: async (id, updates) => {
    set({ loading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('flashcard_decks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        decks: state.decks.map(deck => 
          deck.id === id ? { ...deck, ...data } : deck
        ),
        loading: false
      }));
    } catch (error) {
      console.error('Error updating deck:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to update deck',
        loading: false
      });
    }
  },

  deleteDeck: async (id) => {
    set({ loading: true, error: null });

    try {
      const { error } = await supabase
        .from('flashcard_decks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        decks: state.decks.filter(deck => deck.id !== id),
        currentDeck: state.currentDeck?.id === id ? null : state.currentDeck,
        loading: false
      }));
    } catch (error) {
      console.error('Error deleting deck:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to delete deck',
        loading: false
      });
    }
  },

  setCurrentDeck: (deck) => {
    set({ currentDeck: deck });
  },

  // Flashcard actions
  loadFlashcards: async (deckId) => {
    set({ loading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('deck_id', deckId)
        .order('created_at');

      if (error) throw error;

      set({ flashcards: data || [], loading: false });
    } catch (error) {
      console.error('Error loading flashcards:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load flashcards',
        loading: false
      });
    }
  },

  createFlashcard: async (flashcardData) => {
    set({ loading: true, error: null });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('flashcards')
        .insert({
          ...flashcardData,
          user_id: user.id,
          next_review: new Date().toISOString(),
          review_count: 0,
          ease_factor: 2.5,
          interval_days: 1,
        })
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        flashcards: [...state.flashcards, data],
        loading: false
      }));

      return data;
    } catch (error) {
      console.error('Error creating flashcard:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to create flashcard',
        loading: false
      });
      throw error;
    }
  },

  updateFlashcard: async (id, updates) => {
    set({ loading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('flashcards')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        flashcards: state.flashcards.map(card => 
          card.id === id ? { ...card, ...data } : card
        ),
        loading: false
      }));
    } catch (error) {
      console.error('Error updating flashcard:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to update flashcard',
        loading: false
      });
    }
  },

  deleteFlashcard: async (id) => {
    set({ loading: true, error: null });

    try {
      const { error } = await supabase
        .from('flashcards')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        flashcards: state.flashcards.filter(card => card.id !== id),
        currentCard: state.currentCard?.id === id ? null : state.currentCard,
        loading: false
      }));
    } catch (error) {
      console.error('Error deleting flashcard:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to delete flashcard',
        loading: false
      });
    }
  },

  // Review actions
  loadReviewQueue: async (deckId) => {
    set({ loading: true, error: null });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('flashcards')
        .select('*')
        .eq('user_id', user.id)
        .lte('next_review', new Date().toISOString());

      if (deckId) {
        query = query.eq('deck_id', deckId);
      }

      const { data, error } = await query.order('next_review');

      if (error) throw error;

      set({ reviewQueue: data || [], loading: false });
    } catch (error) {
      console.error('Error loading review queue:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load review queue',
        loading: false
      });
    }
  },

  reviewCard: async (cardId, quality, responseTime) => {
    set({ loading: true, error: null });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const card = get().flashcards.find(c => c.id === cardId) || 
                   get().reviewQueue.find(c => c.id === cardId);
      
      if (!card) throw new Error('Card not found');

      // Calculate new values using SM-2 algorithm
      const { newInterval, newEaseFactor, nextReviewDate } = get().calculateNextReview(
        quality,
        card.interval_days,
        card.ease_factor
      );

      // Update flashcard
      const { data: updatedCard, error: cardError } = await supabase
        .from('flashcards')
        .update({
          next_review: nextReviewDate.toISOString(),
          review_count: card.review_count + 1,
          ease_factor: newEaseFactor,
          interval_days: newInterval,
          last_reviewed: new Date().toISOString(),
        })
        .eq('id', cardId)
        .select()
        .single();

      if (cardError) throw cardError;

      // Record review
      const { error: reviewError } = await supabase
        .from('flashcard_reviews')
        .insert({
          user_id: user.id,
          flashcard_id: cardId,
          quality,
          response_time: responseTime,
          previous_ease_factor: card.ease_factor,
          new_ease_factor: newEaseFactor,
          previous_interval: card.interval_days,
          new_interval: newInterval,
        });

      if (reviewError) throw reviewError;

      // Update state
      set(state => ({
        flashcards: state.flashcards.map(c => 
          c.id === cardId ? updatedCard : c
        ),
        reviewQueue: state.reviewQueue.filter(c => c.id !== cardId),
        loading: false
      }));
    } catch (error) {
      console.error('Error reviewing card:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to review card',
        loading: false
      });
    }
  },

  setCurrentCard: (card) => {
    set({ currentCard: card });
  },

  getNextReviewCard: () => {
    const { reviewQueue } = get();
    return reviewQueue.length > 0 ? reviewQueue[0] : null;
  },

  // SM-2 Spaced Repetition Algorithm
  calculateNextReview: (quality, currentInterval, easeFactor) => {
    let newEaseFactor = easeFactor;
    let newInterval = currentInterval;

    if (quality >= 3) {
      // Correct response
      if (currentInterval === 1) {
        newInterval = 6;
      } else {
        newInterval = Math.round(currentInterval * easeFactor);
      }

      newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      if (newEaseFactor < 1.3) newEaseFactor = 1.3;
    } else {
      // Incorrect response
      newInterval = 1;
    }

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

    return {
      newInterval,
      newEaseFactor: Math.round(newEaseFactor * 100) / 100,
      nextReviewDate,
    };
  },
}));
