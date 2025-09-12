// Ensure environment variables are loaded first
import "../config.js";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { createHash } from "crypto";
import { nanoid } from "nanoid";

interface GenerateQuestionsOptions {
  content: string;
  difficulty: "easy" | "medium" | "hard";
  questionCount: number;
  questionTypes: string[];
  subject?: string;
  focus?: string;
}

interface GeneratedQuestion {
  id: string;
  type: "multiple-choice" | "true-false" | "short-answer" | "essay";
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  points: number;
  sourceText: string;
  sourceOffset?: number;
  sourceLength?: number;
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

interface AIProvider {
  name: string;
  available: boolean;
  requestCount: number;
  lastReset: number;
  maxRequests: number;
  resetInterval: number;
  priority: number;
}

class MultiProviderAIService {
  private providers: Map<string, AIProvider> = new Map();
  private geminiAI: GoogleGenerativeAI | null = null;
  private cache = new Map<string, { data: AIResponse; timestamp: number; expiresAt: number }>();

  constructor() {
    this.initializeProviders();
    setInterval(() => this.cleanupCache(), 60 * 60 * 1000);
    setInterval(() => this.resetProviderLimits(), 60 * 1000); // Reset every minute
  }

  private initializeProviders() {
    // Initialize Gemini
    const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (geminiKey) {
      this.geminiAI = new GoogleGenerativeAI(geminiKey);
      this.providers.set('gemini-flash', {
        name: 'Gemini Flash',
        available: true,
        requestCount: 0,
        lastReset: Date.now(),
        maxRequests: 8, // Conservative limit
        resetInterval: 60 * 1000,
        priority: 1
      });
      this.providers.set('gemini-pro', {
        name: 'Gemini Pro',
        available: true,
        requestCount: 0,
        lastReset: Date.now(),
        maxRequests: 3, // Very conservative for Pro
        resetInterval: 60 * 1000,
        priority: 3
      });
      console.log("✅ Gemini providers initialized");
    }

    // Initialize OpenAI (if available)
    const openaiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
    if (openaiKey) {
      this.providers.set('openai-gpt-3.5', {
        name: 'OpenAI GPT-3.5',
        available: true,
        requestCount: 0,
        lastReset: Date.now(),
        maxRequests: 5,
        resetInterval: 60 * 1000,
        priority: 2
      });
      console.log("✅ OpenAI provider initialized");
    }

    console.log(`🤖 Multi-provider AI service initialized with ${this.providers.size} providers`);
  }

  private resetProviderLimits() {
    const now = Date.now();
    for (const [key, provider] of this.providers) {
      if (now - provider.lastReset >= provider.resetInterval) {
        provider.requestCount = 0;
        provider.lastReset = now;
      }
    }
  }

  private getAvailableProvider(): string | null {
    const availableProviders = Array.from(this.providers.entries())
      .filter(([_, provider]) => provider.available && provider.requestCount < provider.maxRequests)
      .sort(([_, a], [__, b]) => a.priority - b.priority);

    return availableProviders.length > 0 ? availableProviders[0][0] : null;
  }

  private async makeGeminiRequest(model: string, prompt: string): Promise<string> {
    if (!this.geminiAI) throw new Error("Gemini not initialized");

    const aiModel = this.geminiAI.getGenerativeModel({
      model: model === 'gemini-flash' ? 'gemini-1.5-flash' : 'gemini-1.5-pro'
    });

    const result = await aiModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  private async makeOpenAIRequest(prompt: string): Promise<string> {
    const openaiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private async makeProviderRequest(providerId: string, prompt: string): Promise<string> {
    const provider = this.providers.get(providerId);
    if (!provider) throw new Error(`Provider ${providerId} not found`);

    // Increment request count
    provider.requestCount++;

    try {
      let response: string;

      if (providerId.startsWith('gemini')) {
        response = await this.makeGeminiRequest(providerId, prompt);
      } else if (providerId.startsWith('openai')) {
        response = await this.makeOpenAIRequest(prompt);
      } else {
        throw new Error(`Unknown provider: ${providerId}`);
      }

      console.log(`✅ Request successful with ${provider.name}`);
      return response;

    } catch (error) {
      console.error(`❌ Request failed with ${provider.name}:`, error);

      // Mark provider as temporarily unavailable on rate limit
      if (error instanceof Error && error.message.includes('429')) {
        provider.available = false;
        setTimeout(() => {
          provider.available = true;
          provider.requestCount = 0;
        }, 60000); // 1 minute cooldown
      }

      throw error;
    }
  }

  async generateQuestions(options: GenerateQuestionsOptions): Promise<AIResponse> {
    const contentHash = this.generateContentHash(options);

    // Check cache first
    const cached = this.getCachedQuestions(contentHash);
    if (cached) {
      console.log("📋 Returning cached questions");
      return cached;
    }

    console.log(`🤖 Generating ${options.questionCount} questions using multi-provider system`);

    const prompt = this.buildPrompt(options);
    let lastError: Error | null = null;

    // Try each available provider in order of priority
    const maxAttempts = this.providers.size;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const providerId = this.getAvailableProvider();

      if (!providerId) {
        console.log("⏳ No providers available, waiting 30 seconds...");
        await this.sleep(30000);
        continue;
      }

      try {
        console.log(`🔄 Attempting with provider: ${this.providers.get(providerId)?.name}`);

        const response = await this.makeProviderRequest(providerId, prompt);
        const parsedResponse = this.parseAIResponse(response);
        const processedResponse = this.processGeneratedQuestions(parsedResponse, options);

        // Cache the successful response
        this.setCachedQuestions(contentHash, processedResponse);

        console.log(`✅ Successfully generated questions with ${this.providers.get(providerId)?.name}`);
        return processedResponse;

      } catch (error) {
        lastError = error as Error;
        console.log(`❌ Provider ${providerId} failed, trying next...`);

        // Small delay before trying next provider
        await this.sleep(2000);
      }
    }

    // If all providers failed
    console.error("❌ All providers failed");
    throw new Error(`Question generation failed: ${lastError?.message || "All providers exhausted"}`);
  }

  private buildPrompt(options: GenerateQuestionsOptions): string {
    const { content, difficulty, questionCount, questionTypes, focus } = options;

    // Optimize content length
    const maxContentLength = 2500;
    const optimizedContent = content.length > maxContentLength
      ? content.substring(0, maxContentLength) + "..."
      : content;

    // Extract source snippets for better source mapping
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);

    return `Generate exactly ${questionCount} ${difficulty} test questions from this content:

CONTENT:
${optimizedContent}

REQUIREMENTS:
- Question Types: ${questionTypes.join(", ")}
- Difficulty: ${difficulty}
- Each question must reference specific content
- Include the exact source text for each question
${focus ? `- Focus areas: ${focus}` : ""}

IMPORTANT: For each question, include the exact text from the content that supports the answer as "sourceText".

Return valid JSON:
{
  "questions": [
    {
      "id": "unique_id",
      "type": "${questionTypes[0]}",
      "question": "Clear question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Brief explanation",
      "difficulty": "${difficulty}",
      "points": ${difficulty === "easy" ? 1 : difficulty === "medium" ? 2 : 3},
      "sourceText": "EXACT text from content that supports this question"
    }
  ]
}

Generate ${questionCount} questions now:`;
  }

  private parseAIResponse(text: string): any {
    try {
      let jsonText = text.trim();
      jsonText = jsonText.replace(/^```json\s*/, "").replace(/\s*```$/, "");

      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const parsed = JSON.parse(jsonMatch[0]);
      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error("Invalid response format");
      }

      return parsed;
    } catch (error) {
      console.error("Failed to parse AI response:", error);
      throw new Error("Invalid JSON response from AI");
    }
  }

  private processGeneratedQuestions(parsedResponse: any, options: GenerateQuestionsOptions): AIResponse {
    const questions = parsedResponse.questions || [];

    const processedQuestions = questions.map((q: any, index: number) => {
      // Find source text in original content
      let sourceText = q.sourceText || "Generated from your content";
      let sourceOffset = 0;
      let sourceLength = 0;

      if (q.sourceText && options.content && q.sourceText !== "Generated from your content") {
        const content = options.content;
        const contentLower = content.toLowerCase();
        const sourceTextLower = q.sourceText.toLowerCase();
        
        // Try exact match first
        let foundIndex = contentLower.indexOf(sourceTextLower);
        
        if (foundIndex !== -1) {
          sourceText = content.substring(foundIndex, foundIndex + q.sourceText.length);
          sourceOffset = foundIndex;
          sourceLength = q.sourceText.length;
        } else {
          // Try partial matching with key words
          const words = q.sourceText.split(/\s+/).filter(w => w.length > 3);
          let bestMatch = { index: -1, length: 0, text: "" };
          
          for (const word of words) {
            const wordIndex = contentLower.indexOf(word.toLowerCase());
            if (wordIndex !== -1) {
              // Find the sentence/paragraph containing this word
              let start = wordIndex;
              let end = wordIndex + word.length;
              
              // Expand backwards to find sentence start
              while (start > 0 && !/[.!?\n]/.test(content[start - 1])) {
                start--;
              }
              
              // Expand forwards to find sentence end
              while (end < content.length && !/[.!?\n]/.test(content[end])) {
                end++;
              }
              
              // Include the sentence ending punctuation
              if (end < content.length && /[.!?]/.test(content[end])) {
                end++;
              }
              
              const matchText = content.substring(start, end).trim();
              if (matchText.length > bestMatch.length) {
                bestMatch = { index: start, length: end - start, text: matchText };
              }
            }
          }
          
          if (bestMatch.index !== -1) {
            sourceText = bestMatch.text;
            sourceOffset = bestMatch.index;
            sourceLength = bestMatch.length;
          } else {
            // Fallback: use the AI-provided source text as is
            sourceText = q.sourceText;
            sourceOffset = 0;
            sourceLength = 0;
          }
        }
      }

      return {
        id: q.id || nanoid(),
        type: q.type || "multiple-choice",
        question: q.question || `Generated question ${index + 1}`,
        options: q.options || ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || "Explanation based on source content",
        difficulty: q.difficulty || options.difficulty,
        points: q.points || (options.difficulty === "easy" ? 1 : options.difficulty === "medium" ? 2 : 3),
        sourceText,
        sourceOffset,
        sourceLength,
        confidence: 0.8
      } as GeneratedQuestion;
    });

    return {
      questions: processedQuestions,
      metadata: {
        totalQuestions: processedQuestions.length,
        estimatedTime: processedQuestions.length * (options.difficulty === "easy" ? 1 : options.difficulty === "medium" ? 2 : 3),
        difficulty: options.difficulty,
        subject: options.subject,
        contentHash: this.generateContentHash(options)
      }
    };
  }

  async generateTestInsights(testResult: {
    score: number;
    totalQuestions: number;
    questions: GeneratedQuestion[];
    userAnswers: Record<string, string>;
    correctAnswers: Record<string, string>;
    testTitle: string;
    sourceContent: string;
  }): Promise<{
    overallPerformance: string;
    strengths: string[];
    weaknesses: string[];
    studyRecommendations: string[];
    focusAreas: string[];
  }> {
    const wrongQuestions = testResult.questions.filter(
      (q) => testResult.userAnswers[q.id] !== testResult.correctAnswers[q.id]
    );

    const prompt = `Analyze this test performance:

SCORE: ${testResult.score}% (${testResult.totalQuestions - wrongQuestions.length}/${testResult.totalQuestions})

INCORRECT QUESTIONS:
${wrongQuestions.slice(0, 3).map((q, i) => `
${i + 1}. ${q.question}
   Correct: ${testResult.correctAnswers[q.id]}
   User: ${testResult.userAnswers[q.id]}
`).join("")}

Return JSON:
{
  "overallPerformance": "Brief assessment",
  "strengths": ["List 2-3 strengths"],
  "weaknesses": ["List 2-3 areas for improvement"],
  "studyRecommendations": ["List 3-4 specific study strategies"],
  "focusAreas": ["List 2-3 topics to review"]
}`;

    try {
      const providerId = this.getAvailableProvider();
      if (!providerId) {
        return this.generateBasicInsights(testResult);
      }

      const response = await this.makeProviderRequest(providerId, prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return this.generateBasicInsights(testResult);
    } catch (error) {
      console.error("Insights generation failed:", error);
      return this.generateBasicInsights(testResult);
    }
  }

  private generateBasicInsights(testResult: any) {
    const score = testResult.score;
    const wrongCount = testResult.questions.length - Math.floor((score / 100) * testResult.totalQuestions);

    return {
      overallPerformance: score >= 80 ? "Strong performance showing good understanding" :
                         score >= 60 ? "Satisfactory performance with room for improvement" :
                         "Needs improvement - consider reviewing the material",
      strengths: score >= 70 ? ["Good comprehension of key concepts", "Effective study approach"] :
                              ["Completed all questions", "Shows engagement with material"],
      weaknesses: wrongCount > 0 ? [`Missed ${wrongCount} questions`, "Some concepts need reinforcement"] : [],
      studyRecommendations: [
        "Review explanations for missed questions",
        "Focus on understanding key concepts",
        "Practice with similar material",
        "Create summary notes of important points"
      ],
      focusAreas: [
        "Areas where questions were missed",
        "Key concepts from source material",
        "Practice similar question types"
      ]
    };
  }

  private generateContentHash(options: GenerateQuestionsOptions): string {
    const hashInput = `${options.content.substring(0, 1000)}-${options.difficulty}-${options.questionCount}-${options.questionTypes.join(",")}`;
    return createHash("md5").update(hashInput).digest("hex");
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
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    this.cache.set(contentHash, {
      data: response,
      timestamp: Date.now(),
      expiresAt
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private cleanupCache(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, value] of Array.from(this.cache.entries())) {
      if (now > value.expiresAt) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired cache entries`);
    }
  }

  public getProviderStatus(): Record<string, any> {
    const status: Record<string, any> = {};

    for (const [key, provider] of this.providers) {
      status[key] = {
        name: provider.name,
        available: provider.available,
        requestsUsed: provider.requestCount,
        maxRequests: provider.maxRequests,
        priority: provider.priority
      };
    }

    return status;
  }
}

export const aiService = new MultiProviderAIService();
export type { GenerateQuestionsOptions, GeneratedQuestion, AIResponse };