-- Fix: Rename view columns so course_title and module_title are returned correctly
-- Run this in your Supabase SQL Editor

-- Fix course_performance view
DROP VIEW IF EXISTS public.course_performance;
CREATE OR REPLACE VIEW public.course_performance AS
SELECT 
    c.id as course_id,
    c.user_id,
    c.title as course_title,
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

-- Fix module_performance view
DROP VIEW IF EXISTS public.module_performance;
CREATE OR REPLACE VIEW public.module_performance AS
SELECT 
    m.id as module_id,
    m.course_id,
    c.user_id,
    m.title as module_title,
    COUNT(tr.id) as total_attempts,
    ROUND(AVG(COALESCE(tr.score_percentage, 0))::numeric, 2) as average_score,
    MAX(COALESCE(tr.score_percentage, 0)) as best_score,
    MAX(tr.completed_at) as last_attempt_at
FROM public.modules m
JOIN public.courses c ON m.course_id = c.id
LEFT JOIN public.test_results tr ON m.id = tr.module_id AND tr.user_id = c.user_id
GROUP BY m.id, m.course_id, c.user_id, m.title;
