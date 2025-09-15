import { Router } from 'express';
import TestController from './controllers/TestController.js';
import { aiService } from './services/AIService.js';
import { DatabaseService, supabase } from './lib/supabase.js';

const router = Router();

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

    // Update the test in the database
    const { error } = await supabase
      .from('tests')
      .update({
        description: notes,
        title: title,
        metadata: {
          notes: notes
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', testId)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

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

export default router;
