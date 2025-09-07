
// Ensure environment variables are loaded first
import '../config.js';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { createHash } from 'crypto';
import { nanoid } from 'nanoid';

interface GenerateQuestionsOptions {
  content: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
  questionTypes: string[];
  subject?: string;
  focus?: string;
}

interface GeneratedQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  sourceText?: string;
  confidence?: number;
}

interface AIResponse {
  questions: GeneratedQuestion[];
  metadata: {
    totalQuestions: number;
    estimatedTime: number;
    difficulty: string;
    subject?: string;
    contentHash: string;
  };
}

interface ValidationResult {
  isValid: boolean;
  confidence: number;
  reasoning: string;
}

class AIService {
  private genAI: GoogleGenerativeAI;
  private proModel: any;
  private flashModel: any;
  private cache = new Map<string, { data: AIResponse; timestamp: number; expiresAt: number }>();

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      console.warn('GEMINI_API_KEY not found, AI service will use mock responses');
      this.genAI = null;
      this.proModel = null;
      this.flashModel = null;
      return;
    }

    console.log('✅ Gemini API key found, initializing AI service');

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.proModel = this.genAI.getGenerativeModel({ model: process.env.VITE_GEMINI_MODEL || 'gemini-1.5-pro' });
    this.flashModel = this.genAI.getGenerativeModel({ model: process.env.VITE_GEMINI_FLASH_MODEL || 'gemini-1.5-flash' });
  }

  async generateQuestions(options: GenerateQuestionsOptions): Promise<AIResponse> {
    // If no API key, return mock questions immediately
    if (!this.genAI) {
      console.log('No Gemini API key found, returning mock questions');
      return this.generateMockQuestions(options);
    }

    const contentHash = this.generateContentHash(options);

    // Check cache first
    const cached = this.getCachedQuestions(contentHash);
    if (cached) {
      console.log('Returning cached questions for content hash:', contentHash);
      return cached;
    }

    try {
      console.log(`Generating ${options.questionCount} questions using Gemini Pro`);
      const response = await this.generateWithGeminiPro(options);

      // Validate questions with Flash model
      console.log('Validating questions with Gemini Flash');
      const validatedQuestions = await this.validateQuestions(response.questions, options.content);

      const finalResponse: AIResponse = {
        ...response,
        questions: validatedQuestions,
        metadata: {
          ...response.metadata,
          contentHash,
          totalQuestions: validatedQuestions.length
        }
      };

      // Cache the response
      this.setCachedQuestions(contentHash, finalResponse);

      return finalResponse;
    } catch (error) {
      console.error('Primary AI generation failed:', error);
      return await this.generateWithFallback(options);
    }
  }

  private async generateWithGeminiPro(options: GenerateQuestionsOptions): Promise<AIResponse> {
    const prompt = this.buildComprehensivePrompt(options);

    try {
      const result = await this.proModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const parsedResponse = this.parseAIResponse(text);
      return this.processGeneratedQuestions(parsedResponse, options);
    } catch (error) {
      console.error('Gemini Pro generation failed:', error);
      throw new Error(`Gemini Pro API error: ${error.message}`);
    }
  }

  private async generateWithFallback(options: GenerateQuestionsOptions): Promise<AIResponse> {
    console.log('Attempting fallback to Gemini Flash');

    try {
      const simplifiedPrompt = this.buildSimplifiedPrompt(options);
      const result = await this.flashModel.generateContent(simplifiedPrompt);
      const response = await result.response;
      const text = response.text();

      const parsedResponse = this.parseAIResponse(text);
      return this.processGeneratedQuestions(parsedResponse, options);
    } catch (error) {
      console.error('Gemini Flash fallback failed:', error);
      console.log('Falling back to mock questions');
      return this.generateMockQuestions(options);
    }
  }

  private buildComprehensivePrompt(options: GenerateQuestionsOptions): string {
    const { content, difficulty, questionCount, questionTypes, subject, focus } = options;

    return `You are an expert educational content creator and assessment designer with deep expertise in creating high-quality test questions.

TASK: Generate ${questionCount} exceptional test questions based on the provided content.

CONTENT TO ANALYZE:
${content.substring(0, 8000)} // Limit content to avoid token limits

PARAMETERS:
- Difficulty Level: ${difficulty}
- Question Types: ${questionTypes.join(', ')}
- Total Questions: ${questionCount}
${subject ? `- Subject Area: ${subject}` : ''}
${focus ? `- Focus Area: ${focus}` : ''}

CRITICAL REQUIREMENTS:
1. Each question MUST be directly answerable from the provided content
2. Include the exact source sentence that supports the correct answer
3. For multiple-choice: Create 4 options with 1 clearly correct answer and 3 plausible but incorrect distractors
4. For true-false: Ensure statements are unambiguous and clearly true or false based on content
5. For short-answer: Focus on key concepts that require explanation or analysis
6. For essay: Create questions that require synthesis and critical thinking
7. Provide detailed explanations that reference specific parts of the content
8. Assign appropriate point values (1-5) based on question complexity and difficulty
9. Ensure cognitive diversity: include recall, comprehension, application, and analysis questions
10. Avoid questions that require external knowledge not present in the content

QUALITY STANDARDS:
- Questions should test understanding, not just memorization
- Distractors should be plausible to someone who partially understands the content
- Explanations should be educational and help reinforce learning
- Vary sentence structure and question formats to maintain engagement

OUTPUT FORMAT (JSON):
{
  "questions": [
    ${questionTypes.includes('mcq') || questionTypes.includes('multiple-choice') ? `{
      "id": "q_001",
      "type": "multiple-choice",
      "question": "Clear, specific question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Detailed explanation referencing specific content",
      "difficulty": "${difficulty}",
      "points": 2,
      "sourceText": "Exact sentence from content that supports the answer",
      "confidence": 0.95
    }` : ''}${questionTypes.includes('true-false') ? `{
      "id": "q_001",
      "type": "true-false",
      "question": "Clear, specific statement to evaluate",
      "options": ["True", "False"],
      "correctAnswer": "True",
      "explanation": "Detailed explanation referencing specific content",
      "difficulty": "${difficulty}",
      "points": 2,
      "sourceText": "Exact sentence from content that supports the answer",
      "confidence": 0.95
    }` : ''}
  ]
}

Generate exactly ${questionCount} high-quality questions now:`;
  }

  private buildSimplifiedPrompt(options: GenerateQuestionsOptions): string {
    const { content, difficulty, questionCount, questionTypes } = options;

    const isTrueFalse = questionTypes.includes('true-false');
    const isMultipleChoice = questionTypes.includes('mcq') || questionTypes.includes('multiple-choice');

    return `Create ${questionCount} ${difficulty} ${questionTypes.join(' and ')} questions from this content:

${content.substring(0, 4000)}

${isTrueFalse ? 'For true-false questions: Use options ["True", "False"] and make correctAnswer either "True" or "False".' : ''}
${isMultipleChoice ? 'For multiple-choice questions: Use 4 options and make correctAnswer match one of the options exactly.' : ''}

Return as JSON with questions array. Each question needs: id, type, question, options, correctAnswer, explanation, difficulty, points.`;
  }

  private async validateQuestions(questions: GeneratedQuestion[], content: string): Promise<GeneratedQuestion[]> {
    const validatedQuestions: GeneratedQuestion[] = [];

    for (const question of questions) {
      try {
        const validation = await this.validateSingleQuestion(question, content);

        if (validation.isValid && validation.confidence > 0.7) {
          validatedQuestions.push({
            ...question,
            confidence: validation.confidence
          });
        } else {
          console.log(`Question rejected: ${validation.reasoning}`);
        }
      } catch (error) {
        console.error('Validation failed for question:', question.id, error);
        // Include question with lower confidence if validation fails
        validatedQuestions.push({
          ...question,
          confidence: 0.5
        });
      }
    }

    return validatedQuestions;
  }

  private async validateSingleQuestion(question: GeneratedQuestion, content: string): Promise<ValidationResult> {
    const prompt = `You are a quality assurance specialist for educational assessments.

TASK: Validate this question against the source content.

QUESTION: ${question.question}
${question.options ? `OPTIONS: ${question.options.join(', ')}` : ''}
CORRECT ANSWER: ${question.correctAnswer}
SOURCE CONTENT: ${content.substring(0, 2000)}

VALIDATION CRITERIA:
1. Is the question clearly answerable from the source content?
2. Is the correct answer definitively correct based on the content?
3. Are any distractors actually correct or ambiguous?
4. Is the difficulty level appropriate for the content complexity?

Respond with JSON:
{
  "isValid": true/false,
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation"
}`;

    try {
      const result = await this.flashModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return { isValid: true, confidence: 0.6, reasoning: "Validation parsing failed" };
    } catch (error) {
      return { isValid: true, confidence: 0.5, reasoning: "Validation failed" };
    }
  }

  private parseAIResponse(text: string): any {
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw new Error('Invalid JSON response from AI');
    }
  }

  private processGeneratedQuestions(parsedResponse: any, options: GenerateQuestionsOptions): AIResponse {
    const questions = parsedResponse.questions || [];

    // Ensure all questions have required fields
    const processedQuestions = questions.map((q: any, index: number) => ({
      id: q.id || `q_${index + 1}`,
      type: q.type || 'multiple-choice',
      question: q.question || 'Generated question',
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || 'No explanation provided',
      difficulty: q.difficulty || options.difficulty,
      points: q.points || (options.difficulty === 'easy' ? 1 : options.difficulty === 'medium' ? 2 : 3),
      sourceText: q.sourceText,
      confidence: q.confidence || 0.8
    }));

    const estimatedTime = processedQuestions.length * (options.difficulty === 'easy' ? 1 : options.difficulty === 'medium' ? 2 : 3);

    return {
      questions: processedQuestions,
      metadata: {
        totalQuestions: processedQuestions.length,
        estimatedTime,
        difficulty: options.difficulty,
        subject: options.subject,
        contentHash: this.generateContentHash(options)
      }
    };
  }

  private generateMockQuestions(options: GenerateQuestionsOptions): AIResponse {
    const { questionCount, difficulty, questionTypes } = options;
    const questions: GeneratedQuestion[] = [];

    // Determine the question type from the request
    const questionType = questionTypes[0]; // Use the first question type
    const isTrueFalse = questionType === 'true-false';

    for (let i = 0; i < questionCount; i++) {
      if (isTrueFalse) {
        questions.push({
          id: nanoid(),
          type: 'true-false',
          question: `Sample true/false question ${i + 1} based on your content`,
          options: ['True', 'False'],
          correctAnswer: i % 2 === 0 ? 'True' : 'False', // Alternate between True and False
          explanation: 'This is a sample explanation for the mock true/false question.',
          difficulty,
          points: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
          sourceText: 'Mock source text from your document',
          confidence: 0.5
        });
      } else {
        questions.push({
          id: nanoid(),
          type: 'multiple-choice',
          question: `Sample multiple choice question ${i + 1} based on your content`,
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: 'Option A',
          explanation: 'This is a sample explanation for the mock multiple choice question.',
          difficulty,
          points: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
          sourceText: 'Mock source text from your document',
          confidence: 0.5
        });
      }
    }

    return {
      questions,
      metadata: {
        totalQuestions: questionCount,
        estimatedTime: questionCount * 2,
        difficulty,
        subject: 'General',
        contentHash: 'mock_hash'
      }
    };
  }

  private generateContentHash(options: GenerateQuestionsOptions): string {
    const hashInput = `${options.content}-${options.difficulty}-${options.questionCount}-${options.questionTypes.join(',')}`;
    return createHash('md5').update(hashInput).digest('hex');
  }

  private getCachedQuestions(contentHash: string): AIResponse | null {
    const cached = this.cache.get(contentHash);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }
    if (cached) {
      this.cache.delete(contentHash);
    }
    return null;
  }

  private setCachedQuestions(contentHash: string, response: AIResponse): void {
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
    this.cache.set(contentHash, {
      data: response,
      timestamp: Date.now(),
      expiresAt
    });
  }

  // Cleanup old cache entries periodically
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

export const aiService = new AIService();
export type { GenerateQuestionsOptions, GeneratedQuestion, AIResponse };
