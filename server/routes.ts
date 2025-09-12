import { Router } from 'express';
import TestController from './controllers/TestController.js';

const router = Router();

// Test generation routes
router.post('/tests/generate', TestController.generateQuestions);
router.post('/tests/flashcards', TestController.generateFlashcards);

// Test submission endpoint
router.post('/api/tests/:testId/results', async (req, res) => {
  try {
    const { testId } = req.params;
    const results = req.body;

    console.log(`📊 Received test results for test ${testId}`);

    // Here you would typically save to database
    // For now, just return success
    res.json({
      success: true,
      message: 'Results saved successfully',
      testId,
      score: results.score
    });
  } catch (error) {
    console.error('Error saving test results:', error);
    res.status(500).json({
      error: 'Failed to save test results',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test insights endpoint
router.post('/api/tests/:testId/insights', async (req, res) => {
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