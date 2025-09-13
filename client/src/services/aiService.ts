import { QuestionType, Difficulty, GeneratedQuestion, FlashcardSet, TestInsights } from '@/types'
import apiConfig from '@/config/api' 

class AIService {
  private baseUrl: string; 

  constructor() {
    // Use the same origin as the frontend since both are served from the same Vite dev server
    this.baseUrl = apiConfig.baseURL;
  } 

  async generateQuestions(options: GenerateQuestionsOptions): Promise<AIResponse> {
    try {
      console.log('Making request to:', `${this.baseUrl}/tests/generate`);
      console.log('Request options:', options); 

      const response = await fetch(`${this.baseUrl}/tests/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(options)
      }); 

      console.log('Response status:', response.status); 

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`API error: ${response.statusText} - ${errorText}`);
      } 

      const result = await response.json();
      console.log('AI Service response:', result);
      return result;
    } catch (error) {
      console.error('AI question generation failed:', error);
      throw error;
    }
  } 

  async generateFlashcards(content: string, count: number = 10) {
    try {
      const response = await fetch(`${this.baseUrl}/tests/flashcards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ content, count })
      }); 

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      } 

      return await response.json();
    } catch (error) {
      console.error('Flashcard generation failed:', error);
      throw error;
    }
  } 

  async createTest(formData: FormData): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/tests`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      }); 

      if (!response.ok) {
        throw new Error(`Test creation failed: ${response.statusText}`);
      } 

      return await response.json();
    } catch (error) {
      console.error('Test creation failed:', error);
      throw error;
    }
  } 

  async getUserTests(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/library`, {
        method: 'GET',
        credentials: 'include'
      }); 

      if (!response.ok) {
        throw new Error(`Failed to fetch tests: ${response.statusText}`);
      } 

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch user tests:', error);
      throw error;
    }
  } 

  async submitTestResults(testId: string, results: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/tests/${testId}/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(results)
      }); 

      if (!response.ok) {
        throw new Error(`Failed to submit results: ${response.statusText}`);
      } 

      return await response.json();
    } catch (error) {
      console.error('Failed to submit test results:', error);
      throw error;
    }
  }
} 

export const aiService = new AIService();
export type { GenerateQuestionsOptions, GeneratedQuestion, AIResponse };