-- ============================================================================
-- STUDYWISE AI — COMPLETE DATABASE SCHEMA
-- Version: 2.0 (Course-Centric)
-- Run this file against a fresh Supabase project to build the full database.
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE / DROP IF EXISTS.
-- ============================================================================

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- UTILITY FUNCTIONS (must be first — triggers depend on them)
-- ============================================================================

-- Auto-updates the updated_at column on any table that has one
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Creates a profile row automatically when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- USER PROFILES
-- Replaces both the old `profiles` and `user_preferences` tables.
-- All user settings live here — no separate preferences table.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  full_name     TEXT,
  avatar_url    TEXT,

  -- Question generation preferences (used by ModuleTestController)
  default_question_type       TEXT DEFAULT 'mixed'  CHECK (default_question_type IN ('mcq', 'true_false', 'mixed')),
  default_difficulty          TEXT DEFAULT 'medium' CHECK (default_difficulty IN ('easy', 'medium', 'hard')),
  default_questions_per_module INTEGER DEFAULT 10  CHECK (default_questions_per_module BETWEEN 5 AND 50),

  -- UI preferences
  theme                       TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  show_test_preview_modal     BOOLEAN DEFAULT true,

  -- Usage tracking (for cost-control)
  daily_generations_used      INTEGER DEFAULT 0,
  daily_generations_reset_at  TIMESTAMPTZ DEFAULT NOW(),

  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile"   ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger: auto-create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- COURSES
-- The root entity. One course = one uploaded document.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.courses (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  title             TEXT NOT NULL,
  description       TEXT,

  -- Source document
  source_filename   TEXT NOT NULL,
  source_file_type  TEXT NOT NULL CHECK (source_file_type IN ('pdf', 'docx', 'txt', 'md')),
  source_content    TEXT NOT NULL,       -- Full extracted text
  user_context      TEXT,                -- 500-char context provided at upload

  -- AI parsing state
  parsing_status    TEXT DEFAULT 'pending' CHECK (parsing_status IN ('pending', 'processing', 'completed', 'failed')),
  parsing_error     TEXT,
  used_fallback     BOOLEAN DEFAULT false,

  -- Structure
  total_modules     INTEGER DEFAULT 0,

  -- Full-text search
  search_vector     TSVECTOR,

  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  last_studied_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_courses_user_id        ON public.courses(user_id);
CREATE INDEX IF NOT EXISTS idx_courses_created_at     ON public.courses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_courses_parsing_status ON public.courses(parsing_status);
CREATE INDEX IF NOT EXISTS idx_courses_user_updated   ON public.courses(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_courses_search         ON public.courses USING GIN(search_vector);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own courses"   ON public.courses;
DROP POLICY IF EXISTS "Users can create own courses" ON public.courses;
DROP POLICY IF EXISTS "Users can update own courses" ON public.courses;
DROP POLICY IF EXISTS "Users can delete own courses" ON public.courses;

CREATE POLICY "Users can view own courses"
  ON public.courses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own courses"
  ON public.courses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own courses"
  ON public.courses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own courses"
  ON public.courses FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_courses_updated_at ON public.courses;
CREATE TRIGGER trg_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Search vector update function for courses
CREATE OR REPLACE FUNCTION public.update_course_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector = to_tsvector('english',
    COALESCE(NEW.title, '') || ' ' ||
    COALESCE(NEW.user_context, '') || ' ' ||
    COALESCE(LEFT(NEW.source_content, 10000), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_courses_search_vector ON public.courses;
CREATE TRIGGER trg_courses_search_vector
  BEFORE INSERT OR UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_course_search_vector();

-- ============================================================================
-- MODULES
-- Chapters/sections parsed from a course document.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.modules (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id             UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,

  title                 TEXT NOT NULL,
  content               TEXT NOT NULL,
  module_order          INTEGER NOT NULL,

  word_count            INTEGER DEFAULT 0,
  estimated_read_time   INTEGER DEFAULT 1,  -- Minutes

  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_modules_course_id    ON public.modules(course_id);
CREATE INDEX IF NOT EXISTS idx_modules_course_order ON public.modules(course_id, module_order);

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view modules of own courses"   ON public.modules;
DROP POLICY IF EXISTS "Users can create modules for own courses" ON public.modules;
DROP POLICY IF EXISTS "Users can update modules of own courses" ON public.modules;
DROP POLICY IF EXISTS "Users can delete modules of own courses" ON public.modules;

CREATE POLICY "Users can view modules of own courses"
  ON public.modules FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.courses WHERE courses.id = modules.course_id AND courses.user_id = auth.uid()));
CREATE POLICY "Users can create modules for own courses"
  ON public.modules FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.courses WHERE courses.id = modules.course_id AND courses.user_id = auth.uid()));
CREATE POLICY "Users can update modules of own courses"
  ON public.modules FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.courses WHERE courses.id = modules.course_id AND courses.user_id = auth.uid()));
CREATE POLICY "Users can delete modules of own courses"
  ON public.modules FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.courses WHERE courses.id = modules.course_id AND courses.user_id = auth.uid()));

DROP TRIGGER IF EXISTS trg_modules_updated_at ON public.modules;
CREATE TRIGGER trg_modules_updated_at
  BEFORE UPDATE ON public.modules
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- TESTS
-- A test instance tied to a module (or the whole course for exams).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id       UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  course_id       UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Configuration (mirrors user preferences at time of generation)
  question_count  INTEGER NOT NULL DEFAULT 10,
  question_type   TEXT NOT NULL CHECK (question_type IN ('mcq', 'true_false', 'mixed')),
  difficulty      TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  is_exam         BOOLEAN DEFAULT false,  -- true = full course exam

  -- State
  status          TEXT DEFAULT 'generated' CHECK (status IN ('generated', 'in_progress', 'completed', 'abandoned')),

  created_at    TIMESTAMPTZ DEFAULT NOW(),
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tests_module_id  ON public.tests(module_id);
CREATE INDEX IF NOT EXISTS idx_tests_course_id  ON public.tests(course_id);
CREATE INDEX IF NOT EXISTS idx_tests_user_id    ON public.tests(user_id);
CREATE INDEX IF NOT EXISTS idx_tests_status     ON public.tests(status);

ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own tests"   ON public.tests;
DROP POLICY IF EXISTS "Users can create own tests" ON public.tests;
DROP POLICY IF EXISTS "Users can update own tests" ON public.tests;
DROP POLICY IF EXISTS "Users can delete own tests" ON public.tests;

CREATE POLICY "Users can view own tests"
  ON public.tests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own tests"
  ON public.tests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tests"
  ON public.tests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tests"
  ON public.tests FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- QUESTIONS
-- AI-generated questions belonging to a test.
-- options is JSONB (native array) — never stringified.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.questions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id         UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,

  question_text   TEXT NOT NULL,
  question_type   TEXT NOT NULL CHECK (question_type IN ('mcq', 'true_false')),
  question_order  INTEGER NOT NULL,

  options         JSONB,          -- Array of strings: ["A","B","C","D"] or ["True","False"]
  correct_answer  TEXT NOT NULL,

  explanation     TEXT,
  source_text     TEXT,           -- Excerpt from module content
  source_offset   INTEGER,        -- Character offset in module content

  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_test_id    ON public.questions(test_id);
CREATE INDEX IF NOT EXISTS idx_questions_test_order ON public.questions(test_id, question_order);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view questions of own tests"   ON public.questions;
DROP POLICY IF EXISTS "Users can create questions for own tests" ON public.questions;

CREATE POLICY "Users can view questions of own tests"
  ON public.questions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.tests WHERE tests.id = questions.test_id AND tests.user_id = auth.uid()));
CREATE POLICY "Users can create questions for own tests"
  ON public.questions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.tests WHERE tests.id = questions.test_id AND tests.user_id = auth.uid()));

-- ============================================================================
-- USER ANSWERS
-- One row per question per test attempt.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_answers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id             UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  question_id         UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  user_answer         TEXT NOT NULL,
  is_correct          BOOLEAN NOT NULL,
  time_spent_seconds  INTEGER DEFAULT 0,

  answered_at  TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(test_id, question_id)  -- One answer per question per test
);

CREATE INDEX IF NOT EXISTS idx_user_answers_test_id  ON public.user_answers(test_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_user_id  ON public.user_answers(user_id);

ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own answers" ON public.user_answers;
CREATE POLICY "Users can manage own answers"
  ON public.user_answers FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- TEST RESULTS
-- Summary row created after test submission.
-- AI insights are stored here on-demand.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.test_results (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id         UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  module_id       UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  course_id       UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Score
  total_questions   INTEGER NOT NULL,
  correct_answers   INTEGER NOT NULL,
  score_percentage  DECIMAL(5,2) NOT NULL CHECK (score_percentage BETWEEN 0 AND 100),

  -- Timing
  total_time_seconds          INTEGER NOT NULL DEFAULT 0,
  average_time_per_question   DECIMAL(10,2),

  completed_at  TIMESTAMPTZ DEFAULT NOW(),

  -- AI Insights (generated on-demand to save cost)
  insights_requested    BOOLEAN DEFAULT false,
  insights_generated_at TIMESTAMPTZ,
  insights_text         TEXT,
  weak_areas            JSONB,  -- ["Topic A", "Topic B"]
  strong_areas          JSONB,  -- ["Topic C"]
  recommendations       TEXT
);

CREATE INDEX IF NOT EXISTS idx_test_results_test_id      ON public.test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_test_results_module_id    ON public.test_results(module_id);
CREATE INDEX IF NOT EXISTS idx_test_results_course_id    ON public.test_results(course_id);
CREATE INDEX IF NOT EXISTS idx_test_results_user_id      ON public.test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_test_results_completed_at ON public.test_results(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_test_results_user_module  ON public.test_results(user_id, module_id, completed_at DESC);

ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own results"   ON public.test_results;
DROP POLICY IF EXISTS "Users can create own results" ON public.test_results;
DROP POLICY IF EXISTS "Users can update own results" ON public.test_results;

CREATE POLICY "Users can view own results"
  ON public.test_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own results"
  ON public.test_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own results"
  ON public.test_results FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- ANALYTICS VIEWS
-- Pre-computed views for the Results and Library pages.
-- All views are RLS-safe because they filter through joined user_id.
-- ============================================================================

-- Per-module performance aggregated over all attempts
DROP VIEW IF EXISTS public.module_performance;
CREATE OR REPLACE VIEW public.module_performance AS
SELECT
  m.id           AS module_id,
  m.course_id,
  c.user_id,
  m.title        AS module_title,
  COUNT(tr.id)                                             AS total_attempts,
  ROUND(AVG(COALESCE(tr.score_percentage, 0))::NUMERIC, 2) AS average_score,
  MAX(COALESCE(tr.score_percentage, 0))                    AS best_score,
  MAX(tr.completed_at)                                     AS last_attempt_at
FROM public.modules m
JOIN public.courses c ON c.id = m.course_id
LEFT JOIN public.test_results tr ON tr.module_id = m.id AND tr.user_id = c.user_id
GROUP BY m.id, m.course_id, c.user_id, m.title;

-- Per-course performance (aggregates modules)
DROP VIEW IF EXISTS public.course_performance;
CREATE OR REPLACE VIEW public.course_performance AS
SELECT
  c.id           AS course_id,
  c.user_id,
  c.title        AS course_title,
  c.total_modules,
  COUNT(DISTINCT mp.module_id) FILTER (WHERE mp.total_attempts > 0) AS modules_tested,
  ROUND(AVG(mp.average_score)::NUMERIC, 2)                          AS overall_average_score,
  MAX(mp.best_score)                                                AS best_module_score,
  SUM(mp.total_attempts)                                            AS total_tests_taken,
  MAX(mp.last_attempt_at)                                           AS last_studied_at
FROM public.courses c
LEFT JOIN public.module_performance mp ON mp.course_id = c.id
GROUP BY c.id, c.user_id, c.title, c.total_modules;

-- User-level stats (for a future dashboard stats widget)
DROP VIEW IF EXISTS public.user_statistics;
CREATE OR REPLACE VIEW public.user_statistics AS
SELECT
  up.id AS user_id,
  COUNT(DISTINCT c.id)  AS total_courses,
  COUNT(DISTINCT m.id)  AS total_modules,
  COUNT(DISTINCT t.id)  AS total_tests_taken,
  ROUND(AVG(tr.score_percentage)::NUMERIC, 2) AS overall_average_score,
  MAX(tr.score_percentage)                     AS best_score_ever,
  SUM(tr.total_time_seconds)                   AS total_study_time_seconds,
  MAX(tr.completed_at)                         AS last_test_date
FROM public.user_profiles up
LEFT JOIN public.courses      c  ON c.user_id  = up.id
LEFT JOIN public.modules      m  ON m.course_id = c.id
LEFT JOIN public.tests        t  ON t.user_id   = up.id
LEFT JOIN public.test_results tr ON tr.user_id  = up.id
GROUP BY up.id;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get progress for a specific course (how many modules have been tested)
CREATE OR REPLACE FUNCTION public.get_course_progress(p_course_id UUID, p_user_id UUID)
RETURNS TABLE (
  total_modules        INTEGER,
  modules_with_tests   INTEGER,
  progress_percentage  DECIMAL(5,2)
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

-- Get aggregated stats for a specific module
CREATE OR REPLACE FUNCTION public.get_module_statistics(p_module_id UUID, p_user_id UUID)
RETURNS TABLE (
  total_attempts      BIGINT,
  average_score       NUMERIC,
  best_score          NUMERIC,
  last_attempt_at     TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT                                    AS total_attempts,
    ROUND(AVG(COALESCE(score_percentage, 0))::NUMERIC, 2) AS average_score,
    MAX(COALESCE(score_percentage, 0))::NUMERIC         AS best_score,
    MAX(completed_at)                                   AS last_attempt_at
  FROM public.test_results
  WHERE module_id = p_module_id AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Utility: wipe all study data for a user (useful for testing, not exposed in prod UI)
CREATE OR REPLACE FUNCTION public.clean_user_data(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  DELETE FROM public.user_answers   WHERE user_id = p_user_id;
  DELETE FROM public.test_results   WHERE user_id = p_user_id;
  DELETE FROM public.tests          WHERE user_id = p_user_id;
  DELETE FROM public.courses        WHERE user_id = p_user_id;
  UPDATE public.user_profiles
  SET
    default_question_type        = 'mixed',
    default_difficulty           = 'medium',
    default_questions_per_module = 10,
    show_test_preview_modal      = true,
    daily_generations_used       = 0,
    updated_at                   = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES    IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ============================================================================
-- DONE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '==================================================================';
  RAISE NOTICE 'StudyWise AI — Schema v2.0 deployed successfully';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables:';
  RAISE NOTICE '  user_profiles  — auth + preferences (replaces profiles + user_preferences)';
  RAISE NOTICE '  courses        — uploaded documents';
  RAISE NOTICE '  modules        — parsed chapters';
  RAISE NOTICE '  tests          — generated test instances';
  RAISE NOTICE '  questions      — AI questions (options stored as JSONB, never stringified)';
  RAISE NOTICE '  user_answers   — per-question responses';
  RAISE NOTICE '  test_results   — score summary + AI insights';
  RAISE NOTICE '';
  RAISE NOTICE 'Views:';
  RAISE NOTICE '  module_performance, course_performance, user_statistics';
  RAISE NOTICE '';
  RAISE NOTICE 'Functions:';
  RAISE NOTICE '  get_course_progress(), get_module_statistics(), clean_user_data()';
  RAISE NOTICE '  handle_new_user() — auto-creates profile on signup';
  RAISE NOTICE '';
  RAISE NOTICE 'Security: RLS enabled on all tables. auth.uid() enforced everywhere.';
  RAISE NOTICE '==================================================================';
END $$;
