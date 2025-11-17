-- =====================================================
-- STUDYWISE AI - COMPLETE CURRENT DATABASE SCHEMA
-- Compiled from evolution: Base → Enhancements → Additions
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- CORE USER TABLES
-- =====================================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  learning_goal TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User preferences
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
-- CONTENT ORGANIZATION
-- =====================================================

-- Categories for organizing content
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Collections for grouping content
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

-- Collection items (polymorphic)
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
-- STUDY MATERIALS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.study_materials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  file_type TEXT,
  file_url TEXT,
  file_size BIGINT,
  mime_type TEXT,
  tags TEXT[],
  deleted_at TIMESTAMP WITH TIME ZONE,
  search_vector tsvector,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TESTS AND QUESTIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.tests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  question_count INTEGER NOT NULL CHECK (question_count > 0),
  question_types TEXT[] NOT NULL,
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  version INTEGER DEFAULT 1,
  passing_score INTEGER DEFAULT 70,
  deleted_at TIMESTAMP WITH TIME ZONE,
  search_vector tsvector,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  test_id UUID REFERENCES public.tests(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('multiple-choice', 'true-false', 'short-answer', 'essay')) NOT NULL,
  question TEXT NOT NULL,
  options TEXT[],
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  points INTEGER DEFAULT 1,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (
    (type != 'multiple-choice') OR 
    (type = 'multiple-choice' AND options IS NOT NULL AND array_length(options, 1) >= 2)
  )
);

-- Test categories (many-to-many)
CREATE TABLE IF NOT EXISTS public.test_categories (
  test_id UUID REFERENCES public.tests(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (test_id, category_id)
);

-- =====================================================
-- TEST SESSIONS AND RESULTS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.test_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  test_id UUID REFERENCES public.tests(id) ON DELETE CASCADE NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  time_limit INTEGER,
  current_question_index INTEGER DEFAULT 0,
  answers JSONB DEFAULT '{}',
  status TEXT CHECK (status IN ('in_progress', 'completed', 'paused')) DEFAULT 'in_progress'
);

CREATE TABLE IF NOT EXISTS public.test_results (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  test_id UUID REFERENCES public.tests(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES public.test_sessions(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL,
  total_possible INTEGER NOT NULL,
  percentage DECIMAL(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  time_taken INTEGER,
  answers JSONB NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- FLASHCARDS SYSTEM
-- =====================================================

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

CREATE TABLE IF NOT EXISTS public.flashcards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  deck_name TEXT NOT NULL,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  next_review TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  review_count INTEGER DEFAULT 0,
  ease_factor DECIMAL(3,2) DEFAULT 2.5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.flashcard_reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  flashcard_id UUID REFERENCES public.flashcards(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  time_taken INTEGER,
  previous_ease_factor DECIMAL(3,2),
  new_ease_factor DECIMAL(3,2),
  reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- LEARNING ANALYTICS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.learning_streaks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  streak_type TEXT NOT NULL,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, streak_type)
);

CREATE TABLE IF NOT EXISTS public.study_goals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  goal_type TEXT NOT NULL,
  target_value INTEGER NOT NULL,
  current_value INTEGER DEFAULT 0,
  period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly')),
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_activity (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  session_id UUID,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- NOTIFICATIONS AND SHARING
-- =====================================================

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

CREATE TABLE IF NOT EXISTS public.shared_content (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('test', 'deck', 'collection', 'material')),
  content_id UUID NOT NULL,
  share_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(8), 'base64'),
  is_public BOOLEAN DEFAULT false,
  access_level TEXT DEFAULT 'view' CHECK (access_level IN ('view', 'copy', 'edit')),
  password_hash TEXT,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- User and profile indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(id);

-- Content organization indexes
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON public.collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_collection_id ON public.collection_items(collection_id);

-- Study materials indexes
CREATE INDEX IF NOT EXISTS idx_study_materials_user_id ON public.study_materials(user_id);
CREATE INDEX IF NOT EXISTS materials_search_idx ON public.study_materials USING gin(search_vector);

-- Tests and questions indexes
CREATE INDEX IF NOT EXISTS idx_tests_user_id ON public.tests(user_id);
CREATE INDEX IF NOT EXISTS tests_search_idx ON public.tests USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_questions_test_id ON public.questions(test_id);
CREATE INDEX IF NOT EXISTS idx_test_categories_test_id ON public.test_categories(test_id);
CREATE INDEX IF NOT EXISTS idx_test_categories_category_id ON public.test_categories(category_id);

-- Test sessions and results indexes
CREATE INDEX IF NOT EXISTS idx_test_sessions_user_id ON public.test_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_test_sessions_test_id ON public.test_sessions(test_id);
CREATE INDEX IF NOT EXISTS idx_test_results_user_id ON public.test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_test_results_test_id ON public.test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_test_results_user_completed ON public.test_results(user_id, completed_at DESC);

-- Flashcards indexes
CREATE INDEX IF NOT EXISTS idx_flashcard_decks_user_id ON public.flashcard_decks(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON public.flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_next_review ON public.flashcards(user_id, next_review);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_flashcard_id ON public.flashcard_reviews(flashcard_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_user_id ON public.flashcard_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_reviewed_at ON public.flashcard_reviews(reviewed_at);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_learning_streaks_user_id ON public.learning_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_study_goals_user_id ON public.study_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON public.user_activity(created_at);

-- Notifications and sharing indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_unread ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_shared_content_share_code ON public.shared_content(share_code);
CREATE INDEX IF NOT EXISTS idx_shared_content_owner_id ON public.shared_content(owner_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Handle updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update search vectors for full-text search
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

-- Handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, learning_goal)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'learning_goal'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Updated_at triggers
DROP TRIGGER IF EXISTS handle_profiles_updated_at ON public.profiles;
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_tests_updated_at ON public.tests;
CREATE TRIGGER handle_tests_updated_at
  BEFORE UPDATE ON public.tests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_flashcards_updated_at ON public.flashcards;
CREATE TRIGGER handle_flashcards_updated_at
  BEFORE UPDATE ON public.flashcards
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_study_materials_updated_at ON public.study_materials;
CREATE TRIGGER handle_study_materials_updated_at
  BEFORE UPDATE ON public.study_materials
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER handle_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_categories_updated_at ON public.categories;
CREATE TRIGGER handle_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_flashcard_decks_updated_at ON public.flashcard_decks;
CREATE TRIGGER handle_flashcard_decks_updated_at
  BEFORE UPDATE ON public.flashcard_decks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_learning_streaks_updated_at ON public.learning_streaks;
CREATE TRIGGER handle_learning_streaks_updated_at
  BEFORE UPDATE ON public.learning_streaks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_study_goals_updated_at ON public.study_goals;
CREATE TRIGGER handle_study_goals_updated_at
  BEFORE UPDATE ON public.study_goals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_collections_updated_at ON public.collections;
CREATE TRIGGER handle_collections_updated_at
  BEFORE UPDATE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_shared_content_updated_at ON public.shared_content;
CREATE TRIGGER handle_shared_content_updated_at
  BEFORE UPDATE ON public.shared_content
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Search vector triggers
DROP TRIGGER IF EXISTS update_tests_search_vector ON public.tests;
CREATE TRIGGER update_tests_search_vector
  BEFORE INSERT OR UPDATE ON public.tests
  FOR EACH ROW EXECUTE FUNCTION public.update_search_vector();

DROP TRIGGER IF EXISTS update_materials_search_vector ON public.study_materials;
CREATE TRIGGER update_materials_search_vector
  BEFORE INSERT OR UPDATE ON public.study_materials
  FOR EACH ROW EXECUTE FUNCTION public.update_search_vector();

-- New user trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_content ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Drop existing to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User preferences
DROP POLICY IF EXISTS "Users can manage own preferences" ON public.user_preferences;
CREATE POLICY "Users can manage own preferences" ON public.user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Categories
DROP POLICY IF EXISTS "Users can manage own categories" ON public.categories;
CREATE POLICY "Users can manage own categories" ON public.categories
  FOR ALL USING (auth.uid() = user_id);

-- Collections
DROP POLICY IF EXISTS "Users can manage own collections" ON public.collections;
CREATE POLICY "Users can manage own collections" ON public.collections
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own collection items" ON public.collection_items;
CREATE POLICY "Users can manage own collection items" ON public.collection_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.collections 
      WHERE collections.id = collection_items.collection_id 
      AND collections.user_id = auth.uid()
    )
  );

-- Study materials
DROP POLICY IF EXISTS "Users can view own study materials" ON public.study_materials;
DROP POLICY IF EXISTS "Users can create own study materials" ON public.study_materials;
DROP POLICY IF EXISTS "Users can update own study materials" ON public.study_materials;
DROP POLICY IF EXISTS "Users can delete own study materials" ON public.study_materials;

CREATE POLICY "Users can view own study materials" ON public.study_materials
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own study materials" ON public.study_materials
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own study materials" ON public.study_materials
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own study materials" ON public.study_materials
  FOR DELETE USING (auth.uid() = user_id);

-- Tests
DROP POLICY IF EXISTS "Users can view own tests" ON public.tests;
DROP POLICY IF EXISTS "Users can create own tests" ON public.tests;
DROP POLICY IF EXISTS "Users can update own tests" ON public.tests;
DROP POLICY IF EXISTS "Users can delete own tests" ON public.tests;

CREATE POLICY "Users can view own tests" ON public.tests
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own tests" ON public.tests
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tests" ON public.tests
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tests" ON public.tests
  FOR DELETE USING (auth.uid() = user_id);

-- Questions
DROP POLICY IF EXISTS "Users can view own test questions" ON public.questions;
DROP POLICY IF EXISTS "Users can create questions for own tests" ON public.questions;

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

-- Test categories
DROP POLICY IF EXISTS "Users can manage own test categories" ON public.test_categories;
CREATE POLICY "Users can manage own test categories" ON public.test_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.tests 
      WHERE tests.id = test_categories.test_id 
      AND tests.user_id = auth.uid()
    )
  );

-- Test sessions
DROP POLICY IF EXISTS "Users can view own test sessions" ON public.test_sessions;
DROP POLICY IF EXISTS "Users can create own test sessions" ON public.test_sessions;
DROP POLICY IF EXISTS "Users can update own test sessions" ON public.test_sessions;

CREATE POLICY "Users can view own test sessions" ON public.test_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own test sessions" ON public.test_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own test sessions" ON public.test_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Test results
DROP POLICY IF EXISTS "Users can view own test results" ON public.test_results;
DROP POLICY IF EXISTS "Users can create own test results" ON public.test_results;

CREATE POLICY "Users can view own test results" ON public.test_results
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own test results" ON public.test_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Flashcard decks
DROP POLICY IF EXISTS "Users can manage own flashcard decks" ON public.flashcard_decks;
CREATE POLICY "Users can manage own flashcard decks" ON public.flashcard_decks
  FOR ALL USING (auth.uid() = user_id);

-- Flashcards
DROP POLICY IF EXISTS "Users can view own flashcards" ON public.flashcards;
DROP POLICY IF EXISTS "Users can create own flashcards" ON public.flashcards;
DROP POLICY IF EXISTS "Users can update own flashcards" ON public.flashcards;
DROP POLICY IF EXISTS "Users can delete own flashcards" ON public.flashcards;

CREATE POLICY "Users can view own flashcards" ON public.flashcards
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own flashcards" ON public.flashcards
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own flashcards" ON public.flashcards
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own flashcards" ON public.flashcards
  FOR DELETE USING (auth.uid() = user_id);

-- Flashcard reviews
DROP POLICY IF EXISTS "Users can manage own flashcard reviews" ON public.flashcard_reviews;
CREATE POLICY "Users can manage own flashcard reviews" ON public.flashcard_reviews
  FOR ALL USING (auth.uid() = user_id);

-- Learning streaks
DROP POLICY IF EXISTS "Users can manage own learning streaks" ON public.learning_streaks;
CREATE POLICY "Users can manage own learning streaks" ON public.learning_streaks
  FOR ALL USING (auth.uid() = user_id);

-- Study goals
DROP POLICY IF EXISTS "Users can manage own study goals" ON public.study_goals;
CREATE POLICY "Users can manage own study goals" ON public.study_goals
  FOR ALL USING (auth.uid() = user_id);

-- User activity
DROP POLICY IF EXISTS "Users can view own activity" ON public.user_activity;
DROP POLICY IF EXISTS "System can insert user activity" ON public.user_activity;

CREATE POLICY "Users can view own activity" ON public.user_activity
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert user activity" ON public.user_activity
  FOR INSERT WITH CHECK (true);

-- Notifications
DROP POLICY IF EXISTS "Users can manage own notifications" ON public.notifications;
CREATE POLICY "Users can manage own notifications" ON public.notifications
  FOR ALL USING (auth.uid() = user_id);

-- Shared content
DROP POLICY IF EXISTS "Users can manage own shared content" ON public.shared_content;
CREATE POLICY "Users can manage own shared content" ON public.shared_content
  FOR ALL USING (auth.uid() = owner_id);

-- =====================================================
-- ANALYTICS VIEWS
-- =====================================================

-- User dashboard statistics
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
  COUNT(DISTINCT f.id) as total_flashcards
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.test_results tr ON u.id = tr.user_id
LEFT JOIN public.flashcard_reviews fr ON u.id = fr.user_id 
LEFT JOIN public.learning_streaks ls ON u.id = ls.user_id AND ls.streak_type = 'daily_study'
LEFT JOIN public.tests t ON u.id = t.user_id AND t.deleted_at IS NULL
LEFT JOIN public.flashcards f ON u.id = f.user_id
GROUP BY u.id, p.full_name;

-- Learning progress over time
CREATE OR REPLACE VIEW public.learning_progress AS
SELECT 
  user_id,
  DATE(completed_at) as study_date,
  COUNT(*) as tests_taken,
  ROUND(AVG(percentage), 2) as avg_score,
  SUM(time_taken) as total_study_time_seconds
FROM public.test_results 
GROUP BY user_id, DATE(completed_at)
ORDER BY user_id, study_date;

-- Popular content
CREATE OR REPLACE VIEW public.popular_content AS
SELECT 
  'test' as content_type,
  t.id as content_id,
  t.title,
  t.user_id as creator_id,
  COUNT(tr.id) as usage_count,
  ROUND(AVG(tr.percentage), 2) as avg_score
FROM public.tests t
LEFT JOIN public.test_results tr ON t.id = tr.test_id
WHERE t.deleted_at IS NULL
GROUP BY t.id, t.title, t.user_id
HAVING COUNT(tr.id) > 0
ORDER BY usage_count DESC, avg_score DESC;

-- =====================================================
-- INITIAL DATA SETUP
-- =====================================================

-- Insert default preferences for existing users
INSERT INTO public.user_preferences (user_id)
SELECT id FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM public.user_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- Update search vectors for existing data
UPDATE public.tests SET search_vector = to_tsvector('english', 
  COALESCE(title, '') || ' ' || 
  COALESCE(description, '') || ' ' || 
  COALESCE(subject, '') || ' ' ||
  COALESCE(array_to_string(tags, ' '), '')
) WHERE search_vector IS NULL;

UPDATE public.study_materials SET search_vector = to_tsvector('english', 
  COALESCE(title, '') || ' ' || 
  COALESCE(content, '') || ' ' ||
  COALESCE(array_to_string(tags, ' '), '')
) WHERE search_vector IS NULL;