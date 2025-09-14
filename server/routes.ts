import { Router } from 'express';
import TestController from './controllers/TestController.js';
import { aiService } from './services/AIService.js';
import { DatabaseService } from './lib/supabase.js';

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
router.get('/library', (req, res) => {
  res.json([]);
});

export default router;
