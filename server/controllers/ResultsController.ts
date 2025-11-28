import { Request, Response } from 'express';
import { supabase } from '../lib/supabase';

export class ResultsController {
  /**
   * Get all course results for the user
   * GET /api/results/courses
   */
  static async getCourseResults(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      const { data, error } = await supabase
        .from('course_performance')
        .select('*')
        .eq('user_id', userId)
        .order('last_studied_at', { ascending: false, nullsFirst: false });

      if (error) throw error;

      return res.json(data || []);
    } catch (error) {
      console.error('Get course results error:', error);
      return res.status(500).json({ message: 'Failed to fetch course results' });
    }
  }

  /**
   * Get module results for a specific course
   * GET /api/results/courses/:courseId/modules
   */
  static async getModuleResults(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const userId = req.user?.id;

      const { data, error } = await supabase
        .from('module_performance')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', userId)
        .order('module_id');

      if (error) throw error;

      return res.json(data || []);
    } catch (error) {
      console.error('Get module results error:', error);
      return res.status(500).json({ message: 'Failed to fetch module results' });
    }
  }

  /**
   * Get test result details
   * GET /api/tests/:testId/result
   */
  static async getTestResult(req: Request, res: Response) {
    try {
      const { testId } = req.params;
      const userId = req.user?.id;

      const { data, error } = await supabase
        .from('test_results')
        .select('*')
        .eq('test_id', testId)
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return res.status(404).json({ message: 'Test result not found' });
      }

      return res.json(data);
    } catch (error) {
      console.error('Get test result error:', error);
      return res.status(500).json({ message: 'Failed to fetch test result' });
    }
  }

  /**
   * Get questions for a test
   * GET /api/tests/:testId/questions
   */
  static async getTestQuestions(req: Request, res: Response) {
    try {
      const { testId } = req.params;

      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('test_id', testId)
        .order('question_order');

      if (error) throw error;

      return res.json(data || []);
    } catch (error) {
      console.error('Get test questions error:', error);
      return res.status(500).json({ message: 'Failed to fetch questions' });
    }
  }

  /**
   * Get user answers for a test
   * GET /api/tests/:testId/answers
   */
  static async getTestAnswers(req: Request, res: Response) {
    try {
      const { testId } = req.params;
      const userId = req.user?.id;

      const { data, error } = await supabase
        .from('user_answers')
        .select('*')
        .eq('test_id', testId)
        .eq('user_id', userId);

      if (error) throw error;

      return res.json(data || []);
    } catch (error) {
      console.error('Get test answers error:', error);
      return res.status(500).json({ message: 'Failed to fetch answers' });
    }
  }

  /**
   * Get statistics for a test (module and course averages)
   * GET /api/tests/:testId/stats
   */
  static async getTestStats(req: Request, res: Response) {
    try {
      const { testId } = req.params;
      const userId = req.user?.id;

      // Get test to find module and course
      const { data: test } = await supabase
        .from('tests')
        .select('module_id')
        .eq('id', testId)
        .single();

      if (!test) {
        return res.status(404).json({ message: 'Test not found' });
      }

      // Get module stats
      const { data: moduleStats } = await supabase
        .rpc('get_module_statistics', {
          p_module_id: test.module_id,
          p_user_id: userId,
        });

      // Get module to find course
      const { data: module } = await supabase
        .from('modules')
        .select('course_id')
        .eq('id', test.module_id)
        .single();

      // Get course stats
      const { data: courseStats } = await supabase
        .from('course_performance')
        .select('*')
        .eq('course_id', module?.course_id)
        .eq('user_id', userId)
        .single();

      return res.json({
        module: moduleStats?.[0] || null,
        course: courseStats || null,
      });
    } catch (error) {
      console.error('Get test stats error:', error);
      return res.status(500).json({ message: 'Failed to fetch statistics' });
    }
  }
}
