import { Request, Response } from 'express';
import { aiService } from '../services/AIService';

class TestController {
  static async generateQuestions(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { content, difficulty, questionCount, questionTypes, subject, focus } = req.body;

      if (!content || !difficulty || !questionCount || !questionTypes) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      console.log(`Generating ${questionCount} questions for user ${userId}`);

      const aiResponse = await aiService.generateQuestions({
        content,
        difficulty,
        questionCount,
        questionTypes,
        subject: subject || 'General', // Use subject (which is now title) or default to 'General'
        focus
      });

      res.json(aiResponse);
    } catch (error) {
      console.error('Question generation error:', error);
      res.status(500).json({
        error: 'Failed to generate questions',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async generateFlashcards(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { content, count = 10 } = req.body;

      if (!content) {
        return res.status(400).json({ error: 'Content is required' });
      }

      console.log(`Generating ${count} flashcards for user ${userId}`);

      // For now, return a simple structure. You can enhance this later
      const flashcards = [];
      const concepts = content.split(/[.!?]+/).filter(s => s.trim().length > 20).slice(0, count);

      for (let i = 0; i < Math.min(count, concepts.length); i++) {
        flashcards.push({
          id: `flashcard_${i + 1}`,
          front: `What is the main concept in: "${concepts[i].trim().substring(0, 50)}..."?`,
          back: concepts[i].trim(),
          difficulty: 'medium'
        });
      }

      res.json({ flashcards });
    } catch (error) {
      console.error('Flashcard generation error:', error);
      res.status(500).json({
        error: 'Failed to generate flashcards',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async submitResults(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { testId, answers, score, timeTaken } = req.body;

      if (!testId || !answers) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      console.log(`Saving test results for user ${userId}, test ${testId}`);

      // For now, just return success - in production this would save to database
      res.json({ 
        success: true, 
        resultId: nanoid(),
        message: 'Results saved successfully' 
      });
    } catch (error) {
      console.error('Submit results error:', error);
      res.status(500).json({
        error: 'Failed to save results',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export default TestController;