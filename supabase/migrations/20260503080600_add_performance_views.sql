-- Create user_answers table for granular tracking
CREATE TABLE IF NOT EXISTS public.user_answers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  test_id UUID REFERENCES public.tests(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_spent_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update test_results table to support course-centric metrics
ALTER TABLE public.test_results 
ADD COLUMN IF NOT EXISTS module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS total_questions INTEGER,
ADD COLUMN IF NOT EXISTS correct_answers INTEGER,
ADD COLUMN IF NOT EXISTS score_percentage DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS total_time_seconds INTEGER,
ADD COLUMN IF NOT EXISTS average_time_per_question DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS insights_requested BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS insights_generated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS insights_text TEXT,
ADD COLUMN IF NOT EXISTS weak_areas JSONB,
ADD COLUMN IF NOT EXISTS strong_areas JSONB,
ADD COLUMN IF NOT EXISTS recommendations TEXT;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_test_results_module_id ON public.test_results(module_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_test_id ON public.user_answers(test_id);

-- Course Performance View
DROP VIEW IF EXISTS public.course_performance;
CREATE OR REPLACE VIEW public.course_performance AS
SELECT 
    c.id as course_id,
    c.user_id,
    c.title,
    c.total_modules,
    COUNT(DISTINCT m.id) FILTER (WHERE tr.id IS NOT NULL) as modules_tested,
    ROUND(AVG(COALESCE(tr.score_percentage, 0))::numeric, 2) as overall_average_score,
    MAX(COALESCE(tr.score_percentage, 0)) as best_module_score,
    COUNT(tr.id) as total_tests_taken,
    COALESCE(MAX(tr.completed_at), c.created_at) as last_studied_at
FROM public.courses c
LEFT JOIN public.modules m ON c.id = m.course_id
LEFT JOIN public.test_results tr ON m.id = tr.module_id AND tr.user_id = c.user_id
GROUP BY c.id, c.user_id, c.title, c.total_modules, c.created_at;

-- Module Performance View
DROP VIEW IF EXISTS public.module_performance;
CREATE OR REPLACE VIEW public.module_performance AS
SELECT 
    m.id as module_id,
    m.course_id,
    c.user_id,
    m.title,
    COUNT(tr.id) as total_attempts,
    ROUND(AVG(COALESCE(tr.score_percentage, 0))::numeric, 2) as average_score,
    MAX(COALESCE(tr.score_percentage, 0)) as best_score,
    MAX(tr.completed_at) as last_attempt_at
FROM public.modules m
JOIN public.courses c ON m.course_id = c.id
LEFT JOIN public.test_results tr ON m.id = tr.module_id AND tr.user_id = c.user_id
GROUP BY m.id, m.course_id, c.user_id, m.title;

-- Module Statistics Function
DROP FUNCTION IF EXISTS public.get_module_statistics(UUID, UUID);
CREATE OR REPLACE FUNCTION public.get_module_statistics(p_module_id UUID, p_user_id UUID)
RETURNS TABLE (
    average_score NUMERIC,
    total_attempts BIGINT,
    best_score NUMERIC,
    last_attempt_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROUND(AVG(COALESCE(score_percentage, 0))::numeric, 2) as average_score,
        COUNT(*)::BIGINT as total_attempts,
        MAX(COALESCE(score_percentage, 0))::NUMERIC as best_score,
        MAX(completed_at) as last_attempt_at
    FROM public.test_results
    WHERE module_id = p_module_id AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS for user_answers
ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own answers" ON public.user_answers
  FOR ALL USING (auth.uid() = user_id);
