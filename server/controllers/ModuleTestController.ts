import { Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { aiService } from '../services/AIService';

export class ModuleTestController {
  /**
   * Generate a test for a specific module
   * POST /api/courses/:courseId/modules/:moduleId/test/generate
   */
  static async generateModuleTest(req: Request, res: Response) {
    try {
      const { courseId, moduleId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Get user preferences (with fallback to defaults)
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('default_question_type, default_difficulty, default_questions_per_module')
        .eq('id', userId)
        .single();

      // Use defaults if profile is missing
      const preferences = profile || {
        default_question_type: 'mcq',
        default_difficulty: 'medium',
        default_questions_per_module: 5
      };

      // Get module content
      console.log(`🔍 Generating test for module: ${moduleId} (User: ${userId})`);
      const { data: module, error: moduleError } = await supabase
        .from('modules')
        .select('content, title')
        .eq('id', moduleId)
        .single();

      if (moduleError || !module) {
        console.error(`❌ Module not found: ${moduleId}`, moduleError);
        return res.status(404).json({ message: 'Module not found' });
      }

      console.log(`✅ Module found: ${module.title}. Parsing preferences...`);

      // Generate questions using AI
      const questionTypes = preferences.default_question_type === 'mixed' 
        ? ['multiple-choice', 'true-false']
        : preferences.default_question_type === 'mcq'
        ? ['multiple-choice']
        : ['true-false'];

      const aiResponse = await aiService.generateQuestions({
        content: module.content,
        difficulty: preferences.default_difficulty,
        questionCount: preferences.default_questions_per_module,
        questionTypes,
      });

      // Create test record
      const { data: test, error: testError } = await supabase
        .from('tests')
        .insert({
          module_id: moduleId,
          user_id: userId,
          question_count: aiResponse.questions.length,
          question_type: preferences.default_question_type,
          difficulty: preferences.default_difficulty,
          status: 'generated',
        })
        .select()
        .single();

      if (testError || !test) {
        throw new Error('Failed to create test');
      }

      // Insert questions
      const questionsToInsert = aiResponse.questions.map((q, index) => {
        // Robust mapping for different AI response variations
        const questionText = q.question || '';
        const correctAnswer = q.correctAnswer || q.correct_answer || '';
        const options = q.options || [];
        const type = q.type || 'multiple-choice';
        
        return {
          test_id: test.id,
          question_text: questionText,
          question_type: type === 'multiple-choice' ? 'mcq' : 'true_false',
          question_order: index + 1,
          options: options.length > 0 ? JSON.stringify(options) : null,
          correct_answer: correctAnswer,
          source_text: q.sourceText || q.source_text || '',
          source_offset: q.sourceOffset || q.source_offset || 0,
          explanation: q.explanation || '',
        };
      });

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert);

      if (questionsError) {
        throw questionsError;
      }

      return res.json({
        test,
        questions: aiResponse.questions,
        sampleQuestion: aiResponse.questions[0],
      });
    } catch (error) {
      console.error('Generate module test error:', error);
      return res.status(500).json({
        message: error instanceof Error ? error.message : 'Failed to generate test'
      });
    }
  }

  /**
   * Generate an exam for an entire course
   * POST /api/courses/:courseId/exam/generate
   */
  static async generateCourseExam(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Get user preferences (with fallback to defaults)
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('default_question_type, default_difficulty')
        .eq('id', userId)
        .single();

      const preferences = profile || {
        default_question_type: 'mcq',
        default_difficulty: 'medium'
      };

      // Get course content
      const { data: course } = await supabase
        .from('courses')
        .select('source_content, title')
        .eq('id', courseId)
        .single();

      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      // Generate questions using AI (20 questions for a full exam)
      const questionTypes = preferences.default_question_type === 'mixed' 
        ? ['multiple-choice', 'true-false']
        : preferences.default_question_type === 'mcq'
        ? ['multiple-choice']
        : ['true-false'];

      const aiResponse = await aiService.generateQuestions({
        content: course.source_content,
        difficulty: preferences.default_difficulty,
        questionCount: 20,
        questionTypes,
      });

      // Create test record
      const { data: test, error: testError } = await supabase
        .from('tests')
        .insert({
          course_id: courseId,
          user_id: userId,
          question_count: aiResponse.questions.length,
          question_type: preferences.default_question_type,
          difficulty: preferences.default_difficulty,
          status: 'generated',
        })
        .select()
        .single();

      if (testError || !test) {
        throw new Error('Failed to create exam');
      }

      // Insert questions
      const questionsToInsert = aiResponse.questions.map((q, index) => {
        const questionText = q.question || '';
        const correctAnswer = q.correctAnswer || q.correct_answer || '';
        const options = q.options || [];
        const type = q.type || 'multiple-choice';

        return {
          test_id: test.id,
          question_text: questionText,
          question_type: type === 'multiple-choice' ? 'mcq' : 'true_false',
          question_order: index + 1,
          options: options.length > 0 ? JSON.stringify(options) : null,
          correct_answer: correctAnswer,
          source_text: q.sourceText || q.source_text || '',
          source_offset: q.sourceOffset || q.source_offset || 0,
          explanation: q.explanation || '',
        };
      });

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert);

      if (questionsError) {
        throw questionsError;
      }

      return res.json({
        test,
        questions: aiResponse.questions,
        sampleQuestion: aiResponse.questions[0],
      });
    } catch (error) {
      console.error('Generate course exam error:', error);
      return res.status(500).json({
        message: error instanceof Error ? error.message : 'Failed to generate exam'
      });
    }
  }

  /**
   * Submit test answers and create result
   * POST /api/tests/:testId/submit
   */
  static async submitTest(req: Request, res: Response) {
    try {
      const { testId } = req.params;
      const { answers, timeSpent } = req.body;
      const userId = req.user?.id;

      // Get test and questions
      const { data: test } = await supabase
        .from('tests')
        .select('*, module_id')
        .eq('id', testId)
        .eq('user_id', userId)
        .single();

      if (!test) {
        return res.status(404).json({ message: 'Test not found' });
      }

      const { data: questions } = await supabase
        .from('questions')
        .select('*')
        .eq('test_id', testId)
        .order('question_order');

      if (!questions) {
        return res.status(404).json({ message: 'Questions not found' });
      }

      // Process answers
      let correctCount = 0;
      const userAnswersToInsert = [];

      for (const question of questions) {
        const userAnswer = answers[question.id];
        const isCorrect = userAnswer === question.correct_answer;
        
        if (isCorrect) correctCount++;

        userAnswersToInsert.push({
          test_id: testId,
          question_id: question.id,
          user_id: userId,
          user_answer: userAnswer || '',
          is_correct: isCorrect,
          time_spent_seconds: Math.floor(timeSpent / questions.length),
        });
      }

      // Insert user answers
      await supabase.from('user_answers').insert(userAnswersToInsert);

      // Create test result
      const scorePercentage = (correctCount / questions.length) * 100;
      
      const { data: result } = await supabase
        .from('test_results')
        .insert({
          test_id: testId,
          module_id: test.module_id,
          user_id: userId,
          total_questions: questions.length,
          correct_answers: correctCount,
          score_percentage: scorePercentage,
          total_time_seconds: timeSpent,
          average_time_per_question: timeSpent / questions.length,
        })
        .select()
        .single();

      // Update test status
      await supabase
        .from('tests')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', testId);

      return res.json({ result, testId });
    } catch (error) {
      console.error('Submit test error:', error);
      return res.status(500).json({ message: 'Failed to submit test' });
    }
  }

  /**
   * Request AI insights for a test result
   * POST /api/tests/:testId/insights/request
   */
  static async requestInsights(req: Request, res: Response) {
    try {
      const { testId } = req.params;
      const userId = req.user?.id;

      // Get test result
      const { data: result } = await supabase
        .from('test_results')
        .select('*')
        .eq('test_id', testId)
        .eq('user_id', userId)
        .single();

      if (!result) {
        return res.status(404).json({ message: 'Test result not found' });
      }

      // Get questions and answers
      const { data: questions } = await supabase
        .from('questions')
        .select('*')
        .eq('test_id', testId);

      const { data: userAnswers } = await supabase
        .from('user_answers')
        .select('*')
        .eq('test_id', testId);

      // Generate insights
      const insights = await aiService.generateTestInsights({
        score: result.score_percentage,
        totalQuestions: result.total_questions,
        questions: questions || [],
        userAnswers: Object.fromEntries((userAnswers || []).map(a => [a.question_id, a.user_answer])),
        correctAnswers: Object.fromEntries((questions || []).map(q => [q.id, q.correct_answer])),
        testTitle: 'Module Test',
        sourceContent: '',
      });

      // Update result with insights
      await supabase
        .from('test_results')
        .update({
          insights_requested: true,
          insights_generated_at: new Date().toISOString(),
          insights_text: insights.overallPerformance,
          weak_areas: JSON.stringify(insights.weaknesses),
          strong_areas: JSON.stringify(insights.strengths),
          recommendations: insights.studyRecommendations.join('\n'),
        })
        .eq('id', result.id);

      return res.json(insights);
    } catch (error) {
      console.error('Request insights error:', error);
      return res.status(500).json({ message: 'Failed to generate insights' });
    }
  }
}
