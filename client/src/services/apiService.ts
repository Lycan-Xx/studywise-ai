import { supabase } from '@/lib/supabase';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '';

export class ApiService {
  private static getFullUrl(endpoint: string): string {
    // If endpoint starts with http, it's already a full URL
    if (endpoint.startsWith('http')) {
      return endpoint;
    }

    // If we have a base URL, use it
    if (API_BASE_URL) {
      return `${API_BASE_URL}${endpoint}`;
    }

    // Fallback to relative URL (for development)
    return endpoint;
  }

  private static async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        headers['user-id'] = user.id;
      }
    } catch (error) {
      console.warn('Failed to get user for auth headers:', error);
    }

    return headers;
  }

  static async post(endpoint: string, data?: any): Promise<Response> {
    const url = this.getFullUrl(endpoint);
    const headers = await this.getAuthHeaders();

    return fetch(url, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static async get(endpoint: string): Promise<Response> {
    const url = this.getFullUrl(endpoint);
    const headers = await this.getAuthHeaders();

    return fetch(url, {
      method: 'GET',
      headers,
    });
  }

  static async put(endpoint: string, data?: any): Promise<Response> {
    const url = this.getFullUrl(endpoint);
    const headers = await this.getAuthHeaders();

    return fetch(url, {
      method: 'PUT',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static async delete(endpoint: string): Promise<Response> {
    const url = this.getFullUrl(endpoint);
    const headers = await this.getAuthHeaders();

    return fetch(url, {
      method: 'DELETE',
      headers,
    });
  }

  // ==================== COURSE ENDPOINTS ====================

  /**
   * Generate a new course from uploaded content
   */
  static async generateCourse(data: {
    filename: string;
    content: string;
    userContext?: string;
    fileType: 'pdf' | 'docx' | 'txt' | 'md';
  }): Promise<any> {
    const payload = {
      filename: data.filename,
      file_type: data.fileType,
      content: data.content,
      user_context: data.userContext
    };
    const response = await this.post('/api/courses/generate', payload);
    if (!response.ok) throw new Error('Failed to generate course');
    return response.json();
  }

  /**
   * Fetch a specific course with all its modules
   */
  static async fetchCourse(courseId: string): Promise<any> {
    const response = await this.get(`/api/courses/${courseId}`);
    if (!response.ok) throw new Error('Failed to fetch course');
    return response.json();
  }

  /**
   * Get all courses for the current user
   */
  static async getUserCourses(): Promise<any[]> {
    const response = await this.get('/api/courses');
    if (!response.ok) throw new Error('Failed to fetch user courses');
    return response.json();
  }

  /**
   * Delete a course and all associated data
   */
  static async deleteCourse(courseId: string): Promise<void> {
    const response = await this.delete(`/api/courses/${courseId}`);
    if (!response.ok) throw new Error('Failed to delete course');
  }

  /**
   * Retry/Regenerate a failed course
   */
  static async retryCourseGeneration(courseId: string): Promise<any> {
    const response = await this.post(`/api/courses/${courseId}/retry`);
    if (!response.ok) throw new Error('Failed to retry course generation');
    return response.json();
  }

  // ==================== MODULE TEST ENDPOINTS ====================

  /**
   * Generate a test for a specific module
   */
  static async generateModuleTest(data: {
    courseId: string;
    moduleId: string;
    numberOfQuestions?: number;
    questionType?: 'mcq' | 'truefalse' | 'mixed';
    difficulty?: 'easy' | 'medium' | 'hard';
  }): Promise<any> {
    const { courseId, moduleId } = data;
    const response = await this.post(
      `/api/courses/${courseId}/modules/${moduleId}/test/generate`,
      data
    );
    if (!response.ok) throw new Error('Failed to generate module test');
    return response.json();
  }

  /**
   * Generate an exam for the entire course
   */
  static async generateCourseExam(courseId: string): Promise<any> {
    const response = await this.post(`/api/courses/${courseId}/exam/generate`, {});
    if (!response.ok) throw new Error('Failed to generate course exam');
    return response.json();
  }

  /**
   * Fetch a specific test
   */
  static async fetchTest(testId: string): Promise<any> {
    const response = await this.get(`/api/tests/${testId}`);
    if (!response.ok) throw new Error('Failed to fetch test');
    return response.json();
  }

  /**
   * Get all tests for a module
   */
  static async getModuleTests(courseId: string, moduleId: string): Promise<any[]> {
    const response = await this.get(
      `/api/courses/${courseId}/modules/${moduleId}/tests`
    );
    if (!response.ok) throw new Error('Failed to fetch module tests');
    return response.json();
  }

  /**
   * Delete a test
   */
  static async deleteTest(testId: string): Promise<void> {
    const response = await this.delete(`/api/tests/${testId}`);
    if (!response.ok) throw new Error('Failed to delete test');
  }

  // ==================== TEST SUBMISSION & RESULTS ====================

  /**
   * Submit a completed test
   */
  static async submitTest(data: {
    testId: string;
    answers: Array<{
      questionId: string;
      selectedAnswer: string;
      timeSpent: number;
    }>;
    totalTime: number;
  }): Promise<any> {
    const response = await this.post(`/api/tests/${data.testId}/submit`, data);
    if (!response.ok) throw new Error('Failed to submit test');
    return response.json();
  }

  /**
   * Fetch test result
   */
  static async fetchTestResult(resultId: string): Promise<any> {
    const response = await this.get(`/api/results/${resultId}`);
    if (!response.ok) throw new Error('Failed to fetch test result');
    return response.json();
  }

  /**
   * Get all results for a module
   */
  static async getModuleResults(courseId: string, moduleId: string): Promise<any[]> {
    const response = await this.get(
      `/api/courses/${courseId}/modules/${moduleId}/results`
    );
    if (!response.ok) throw new Error('Failed to fetch module results');
    return response.json();
  }

  /**
   * Get aggregated statistics for a course
   */
  static async getCourseStatistics(courseId: string): Promise<any> {
    const response = await this.get(`/api/courses/${courseId}/statistics`);
    if (!response.ok) throw new Error('Failed to fetch course statistics');
    return response.json();
  }

  /**
   * Request AI analysis for a test result
   */
  static async requestAIAnalysis(testId: string): Promise<any> {
    const response = await this.post(`/api/tests/${testId}/insights/request`, {});
    if (!response.ok) throw new Error('Failed to request AI analysis');
    return response.json();
  }

  /**
   * Get all course-level performance results
   */
  static async getCoursePerformance(): Promise<any[]> {
    const response = await this.get('/api/results/courses');
    if (!response.ok) return [];
    return response.json();
  }

  /**
   * Get all module-level performance results for a course
   */
  static async getModulePerformance(courseId: string): Promise<any[]> {
    const response = await this.get(`/api/results/courses/${courseId}/modules`);
    if (!response.ok) return [];
    return response.json();
  }

  /**
   * Get specific test result
   */
  static async getTestResult(testId: string): Promise<any> {
    const response = await this.get(`/api/tests/${testId}/result`);
    if (!response.ok) throw new Error('Failed to fetch test result');
    return response.json();
  }

  /**
   * Get questions for a test
   */
  static async getTestQuestions(testId: string): Promise<any[]> {
    const response = await this.get(`/api/tests/${testId}/questions`);
    if (!response.ok) return [];
    return response.json();
  }

  /**
   * Get user answers for a test
   */
  static async getTestAnswers(testId: string): Promise<any[]> {
    const response = await this.get(`/api/tests/${testId}/answers`);
    if (!response.ok) return [];
    return response.json();
  }

  /**
   * Get combined stats for a test (module + course averages)
   */
  static async getTestStats(testId: string): Promise<any> {
    const response = await this.get(`/api/tests/${testId}/stats`);
    if (!response.ok) throw new Error('Failed to fetch test stats');
    return response.json();
  }

  // ==================== USER PREFERENCES ====================

  /**
   * Update user test preferences
   */
  static async updateUserPreferences(data: {
    questionDifficulty?: 'easy' | 'medium' | 'hard';
    questionTypes?: ('mcq' | 'truefalse')[];
    defaultQuestionsPerModule?: number;
  }): Promise<any> {
    const response = await this.put('/api/user/preferences', data);
    if (!response.ok) throw new Error('Failed to update preferences');
    return response.json();
  }

  /**
   * Get user test preferences
   */
  static async getUserPreferences(): Promise<any> {
    const response = await this.get('/api/user/preferences');
    if (!response.ok) throw new Error('Failed to fetch preferences');
    return response.json();
  }
}

export default ApiService;
