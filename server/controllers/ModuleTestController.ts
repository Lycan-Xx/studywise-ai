import { Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { aiService } from '../services/AIService';
import { computeServerQuote } from './WalletController';

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

      // Verify course ownership before accessing module
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('id')
        .eq('id', courseId)
        .eq('user_id', userId)
        .single();

      if (courseError || !course) {
        console.error(`❌ Course not found or unauthorized: ${courseId}`, courseError);
        return res.status(404).json({ message: 'Course not found' });
      }

      // Get module content
      console.log(`🔍 Generating test for module: ${moduleId} (User: ${userId})`);
      const { data: module, error: moduleError } = await supabase
        .from('modules')
        .select('content, title')
        .eq('id', moduleId)
        .eq('course_id', courseId)
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

      // ── Wallet pre-authorization for this test generation ────────────────
      // Regenerating/retaking a module test is its own billable action —
      // separate from the course-creation hold, which only covered the
      // initial module-parsing + first question pool. Quote against just
      // this module's content, not the whole course.
      const quote = computeServerQuote(module.content, preferences.default_questions_per_module);
      const heldAmountUSD = quote.costUSD;

      try {
        await supabase.rpc('apply_wallet_transaction', {
          p_user_id: userId,
          p_type: 'test_regeneration',
          p_amount_usd: -heldAmountUSD,
          p_reference_id: moduleId,
          p_description: `Module test generation: ${module.title}`,
        });
      } catch (walletError) {
        console.warn(`💳 Insufficient balance for user ${userId} — test quote was $${heldAmountUSD.toFixed(4)}`);
        return res.status(402).json({
          message: 'Insufficient wallet balance',
          quotedCostUSD: heldAmountUSD,
        });
      }

      const aiResponse = await aiService.generateQuestions({
        content: module.content,
        difficulty: preferences.default_difficulty,
        questionCount: preferences.default_questions_per_module,
        questionTypes,
        userId,
        courseId,
      });

      // Reconcile: refund the gap between the hold and actual AI spend for
      // this specific call. We scope the usage lookup to rows created after
      // the hold was taken, since ai_usage_log is keyed by course_id (shared
      // across many test generations for the same course) rather than by
      // this individual request.
      try {
        const { data: usageRows } = await supabase
          .from('ai_usage_log')
          .select('cost_usd')
          .eq('course_id', courseId)
          .eq('call_type', 'question_generation')
          .gte('created_at', new Date(Date.now() - 60_000).toISOString()); // last 60s — this request's window

        const actualCostUSD = (usageRows ?? []).reduce((sum, row) => sum + (row.cost_usd ?? 0), 0);
        const refundUSD = Math.max(0, heldAmountUSD - actualCostUSD);

        if (refundUSD > 0.000001) {
          await supabase.rpc('apply_wallet_transaction', {
            p_user_id: userId,
            p_type: 'refund',
            p_amount_usd: refundUSD,
            p_reference_id: moduleId,
            p_description: `Refund: quoted $${heldAmountUSD.toFixed(4)}, actual cost $${actualCostUSD.toFixed(4)}`,
          });
        }
      } catch (reconcileError) {
        console.error(`⚠️  Wallet reconciliation failed for module test ${moduleId}:`, reconcileError);
      }

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
        const correctAnswer = q.correctAnswer || '';
        const options = q.options || [];
        const type = q.type || 'multiple-choice';
        
        return {
          test_id: test.id,
          question_text: questionText,
          question_type: type === 'multiple-choice' ? 'mcq' : 'true_false',
          question_order: index + 1,
          options: options.length > 0 ? JSON.stringify(options) : null,
          correct_answer: correctAnswer,
          source_text: q.sourceText || '',
          source_offset: q.sourceOffset || 0,
          explanation: q.explanation || '',
        };
      });

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert);

      if (questionsError) {
        throw questionsError;
      }

      const { data: dbQuestions, error: fetchError } = await supabase
        .from('questions')
        .select('*')
        .eq('test_id', test.id)
        .order('question_order');

      if (fetchError) throw fetchError;

      // Map back to frontend Question format
      const formattedQuestions = dbQuestions.map(q => ({
        id: q.id,
        question: q.question_text,
        type: q.question_type === 'mcq' ? 'multiple-choice' : 'true-false',
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
        correctAnswer: q.correct_answer,
        explanation: q.explanation,
        sourceText: q.source_text
      }));

      return res.json({
        test,
        questions: formattedQuestions
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

      // Get course metadata (no longer need source_content — we sample per module instead)
      const { data: course } = await supabase
        .from('courses')
        .select('id, title')
        .eq('id', courseId)
        .eq('user_id', userId)
        .single();

      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      // FIX 3: Generate exam questions proportionally from every module instead of dumping the
      // entire raw source_content into a single AI call.
      //
      // Why the old approach was bad:
      //   - Sending 60 K+ chars of raw source in one shot biases the model toward content it
      //     reads first (primacy/recency effect), so early modules were over-represented.
      //   - It was the most expensive single API call in the whole pipeline.
      //
      // New approach: fetch all modules → generate ceil(20 / N) questions per module in
      // parallel → shuffle → trim to 20. This guarantees proportional coverage at lower cost.

      const EXAM_TOTAL = 20;

      const questionTypes = preferences.default_question_type === 'mixed'
        ? ['multiple-choice', 'true-false']
        : preferences.default_question_type === 'mcq'
        ? ['multiple-choice']
        : ['true-false'];

      const { data: modules, error: modulesError } = await supabase
        .from('modules')
        .select('id, title, content')
        .eq('course_id', courseId)
        .order('module_order');

      if (modulesError || !modules || modules.length === 0) {
        return res.status(404).json({ message: 'No modules found for this course' });
      }

      const questionsPerModule = Math.ceil(EXAM_TOTAL / modules.length);

      console.log(
        `📝 Exam generation: ${modules.length} modules × ~${questionsPerModule} questions each → trim to ${EXAM_TOTAL}`
      );

      // ── Wallet pre-authorization for the full exam ────────────────────────
      // Quote against the combined content of every module, since this call
      // fans out to one generateQuestions request per module in parallel.
      const combinedContent = modules.map(m => m.content).join('\n\n');
      const quote = computeServerQuote(combinedContent, questionsPerModule);
      const heldAmountUSD = quote.costUSD;

      try {
        await supabase.rpc('apply_wallet_transaction', {
          p_user_id: userId,
          p_type: 'test_regeneration',
          p_amount_usd: -heldAmountUSD,
          p_reference_id: courseId,
          p_description: `Full course exam generation: ${course.title}`,
        });
      } catch (walletError) {
        console.warn(`💳 Insufficient balance for user ${userId} — exam quote was $${heldAmountUSD.toFixed(4)}`);
        return res.status(402).json({
          message: 'Insufficient wallet balance',
          quotedCostUSD: heldAmountUSD,
        });
      }

      // Run all module question-generation calls in parallel to keep latency low
      const perModuleResults = await Promise.allSettled(
        modules.map((mod) =>
          aiService.generateQuestions({
            content: mod.content,
            difficulty: preferences.default_difficulty,
            questionCount: questionsPerModule,
            questionTypes,
            subject: mod.title, // scopes the AI to the module's topic
            userId,
            courseId,
          })
        )
      );

      // Collect all questions; log any per-module failures but don't abort the whole exam
      const allQuestions: any[] = [];
      perModuleResults.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          allQuestions.push(...result.value.questions);
        } else {
          console.warn(`⚠️  Module ${modules[idx].title} question generation failed:`, result.reason);
        }
      });

      if (allQuestions.length === 0) {
        // Refund the full hold — nothing was generated at all
        try {
          await supabase.rpc('apply_wallet_transaction', {
            p_user_id: userId,
            p_type: 'refund',
            p_amount_usd: heldAmountUSD,
            p_reference_id: courseId,
            p_description: 'Full refund — all module question generations failed',
          });
        } catch (refundError) {
          console.error('⚠️  Failed to refund after total exam generation failure:', refundError);
        }
        throw new Error('All module question generations failed — cannot build exam');
      }

      // Shuffle for variety then cap to EXAM_TOTAL
      const shuffled = allQuestions.sort(() => Math.random() - 0.5).slice(0, EXAM_TOTAL);

      const aiResponse = { questions: shuffled };

      // Reconcile: refund the gap between the hold and actual AI spend
      try {
        const { data: usageRows } = await supabase
          .from('ai_usage_log')
          .select('cost_usd')
          .eq('course_id', courseId)
          .eq('call_type', 'question_generation')
          .gte('created_at', new Date(Date.now() - 120_000).toISOString()); // last 2 min — this exam's window

        const actualCostUSD = (usageRows ?? []).reduce((sum, row) => sum + (row.cost_usd ?? 0), 0);
        const refundUSD = Math.max(0, heldAmountUSD - actualCostUSD);

        if (refundUSD > 0.000001) {
          await supabase.rpc('apply_wallet_transaction', {
            p_user_id: userId,
            p_type: 'refund',
            p_amount_usd: refundUSD,
            p_reference_id: courseId,
            p_description: `Refund: quoted $${heldAmountUSD.toFixed(4)}, actual cost $${actualCostUSD.toFixed(4)}`,
          });
        }
      } catch (reconcileError) {
        console.error(`⚠️  Wallet reconciliation failed for course exam ${courseId}:`, reconcileError);
      }

      // Create test record
      const { data: test, error: testError } = await supabase
        .from('tests')
        .insert({
          user_id: userId,
          question_count: aiResponse.questions.length,
          question_type: preferences.default_question_type,
          difficulty: preferences.default_difficulty,
          status: 'generated',
          is_exam: true
        })
        .select()
        .single();

      if (testError || !test) {
        throw new Error('Failed to create exam');
      }

      // Insert questions
      const questionsToInsert = aiResponse.questions.map((q, index) => {
        const questionText = q.question || '';
        const correctAnswer = q.correctAnswer || '';
        const options = q.options || [];
        const type = q.type || 'multiple-choice';

        return {
          test_id: test.id,
          question_text: questionText,
          question_type: type === 'multiple-choice' ? 'mcq' : 'true_false',
          question_order: index + 1,
          options: options.length > 0 ? JSON.stringify(options) : null,
          correct_answer: correctAnswer,
          source_text: q.sourceText || '',
          source_offset: q.sourceOffset || 0,
          explanation: q.explanation || '',
        };
      });

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert);

      if (questionsError) {
        throw questionsError;
      }

      const { data: dbQuestions, error: fetchError } = await supabase
        .from('questions')
        .select('*')
        .eq('test_id', test.id)
        .order('question_order');

      if (fetchError) throw fetchError;

      // Map back to frontend Question format
      const formattedQuestions = dbQuestions.map(q => ({
        id: q.id,
        question: q.question_text,
        type: q.question_type === 'mcq' ? 'multiple-choice' : 'true-false',
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
        correctAnswer: q.correct_answer,
        explanation: q.explanation,
        sourceText: q.source_text
      }));

      return res.json({
        test,
        questions: formattedQuestions
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
        const isCorrect = String(userAnswer || '').trim().toLowerCase() === String(question.correct_answer || '').trim().toLowerCase();
        
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
      
      const { data: result, error: resultError } = await supabase
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

      if (resultError) {
        console.error('Failed to insert test result:', resultError);
        throw new Error('Failed to create test result');
      }

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
        .eq('test_id', testId)
        .eq('user_id', userId);

      // Get test's module → course chain so this call can be attributed to a
      // course in ai_usage_log. Not gated behind a wallet hold — insights are
      // small, bundled post-test value rather than a separately billed action.
      const { data: moduleRow } = await supabase
        .from('modules')
        .select('course_id')
        .eq('id', result.module_id)
        .maybeSingle();

      // Generate insights
      const insights = await aiService.generateTestInsights({
        score: result.score_percentage,
        totalQuestions: result.total_questions,
        questions: questions || [],
        userAnswers: Object.fromEntries((userAnswers || []).map(a => [a.question_id, a.user_answer])),
        correctAnswers: Object.fromEntries((questions || []).map(q => [q.id, q.correct_answer])),
        testTitle: 'Module Test',
        sourceContent: '',
        userId,
        courseId: moduleRow?.course_id,
      });

      const { data: updatedResult, error: updateError } = await supabase
        .from('test_results')
        .update({
          insights_requested: true,
          insights_generated_at: new Date().toISOString(),
          insights_text: insights.overallPerformance,
          weak_areas: JSON.stringify(insights.weaknesses),
          strong_areas: JSON.stringify(insights.strengths),
          recommendations: insights.studyRecommendations.join('\n'),
        })
        .eq('id', result.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Parse JSON fields
      const finalResult = {
        ...updatedResult,
        weak_areas: typeof updatedResult.weak_areas === 'string' ? JSON.parse(updatedResult.weak_areas) : updatedResult.weak_areas,
        strong_areas: typeof updatedResult.strong_areas === 'string' ? JSON.parse(updatedResult.strong_areas) : updatedResult.strong_areas,
      };

      return res.json(finalResult);
    } catch (error) {
      console.error('Request insights error:', error);
      return res.status(500).json({ message: 'Failed to generate insights' });
    }
  }
}
