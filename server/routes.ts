
import { Router } from 'express';
import TestController from './controllers/TestController';

const router = Router();

// Test generation routes
router.post('/tests/generate', TestController.generateQuestions);
router.post('/tests/flashcards', TestController.generateFlashcards);
router.post('/tests/:testId/results', TestController.submitResults);

// Library routes
router.get('/library', (req, res) => {
  res.json([]);
});

export default router;
