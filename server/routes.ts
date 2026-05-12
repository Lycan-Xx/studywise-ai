import { Router } from 'express';
import TestController from './controllers/TestController.js';
import { CourseController } from './controllers/CourseController.js';
import { ModuleTestController } from './controllers/ModuleTestController.js';
import { ResultsController } from './controllers/ResultsController.js';
import { aiService } from './services/AIService.js';
import { DatabaseService, supabase } from './lib/supabase.js';

const router = Router();

// Simple auth middleware (replace with proper auth in production)
const authMiddleware = (req: any, res: any, next: any) => {
  const userId = req.headers['user-id'] as string;
  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }
  req.user = { id: userId };
  next();
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
      .eq('id', req.user.id)
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

router.put('/user/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`👤 Updating profile for user: ${userId}`, req.body);
    
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({ 
        id: userId,
        ...req.body,
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

// Test generation routes
router.post('/tests/generate', TestController.generateQuestions);
router.post('/tests/flashcards', TestController.generateFlashcards);

// Test submission endpoint
router.post('/tests/:testId/results', async (req, res) => {
  try {
    const { testId } = req.params;
    const {
      userId,
      score,
      totalQuestions,
      timeSpent,
      userAnswers,
      correctAnswers,
      testTitle
    } = req.body;

    console.log(`📊 Received test results for test ${testId}, user ${userId}`);

    // Validate required fields
    if (!userId || !score || !totalQuestions || !userAnswers || !correctAnswers) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['userId', 'score', 'totalQuestions', 'userAnswers', 'correctAnswers']
      });
    }

    // Save to database using DatabaseService
    const savedResult = await DatabaseService.saveTestResult({
      userId,
      testId,
      score,
      totalQuestions,
      timeSpent,
      userAnswers,
      correctAnswers,
      testTitle: testTitle || 'Generated Test'
    });

    console.log('✅ Test result saved successfully:', savedResult.id);

    res.json({
      success: true,
      message: 'Results saved successfully',
      resultId: savedResult.id,
      testId,
      score
    });
  } catch (error) {
    console.error('❌ Error saving test results:', error);
    res.status(500).json({
      error: 'Failed to save test results',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test insights endpoint
router.post('/tests/:testId/insights', async (req, res) => {
  try {
    const { testId } = req.params;
    const testResult = req.body;

    console.log(`🧠 Generating insights for test ${testId}`);

    const insights = await aiService.generateTestInsights(testResult);

    res.json(insights);
  } catch (error) {
    console.error('Error generating test insights:', error);
    res.status(500).json({
      error: 'Failed to generate insights',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});


// Library routes
router.get('/library', async (req, res) => {
  try {
    // For now, we'll get user from a simple auth check
    // In production, this should use proper authentication middleware
    const userId = req.headers['user-id'] as string;

    console.log('📚 API Route: Fetching library for user:', userId);

    if (!userId) {
      console.error('❌ API Route: No user ID provided for library fetch');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const tests = await DatabaseService.getUserTests(userId);
    console.log('✅ API Route: Retrieved tests from library:', tests?.length || 0, 'tests');

    // Log metadata for first test if available
    if (tests && tests.length > 0) {
      console.log('📋 API Route: First test metadata sample:', {
        id: tests[0].id,
        title: tests[0].title,
        hasMetadata: !!tests[0].metadata,
        metadataKeys: tests[0].metadata ? Object.keys(tests[0].metadata) : [],
        notesLength: tests[0].metadata?.notes?.length || 0,
        questionsCount: tests[0].metadata?.questions?.length || 0
      });
    }

    res.json(tests);
  } catch (error) {
    console.error('❌ API Route: Error fetching library:', error);
    res.status(500).json({
      error: 'Failed to fetch library',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/library/tests', async (req, res) => {
  try {
    const {
      id,
      title,
      questionCount,
      config,
      questions,
      notes,
      subject,
      difficulty
    } = req.body;

    console.log('📥 API Route: Received test save request:', {
      id,
      title,
      questionCount,
      hasConfig: !!config,
      hasQuestions: questions?.length > 0,
      notesLength: notes?.length || 0,
      subject,
      difficulty
    });

    // For now, we'll get user from a simple auth check
    // In production, this should use proper authentication middleware
    const userId = req.headers['user-id'] as string;

    console.log('👤 API Route: User ID from headers:', userId);

    if (!userId) {
      console.error('❌ API Route: No user ID provided');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const saveData = {
      id: id || crypto.randomUUID(),
      userId,
      title: title || 'Generated Test',
      questionCount: questionCount || questions?.length || 0,
      config: config || {},
      questions: questions || [],
      notes: notes || ''
    };

    console.log('🔄 API Route: Calling DatabaseService.saveTestToLibrary with:', saveData);

    const result = await DatabaseService.saveTestToLibrary(saveData);

    console.log('✅ API Route: Test saved successfully, result:', result);

    res.json({
      success: true,
      message: 'Test saved to library successfully',
      testId: id
    });
  } catch (error) {
    console.error('❌ API Route: Error saving test to library:', error);
    res.status(500).json({
      error: 'Failed to save test to library',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ADMIN: Backfill notes for tests that have empty metadata.notes
router.post('/admin/backfill-notes', async (req, res) => {
  try {
    const userId = req.headers['user-id'] as string;
    if (!userId) return res.status(401).json({ error: 'User not authenticated' });

    console.log('🔧 Admin: Backfill notes for user:', userId);

    const { data: tests, error } = await supabase
      .from('tests')
      .select('id, user_id, metadata')
      .eq('user_id', userId)
      .not('metadata', 'is', null);

    if (error) {
      console.error('❌ Admin: Error fetching tests for backfill:', error);
      throw error;
    }

    let updated = 0;
    for (const t of tests || []) {
      const notes = t.metadata?.notes?.trim();
      if (!notes) {
        const questions = t.metadata?.questions || [];
        const notesFromQuestions = (questions || []).map((q: any) => q.sourceText).filter(Boolean).join('\n\n');
        const updatedMetadata = { ...t.metadata, notes: notesFromQuestions };
        const { error: updateError } = await supabase
          .from('tests')
          .update({ metadata: updatedMetadata })
          .eq('id', t.id)
          .eq('user_id', userId);
        if (!updateError) updated++;
      }
    }

    res.json({ success: true, updated });
  } catch (error) {
    console.error('❌ Admin: Backfill failed:', error);
    res.status(500).json({ error: 'Backfill failed', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.put('/library/tests/:testId', async (req, res) => {
  try {
    const { testId } = req.params;
    const { notes, title } = req.body;

    // For now, we'll get user from a simple auth check
    // In production, this should use proper authentication middleware
    const userId = req.headers['user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // First, get the existing test to preserve metadata
    const { data: existingTest, error: fetchError } = await supabase
      .from('tests')
      .select('metadata')
      .eq('id', testId)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // Merge the existing metadata with the new notes (preserve config and questions)
    const existingMetadata = existingTest?.metadata || {};
    const updatedMetadata = {
      ...existingMetadata,
      notes: notes || existingMetadata.notes
    };

    // Update the test in the database
    const { error } = await supabase
      .from('tests')
      .update({
        description: notes || existingTest?.description,
        title: title || existingTest?.title,
        metadata: updatedMetadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', testId)
      .eq('user_id', userId);

    if (error) {
      console.error('❌ API Route: Error updating test:', error);
      throw error;
    }

    console.log('✅ Test updated successfully:', testId, 'Notes length:', notes?.length || 0);

    res.json({
      success: true,
      message: 'Test updated successfully'
    });
  } catch (error) {
    console.error('Error updating test:', error);
    res.status(500).json({
      error: 'Failed to update test',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.delete('/library/tests/:testId', async (req, res) => {
  try {
    const { testId } = req.params;

    // For now, we'll get user from a simple auth check
    // In production, this should use proper authentication middleware
    const userId = req.headers['user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { error } = await supabase
      .from('tests')
      .delete()
      .eq('id', testId)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Test deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting test:', error);
    res.status(500).json({
      error: 'Failed to delete test',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get detailed test info (notes + questions) - optimized for NotePreview
router.get('/library/tests/:testId/details', async (req, res) => {
  try {
    const { testId } = req.params;
    const userId = req.headers['user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    console.log('📖 API Route: Fetching test details for testId:', testId);

    const { data: test, error } = await supabase
      .from('tests')
      .select('id, title, description, metadata')
      .eq('id', testId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('❌ API Route: Error fetching test details:', error);
      return res.status(404).json({ error: 'Test not found' });
    }

    // Extract notes and questions from metadata
    const notes = test.metadata?.notes || test.description || '';
    const questions = test.metadata?.questions || [];

    console.log('✅ API Route: Retrieved test details:', {
      testId,
      notesLength: notes.length,
      questionsCount: questions.length
    });

    res.json({
      id: test.id,
      title: test.title,
      notes: notes,
      questions: questions
    });
  } catch (error) {
    console.error('Error fetching test details:', error);
    res.status(500).json({
      error: 'Failed to fetch test details',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
