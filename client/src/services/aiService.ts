
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
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
}

interface AIResponse {
  questions: GeneratedQuestion[];
  metadata: {
    totalQuestions: number;
    estimatedTime: number;
    difficulty: string;
    subject?: string;
  };
}

class AIService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    // Use Gemini API by default, fallback to OpenAI if needed
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY;
    this.baseUrl = import.meta.env.VITE_GEMINI_API_KEY 
      ? 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'
      : 'https://api.openai.com/v1/chat/completions';
    
    if (!this.apiKey) {
      console.warn('No AI API key found. AI features will use mock data.');
    }
  }

  async generateQuestions(options: GenerateQuestionsOptions): Promise<AIResponse> {
    if (!this.apiKey) {
      return this.generateMockQuestions(options);
    }

    try {
      const prompt = this.buildPrompt(options);
      
      if (import.meta.env.VITE_GEMINI_API_KEY) {
        return await this.callGeminiAPI(prompt);
      } else {
        return await this.callOpenAI(prompt);
      }
    } catch (error) {
      console.error('AI API call failed:', error);
      // Fallback to mock data if AI fails
      return this.generateMockQuestions(options);
    }
  }

  private buildPrompt(options: GenerateQuestionsOptions): string {
    const { content, difficulty, questionCount, questionTypes, subject, focus } = options;
    
    return `
You are an expert educational content creator. Generate ${questionCount} high-quality test questions based on the following content.

CONTENT TO ANALYZE:
${content}

REQUIREMENTS:
- Difficulty Level: ${difficulty}
- Question Types: ${questionTypes.join(', ')}
- Number of Questions: ${questionCount}
${subject ? `- Subject Area: ${subject}` : ''}
${focus ? `- Focus Area: ${focus}` : ''}

INSTRUCTIONS:
1. Create diverse, engaging questions that test comprehension, analysis, and application
2. For multiple-choice questions, provide 4 options with only one correct answer
3. For true/false questions, ensure clear, unambiguous statements
4. Include explanations for correct answers
5. Assign appropriate point values (1-5 points based on difficulty)
6. Ensure questions are directly related to the provided content

OUTPUT FORMAT (JSON):
{
  "questions": [
    {
      "id": "unique_id",
      "type": "multiple-choice|true-false|short-answer|essay",
      "question": "Question text",
      "options": ["A", "B", "C", "D"] (for multiple-choice only),
      "correctAnswer": "correct answer or option letter",
      "explanation": "Why this answer is correct",
      "difficulty": "${difficulty}",
      "points": number
    }
  ],
  "metadata": {
    "totalQuestions": ${questionCount},
    "estimatedTime": estimated_minutes,
    "difficulty": "${difficulty}",
    "subject": "${subject || 'General'}"
  }
}

Generate exactly ${questionCount} questions now:`;
  }

  private async callGeminiAPI(prompt: string): Promise<AIResponse> {
    const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.candidates[0].content.parts[0].text;
    
    // Extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from Gemini API');
    }

    return JSON.parse(jsonMatch[0]);
  }

  private async callOpenAI(prompt: string): Promise<AIResponse> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational content creator who generates high-quality test questions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from OpenAI API');
    }

    return JSON.parse(jsonMatch[0]);
  }

  private generateMockQuestions(options: GenerateQuestionsOptions): AIResponse {
    const { questionCount, difficulty } = options;
    const questions: GeneratedQuestion[] = [];

    const sampleQuestions = [
      {
        type: 'multiple-choice' as const,
        question: 'What is the main concept discussed in the provided content?',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 'A',
        explanation: 'This is the correct answer based on the content analysis.',
      },
      {
        type: 'true-false' as const,
        question: 'The content emphasizes the importance of understanding key concepts.',
        correctAnswer: 'true',
        explanation: 'This statement aligns with the main themes in the content.',
      },
      {
        type: 'short-answer' as const,
        question: 'Explain the key takeaway from the provided material.',
        correctAnswer: 'The key takeaway involves understanding the fundamental principles and their applications.',
        explanation: 'A good answer should demonstrate comprehension of the core concepts.',
      },
    ];

    for (let i = 0; i < questionCount; i++) {
      const template = sampleQuestions[i % sampleQuestions.length];
      questions.push({
        ...template,
        id: `mock_${i + 1}`,
        difficulty,
        points: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
      });
    }

    return {
      questions,
      metadata: {
        totalQuestions: questionCount,
        estimatedTime: questionCount * 2, // 2 minutes per question
        difficulty,
        subject: 'General',
      },
    };
  }

  async generateFlashcards(content: string, count: number = 10) {
    // Similar implementation for flashcard generation
    if (!this.apiKey) {
      return this.generateMockFlashcards(content, count);
    }

    const prompt = `
Generate ${count} flashcards based on the following content:

${content}

Format as JSON:
{
  "flashcards": [
    {
      "id": "unique_id",
      "front": "Question or term",
      "back": "Answer or definition",
      "difficulty": "easy|medium|hard"
    }
  ]
}`;

    try {
      if (import.meta.env.VITE_GEMINI_API_KEY) {
        const response = await this.callGeminiAPI(prompt);
        return response;
      } else {
        const response = await this.callOpenAI(prompt);
        return response;
      }
    } catch (error) {
      console.error('Flashcard generation failed:', error);
      return this.generateMockFlashcards(content, count);
    }
  }

  private generateMockFlashcards(content: string, count: number) {
    const flashcards = [];
    for (let i = 0; i < count; i++) {
      flashcards.push({
        id: `flashcard_${i + 1}`,
        front: `Key concept ${i + 1} from your content`,
        back: `This is the explanation or definition for concept ${i + 1}`,
        difficulty: ['easy', 'medium', 'hard'][i % 3],
      });
    }

    return { flashcards };
  }
}

export const aiService = new AIService();
export type { GenerateQuestionsOptions, GeneratedQuestion, AIResponse };
