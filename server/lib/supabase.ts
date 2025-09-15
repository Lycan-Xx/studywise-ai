import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client with service role key
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Helper functions for database operations
export class DatabaseService {
  // Save test result
  static async saveTestResult(data: {
    userId: string;
    testId: string;
    score: number;
    totalQuestions: number;
    timeSpent?: number;
    userAnswers: Record<string, string>;
    correctAnswers: Record<string, string>;
    testTitle: string;
  }) {
    try {
      // First, ensure the test exists
      const { data: existingTest, error: testQueryError } = await supabase
        .from('tests')
        .select('id')
        .eq('id', data.testId)
        .single();

      if (testQueryError && testQueryError.code !== 'PGRST116') {
        console.error('Error checking test existence:', testQueryError);
      }

      // If test doesn't exist, create a minimal test entry
      if (!existingTest) {
        const { error: testInsertError } = await supabase
          .from('tests')
          .insert({
            id: data.testId,
            user_id: data.userId,
            title: data.testTitle,
            description: 'Generated test',
            question_count: data.totalQuestions,
            question_types: ['mcq'],
            metadata: {
              generated: true,
              answers: data.correctAnswers
            }
          });

        if (testInsertError) {
          console.error('Error creating test:', testInsertError);
          // Continue with saving result even if test creation fails
        } else {
          console.log('Created test in database:', data.testId);
        }
      }

      // Save the test result
      const { data: savedResult, error: resultError } = await supabase
        .from('test_results')
        .insert({
          user_id: data.userId,
          test_id: data.testId,
          score: data.score,
          total_questions: data.totalQuestions,
          correct_answers: Object.keys(data.correctAnswers).length,
          time_spent: data.timeSpent,
          user_answers: data.userAnswers,
          correct_answers_data: data.correctAnswers,
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (resultError) {
        console.error('Error saving test result:', resultError);
        throw resultError;
      }

      console.log('Test result saved successfully:', savedResult.id);
      return savedResult;
    } catch (error) {
      console.error('Database service error:', error);
      throw error;
    }
  }

  // Get user test results
  static async getUserTestResults(userId: string) {
    try {
      const { data, error } = await supabase
        .from('test_results')
        .select(`
          id,
          test_id,
          score,
          total_questions,
          time_spent,
          user_answers,
          correct_answers_data,
          insights,
          completed_at,
          tests!inner (
            title
          )
        `)
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });

      if (error) {
        console.error('Error fetching test results:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Database service error:', error);
      throw error;
    }
  }

  // Save test to library
  static async saveTestToLibrary(data: {
    id: string;
    userId: string;
    title: string;
    questionCount: number;
    config: any;
    questions: any[];
    notes: string;
  }) {
    try {
      console.log('🔄 Saving test to library:', {
        id: data.id,
        userId: data.userId,
        title: data.title,
        questionCount: data.questionCount,
        hasQuestions: data.questions?.length > 0,
        notesLength: data.notes?.length || 0
      });

      const { error } = await supabase
        .from('tests')
        .upsert({
          id: data.id,
          user_id: data.userId,
          title: data.title,
          description: data.notes || 'Generated test',
          subject: data.config?.topics || 'General',
          difficulty: data.config?.difficulty || 'medium',
          question_count: data.questionCount,
          question_types: [data.config?.questionType || 'mcq'],
          metadata: {
            config: data.config,
            questions: data.questions,
            notes: data.notes
          },
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Error saving test to library:', error);
        throw error;
      }

      console.log('✅ Test saved to library successfully:', data.id);
      return { success: true };
    } catch (error) {
      console.error('❌ Database service error:', error);
      throw error;
    }
  }

  // Get user tests
  static async getUserTests(userId: string) {
    try {
      console.log('🔍 DatabaseService: Fetching tests for user:', userId);

      const { data, error } = await supabase
        .from('tests')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ DatabaseService: Error fetching user tests:', error);
        throw error;
      }

      console.log('✅ DatabaseService: Retrieved tests:', data?.length || 0, 'tests');

      // Log metadata for first test if available
      if (data && data.length > 0) {
        console.log('📋 DatabaseService: First test sample:', {
          id: data[0].id,
          title: data[0].title,
          hasMetadata: !!data[0].metadata,
          metadataKeys: data[0].metadata ? Object.keys(data[0].metadata) : [],
          notesLength: data[0].metadata?.notes?.length || 0,
          questionsCount: data[0].metadata?.questions?.length || 0,
          descriptionLength: data[0].description?.length || 0
        });
      }

      return data || [];
    } catch (error) {
      console.error('❌ DatabaseService: Error in getUserTests:', error);
      throw error;
    }
  }
}
