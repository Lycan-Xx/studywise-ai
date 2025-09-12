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

interface RateLimitState {
  requestCount: number;
  windowStart: number;
  lastRequestTime: number;
}

class AIService {
  private genAI: GoogleGenerativeAI | null;
  private flashModel: any;
  private proModel: any;
  private cache = new Map<
    string,
    { data: AIResponse; timestamp: number; expiresAt: number }
  >();

  // Rate limiting state
  private rateLimitState: RateLimitState = {
    requestCount: 0,
    windowStart: Date.now(),
    lastRequestTime: 0,
  };

  // Rate limiting configuration
  private readonly REQUESTS_PER_MINUTE = 10; // Conservative limit
  private readonly REQUESTS_PER_HOUR = 100;
  private readonly MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests
  private readonly RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

  constructor() {
    const apiKey =
      process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      console.error(
        "GEMINI_API_KEY not found! AI service requires API key for production use.",
      );
      console.error(
        "Please set GEMINI_API_KEY or VITE_GEMINI_API_KEY environment variable.",
      );
      this.genAI = null;
      this.flashModel = null;
      this.proModel = null;
      return;
    }

    console.log("✅ Gemini API key found, initializing AI service");

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.flashModel = this.genAI.getGenerativeModel({
      model: process.env.VITE_GEMINI_FLASH_MODEL || "gemini-1.5-flash",
    });
    this.proModel = this.genAI.getGenerativeModel({
      model: process.env.VITE_GEMINI_MODEL || "gemini-1.5-pro",
    });

    // Cleanup cache every hour
    setInterval(() => this.cleanupCache(), 60 * 60 * 1000);
  }

  async generateQuestions(
    options: GenerateQuestionsOptions,
  ): Promise<AIResponse> {
    if (!this.genAI) {
      throw new Error("AI service not initialized - missing API key");
    }

    const contentHash = this.generateContentHash(options);

    // Check cache first
    const cached = this.getCachedQuestions(contentHash);
    if (cached) {
      console.log(
        "Returning cached questions for content hash:",
        contentHash.substring(0, 8),
      );
      return cached;
    }

    console.log(`Generating ${options.questionCount} questions for user`);

    try {
      // Apply rate limiting before making API call
      await this.enforceRateLimit();

      // Use Flash as primary model for better rate limits and speed
      const response = await this.generateWithFlash(options);

      // Cache the response
      this.setCachedQuestions(contentHash, response);

      return response;
    } catch (error) {
      console.error("Primary Flash generation failed:", error);

      // Only fallback to Pro for small requests if Flash fails
      if (options.questionCount <= 5 && options.content.length <= 2000) {
        console.log("Attempting fallback to Gemini Pro for small request");
        try {
          await this.enforceRateLimit();
          const fallbackResponse = await this.generateWithPro(options);
          this.setCachedQuestions(contentHash, fallbackResponse);
          return fallbackResponse;
        } catch (fallbackError) {
          console.error("Pro fallback also failed:", fallbackError);
        }
      }

      // If all else fails, throw the original error
      throw new Error(
        `Question generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();

    // Reset window if needed
    if (now - this.rateLimitState.windowStart >= this.RATE_LIMIT_WINDOW) {
      this.rateLimitState.requestCount = 0;
      this.rateLimitState.windowStart = now;
    }

    // Check if we're at the rate limit
    if (this.rateLimitState.requestCount >= this.REQUESTS_PER_MINUTE) {
      const waitTime =
        this.RATE_LIMIT_WINDOW - (now - this.rateLimitState.windowStart);
      console.log(
        `Rate limit reached. Waiting ${waitTime}ms before next request`,
      );
      await this.sleep(waitTime);

      // Reset after waiting
      this.rateLimitState.requestCount = 0;
      this.rateLimitState.windowStart = Date.now();
    }

    // Enforce minimum interval between requests
    const timeSinceLastRequest = now - this.rateLimitState.lastRequestTime;
    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      const waitTime = this.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      console.log(`Enforcing minimum interval. Waiting ${waitTime}ms`);
      await this.sleep(waitTime);
    }

    // Update rate limit state
    this.rateLimitState.requestCount++;
    this.rateLimitState.lastRequestTime = Date.now();
  }

  private async makeAPICall(
    model: any,
    prompt: string,
    maxRetries = 3,
  ): Promise<any> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
      } catch (error: any) {
        if (error.status === 429 && attempt < maxRetries) {
          // Extract retry delay from error or calculate exponential backoff
          let retryDelay = 1000 * Math.pow(2, attempt); // 1s, 2s, 4s

          // Check if Google provided a retry delay
          if (error.errorDetails) {
            const retryInfo = error.errorDetails.find(
              (detail: any) =>
                detail["@type"] === "type.googleapis.com/google.rpc.RetryInfo",
            );
            if (retryInfo?.retryDelay) {
              const delaySeconds = parseInt(
                retryInfo.retryDelay.replace("s", ""),
              );
              retryDelay = Math.min(delaySeconds * 1000, 60000); // Max 60s
            }
          }

          console.log(
            `Rate limit hit (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${retryDelay}ms`,
          );
          await this.sleep(retryDelay);
          continue;
        }

        // If it's not a rate limit error or we've exhausted retries, throw
        throw error;
      }
    }
  }

  private async generateWithFlash(
    options: GenerateQuestionsOptions,
  ): Promise<AIResponse> {
    const prompt = this.buildOptimizedPrompt(options);

    try {
      const text = await this.makeAPICall(this.flashModel, prompt);
      const parsedResponse = this.parseAIResponse(text);
      return this.processGeneratedQuestions(parsedResponse, options);
    } catch (error) {
      throw new Error(
        `Gemini Flash API error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  private async generateWithPro(
    options: GenerateQuestionsOptions,
  ): Promise<AIResponse> {
    const prompt = this.buildOptimizedPrompt(options);

    try {
      const text = await this.makeAPICall(this.proModel, prompt);
      const parsedResponse = this.parseAIResponse(text);
      return this.processGeneratedQuestions(parsedResponse, options);
    } catch (error) {
      throw new Error(
        `Gemini Pro API error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  private buildOptimizedPrompt(options: GenerateQuestionsOptions): string {
    const {
      content,
      difficulty,
      questionCount,
      questionTypes,
      subject,
      focus,
    } = options;

    // Optimize content length to stay within token limits
    const maxContentLength = 3000; // Conservative limit for Flash
    const optimizedContent =
      content.length > maxContentLength
        ? content.substring(0, maxContentLength) + "..."
        : content;

    const isTrueFalse = questionTypes.includes("true-false");
    const isMultipleChoice =
      questionTypes.includes("mcq") ||
      questionTypes.includes("multiple-choice");

    return `Generate exactly ${questionCount} high-quality ${difficulty} test questions from this content:

CONTENT:
${optimizedContent}

REQUIREMENTS:
- Question Types: ${questionTypes.join(", ")}
- Difficulty: ${difficulty}
- Each question must be answerable from the provided content
- Include source text that supports each answer
${subject ? `- Subject: ${subject}` : ""}
${focus ? `- Focus: ${focus}` : ""}

FORMAT RULES:
${isTrueFalse ? '- True-False: Use options ["True", "False"], correctAnswer must be exactly "True" or "False"' : ""}
${isMultipleChoice ? "- Multiple-Choice: Use exactly 4 options, correctAnswer must match one option exactly" : ""}

Return valid JSON:
{
  "questions": [
    {
      "id": "unique_id",
      "type": "${questionTypes[0]}",
      "question": "Clear question text",
      "options": ${isTrueFalse ? '["True", "False"]' : '["Option A", "Option B", "Option C", "Option D"]'},
      "correctAnswer": "${isTrueFalse ? "True" : "Option A"}",
      "explanation": "Brief explanation referencing content",
      "difficulty": "${difficulty}",
      "points": ${difficulty === "easy" ? 1 : difficulty === "medium" ? 2 : 3},
      "sourceText": "Exact text from content supporting answer"
    }
  ]
}

Generate ${questionCount} questions now:`;
  }

  private parseAIResponse(text: string): any {
    try {
      // Clean up common JSON formatting issues
      let jsonText = text.trim();

      // Remove markdown code block markers if present
      jsonText = jsonText.replace(/^```json\s*/, "").replace(/\s*```$/, "");

      // Try to extract JSON from the response
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in AI response");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error("Invalid response format: questions array not found");
      }

      return parsed;
    } catch (error) {
      console.error("Failed to parse AI response:", error);
      console.error("Response text:", text.substring(0, 500) + "...");
      throw new Error("Invalid JSON response from AI");
    }
  }

  private processGeneratedQuestions(
    parsedResponse: any,
    options: GenerateQuestionsOptions,
  ): AIResponse {
    const questions = parsedResponse.questions || [];

    // Process and validate each question
    const processedQuestions = questions.map((q: any, index: number) => {
      // Generate source text details
      let sourceText = q.sourceText || "Generated from your content";
      let sourceOffset = 0;
      let sourceLength = 0;

      if (q.sourceText && options.content) {
        const contentLower = options.content.toLowerCase();
        const sourceTextLower = q.sourceText.toLowerCase();
        const foundIndex = contentLower.indexOf(sourceTextLower);

        if (foundIndex !== -1) {
          sourceOffset = foundIndex;
          sourceLength = q.sourceText.length;
        } else {
          // Find a relevant sentence from the content
          const sentences = options.content
            .split(/[.!?]+/)
            .filter((s) => s.trim().length > 20);
          if (sentences.length > 0) {
            const relevantSentence =
              sentences[Math.min(index, sentences.length - 1)];
            sourceText = relevantSentence.trim();
            sourceOffset = options.content.indexOf(relevantSentence);
            sourceLength = relevantSentence.length;
          }
        }
      }

      // Validate and clean up the question data
      const processedQuestion: GeneratedQuestion = {
        id: q.id || nanoid(),
        type:
          q.type ||
          (questionTypes.includes("true-false")
            ? "true-false"
            : "multiple-choice"),
        question: q.question || `Generated question ${index + 1}`,
        options:
          q.options ||
          (q.type === "true-false"
            ? ["True", "False"]
            : ["Option A", "Option B", "Option C", "Option D"]),
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || "Explanation based on source content",
        difficulty: q.difficulty || options.difficulty,
        points:
          q.points ||
          (options.difficulty === "easy"
            ? 1
            : options.difficulty === "medium"
              ? 2
              : 3),
        sourceText,
        sourceOffset,
        sourceLength,
        confidence: 0.8, // Fixed confidence since we removed validation
      };

      return processedQuestion;
    });

    const estimatedTime =
      processedQuestions.length *
      (options.difficulty === "easy"
        ? 1
        : options.difficulty === "medium"
          ? 2
          : 3);

    return {
      questions: processedQuestions,
      metadata: {
        totalQuestions: processedQuestions.length,
        estimatedTime,
        difficulty: options.difficulty,
        subject: options.subject,
        contentHash: this.generateContentHash(options),
      },
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
      expiresAt,
    });
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
    if (!this.genAI) {
      throw new Error("AI service not initialized");
    }

    // Apply rate limiting
    await this.enforceRateLimit();

    const wrongQuestions = testResult.questions.filter(
      (q) => testResult.userAnswers[q.id] !== testResult.correctAnswers[q.id],
    );

    const prompt = `Analyze this test performance and provide insights:

PERFORMANCE:
- Score: ${testResult.score}% (${testResult.totalQuestions - wrongQuestions.length}/${testResult.totalQuestions})
- Wrong: ${wrongQuestions.length}

INCORRECT QUESTIONS:
${wrongQuestions
  .slice(0, 3)
  .map(
    (q, i) => `
${i + 1}. ${q.question}
   Correct: ${testResult.correctAnswers[q.id]}
   User: ${testResult.userAnswers[q.id]}
`,
  )
  .join("")}

Return JSON:
{
  "overallPerformance": "Brief assessment",
  "strengths": ["List strengths"],
  "weaknesses": ["List weaknesses"],
  "studyRecommendations": ["Study strategies"],
  "focusAreas": ["Topics to review"]
}`;

    try {
      const text = await this.makeAPICall(this.flashModel, prompt);
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback insights if parsing fails
      return this.generateBasicInsights(testResult);
    } catch (error) {
      console.error("Test insights generation failed:", error);
      return this.generateBasicInsights(testResult);
    }
  }

  private generateBasicInsights(testResult: any) {
    const score = testResult.score;
    const wrongCount =
      testResult.questions.length -
      Math.floor((score / 100) * testResult.totalQuestions);

    return {
      overallPerformance:
        score >= 80
          ? "Strong performance showing good understanding"
          : score >= 60
            ? "Satisfactory performance with room for improvement"
            : "Needs improvement - consider reviewing the material",
      strengths:
        score >= 70
          ? ["Good comprehension of key concepts", "Effective study approach"]
          : ["Completed all questions", "Shows engagement"],
      weaknesses:
        wrongCount > 0
          ? [
              `Missed ${wrongCount} questions`,
              "Some concepts need reinforcement",
            ]
          : [],
      studyRecommendations: [
        "Review explanations for missed questions",
        "Focus on understanding key concepts",
        "Practice with similar material",
      ],
      focusAreas: [
        "Areas where questions were missed",
        "Key concepts from source material",
      ],
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
      console.log(`Cleaned up ${cleanedCount} expired cache entries`);
    }
  }

  // Public method to check current rate limit status
  public getRateLimitStatus(): {
    requestsRemaining: number;
    windowResetIn: number;
  } {
    const now = Date.now();
    const windowAge = now - this.rateLimitState.windowStart;

    return {
      requestsRemaining: Math.max(
        0,
        this.REQUESTS_PER_MINUTE - this.rateLimitState.requestCount,
      ),
      windowResetIn: Math.max(0, this.RATE_LIMIT_WINDOW - windowAge),
    };
  }
}

export const aiService = new AIService();
export type { GenerateQuestionsOptions, GeneratedQuestion, AIResponse };
