import { Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { aiService } from '../services/AIService';



export class CourseController {
  /**
   * Generate a new course from uploaded content
   * POST /api/courses/generate
   */
  static async generateCourse(req: Request, res: Response) {
    try {
      const { filename, file_type, content, user_context } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      if (!filename || !file_type || !content) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Create course record with pending status
      console.log('Creating course for user:', userId);
      console.log('Course data:', {
        user_id: userId,
        title: filename.replace(/\.[^/.]+$/, ''),
        source_filename: filename,
        source_file_type: file_type,
        content_length: content.length,
        user_context: user_context || null,
      });

      const { data: course, error: courseError } = await supabase
        .from('courses')
        .insert({
          user_id: userId,
          title: filename.replace(/\.[^/.]+$/, ''), // Remove extension
          source_filename: filename,
          source_file_type: file_type,
          source_content: content,
          user_context: user_context || null,
          parsing_status: 'processing',
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

      console.log('Course created successfully:', course.id);

      // Parse content into modules using AI
      try {
        const modules = await aiService.parseContentIntoModules({
          content,
          context: user_context,
          courseId: course.id,
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

        const { data: updatedCourse } = await supabase
          .from('courses')
          .select()
          .eq('id', course.id)
          .single();

        return res.json(updatedCourse);
      }
    } catch (error) {
      console.error('Generate course error:', error);
      return res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to generate course' 
      });
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
