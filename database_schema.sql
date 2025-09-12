
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "fuzzystrmatch";

-- Drop existing tables and policies to avoid conflicts
DROP TABLE IF EXISTS public.collection_items CASCADE;
DROP TABLE IF EXISTS public.collections CASCADE;
DROP TABLE IF EXISTS public.shared_content CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.learning_streaks CASCADE;
DROP TABLE IF EXISTS public.study_goals CASCADE;
DROP TABLE IF EXISTS public.user_activity CASCADE;
DROP TABLE IF EXISTS public.flashcard_reviews CASCADE;
DROP TABLE IF EXISTS public.flashcard_decks CASCADE;
DROP TABLE IF EXISTS public.test_categories CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.user_preferences CASCADE;
DROP TABLE IF EXISTS public.test_results CASCADE;
DROP TABLE IF EXISTS public.test_sessions CASCADE;
DROP TABLE IF EXISTS public.questions CASCADE;
DROP TABLE IF EXISTS public.tests CASCADE;
DROP TABLE IF EXISTS public.flashcards CASCADE;
DROP TABLE IF EXISTS public.study_materials CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Enhanced profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  learning_goal TEXT,
  timezone TEXT DEFAULT 'UTC',
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User preferences table
CREATE TABLE public.user_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  language TEXT DEFAULT 'en',
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  study_reminders BOOLEAN DEFAULT true,
  difficulty_preference TEXT DEFAULT 'medium' CHECK (difficulty_preference IN ('easy', 'medium', 'hard')),
  daily_goal_minutes INTEGER DEFAULT 30,
  spaced_repetition_enabled BOOLEAN DEFAULT true,
  auto_play_audio BOOLEAN DEFAULT false,
  show_explanations BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Categories table
CREATE TABLE public.categories (
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

-- Enhanced tests table
CREATE TABLE public.tests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  question_count INTEGER NOT NULL,
  question_types TEXT[] NOT NULL,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  version INTEGER DEFAULT 1,
  is_deleted BOOLEAN DEFAULT false,
  search_vector tsvector,
  estimated_duration INTEGER, -- in minutes
  passing_score INTEGER DEFAULT 70,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Test categories junction table
CREATE TABLE public.test_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  test_id UUID REFERENCES public.tests(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(test_id, category_id)
);

-- Enhanced questions table
CREATE TABLE public.questions (
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
  source_text TEXT,
  source_offset INTEGER,
  source_length INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced test sessions table
CREATE TABLE public.test_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  test_id UUID REFERENCES public.tests(id) ON DELETE CASCADE NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  paused_at TIMESTAMP WITH TIME ZONE,
  time_limit INTEGER, -- in minutes
  current_question_index INTEGER DEFAULT 0,
  answers JSONB DEFAULT '{}',
  status TEXT CHECK (status IN ('in_progress', 'completed', 'paused', 'abandoned')) DEFAULT 'in_progress',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced test results table
CREATE TABLE public.test_results (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  test_id UUID REFERENCES public.tests(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES public.test_sessions(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL,
  total_possible INTEGER NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  time_taken INTEGER, -- in seconds
  answers JSONB NOT NULL,
  question_analytics JSONB DEFAULT '{}', -- per-question performance data
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Flashcard decks table
CREATE TABLE public.flashcard_decks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  is_public BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced flashcards table
CREATE TABLE public.flashcards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  deck_id UUID REFERENCES public.flashcard_decks(id) ON DELETE CASCADE NOT NULL,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  next_review TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  review_count INTEGER DEFAULT 0,
  ease_factor DECIMAL(3,2) DEFAULT 2.5,
  interval_days INTEGER DEFAULT 1,
  last_reviewed TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Flashcard reviews table
CREATE TABLE public.flashcard_reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  flashcard_id UUID REFERENCES public.flashcards(id) ON DELETE CASCADE NOT NULL,
  quality INTEGER CHECK (quality BETWEEN 0 AND 5) NOT NULL, -- SM-2 quality rating
  response_time INTEGER, -- in milliseconds
  previous_ease_factor DECIMAL(3,2),
  new_ease_factor DECIMAL(3,2),
  previous_interval INTEGER,
  new_interval INTEGER,
  reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced study materials table
CREATE TABLE public.study_materials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  file_type TEXT,
  file_url TEXT,
  file_size BIGINT,
  file_metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  is_deleted BOOLEAN DEFAULT false,
  search_vector tsvector,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User activity tracking table
CREATE TABLE public.user_activity (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL, -- 'test_taken', 'flashcard_reviewed', 'material_studied', etc.
  resource_type TEXT, -- 'test', 'flashcard', 'material'
  resource_id UUID,
  metadata JSONB DEFAULT '{}',
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learning streaks table
CREATE TABLE public.learning_streaks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  total_study_days INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Study goals table
CREATE TABLE public.study_goals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  goal_type TEXT CHECK (goal_type IN ('daily', 'weekly', 'monthly', 'custom')) NOT NULL,
  target_value INTEGER NOT NULL, -- minutes, questions, etc.
  current_value INTEGER DEFAULT 0,
  unit TEXT NOT NULL, -- 'minutes', 'questions', 'tests', etc.
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collections table
CREATE TABLE public.collections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collection items table (polymorphic)
CREATE TABLE public.collection_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE NOT NULL,
  item_type TEXT CHECK (item_type IN ('test', 'flashcard_deck', 'study_material')) NOT NULL,
  item_id UUID NOT NULL,
  order_index INTEGER DEFAULT 0,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('info', 'success', 'warning', 'error', 'reminder')) DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shared content table
CREATE TABLE public.shared_content (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shared_with_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT CHECK (content_type IN ('test', 'collection', 'flashcard_deck')) NOT NULL,
  content_id UUID NOT NULL,
  permission_level TEXT CHECK (permission_level IN ('view', 'edit', 'admin')) DEFAULT 'view',
  is_public BOOLEAN DEFAULT false,
  share_token TEXT UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_content ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User Preferences
CREATE POLICY "Users can manage own preferences" ON public.user_preferences FOR ALL USING (auth.uid() = user_id);

-- Categories
CREATE POLICY "Users can manage own categories" ON public.categories FOR ALL USING (auth.uid() = user_id);

-- Tests
CREATE POLICY "Users can manage own tests" ON public.tests FOR ALL USING (auth.uid() = user_id AND is_deleted = false);

-- Test Categories
CREATE POLICY "Users can manage test categories for own tests" ON public.test_categories FOR ALL USING (
  EXISTS (SELECT 1 FROM public.tests WHERE tests.id = test_categories.test_id AND tests.user_id = auth.uid())
);

-- Questions
CREATE POLICY "Users can manage questions for own tests" ON public.questions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.tests WHERE tests.id = questions.test_id AND tests.user_id = auth.uid())
);

-- Test Sessions
CREATE POLICY "Users can manage own test sessions" ON public.test_sessions FOR ALL USING (auth.uid() = user_id);

-- Test Results
CREATE POLICY "Users can manage own test results" ON public.test_results FOR ALL USING (auth.uid() = user_id);

-- Flashcard Decks
CREATE POLICY "Users can manage own flashcard decks" ON public.flashcard_decks FOR ALL USING (auth.uid() = user_id);

-- Flashcards
CREATE POLICY "Users can manage own flashcards" ON public.flashcards FOR ALL USING (auth.uid() = user_id);

-- Flashcard Reviews
CREATE POLICY "Users can manage own flashcard reviews" ON public.flashcard_reviews FOR ALL USING (auth.uid() = user_id);

-- Study Materials
CREATE POLICY "Users can manage own study materials" ON public.study_materials FOR ALL USING (auth.uid() = user_id AND is_deleted = false);

-- User Activity
CREATE POLICY "Users can view own activity" ON public.user_activity FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activity" ON public.user_activity FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Learning Streaks
CREATE POLICY "Users can manage own streaks" ON public.learning_streaks FOR ALL USING (auth.uid() = user_id);

-- Study Goals
CREATE POLICY "Users can manage own goals" ON public.study_goals FOR ALL USING (auth.uid() = user_id);

-- Collections
CREATE POLICY "Users can manage own collections" ON public.collections FOR ALL USING (auth.uid() = user_id);

-- Collection Items
CREATE POLICY "Users can manage own collection items" ON public.collection_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.collections WHERE collections.id = collection_items.collection_id AND collections.user_id = auth.uid())
);

-- Notifications
CREATE POLICY "Users can manage own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- Shared Content
CREATE POLICY "Users can manage content they own or is shared with them" ON public.shared_content FOR SELECT USING (
  auth.uid() = owner_id OR auth.uid() = shared_with_id OR is_public = true
);
CREATE POLICY "Users can create shared content for own resources" ON public.shared_content FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own shared content" ON public.shared_content FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own shared content" ON public.shared_content FOR DELETE USING (auth.uid() = owner_id);

-- Functions and triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER handle_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_tests_updated_at BEFORE UPDATE ON public.tests FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_flashcard_decks_updated_at BEFORE UPDATE ON public.flashcard_decks FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_flashcards_updated_at BEFORE UPDATE ON public.flashcards FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_study_materials_updated_at BEFORE UPDATE ON public.study_materials FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_learning_streaks_updated_at BEFORE UPDATE ON public.learning_streaks FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_study_goals_updated_at BEFORE UPDATE ON public.study_goals FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_collections_updated_at BEFORE UPDATE ON public.collections FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, learning_goal)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'learning_goal'
  );
  
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);
  
  INSERT INTO public.learning_streaks (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Search vector update functions
CREATE OR REPLACE FUNCTION public.update_test_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector = to_tsvector('english', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.description, '') || ' ' || COALESCE(NEW.subject, '') || ' ' || COALESCE(array_to_string(NEW.tags, ' '), ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_material_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector = to_tsvector('english', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content, '') || ' ' || COALESCE(array_to_string(NEW.tags, ' '), ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply search vector triggers
CREATE TRIGGER update_test_search_vector_trigger
  BEFORE INSERT OR UPDATE ON public.tests
  FOR EACH ROW EXECUTE FUNCTION public.update_test_search_vector();

CREATE TRIGGER update_material_search_vector_trigger
  BEFORE INSERT OR UPDATE ON public.study_materials
  FOR EACH ROW EXECUTE FUNCTION public.update_material_search_vector();

-- Performance indexes
CREATE INDEX idx_profiles_user_id ON public.profiles(id);
CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX idx_categories_user_id ON public.categories(user_id);
CREATE INDEX idx_tests_user_id ON public.tests(user_id);
CREATE INDEX idx_tests_search_vector ON public.tests USING gin(search_vector);
CREATE INDEX idx_tests_tags ON public.tests USING gin(tags);
CREATE INDEX idx_test_categories_test_id ON public.test_categories(test_id);
CREATE INDEX idx_test_categories_category_id ON public.test_categories(category_id);
CREATE INDEX idx_questions_test_id ON public.questions(test_id);
CREATE INDEX idx_test_sessions_user_id ON public.test_sessions(user_id);
CREATE INDEX idx_test_sessions_test_id ON public.test_sessions(test_id);
CREATE INDEX idx_test_results_user_id ON public.test_results(user_id);
CREATE INDEX idx_test_results_test_id ON public.test_results(test_id);
CREATE INDEX idx_flashcard_decks_user_id ON public.flashcard_decks(user_id);
CREATE INDEX idx_flashcards_user_id ON public.flashcards(user_id);
CREATE INDEX idx_flashcards_deck_id ON public.flashcards(deck_id);
CREATE INDEX idx_flashcards_next_review ON public.flashcards(next_review);
CREATE INDEX idx_flashcard_reviews_user_id ON public.flashcard_reviews(user_id);
CREATE INDEX idx_flashcard_reviews_flashcard_id ON public.flashcard_reviews(flashcard_id);
CREATE INDEX idx_study_materials_user_id ON public.study_materials(user_id);
CREATE INDEX idx_study_materials_search_vector ON public.study_materials USING gin(search_vector);
CREATE INDEX idx_study_materials_tags ON public.study_materials USING gin(tags);
CREATE INDEX idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX idx_user_activity_created_at ON public.user_activity(created_at);
CREATE INDEX idx_learning_streaks_user_id ON public.learning_streaks(user_id);
CREATE INDEX idx_study_goals_user_id ON public.study_goals(user_id);
CREATE INDEX idx_collections_user_id ON public.collections(user_id);
CREATE INDEX idx_collection_items_collection_id ON public.collection_items(collection_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_shared_content_owner_id ON public.shared_content(owner_id);
CREATE INDEX idx_shared_content_shared_with_id ON public.shared_content(shared_with_id);
CREATE INDEX idx_shared_content_share_token ON public.shared_content(share_token);
