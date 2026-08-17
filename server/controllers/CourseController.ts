import { Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { aiService } from '../services/AIService';
import { computeServerQuote } from './WalletController';



export class CourseController {
  /**
   * Generate a new course from uploaded content
   * POST /api/courses/generate
   *
   * Wallet flow (pay-as-you-go, see WalletController for the full design note):
   *   1. Compute a server-authoritative quote from the content up front.
   *   2. Pre-authorize the FULL quoted amount as a hold — via
   *      apply_wallet_transaction(type: 'course_generation', negative amount) —
   *      BEFORE any AI provider is called. If the user can't afford the quote,
   *      we reject here and never spend a cent on AI calls.
   *   3. Run the actual generation. AIService.recordUsage() logs real token
   *      cost per call into ai_usage_log as it goes.
   *   4. After generation completes (success OR fallback), sum the actual
   *      cost from ai_usage_log for this courseId and refund the difference
   *      between what was held and what was actually spent. The user is
   *      NEVER charged more than the quote shown before they clicked generate.
   */
  static async generateCourse(req: Request, res: Response) {
    let courseId: string | undefined;
    let userId: string | undefined;
    let heldAmountUSD = 0;

    try {
      const { filename, file_type, content, user_context, detected_headings, heading_detection_method } = req.body;
      userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      if (!filename || !file_type || !content) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // ── Pre-authorization: quote + hold, before any AI call ────────────
      // Use the same questions-per-module the user has configured, so the
      // quote matches what generateModuleTest will actually request later.
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('default_questions_per_module')
        .eq('id', userId)
        .maybeSingle();

      const questionsPerModule = profile?.default_questions_per_module ?? 10;
      const quote = computeServerQuote(content, questionsPerModule);
      heldAmountUSD = quote.costUSD;

      // Create course record with pending status
      console.log('Creating course for user:', userId);
      console.log('Course data:', {
        user_id: userId,
        title: filename.replace(/\.[^/.]+$/, ''),
        source_filename: filename,
        source_file_type: file_type,
        content_length: content.length,
        user_context: user_context || null,
        quoted_cost_usd: heldAmountUSD,
      });

      const { data: course, error: courseError } = await supabase
        .from('courses')
        .insert({
          user_id: userId,
          title: filename.replace(/\.[^/.]+$/, ''),
          source_filename: filename,
          source_file_type: file_type,
          source_content: content,
          user_context: user_context || null,
          parsing_status: 'processing',
          // Store heading hints so retryGeneration can use the same structural data
          detected_headings: detected_headings || [],
          heading_detection_method: heading_detection_method || 'none',
        })
        .select()
        .single();

      if (courseError) {
        console.error('Supabase error creating course:', courseError);
        throw new Error(`Failed to create course: ${courseError.message}`);
      }

      if (!course) {
        throw new Error('Failed to create course: No data returned');
      }

      courseId = course.id;
      console.log('Course created successfully:', course.id);

      // Now take the hold, with the real courseId as the reference. If the
      // user can't afford this, apply_wallet_transaction raises an exception
      // and we clean up the course record we just created rather than leaving
      // an orphaned "processing" course with no modules.
      try {
        await supabase.rpc('apply_wallet_transaction', {
          p_user_id: userId,
          p_type: 'course_generation',
          p_amount_usd: -heldAmountUSD,
          p_reference_id: course.id,
          p_description: `Course generation hold: ${filename}`,
        });
      } catch (walletError) {
        console.warn(`💳 Insufficient balance for user ${userId} — quote was $${heldAmountUSD.toFixed(4)}`);
        await supabase.from('courses').delete().eq('id', course.id);
        heldAmountUSD = 0; // nothing was actually held, don't try to refund in the catch block
        return res.status(402).json({
          message: 'Insufficient wallet balance',
          quotedCostUSD: heldAmountUSD,
        });
      }

      // Parse content into modules using AI
      try {
        const modules = await aiService.parseContentIntoModules({
          content,
          context: user_context,
          courseId: course.id,
          detectedHeadings: detected_headings || [],
          headingDetectionMethod: heading_detection_method || 'none',
          userId,
        });

        // Insert modules
        const { error: modulesError } = await supabase
          .from('modules')
          .insert(modules);

        if (modulesError) throw modulesError;

        // Update course status
        await supabase
          .from('courses')
          .update({
            parsing_status: 'completed',
            total_modules: modules.length,
            used_fallback: false,
          })
          .eq('id', course.id);

        // ── Reconcile: refund the gap between the hold and actual spend ──
        await CourseController.reconcileWalletHold(userId, course.id, heldAmountUSD);

        // Return updated course
        const { data: updatedCourse } = await supabase
          .from('courses')
          .select()
          .eq('id', course.id)
          .single();

        return res.json(updatedCourse);
      } catch (aiError) {
        // Fallback: Create single module with full content
        const fallbackModule = {
          course_id: course.id,
          title: 'Full Content',
          content: content,
          module_order: 1,
          word_count: content.split(/\s+/).length,
          estimated_read_time: Math.ceil(content.split(/\s+/).length / 200),
        };

        await supabase.from('modules').insert(fallbackModule);

        // Update course with fallback status
        await supabase
          .from('courses')
          .update({
            parsing_status: 'completed',
            total_modules: 1,
            used_fallback: true,
            parsing_error: aiError instanceof Error ? aiError.message : 'AI parsing failed',
          })
          .eq('id', course.id);

        // Even on fallback, reconcile — a fallback that used zero/few AI tokens
        // (e.g. immediate mock response) should refund almost the entire hold,
        // not leave the student paying full price for a degraded result.
        await CourseController.reconcileWalletHold(userId, course.id, heldAmountUSD);

        const { data: updatedCourse } = await supabase
          .from('courses')
          .select()
          .eq('id', course.id)
          .single();

        return res.json(updatedCourse);
      }
    } catch (error) {
      console.error('Generate course error:', error);

      // If we took a hold but crashed before reconciling, refund the FULL
      // hold rather than leaving the student out of pocket for a course that
      // never got created. Never let an unexpected error become a silent charge.
      if (userId && courseId && heldAmountUSD > 0) {
        try {
          await supabase.rpc('apply_wallet_transaction', {
            p_user_id: userId,
            p_type: 'refund',
            p_amount_usd: heldAmountUSD,
            p_reference_id: courseId,
            p_description: 'Full refund — course generation failed unexpectedly',
          });
        } catch (refundError) {
          console.error('⚠️  CRITICAL: failed to refund after generation error — manual intervention needed:', {
            userId, courseId, heldAmountUSD, refundError,
          });
        }
      }

      return res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to generate course' 
      });
    }
  }

  /**
   * Sum actual AI cost for a course from ai_usage_log (ground truth) and
   * refund the difference between what was held and what was actually spent.
   * Never refunds more than was held, and never charges beyond the hold —
   * the wallet's exposure for this course generation is capped at heldAmountUSD
   * from the moment the hold succeeded.
   */
  private static async reconcileWalletHold(userId: string, courseId: string, heldAmountUSD: number) {
    try {
      const { data: usageRows, error } = await supabase
        .from('ai_usage_log')
        .select('cost_usd')
        .eq('course_id', courseId);

      if (error) throw error;

      const actualCostUSD = (usageRows ?? []).reduce((sum, row) => sum + (row.cost_usd ?? 0), 0);
      const refundUSD = Math.max(0, heldAmountUSD - actualCostUSD);

      if (refundUSD > 0.000001) { // ignore dust-level refunds from float rounding
        await supabase.rpc('apply_wallet_transaction', {
          p_user_id: userId,
          p_type: 'refund',
          p_amount_usd: refundUSD,
          p_reference_id: courseId,
          p_description: `Refund: quoted $${heldAmountUSD.toFixed(4)}, actual cost $${actualCostUSD.toFixed(4)}`,
        });
        console.log(`💸 Refunded $${refundUSD.toFixed(4)} to user ${userId} (quote $${heldAmountUSD.toFixed(4)} vs actual $${actualCostUSD.toFixed(4)})`);
      }
    } catch (reconcileError) {
      // Never let a reconciliation failure surface to the user or block the
      // course response — the course itself succeeded, this is a billing
      // cleanup step. Log loudly so it can be caught and fixed manually.
      console.error(`⚠️  Wallet reconciliation failed for course ${courseId}:`, reconcileError);
    }
  }

  /**
   * Get a specific course
   * GET /api/courses/:courseId
   */
  static async getCourse(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const userId = req.user?.id;

      const { data: course, error } = await supabase
        .from('courses')
        .select()
        .eq('id', courseId)
        .eq('user_id', userId)
        .single();

      if (error || !course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      return res.json(course);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to fetch course' });
    }
  }

  /**
   * Get all modules for a course
   * GET /api/courses/:courseId/modules
   */
  static async getCourseModules(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const userId = req.user?.id;

      // Verify course ownership
      const { data: course } = await supabase
        .from('courses')
        .select('id')
        .eq('id', courseId)
        .eq('user_id', userId)
        .single();

      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      const { data: modules, error } = await supabase
        .from('modules')
        .select()
        .eq('course_id', courseId)
        .order('module_order', { ascending: true });

      if (error) throw error;

      return res.json(modules || []);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to fetch modules' });
    }
  }

  /**
   * Get all courses for the current user
   * GET /api/courses
   */
  static async getUserCourses(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      console.log(`🔍 Fetching courses for user: ${userId}`);
      
      if (!userId) {
        console.warn('⚠️ No user ID found in request');
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { data: courses, error } = await supabase
        .from('courses')
        .select()
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase error fetching courses:', error);
        throw error;
      }

      console.log(`✅ Found ${courses?.length || 0} courses for user ${userId}`);
      return res.json(courses || []);
    } catch (error) {
      console.error('❌ getUserCourses error:', error);
      return res.status(500).json({ message: 'Failed to fetch courses' });
    }
  }

  /**
   * Delete a course
   * DELETE /api/courses/:courseId
   */
  static async deleteCourse(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const userId = req.user?.id;

      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId)
        .eq('user_id', userId);

      if (error) throw error;

      return res.json({ message: 'Course deleted successfully' });
    } catch (error) {
      return res.status(500).json({ message: 'Failed to delete course' });
    }
  }

  /**
   * Retry/Regenerate course generation
   * POST /api/courses/:courseId/retry
   */
  static async retryGeneration(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // 1. Fetch existing course to get source content
      const { data: course, error: fetchError } = await supabase
        .from('courses')
        .select()
        .eq('id', courseId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      console.log(`🔄 Retrying generation for course: ${courseId} (${course.title})`);

      // 2. Clean up existing modules
      await supabase
        .from('modules')
        .delete()
        .eq('course_id', courseId);

      // 3. Reset course status to processing
      await supabase
        .from('courses')
        .update({
          parsing_status: 'processing',
          parsing_error: null,
          used_fallback: false
        })
        .eq('id', courseId);

      // 4. Run generation logic (same as generateCourse but without creating the record)
      try {
        const modules = await aiService.parseContentIntoModules({
          content: course.source_content,
          context: course.user_context,
          courseId: course.id,
          // Re-use the heading hints saved at initial generation time
          detectedHeadings: course.detected_headings || [],
          headingDetectionMethod: course.heading_detection_method || 'none',
        });

        // Insert modules
        const { error: modulesError } = await supabase
          .from('modules')
          .insert(modules);

        if (modulesError) throw modulesError;

        // Update course status
        const { data: updatedCourse } = await supabase
          .from('courses')
          .update({
            parsing_status: 'completed',
            total_modules: modules.length,
            used_fallback: false,
          })
          .eq('id', course.id)
          .select()
          .single();

        return res.json(updatedCourse);
      } catch (aiError) {
        console.error('Retry AI parsing error, using fallback:', aiError);
        
        // Fallback: Create single module with full content
        const fallbackModule = {
          course_id: course.id,
          title: 'Full Content',
          content: course.source_content,
          module_order: 1,
          word_count: (course.source_content || '').split(/\s+/).length,
          estimated_read_time: Math.ceil((course.source_content || '').split(/\s+/).length / 200),
        };

        await supabase.from('modules').insert(fallbackModule);

        // Update course with fallback status
        const { data: updatedCourse } = await supabase
          .from('courses')
          .update({
            parsing_status: 'completed',
            total_modules: 1,
            used_fallback: true,
            parsing_error: aiError instanceof Error ? aiError.message : 'AI parsing failed during retry',
          })
          .eq('id', course.id)
          .select()
          .single();

        return res.json(updatedCourse);
      }
    } catch (error) {
      console.error('Retry generation error:', error);
      return res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to retry course generation' 
      });
    }
  }
}
