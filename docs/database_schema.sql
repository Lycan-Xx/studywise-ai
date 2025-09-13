-- =====================================================
-- COMPREHENSIVE STUDYWISE AI DATABASE SCHEMA
-- Combines all functionality from existing schemas
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- =====================================================
-- CORE USER MANAGEMENT TABLES
-- =====================================================

-- User profiles table (enhanced from all schemas)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  learning_goal TEXT,
  timezone TEXT DEFAULT 'UTC',
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  preferences JSONB DEFAULT '{"theme": "system", "notifications": {"email": true, "push": false, "study_reminders": true}}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User preferences table (from schema 2)
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  notifications JSONB DEFAULT '{"email": true, "push": false, "study_reminders": true}',
  study_reminders BOOLEAN DEFAULT true,
  default_test_difficulty TEXT DEFAULT 'medium' CHECK (default_test_difficulty IN ('easy', 'medium', 'hard')),
  spaced_repetition_settings JSONB DEFAULT '{"max_daily_reviews": 50, "new_cards_per_day": 20}',
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CONTENT ORGANIZATION SYSTEM
-- =====================================================

-- Categories for organizing content
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT,
  is_system BOOLEAN DEFAULT false, -- for default categories
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(COALESCE(user_id, '00000000-0000-0000-0000-000000000000'), name)
);

-- Collections for grouping related content
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  share_code TEXT UNIQUE,
  cover_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Collection items (polymorphic relationship)
CREATE TABLE IF NOT EXISTS public.collection_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('test', 'material', 'flashcard_deck')),
  item_id UUID NOT NULL,
  order_index INTEGER DEFAULT 0,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(collection_id, item_type, item_id)
);

-- =====================================================
-- STUDY MATERIALS SYSTEM
-- =====================================================

-- Study materials table (enhanced)
CREATE TABLE IF NOT EXISTS public.study_materials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  file_type TEXT, -- pdf, docx, txt, etc.
  file_url TEXT, -- If stored in Supabase Storage
  file_size BIGINT,
  mime_type TEXT,
  file_metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  search_vector tsvector,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TESTING SYSTEM
-- =====================================================

-- Tests table (comprehensive)
CREATE TABLE IF NOT EXISTS public.tests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  question_count INTEGER NOT NULL DEFAULT 0,
  question_types TEXT[] NOT NULL DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  version INTEGER DEFAULT 1,
  estimated_duration INTEGER, -- in minutes
  passing_score INTEGER DEFAULT 70,
  search_vector tsvector,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_question_count_positive CHECK (question_count >= 0)
);

-- Test categories (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.test_categories (
  test_id UUID REFERENCES public.tests(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (test_id, category_id)
);

-- Questions table (enhanced)
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  test_id UUID REFERENCES public.tests(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('multiple-choice', 'true-false', 'short-answer', 'essay')) NOT NULL,
  question TEXT NOT NULL,
  options TEXT[], -- For multiple choice questions
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  points INTEGER DEFAULT 1,
  order_index INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_options_for_multiple_choice CHECK (
    (type != 'multiple-choice') OR 
    (type = 'multiple-choice' AND options IS NOT NULL AND array_length(options, 1) >= 2)
  )
);

-- Test sessions table (for tracking test attempts)
CREATE TABLE IF NOT EXISTS public.test_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  test_id UUID REFERENCES public.tests(id) ON DELETE CASCADE NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  time_limit INTEGER, -- in minutes
  current_question_index INTEGER DEFAULT 0,
  answers JSONB DEFAULT '{}', -- Store answers as JSON
  status TEXT CHECK (status IN ('in_progress', 'completed', 'paused')) DEFAULT 'in_progress'
);

-- Test results table (comprehensive)
CREATE TABLE IF NOT EXISTS public.test_results (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  test_id UUID REFERENCES public.tests(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES public.test_sessions(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  total_possible INTEGER NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  time_spent INTEGER, -- in seconds
  time_taken INTEGER, -- alias for compatibility
  user_answers JSONB DEFAULT '{}',
  correct_answers_data JSONB DEFAULT '{}',
  answers JSONB NOT NULL, -- Store all answers and correctness
  insights JSONB DEFAULT '{}',
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_valid_percentage CHECK (percentage >= 0 AND percentage <= 100),
  CONSTRAINT check_valid_scores CHECK (correct_answers <= total_questions)
);

-- =====================================================
-- FLASHCARD SYSTEM
-- =====================================================

-- Flashcard decks for organization
CREATE TABLE IF NOT EXISTS public.flashcard_decks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#8B5CF6',
  is_shared BOOLEAN DEFAULT false,
  share_code TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Flashcards table (enhanced with deck support)
CREATE TABLE IF NOT EXISTS public.flashcards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  deck_id UUID REFERENCES public.flashcard_decks(id) ON DELETE CASCADE,
  deck_name TEXT, -- backward compatibility
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  next_review TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  review_count INTEGER DEFAULT 0,
  ease_factor DECIMAL(3,2) DEFAULT 2.5, -- For spaced repetition
  last_reviewed TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Flashcard review history for spaced repetition analytics
CREATE TABLE IF NOT EXISTS public.flashcard_reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  flashcard_id UUID REFERENCES public.flashcards(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  time_taken INTEGER, -- in seconds
  previous_ease_factor DECIMAL(3,2),
  new_ease_factor DECIMAL(3,2),
  reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ANALYTICS AND GAMIFICATION
-- =====================================================

-- User activity tracking
CREATE TABLE IF NOT EXISTS public.user_activity (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL, -- 'test_started', 'test_completed', 'flashcard_reviewed', etc.
  entity_type TEXT, -- 'test', 'flashcard', 'material'
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  session_id UUID,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learning streaks tracking
CREATE TABLE IF NOT EXISTS public.learning_streaks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  streak_type TEXT NOT NULL, -- 'daily_study', 'test_completion', 'flashcard_reviews'
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, streak_type)
);

-- Study goals and progress tracking
CREATE TABLE IF NOT EXISTS public.study_goals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  goal_type TEXT NOT NULL, -- 'tests_per_week', 'study_minutes_per_day', 'flashcards_per_day'
  target_value INTEGER NOT NULL,
  current_value INTEGER DEFAULT 0,
  period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly')),
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- NOTIFICATIONS AND SHARING
-- =====================================================

-- System notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'achievement')),
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  action_label TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content sharing system
CREATE TABLE IF NOT EXISTS public.shared_content (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('test', 'deck', 'collection', 'material')),
  content_id UUID NOT NULL,
  share_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(8), 'base64'),
  is_public BOOLEAN DEFAULT false,
  access_level TEXT DEFAULT 'view' CHECK (access_level IN ('view', 'copy', 'edit')),
  password_hash TEXT, -- for password-protected shares
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Core indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_tests_user_id ON public.tests(user_id);
CREATE INDEX IF NOT EXISTS idx_tests_difficulty ON public.tests(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_test_id ON public.questions(test_id);
CREATE INDEX IF NOT EXISTS idx_questions_order ON public.questions(test_id, order_index);
CREATE INDEX IF NOT EXISTS idx_test_sessions_user_id ON public.test_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_test_sessions_test_id ON public.test_sessions(test_id);
CREATE INDEX IF NOT EXISTS idx_test_sessions_status ON public.test_sessions(status);
CREATE INDEX IF NOT EXISTS idx_test_results_user_id ON public.test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_test_results_test_id ON public.test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON public.flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_deck_id ON public.flashcards(deck_id);
CREATE INDEX IF NOT EXISTS idx_study_materials_user_id ON public.study_materials(user_id);

-- Search indexes
CREATE INDEX IF NOT EXISTS tests_search_idx ON public.tests USING gin(search_vector);
CREATE INDEX IF NOT EXISTS materials_search_idx ON public.study_materials USING gin(search_vector);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_test_results_user_completed ON public.test_results(user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_next_review ON public.flashcards(user_id, next_review);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_flashcard_id ON public.flashcard_reviews(flashcard_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_user_id ON public.flashcard_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_reviewed_at ON public.flashcard_reviews(reviewed_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON public.user_activity(created_at);
CREATE INDEX IF NOT EXISTS idx_learning_streaks_user_id ON public.learning_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_study_goals_user_id ON public.study_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON public.collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_collection_id ON public.collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_unread ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_shared_content_share_code ON public.shared_content(share_code);
CREATE INDEX IF NOT EXISTS idx_shared_content_owner_id ON public.shared_content(owner_id);

-- Organization indexes
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_test_categories_test_id ON public.test_categories(test_id);
CREATE INDEX IF NOT EXISTS idx_test_categories_category_id ON public.test_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_decks_user_id ON public.flashcard_decks(user_id);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update search vectors
CREATE OR REPLACE FUNCTION public.update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'tests' THEN
    NEW.search_vector = to_tsvector('english', 
      COALESCE(NEW.title, '') || ' ' || 
      COALESCE(NEW.description, '') || ' ' || 
      COALESCE(NEW.subject, '') || ' ' ||
      COALESCE(array_to_string(NEW.tags, ' '), '')
    );
  ELSIF TG_TABLE_NAME = 'study_materials' THEN
    NEW.search_vector = to_tsvector('english', 
      COALESCE(NEW.title, '') || ' ' || 
      COALESCE(NEW.content, '') || ' ' ||
      COALESCE(array_to_string(NEW.tags, ' '), '')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, learning_goal)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'learning_goal'
  );
  
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS handle_profiles_updated_at ON public.user_profiles;
DROP TRIGGER IF EXISTS handle_tests_updated_at ON public.tests;
DROP TRIGGER IF EXISTS handle_flashcards_updated_at ON public.flashcards;
DROP TRIGGER IF EXISTS handle_study_materials_updated_at ON public.study_materials;
DROP TRIGGER IF EXISTS handle_user_preferences_updated_at ON public.user_preferences;
DROP TRIGGER IF EXISTS handle_categories_updated_at ON public.categories;
DROP TRIGGER IF EXISTS handle_flashcard_decks_updated_at ON public.flashcard_decks;
DROP TRIGGER IF EXISTS handle_learning_streaks_updated_at ON public.learning_streaks;
DROP TRIGGER IF EXISTS handle_study_goals_updated_at ON public.study_goals;
DROP TRIGGER IF EXISTS handle_collections_updated_at ON public.collections;
DROP TRIGGER IF EXISTS handle_shared_content_updated_at ON public.shared_content;
DROP TRIGGER IF EXISTS update_tests_search_vector ON public.tests;
DROP TRIGGER IF EXISTS update_materials_search_vector ON public.study_materials;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create updated_at triggers
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_tests_updated_at
  BEFORE UPDATE ON public.tests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_flashcards_updated_at
  BEFORE UPDATE ON public.flashcards
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_study_materials_updated_at
  BEFORE UPDATE ON public.study_materials
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_flashcard_decks_updated_at
  BEFORE UPDATE ON public.flashcard_decks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_learning_streaks_updated_at
  BEFORE UPDATE ON public.learning_streaks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_study_goals_updated_at
  BEFORE UPDATE ON public.study_goals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_collections_updated_at
  BEFORE UPDATE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_shared_content_updated_at
  BEFORE UPDATE ON public.shared_content
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create search vector triggers
CREATE TRIGGER update_tests_search_vector
  BEFORE INSERT OR UPDATE ON public.tests
  FOR EACH ROW EXECUTE FUNCTION public.update_search_vector();

CREATE TRIGGER update_materials_search_vector
  BEFORE INSERT OR UPDATE ON public.study_materials
  FOR EACH ROW EXECUTE FUNCTION public.update_search_vector();

-- Create user signup trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_content ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can manage own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can manage own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can view system categories" ON public.categories;
DROP POLICY IF EXISTS "Users can manage own collections" ON public.collections;
DROP POLICY IF EXISTS "Users can manage own collection items" ON public.collection_items;
DROP POLICY IF EXISTS "Users can view own study materials" ON public.study_materials;
DROP POLICY IF EXISTS "Users can create own study materials" ON public.study_materials;
DROP POLICY IF EXISTS "Users can update own study materials" ON public.study_materials;
DROP POLICY IF EXISTS "Users can delete own study materials" ON public.study_materials;
DROP POLICY IF EXISTS "Users can view own tests" ON public.tests;
DROP POLICY IF EXISTS "Users can create own tests" ON public.tests;
DROP POLICY IF EXISTS "Users can update own tests" ON public.tests;
DROP POLICY IF EXISTS "Users can delete own tests" ON public.tests;
DROP POLICY IF EXISTS "Users can manage own test categories" ON public.test_categories;
DROP POLICY IF EXISTS "Users can view own test questions" ON public.questions;
DROP POLICY IF EXISTS "Users can create questions for own tests" ON public.questions;
DROP POLICY IF EXISTS "Users can view own test sessions" ON public.test_sessions;
DROP POLICY IF EXISTS "Users can create own test sessions" ON public.test_sessions;
DROP POLICY IF EXISTS "Users can update own test sessions" ON public.test_sessions;
DROP POLICY IF EXISTS "Users can view own test results" ON public.test_results;
DROP POLICY IF EXISTS "Users can create own test results" ON public.test_results;
DROP POLICY IF EXISTS "Users can update own test results" ON public.test_results;
DROP POLICY IF EXISTS "Users can manage own flashcard decks" ON public.flashcard_decks;
DROP POLICY IF EXISTS "Users can view own flashcards" ON public.flashcards;
DROP POLICY IF EXISTS "Users can create own flashcards" ON public.flashcards;
DROP POLICY IF EXISTS "Users can update own flashcards" ON public.flashcards;
DROP POLICY IF EXISTS "Users can delete own flashcards" ON public.flashcards;
DROP POLICY IF EXISTS "Users can manage own flashcard reviews" ON public.flashcard_reviews;
DROP POLICY IF EXISTS "Users can view own activity" ON public.user_activity;
DROP POLICY IF EXISTS "System can insert user activity" ON public.user_activity;
DROP POLICY IF EXISTS "Users can manage own learning streaks" ON public.learning_streaks;
DROP POLICY IF EXISTS "Users can manage own study goals" ON public.study_goals;
DROP POLICY IF EXISTS "Users can manage own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can manage own shared content" ON public.shared_content;

-- User profiles policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User preferences policies
CREATE POLICY "Users can manage own preferences" ON public.user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Categories policies (allow system categories + user categories)
CREATE POLICY "Users can manage own categories" ON public.categories
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view system categories" ON public.categories
  FOR SELECT USING (is_system = true);

-- Collections policies
CREATE POLICY "Users can manage own collections" ON public.collections
  FOR ALL USING (auth.uid() = user_id);

-- Collection items policies
CREATE POLICY "Users can manage own collection items" ON public.collection_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.collections 
      WHERE collections.id = collection_items.collection_id 
      AND collections.user_id = auth.uid()
    )
  );

-- Study materials policies
CREATE POLICY "Users can view own study materials" ON public.study_materials
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own study materials" ON public.study_materials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study materials" ON public.study_materials
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own study materials" ON public.study_materials
  FOR DELETE USING (auth.uid() = user_id);

-- Tests policies
CREATE POLICY "Users can view own tests" ON public.tests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tests" ON public.tests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tests" ON public.tests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tests" ON public.tests
  FOR DELETE USING (auth.uid() = user_id);

-- Test categories policies
CREATE POLICY "Users can manage own test categories" ON public.test_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.tests 
      WHERE tests.id = test_categories.test_id 
      AND tests.user_id = auth.uid()
    )
  );

-- Questions policies
CREATE POLICY "Users can view own test questions" ON public.questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tests 
      WHERE tests.id = questions.test_id 
      AND tests.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create questions for own tests" ON public.questions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tests 
      WHERE tests.id = questions.test_id 
      AND tests.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own test questions" ON public.questions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.tests 
      WHERE tests.id = questions.test_id 
      AND tests.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own test questions" ON public.questions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.tests 
      WHERE tests.id = questions.test_id 
      AND tests.user_id = auth.uid()
    )
  );

-- Test sessions policies
CREATE POLICY "Users can view own test sessions" ON public.test_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own test sessions" ON public.test_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own test sessions" ON public.test_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Test results policies
CREATE POLICY "Users can view own test results" ON public.test_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own test results" ON public.test_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own test results" ON public.test_results
  FOR UPDATE USING (auth.uid() = user_id);

-- Flashcard decks policies
CREATE POLICY "Users can manage own flashcard decks" ON public.flashcard_decks
  FOR ALL USING (auth.uid() = user_id);

-- Flashcards policies
CREATE POLICY "Users can view own flashcards" ON public.flashcards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own flashcards" ON public.flashcards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flashcards" ON public.flashcards
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own flashcards" ON public.flashcards
  FOR DELETE USING (auth.uid() = user_id);

-- Flashcard reviews policies
CREATE POLICY "Users can manage own flashcard reviews" ON public.flashcard_reviews
  FOR ALL USING (auth.uid() = user_id);

-- User activity policies
CREATE POLICY "Users can view own activity" ON public.user_activity
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert user activity" ON public.user_activity
  FOR INSERT WITH CHECK (true); -- Allow system to log activity

-- Learning streaks policies
CREATE POLICY "Users can manage own learning streaks" ON public.learning_streaks
  FOR ALL USING (auth.uid() = user_id);

-- Study goals policies
CREATE POLICY "Users can manage own study goals" ON public.study_goals
  FOR ALL USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can manage own notifications" ON public.notifications
  FOR ALL USING (auth.uid() = user_id);

-- Shared content policies
CREATE POLICY "Users can manage own shared content" ON public.shared_content
  FOR ALL USING (auth.uid() = owner_id);

-- =====================================================
-- USEFUL VIEWS FOR ANALYTICS AND DASHBOARDS
-- =====================================================

-- User dashboard statistics view
CREATE OR REPLACE VIEW public.user_dashboard_stats AS
SELECT 
  u.id as user_id,
  p.full_name,
  COUNT(DISTINCT tr.test_id) as tests_completed,
  ROUND(AVG(tr.percentage), 2) as average_score,
  MAX(tr.percentage) as best_score,
  COUNT(DISTINCT CASE WHEN DATE(tr.completed_at) = CURRENT_DATE THEN tr.id END) as tests_today,
  COUNT(DISTINCT CASE WHEN DATE(fr.reviewed_at) = CURRENT_DATE THEN fr.id END) as flashcards_reviewed_today,
  COALESCE(MAX(ls.current_streak), 0) as current_study_streak,
  COUNT(DISTINCT t.id) as total_tests_created,
  COUNT(DISTINCT f.id) as total_flashcards,
  COUNT(DISTINCT sm.id) as total_study_materials
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.id
LEFT JOIN public.test_results tr ON u.id = tr.user_id
LEFT JOIN public.flashcard_reviews fr ON u.id = fr.user_id 
LEFT JOIN public.learning_streaks ls ON u.id = ls.user_id AND ls.streak_type = 'daily_study'
LEFT JOIN public.tests t ON u.id = t.user_id AND t.deleted_at IS NULL
LEFT JOIN public.flashcards f ON u.id = f.user_id
LEFT JOIN public.study_materials sm ON u.id = sm.user_id AND sm.deleted_at IS NULL
GROUP BY u.id, p.full_name;

-- Learning progress over time
CREATE OR REPLACE VIEW public.learning_progress AS
SELECT 
  user_id,
  DATE(completed_at) as study_date,
  COUNT(*) as tests_taken,
  ROUND(AVG(percentage), 2) as avg_score,
  SUM(COALESCE(time_taken, time_spent)) as total_study_time_seconds
FROM public.test_results 
GROUP BY user_id, DATE(completed_at)
ORDER BY user_id, study_date;

-- Popular content view
CREATE OR REPLACE VIEW public.popular_content AS
SELECT 
  'test' as content_type,
  t.id as content_id,
  t.title,
  t.user_id as creator_id,
  COUNT(tr.id) as usage_count,
  ROUND(AVG(tr.percentage), 2) as avg_score,
  MAX(tr.completed_at) as last_used
FROM public.tests t
LEFT JOIN public.test_results tr ON t.id = tr.test_id
WHERE t.deleted_at IS NULL
GROUP BY t.id, t.title, t.user_id
HAVING COUNT(tr.id) > 0

UNION ALL

SELECT 
  'material' as content_type,
  sm.id as content_id,
  sm.title,
  sm.user_id as creator_id,
  0 as usage_count, -- Can be enhanced with usage tracking
  NULL as avg_score,
  sm.updated_at as last_used
FROM public.study_materials sm
WHERE sm.deleted_at IS NULL

ORDER BY usage_count DESC, last_used DESC;

-- Test performance analytics
CREATE OR REPLACE VIEW public.test_performance_analytics AS
SELECT 
  t.id as test_id,
  t.title,
  t.user_id as creator_id,
  t.difficulty,
  t.subject,
  COUNT(tr.id) as total_attempts,
  COUNT(DISTINCT tr.user_id) as unique_users,
  ROUND(AVG(tr.percentage), 2) as avg_score,
  MIN(tr.percentage) as min_score,
  MAX(tr.percentage) as max_score,
  ROUND(AVG(COALESCE(tr.time_taken, tr.time_spent)), 2) as avg_time_seconds,
  COUNT(CASE WHEN tr.percentage >= t.passing_score THEN 1 END) as passed_attempts,
  ROUND(
    COUNT(CASE WHEN tr.percentage >= t.passing_score THEN 1 END) * 100.0 / COUNT(tr.id), 2
  ) as pass_rate_percentage
FROM public.tests t
LEFT JOIN public.test_results tr ON t.id = tr.test_id
WHERE t.deleted_at IS NULL
GROUP BY t.id, t.title, t.user_id, t.difficulty, t.subject, t.passing_score
ORDER BY total_attempts DESC;

-- =====================================================
-- INSERT DEFAULT SYSTEM CATEGORIES
-- =====================================================

INSERT INTO public.categories (name, color, description, is_system, user_id) VALUES
  ('Mathematics', '#3B82F6', 'Math and calculation related topics', true, NULL),
  ('Science', '#10B981', 'Scientific subjects and research', true, NULL),
  ('History', '#F59E0B', 'Historical events and periods', true, NULL),
  ('Literature', '#8B5CF6', 'Books, poetry, and literary analysis', true, NULL),
  ('Technology', '#EF4444', 'Computer science and technology topics', true, NULL),
  ('Languages', '#06B6D4', 'Foreign languages and linguistics', true, NULL),
  ('Business', '#F97316', 'Business and management topics', true, NULL),
  ('Art', '#EC4899', 'Visual arts and creative subjects', true, NULL),
  ('Music', '#8B5CF6', 'Music theory and practice', true, NULL),
  ('Health', '#059669', 'Health and medical topics', true, NULL)
ON CONFLICT (COALESCE(user_id, '00000000-0000-0000-0000-000000000000'), name) DO NOTHING;

-- =====================================================
-- UPDATE EXISTING DATA (SAFE OPERATIONS)
-- =====================================================

-- Update search vectors for existing tests
UPDATE public.tests SET search_vector = to_tsvector('english', 
  COALESCE(title, '') || ' ' || 
  COALESCE(description, '') || ' ' || 
  COALESCE(subject, '') || ' ' ||
  COALESCE(array_to_string(tags, ' '), '')
) WHERE search_vector IS NULL;

-- Update search vectors for existing study materials
UPDATE public.study_materials SET search_vector = to_tsvector('english', 
  COALESCE(title, '') || ' ' || 
  COALESCE(content, '') || ' ' ||
  COALESCE(array_to_string(tags, ' '), '')
) WHERE search_vector IS NULL;

-- Create default preferences for existing users
INSERT INTO public.user_preferences (user_id)
SELECT id FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM public.user_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- Initialize learning streaks for existing users
INSERT INTO public.learning_streaks (user_id, streak_type, current_streak, longest_streak)
SELECT u.id, streak_type, 0, 0
FROM auth.users u
CROSS JOIN (VALUES ('daily_study'), ('test_completion'), ('flashcard_reviews')) AS st(streak_type)
WHERE NOT EXISTS (
  SELECT 1 FROM public.learning_streaks ls 
  WHERE ls.user_id = u.id AND ls.streak_type = st.streak_type
)
ON CONFLICT (user_id, streak_type) DO NOTHING;

-- =====================================================
-- HELPER FUNCTIONS FOR COMMON OPERATIONS
-- =====================================================

-- Function to calculate spaced repetition intervals
CREATE OR REPLACE FUNCTION public.calculate_next_review(
  ease_factor DECIMAL(3,2),
  rating INTEGER,
  review_count INTEGER
)
RETURNS TABLE(
  new_ease_factor DECIMAL(3,2),
  interval_days INTEGER
) AS $
DECLARE
  new_ef DECIMAL(3,2);
  days INTEGER;
BEGIN
  -- SM-2 Algorithm implementation
  new_ef = GREATEST(1.3, ease_factor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02)));
  
  CASE 
    WHEN rating < 3 THEN
      days = 1; -- Reset to beginning
    WHEN review_count = 0 THEN
      days = 1;
    WHEN review_count = 1 THEN
      days = 6;
    ELSE
      days = ROUND(6 * POWER(new_ef, review_count - 1));
  END CASE;
  
  RETURN QUERY SELECT new_ef, days;
END;
$ LANGUAGE plpgsql;

-- Function to get user statistics
CREATE OR REPLACE FUNCTION public.get_user_stats(user_uuid UUID)
RETURNS JSONB AS $
DECLARE
  stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'tests_completed', COUNT(DISTINCT tr.test_id),
    'average_score', ROUND(AVG(tr.percentage), 2),
    'total_study_time', SUM(COALESCE(tr.time_taken, tr.time_spent, 0)),
    'flashcards_reviewed', COUNT(DISTINCT fr.id),
    'current_streak', COALESCE(MAX(ls.current_streak), 0),
    'materials_uploaded', COUNT(DISTINCT sm.id)
  )
  INTO stats
  FROM auth.users u
  LEFT JOIN public.test_results tr ON u.id = tr.user_id
  LEFT JOIN public.flashcard_reviews fr ON u.id = fr.user_id
  LEFT JOIN public.learning_streaks ls ON u.id = ls.user_id AND ls.streak_type = 'daily_study'
  LEFT JOIN public.study_materials sm ON u.id = sm.user_id AND sm.deleted_at IS NULL
  WHERE u.id = user_uuid;
  
  RETURN stats;
END;
$ LANGUAGE plpgsql;

-- Function to search content
CREATE OR REPLACE FUNCTION public.search_content(
  search_query TEXT,
  user_uuid UUID,
  content_types TEXT[] DEFAULT ARRAY['test', 'material']
)
RETURNS TABLE(
  content_type TEXT,
  content_id UUID,
  title TEXT,
  description TEXT,
  rank REAL
) AS $
BEGIN
  RETURN QUERY
  (
    SELECT 
      'test'::TEXT,
      t.id,
      t.title,
      t.description,
      ts_rank(t.search_vector, plainto_tsquery('english', search_query)) as rank
    FROM public.tests t
    WHERE t.user_id = user_uuid
      AND t.deleted_at IS NULL
      AND 'test' = ANY(content_types)
      AND t.search_vector @@ plainto_tsquery('english', search_query)
    
    UNION ALL
    
    SELECT 
      'material'::TEXT,
      sm.id,
      sm.title,
      LEFT(sm.content, 200) as description,
      ts_rank(sm.search_vector, plainto_tsquery('english', search_query)) as rank
    FROM public.study_materials sm
    WHERE sm.user_id = user_uuid
      AND sm.deleted_at IS NULL
      AND 'material' = ANY(content_types)
      AND sm.search_vector @@ plainto_tsquery('english', search_query)
  )
  ORDER BY rank DESC;
END;
$ LANGUAGE plpgsql;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $
BEGIN
  RAISE NOTICE '==================================================';
  RAISE NOTICE 'COMPREHENSIVE STUDYWISE AI SCHEMA SETUP COMPLETE!';
  RAISE NOTICE '==================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Successfully created comprehensive database schema with:';
  RAISE NOTICE '';
  RAISE NOTICE '✅ CORE FEATURES:';
  RAISE NOTICE '   • User profiles with preferences';
  RAISE NOTICE '   • Advanced test system with sessions';
  RAISE NOTICE '   • Enhanced flashcard system with decks';
  RAISE NOTICE '   • Study materials management';
  RAISE NOTICE '';
  RAISE NOTICE '✅ ORGANIZATION:';
  RAISE NOTICE '   • Categories and collections';
  RAISE NOTICE '   • Content tagging and search';
  RAISE NOTICE '   • Full-text search capabilities';
  RAISE NOTICE '';
  RAISE NOTICE '✅ ANALYTICS & GAMIFICATION:';
  RAISE NOTICE '   • Learning streaks tracking';
  RAISE NOTICE '   • Study goals and progress';
  RAISE NOTICE '   • Comprehensive analytics views';
  RAISE NOTICE '   • User activity logging';
  RAISE NOTICE '';
  RAISE NOTICE '✅ ADVANCED FEATURES:';
  RAISE NOTICE '   • Spaced repetition for flashcards';
  RAISE NOTICE '   • Content sharing system';
  RAISE NOTICE '   • Notification system';
  RAISE NOTICE '   • Performance optimization';
  RAISE NOTICE '';
  RAISE NOTICE '✅ SECURITY:';
  RAISE NOTICE '   • Row Level Security (RLS) enabled';
  RAISE NOTICE '   • Comprehensive access policies';
  RAISE NOTICE '   • Data isolation per user';
  RAISE NOTICE '';
  RAISE NOTICE 'Your StudyWise AI platform is now ready for development!';
  RAISE NOTICE '';
END $;