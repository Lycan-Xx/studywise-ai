import { Router } from 'express';
import TestController from './controllers/TestController.js';
import { CourseController } from './controllers/CourseController.js';
import { ModuleTestController } from './controllers/ModuleTestController.js';
import { ResultsController } from './controllers/ResultsController.js';
import { aiService } from './services/AIService.js';
import { DatabaseService, supabase } from './lib/supabase.js';

const router = Router();

// Validate the Supabase JWT from the Authorization header
const authMiddleware = async (req: any & { user?: { id: string; email: string; user_metadata?: Record<string, any> } }, res: any, next: any) => {
  const authHeader = req.headers['authorization'] as string;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.slice(7);
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    req.user = user as { id: string; email: string; user_metadata?: Record<string, any> };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token validation failed' });
  }
};

// ============================================================================
// NEW COURSE-CENTRIC ROUTES
// ============================================================================

// Course routes
router.post('/courses/generate', authMiddleware, CourseController.generateCourse);
router.get('/courses', authMiddleware, CourseController.getUserCourses);
router.get('/courses/:courseId', authMiddleware, CourseController.getCourse);
router.get('/courses/:courseId/modules', authMiddleware, CourseController.getCourseModules);
router.delete('/courses/:courseId', authMiddleware, CourseController.deleteCourse);
router.post('/courses/:courseId/retry', authMiddleware, CourseController.retryGeneration);

// Module test routes
router.post('/courses/:courseId/modules/:moduleId/test/generate', authMiddleware, ModuleTestController.generateModuleTest);
router.post('/courses/:courseId/exam/generate', authMiddleware, ModuleTestController.generateCourseExam);
router.post('/tests/:testId/submit', authMiddleware, ModuleTestController.submitTest);
router.post('/tests/:testId/insights/request', authMiddleware, ModuleTestController.requestInsights);

// Results routes
router.get('/results/courses', authMiddleware, ResultsController.getCourseResults);
router.get('/results/courses/:courseId/modules', authMiddleware, ResultsController.getModuleResults);
router.get('/tests/:testId/result', authMiddleware, ResultsController.getTestResult);
router.get('/tests/:testId/questions', authMiddleware, ResultsController.getTestQuestions);
router.get('/tests/:testId/answers', authMiddleware, ResultsController.getTestAnswers);
router.get('/tests/:testId/stats', authMiddleware, ResultsController.getTestStats);

// User profile routes
router.get('/user/profile', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', req.user!.id)
      .single();
    
    if (error) {
      // PGRST116 means no rows found for .single()
      if (error.code === 'PGRST116') {
        return res.json({
          id: req.user!.id,
          email: (req as any).user!.email,
          full_name: (req as any).user!.user_metadata?.full_name || '',
          default_question_type: 'mixed',
          default_difficulty: 'medium',
          default_questions_per_module: 10,
          theme: 'system'
        });
      }
      throw error;
    }
    res.json(data);
  } catch (error) {
    console.error('Fetch profile error:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

router.put('/user/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.id;
    console.log(`👤 Updating profile for user: ${userId}`, req.body);
    
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({ 
        ...req.body,
        id: userId,
        email: req.user!.email,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Profile update failed:', error);
      throw error;
    }
    
    console.log('✅ Profile updated successfully');
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// ============================================================================
// LEGACY ROUTES (Keep for backward compatibility)
// ============================================================================
// Legacy routes have been removed in Phase 2 as the project has transitioned
// fully to the course-centric architecture.

export default router;
