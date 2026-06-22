-- ============================================================================
-- STUDYWISE AI - COURSE-CENTRIC SCHEMA (Complete Redesign)
-- ============================================================================
-- This schema transforms the app from test-centric to course-centric
-- Cleans all previous user data while preserving auth records
-- Maintains minimalistic design principles
-- ============================================================================

-- ============================================================================
-- STEP 1: CLEAN EXISTING DATA (PRESERVE AUTH)
-- ============================================================================

-- Drop all existing tables (except auth.users which is managed by Supabase)
-- Drop in correct order to handle foreign key dependencies
DROP TABLE IF EXISTS public.user_answers CASCADE;
DROP TABLE IF EXISTS public.questions CASCADE;
DROP TABLE IF EXISTS public.test_results CASCADE;
DROP TABLE IF EXISTS public.tests CASCADE;
DROP TABLE IF EXISTS public.modules CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.shared_content CASCADE;
DROP TABLE IF EXISTS public.user_activity_log CASCADE;
DROP TABLE IF EXISTS public.study_goals CASCADE;
DROP TABLE IF EXISTS public.learning_streaks CASCADE;
DROP TABLE IF EXISTS public.flashcard_reviews CASCADE;
DROP TABLE IF EXISTS public.flashcards CASCADE;
DROP TABLE IF EXISTS public.flashcard_decks CASCADE;
DROP TABLE IF EXISTS public.test_answers CASCADE;
DROP TABLE IF EXISTS public.test_sessions CASCADE;
DROP TABLE IF EXISTS public.test_questions CASCADE;
DROP TABLE IF EXISTS public.content_tags CASCADE;
DROP TABLE IF EXISTS public.tags CASCADE;
DROP TABLE IF EXISTS public.study_materials CASCADE;
DROP TABLE IF EXISTS public.collections CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Drop views if they exist
DROP VIEW IF EXISTS public.module_performance CASCADE;
DROP VIEW IF EXISTS public.course_performance CASCADE;
DROP VIEW IF EXISTS public.user_statistics CASCADE;

-- Drop existing functions and triggers
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS calculate_next_review_date(interval, integer) CASCADE;

-- ============================================================================
-- STEP 2: CORE UTILITY FUNCTIONS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 3: USER PROFILES (Minimal)
-- ============================================================================

CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  
  -- Question Generation Preferences (Global Settings)
  default_question_type TEXT DEFAULT 'mixed' CHECK (default_question_type IN ('mcq', 'true_false', 'mixed')),
  default_difficulty TEXT DEFAULT 'medium' CHECK (default_difficulty IN ('easy', 'medium', 'hard')),
  default_questions_per_module INTEGER DEFAULT 10 CHECK (default_questions_per_module BETWEEN 5 AND 50),
  
  -- UI Preferences
  show_test_preview_modal BOOLEAN DEFAULT true, -- Show modal before first test
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Trigger
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 4: COURSES (The Core Entity)
-- ============================================================================

CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Course Metadata
  title TEXT NOT NULL,
  description TEXT,
  
  -- Source Document Info
  source_filename TEXT NOT NULL,
  source_file_type TEXT NOT NULL CHECK (source_file_type IN ('pdf', 'docx', 'txt', 'md')),
  source_content TEXT NOT NULL, -- Full extracted text
  
  -- User Context (from upload)
  user_context TEXT, -- Optional context provided during upload
  
  -- AI Parsing Status
  parsing_status TEXT DEFAULT 'pending' CHECK (parsing_status IN ('pending', 'processing', 'completed', 'failed')),
  parsing_error TEXT, -- Error message if parsing failed
  used_fallback BOOLEAN DEFAULT false, -- True if AI parsing failed and fallback was used
  
  -- Course Structure
  total_modules INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_studied_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_courses_user_id ON public.courses(user_id);
CREATE INDEX idx_courses_created_at ON public.courses(created_at DESC);
CREATE INDEX idx_courses_parsing_status ON public.courses(parsing_status);

-- Enable RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own courses"
  ON public.courses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own courses"
  ON public.courses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own courses"
  ON public.courses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own courses"
  ON public.courses FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger
CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 5: MODULES (Course Chapters/Sections)
-- ============================================================================

CREATE TABLE public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  
  -- Module Info
  title TEXT NOT NULL,
  content TEXT NOT NULL, -- Full module text content
  module_order INTEGER NOT NULL, -- Position in course (1, 2, 3...)
  
  -- Content Metadata
  word_count INTEGER,
  estimated_read_time INTEGER, -- Minutes
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_modules_course_id ON public.modules(course_id);
CREATE INDEX idx_modules_order ON public.modules(course_id, module_order);

-- Enable RLS
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view modules of own courses"
  ON public.modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = modules.course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create modules for own courses"
  ON public.modules FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = modules.course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update modules of own courses"
  ON public.modules FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = modules.course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete modules of own courses"
  ON public.modules FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = modules.course_id
      AND courses.user_id = auth.uid()
    )
  );

-- Trigger
CREATE TRIGGER update_modules_updated_at
  BEFORE UPDATE ON public.modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 6: TESTS (Generated from Modules)
-- ============================================================================

CREATE TABLE public.tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Test Configuration
  question_count INTEGER NOT NULL DEFAULT 10,
  question_type TEXT NOT NULL CHECK (question_type IN ('mcq', 'true_false', 'mixed')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  
  -- Test Status
  status TEXT DEFAULT 'generated' CHECK (status IN ('generated', 'in_progress', 'completed', 'abandoned')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_tests_module_id ON public.tests(module_id);
CREATE INDEX idx_tests_user_id ON public.tests(user_id);
CREATE INDEX idx_tests_status ON public.tests(status);

-- Enable RLS
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own tests"
  ON public.tests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tests"
  ON public.tests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tests"
  ON public.tests FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tests"
  ON public.tests FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- STEP 7: QUESTIONS (AI-Generated)
-- ============================================================================

CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  
  -- Question Content
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('mcq', 'true_false')),
  question_order INTEGER NOT NULL, -- Position in test (1, 2, 3...)
  
  -- Answer Options (for MCQ)
  options JSONB, -- Array of options: ["Option A", "Option B", "Option C", "Option D"]
  correct_answer TEXT NOT NULL,
  
  -- Source Attribution
  source_text TEXT, -- Excerpt from module content
  source_offset INTEGER, -- Character offset in module content
  
  -- Explanation
  explanation TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_questions_test_id ON public.questions(test_id);
CREATE INDEX idx_questions_order ON public.questions(test_id, question_order);

-- Enable RLS
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view questions of own tests"
  ON public.questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tests
      WHERE tests.id = questions.test_id
      AND tests.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create questions for own tests"
  ON public.questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tests
      WHERE tests.id = questions.test_id
      AND tests.user_id = auth.uid()
    )
  );

-- ============================================================================
-- STEP 8: USER ANSWERS (Test Responses)
-- ============================================================================

CREATE TABLE public.user_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Answer Data
  user_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  
  -- Timing
  time_spent_seconds INTEGER, -- Time spent on this question
  answered_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(test_id, question_id) -- One answer per question per test
);

-- Indexes
CREATE INDEX idx_user_answers_test_id ON public.user_answers(test_id);
CREATE INDEX idx_user_answers_user_id ON public.user_answers(user_id);

-- Enable RLS
ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own answers"
  ON public.user_answers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own answers"
  ON public.user_answers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own answers"
  ON public.user_answers FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- STEP 9: TEST RESULTS (Summary & Analytics)
-- ============================================================================

CREATE TABLE public.test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Score Data
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  score_percentage DECIMAL(5,2) NOT NULL,
  
  -- Timing Data
  total_time_seconds INTEGER NOT NULL,
  average_time_per_question DECIMAL(10,2),
  
  -- Test Metadata
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- AI Insights (On-Demand)
  insights_requested BOOLEAN DEFAULT false,
  insights_generated_at TIMESTAMPTZ,
  insights_text TEXT, -- AI-generated analysis
  weak_areas JSONB, -- Array of topics: ["Topic 1", "Topic 2"]
  strong_areas JSONB, -- Array of topics
  recommendations TEXT -- AI recommendations
);

-- Indexes
CREATE INDEX idx_test_results_test_id ON public.test_results(test_id);
CREATE INDEX idx_test_results_module_id ON public.test_results(module_id);
CREATE INDEX idx_test_results_user_id ON public.test_results(user_id);
CREATE INDEX idx_test_results_completed_at ON public.test_results(completed_at DESC);

-- Enable RLS
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own results"
  ON public.test_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own results"
  ON public.test_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own results"
  ON public.test_results FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- STEP 10: ANALYTICS VIEWS (Computed Data)
-- ============================================================================

-- Module Performance View
CREATE OR REPLACE VIEW public.module_performance AS
SELECT
  m.id AS module_id,
  m.course_id,
  c.user_id,
  m.title AS module_title,
  COUNT(DISTINCT tr.id) AS total_attempts,
  ROUND(AVG(tr.score_percentage), 2) AS average_score,
  MAX(tr.score_percentage) AS best_score,
  MIN(tr.score_percentage) AS worst_score,
  MAX(tr.completed_at) AS last_attempt_at
FROM public.modules m
JOIN public.courses c ON c.id = m.course_id
LEFT JOIN public.test_results tr ON tr.module_id = m.id
GROUP BY m.id, m.course_id, c.user_id, m.title;

-- Course Performance View
CREATE OR REPLACE VIEW public.course_performance AS
SELECT
  c.id AS course_id,
  c.user_id,
  c.title AS course_title,
  c.total_modules,
  COUNT(DISTINCT mp.module_id) AS modules_tested,
  ROUND(AVG(mp.average_score), 2) AS overall_average_score,
  MAX(mp.best_score) AS best_module_score,
  SUM(mp.total_attempts) AS total_tests_taken,
  MAX(mp.last_attempt_at) AS last_studied_at
FROM public.courses c
LEFT JOIN public.module_performance mp ON mp.course_id = c.id
GROUP BY c.id, c.user_id, c.title, c.total_modules;

-- User Statistics View
CREATE OR REPLACE VIEW public.user_statistics AS
SELECT
  up.id AS user_id,
  COUNT(DISTINCT c.id) AS total_courses,
  COUNT(DISTINCT m.id) AS total_modules,
  COUNT(DISTINCT t.id) AS total_tests_taken,
  ROUND(AVG(tr.score_percentage), 2) AS overall_average_score,
  MAX(tr.score_percentage) AS best_score_ever,
  SUM(tr.total_time_seconds) AS total_study_time_seconds,
  MAX(tr.completed_at) AS last_test_date
FROM public.user_profiles up
LEFT JOIN public.courses c ON c.user_id = up.id
LEFT JOIN public.modules m ON m.course_id = c.id
LEFT JOIN public.tests t ON t.user_id = up.id
LEFT JOIN public.test_results tr ON tr.user_id = up.id
GROUP BY up.id;

-- ============================================================================
-- STEP 11: HELPER FUNCTIONS
-- ============================================================================

-- Function: Get Course Progress
CREATE OR REPLACE FUNCTION get_course_progress(p_course_id UUID, p_user_id UUID)
RETURNS TABLE (
  total_modules INTEGER,
  modules_with_tests INTEGER,
  progress_percentage DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.total_modules,
    COUNT(DISTINCT tr.module_id)::INTEGER AS modules_with_tests,
    CASE
      WHEN c.total_modules > 0 THEN
        ROUND((COUNT(DISTINCT tr.module_id)::DECIMAL / c.total_modules) * 100, 2)
      ELSE 0
    END AS progress_percentage
  FROM public.courses c
  LEFT JOIN public.modules m ON m.course_id = c.id
  LEFT JOIN public.test_results tr ON tr.module_id = m.id AND tr.user_id = p_user_id
  WHERE c.id = p_course_id AND c.user_id = p_user_id
  GROUP BY c.id, c.total_modules;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get Module Statistics
CREATE OR REPLACE FUNCTION get_module_statistics(p_module_id UUID, p_user_id UUID)
RETURNS TABLE (
  total_attempts INTEGER,
  average_score DECIMAL(5,2),
  best_score DECIMAL(5,2),
  last_attempt_date TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(tr.id)::INTEGER AS total_attempts,
    ROUND(AVG(tr.score_percentage), 2) AS average_score,
    MAX(tr.score_percentage) AS best_score,
    MAX(tr.completed_at) AS last_attempt_date
  FROM public.test_results tr
  WHERE tr.module_id = p_module_id AND tr.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 12: SAMPLE DATA CLEANUP FUNCTION
-- ============================================================================

-- Function to clean all user data (except auth) - useful for testing
CREATE OR REPLACE FUNCTION clean_user_data(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  DELETE FROM public.user_answers WHERE user_id = p_user_id;
  DELETE FROM public.test_results WHERE user_id = p_user_id;
  DELETE FROM public.tests WHERE user_id = p_user_id;
  DELETE FROM public.courses WHERE user_id = p_user_id;
  
  -- Reset user preferences to defaults
  UPDATE public.user_profiles
  SET
    default_question_type = 'mixed',
    default_difficulty = 'medium',
    default_questions_per_module = 10,
    show_test_preview_modal = true,
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 13: INDEXES FOR PERFORMANCE
-- ============================================================================

-- Additional composite indexes for common queries
CREATE INDEX idx_test_results_user_module ON public.test_results(user_id, module_id, completed_at DESC);
CREATE INDEX idx_modules_course_order ON public.modules(course_id, module_order);
CREATE INDEX idx_courses_user_updated ON public.courses(user_id, updated_at DESC);

-- ============================================================================
-- STEP 14: GRANTS (If needed for service role)
-- ============================================================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ============================================================================
-- COMPLETION NOTICE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'STUDYWISE AI - COURSE-CENTRIC SCHEMA DEPLOYED SUCCESSFULLY';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ CORE ENTITIES:';
  RAISE NOTICE '   • user_profiles - User settings and preferences';
  RAISE NOTICE '   • courses - Main course entity with AI parsing status';
  RAISE NOTICE '   • modules - Course chapters/sections';
  RAISE NOTICE '   • tests - Generated tests from modules';
  RAISE NOTICE '   • questions - AI-generated questions';
  RAISE NOTICE '   • user_answers - Test responses';
  RAISE NOTICE '   • test_results - Performance analytics';
  RAISE NOTICE '';
  RAISE NOTICE '✅ ANALYTICS VIEWS:';
  RAISE NOTICE '   • module_performance - Per-module statistics';
  RAISE NOTICE '   • course_performance - Per-course statistics';
  RAISE NOTICE '   • user_statistics - Overall user stats';
  RAISE NOTICE '';
  RAISE NOTICE '✅ HELPER FUNCTIONS:';
  RAISE NOTICE '   • get_course_progress() - Calculate course completion';
  RAISE NOTICE '   • get_module_statistics() - Module performance data';
  RAISE NOTICE '   • clean_user_data() - Reset user data for testing';
  RAISE NOTICE '';
  RAISE NOTICE '✅ SECURITY:';
  RAISE NOTICE '   • Row Level Security enabled on all tables';
  RAISE NOTICE '   • Users can only access their own data';
  RAISE NOTICE '   • Auth records preserved';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 DESIGN PRINCIPLES:';
  RAISE NOTICE '   • Course-centric architecture';
  RAISE NOTICE '   • Minimal user preferences (global settings)';
  RAISE NOTICE '   • On-demand AI insights (cost-effective)';
  RAISE NOTICE '   • Hierarchical organization: Course → Module → Test';
  RAISE NOTICE '   • Fallback support for AI parsing failures';
  RAISE NOTICE '';
  RAISE NOTICE 'Ready to build the new StudyWise AI experience!';
  RAISE NOTICE '============================================================================';
END $$;
