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
  costPerToken?: number;
  maxTokens?: number;
}

class MultiProviderAIService {
  private providers: Map<string, AIProvider> = new Map();
  private geminiAI: GoogleGenerativeAI | null = null;
  private cache = new Map<string, { data: AIResponse; timestamp: number; expiresAt: number }>();

  constructor() {
    this.initializeProviders();
    setInterval(() => this.cleanupCache(), 60 * 60 * 1000);
    setInterval(() => this.resetProviderLimits(), 60 * 1000);
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
        maxRequests: 15,
        resetInterval: 60 * 1000,
        priority: 1,
        costPerToken: 0.000125,
        maxTokens: 1000000
      });
      this.providers.set('gemini-pro', {
        name: 'Gemini Pro',
        available: true,
        requestCount: 0,
        lastReset: Date.now(),
        maxRequests: 5,
        resetInterval: 60 * 1000,
        priority: 4,
        costPerToken: 0.00025,
        maxTokens: 30720
      });
      console.log("✅ Gemini providers initialized");
    }

    // Initialize OpenRouter (supports 200+ models)
    const openrouterKey = process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY;
    if (openrouterKey && openrouterKey !== 'your_openrouter_api_key') {
      // GPT models via OpenRouter
      this.providers.set('gpt-4o-mini', {
        name: 'GPT-4o Mini (OpenRouter)',
        available: true,
        requestCount: 0,
        lastReset: Date.now(),
        maxRequests: 10,
        resetInterval: 60 * 1000,
        priority: 2,
        costPerToken: 0.00015,
        maxTokens: 128000
      });

      this.providers.set('gpt-3.5-turbo', {
        name: 'GPT-3.5 Turbo (OpenRouter)',
        available: true,
        requestCount: 0,
        lastReset: Date.now(),
        maxRequests: 15,
        resetInterval: 60 * 1000,
        priority: 3,
        costPerToken: 0.0005,
        maxTokens: 16385
      });

      // Claude models via OpenRouter
      this.providers.set('claude-3-haiku', {
        name: 'Claude 3 Haiku (OpenRouter)',
        available: true,
        requestCount: 0,
        lastReset: Date.now(),
        maxRequests: 8,
        resetInterval: 60 * 1000,
        priority: 5,
        costPerToken: 0.00025,
        maxTokens: 200000
      });

      // Add Mistral as backup
      this.providers.set('mistral-7b', {
        name: 'Mistral 7B (OpenRouter)',
        available: true,
        requestCount: 0,
        lastReset: Date.now(),
        maxRequests: 15,
        resetInterval: 60 * 1000,
        priority: 7,
        costPerToken: 0.00002,
        maxTokens: 32768
      });

      console.log("✅ OpenRouter providers initialized");
    } else {
      console.log("ℹ️ OpenRouter API key not configured - OpenRouter providers disabled");
    }

    // Initialize Hugging Face Inference API (free tier available)
    const hfToken = process.env.HUGGINGFACE_API_TOKEN || process.env.VITE_HUGGINGFACE_API_TOKEN;
    if (hfToken && hfToken !== 'hf_your_huggingface_api_token_here') {
      this.providers.set('microsoft-dialoGPT', {
        name: 'DialoGPT (Hugging Face)',
        available: true,
        requestCount: 0,
        lastReset: Date.now(),
        maxRequests: 30,
        resetInterval: 60 * 1000,
        priority: 8,
        costPerToken: 0, // Free
        maxTokens: 1000
      });

      this.providers.set('distilgpt2', {
        name: 'DistilGPT-2 (Hugging Face)',
        available: true,
        requestCount: 0,
        lastReset: Date.now(),
        maxRequests: 30,
        resetInterval: 60 * 1000,
        priority: 9,
        costPerToken: 0, // Free
        maxTokens: 1000
      });

      console.log("✅ Hugging Face providers initialized");
    } else {
      console.log("ℹ️ Hugging Face API token not configured - Hugging Face providers disabled");
    }

    // Always add a mock provider as fallback
    this.providers.set('mock-ai', {
      name: 'Mock AI (Fallback)',
      available: true,
      requestCount: 0,
      lastReset: Date.now(),
      maxRequests: 100,
      resetInterval: 60 * 1000,
      priority: 10, // Lowest priority - only used when all others fail
      costPerToken: 0,
      maxTokens: 10000
    });

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

  private getAvailableProvider(options?: GenerateQuestionsOptions): string | null {
    const contentLength = options?.content?.length || 0;
    
    const availableProviders = Array.from(this.providers.entries())
      .filter(([_, provider]) => {
        // Check availability and rate limits
        if (!provider.available || provider.requestCount >= provider.maxRequests) {
          return false;
        }
        
        // Check if provider can handle content size
        if (provider.maxTokens && contentLength > provider.maxTokens * 0.6) { // 60% buffer
          return false;
        }
        
        return true;
      })
      .sort(([_, a], [__, b]) => {
        // Smart provider selection based on request size
        if (options && options.questionCount >= 15) {
          // Large requests: prioritize cost-effectiveness
          return (a.costPerToken || 0) - (b.costPerToken || 0);
        } else if (options && options.questionCount <= 5) {
          // Small requests: prioritize speed (lower priority number = higher priority)
          return a.priority - b.priority;
        } else {
          // Medium requests: balance priority and cost
          return a.priority - b.priority;
        }
      });

    return availableProviders.length > 0 ? availableProviders[0][0] : null;
  }

  private async makeGeminiRequest(model: string, prompt: string): Promise<string> {
    if (!this.geminiAI) throw new Error("Gemini not initialized");

    // Try current known Gemini model names
    const modelMapping: Record<string, string> = {
      'gemini-flash': 'gemini-1.5-flash',
      'gemini-pro': 'gemini-1.5-pro'
    };

    const aiModel = this.geminiAI.getGenerativeModel({
      model: modelMapping[model] || model
    });

    const result = await aiModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  private async makeOpenRouterRequest(model: string, prompt: string): Promise<string> {
    const openrouterKey = process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY;

    // Check if OpenRouter key is configured
    if (!openrouterKey || openrouterKey === 'your_openrouter_api_key') {
      throw new Error('OpenRouter API key not configured');
    }

    const siteUrl = process.env.SITE_URL || process.env.VITE_SITE_URL || "http://localhost:3000";
    const appName = process.env.APP_NAME || process.env.VITE_APP_NAME || "AI Test Generator";

    // Map internal model names to OpenRouter model IDs
    const modelMapping: Record<string, string> = {
      'gpt-4o-mini': 'openai/gpt-4o-mini',
      'gpt-3.5-turbo': 'openai/gpt-3.5-turbo',
      'claude-3-haiku': 'anthropic/claude-3-haiku',
      'llama-3.1-8b': 'meta-llama/llama-3.1-8b-instruct',
      'mistral-7b': 'mistralai/mistral-7b-instruct'
    };

    const openrouterModel = modelMapping[model] || model;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openrouterKey}`,
        'HTTP-Referer': siteUrl,
        'X-Title': appName
      },
      body: JSON.stringify({
        model: openrouterModel,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenRouter API error (${response.status}):`, errorText);

      // Handle specific error cases
      if (response.status === 401) {
        throw new Error('OpenRouter API key is invalid or expired. Please update your API key.');
      } else if (response.status === 429) {
        throw new Error('OpenRouter rate limit exceeded. Please try again later.');
      } else if (response.status >= 500) {
        throw new Error('OpenRouter service is temporarily unavailable. Please try again later.');
      } else {
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from OpenRouter');
    }

    return data.choices[0].message.content;
  }

  private async makeHuggingFaceRequest(model: string, prompt: string): Promise<string> {
    const hfToken = process.env.HUGGINGFACE_API_TOKEN || process.env.VITE_HUGGINGFACE_API_TOKEN;

    if (!hfToken) {
      throw new Error('Hugging Face API token not configured');
    }

    // Map internal model names to Hugging Face model IDs
    const modelMapping: Record<string, string> = {
      'microsoft-dialoGPT': 'microsoft/DialoGPT-medium',
      'distilgpt2': 'distilgpt2'
    };

    const hfModel = modelMapping[model] || model;

    const response = await fetch(`https://router.huggingface.co/hf-inference/models/${hfModel}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hfToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.3,
          do_sample: true,
          return_full_text: false
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Hugging Face API error (${response.status}):`, errorText);

      if (response.status === 401) {
        throw new Error('Hugging Face API token is invalid. Please update your API token.');
      } else if (response.status === 429) {
        throw new Error('Hugging Face rate limit exceeded. Please try again later.');
      } else if (response.status === 503) {
        throw new Error('Hugging Face model is currently loading. Please try again in a few seconds.');
      } else if (response.status >= 500) {
        throw new Error('Hugging Face service is temporarily unavailable. Please try again later.');
      } else {
        throw new Error(`Hugging Face API error: ${response.status} ${response.statusText}`);
      }
    }

    const data = await response.json();

    if (Array.isArray(data) && data.length > 0 && data[0].generated_text) {
      return data[0].generated_text;
    } else if (data.generated_text) {
      return data.generated_text;
    } else {
      throw new Error('Invalid response format from Hugging Face');
    }
  }

  private async makeMockRequest(model: string, prompt: string): Promise<string> {
    console.log(`🤖 Using Mock AI fallback for model: ${model}`);

    // Extract question requirements from the prompt
    const questionCountMatch = prompt.match(/Generate exactly (\d+) high-quality/);
    const questionCount = questionCountMatch ? parseInt(questionCountMatch[1]) : 5;

    const difficultyMatch = prompt.match(/high-quality (\w+) test questions/);
    const difficulty = difficultyMatch ? difficultyMatch[1] : "medium";

    // Generate mock questions based on content analysis
    const questions = [];
    const mockQuestionTemplates = [
      "What is the main topic discussed in the content?",
      "Which of the following is mentioned as an important concept?",
      "According to the content, what would be the result of...?",
      "The content suggests that...",
      "Which statement best describes the information provided?"
    ];

    for (let i = 0; i < questionCount; i++) {
      const questionText = mockQuestionTemplates[i % mockQuestionTemplates.length];
      const options = ["Option A", "Option B", "Option C", "Option D"];

      questions.push({
        id: `q${i + 1}`,
        type: "multiple-choice",
        question: `${questionText} (Question ${i + 1})`,
        options: options,
        correctAnswer: options[0],
        explanation: "This is a mock response generated as a fallback when AI services are unavailable.",
        difficulty: difficulty,
        points: difficulty === "easy" ? 1 : difficulty === "medium" ? 2 : 3,
        sourceText: "Generated from your content (mock response)"
      });
    }

    return JSON.stringify({
      questions: questions
    }, null, 2);
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
      } else if (providerId.startsWith('microsoft') || providerId === 'distilgpt2') {
        // Hugging Face models
        response = await this.makeHuggingFaceRequest(providerId, prompt);
      } else if (providerId === 'mock-ai') {
        // Mock AI fallback
        response = await this.makeMockRequest(providerId, prompt);
      } else {
        // All other models go through OpenRouter
        response = await this.makeOpenRouterRequest(providerId, prompt);
      }

      console.log(`✅ Request successful with ${provider.name}`);
      return response;

    } catch (error) {
      console.error(`❌ Request failed with ${provider.name}:`, error);

      // Handle different types of errors
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('invalid') || error.message.includes('User not found')) {
          // Authentication/API key errors - disable provider permanently for this session
          provider.available = false;
          console.log(`🔐 Provider ${provider.name} authentication failed - disabled for session`);
        } else if (error.message.includes('429') || error.message.includes('rate limit')) {
          provider.available = false;
          console.log(`⏳ Provider ${provider.name} rate limited, cooldown for 60 seconds`);
          setTimeout(() => {
            provider.available = true;
            provider.requestCount = 0;
            console.log(`✅ Provider ${provider.name} back online`);
          }, 60000);
        } else if (error.message.includes('quota') || error.message.includes('insufficient')) {
          provider.available = false;
          console.log(`💰 Provider ${provider.name} quota exceeded, disabling for 1 hour`);
          setTimeout(() => {
            provider.available = true;
            provider.requestCount = 0;
          }, 3600000); // 1 hour
        } else if (error.message.includes('temporarily unavailable') || error.message.includes('5')) {
          // Temporary server errors - retry after delay
          provider.available = false;
          console.log(`🌐 Provider ${provider.name} temporarily unavailable, cooldown for 30 seconds`);
          setTimeout(() => {
            provider.available = true;
            provider.requestCount = 0;
            console.log(`✅ Provider ${provider.name} back online`);
          }, 30000);
        }
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
    this.logProviderStatus();

    const prompt = this.buildPrompt(options);
    let lastError: Error | null = null;

    // Try up to 3 different providers, but always try mock AI as final fallback
    const maxAttempts = Math.min(3, this.providers.size);
    let mockAITried = false;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const providerId = this.getAvailableProvider(options);

      if (!providerId) {
        // If no provider available and we haven't tried mock AI yet, force try mock AI
        if (!mockAITried && this.providers.get('mock-ai')?.available) {
          console.log("🔄 No suitable providers available, trying Mock AI fallback...");
          const mockProvider = this.providers.get('mock-ai');
          if (mockProvider) {
            mockProvider.requestCount++;
            try {
              console.log(`🔄 Attempt ${attempt + 1}: Using ${mockProvider.name} (forced fallback)`);

              const response = await this.makeMockRequest('mock-ai', prompt);
              const parsedResponse = this.parseAIResponse(response);
              const processedResponse = this.processGeneratedQuestions(parsedResponse, options);

              // Cache the successful response
              this.setCachedQuestions(contentHash, processedResponse);

              console.log(`✅ Successfully generated ${processedResponse.questions.length} questions with ${mockProvider.name}`);
              return processedResponse;
            } catch (error) {
              lastError = error as Error;
              console.log(`❌ Mock AI fallback failed:`, error instanceof Error ? error.message : 'Unknown error');
              mockProvider.available = false;
            }
            mockAITried = true;
          }
        }

        console.log("⏳ No suitable providers available, waiting 10 seconds...");
        await this.sleep(10000);
        continue;
      }

      try {
        console.log(`🔄 Attempt ${attempt + 1}: Using ${this.providers.get(providerId)?.name}`);

        const response = await this.makeProviderRequest(providerId, prompt);
        const parsedResponse = this.parseAIResponse(response);
        const processedResponse = this.processGeneratedQuestions(parsedResponse, options);

        // Cache the successful response
        this.setCachedQuestions(contentHash, processedResponse);

        console.log(`✅ Successfully generated ${processedResponse.questions.length} questions with ${this.providers.get(providerId)?.name}`);
        return processedResponse;

      } catch (error) {
        lastError = error as Error;
        console.log(`❌ Provider ${providerId} failed:`, error instanceof Error ? error.message : 'Unknown error');

        // Small delay before trying next provider
        if (attempt < maxAttempts - 1) {
          await this.sleep(Math.min(2000 * (attempt + 1), 8000)); // Progressive delay
        }
      }
    }

    // Final attempt: try mock AI if not already tried
    if (!mockAITried && this.providers.get('mock-ai')?.available) {
      console.log("🔄 Final attempt: Using Mock AI fallback...");
      const mockProvider = this.providers.get('mock-ai');
      if (mockProvider) {
        mockProvider.requestCount++;
        try {
          const response = await this.makeMockRequest('mock-ai', prompt);
          const parsedResponse = this.parseAIResponse(response);
          const processedResponse = this.processGeneratedQuestions(parsedResponse, options);

          // Cache the successful response
          this.setCachedQuestions(contentHash, processedResponse);

          console.log(`✅ Successfully generated ${processedResponse.questions.length} questions with ${mockProvider.name}`);
          return processedResponse;
        } catch (error) {
          lastError = error as Error;
          console.log(`❌ Mock AI fallback failed:`, error instanceof Error ? error.message : 'Unknown error');
        }
      }
    }

    // If all attempts failed
    console.error("❌ All providers failed to generate questions");
    throw new Error(`Question generation failed: ${lastError?.message || "All providers exhausted"}`);
  }

  private buildPrompt(options: GenerateQuestionsOptions): string {
    const { content, difficulty, questionCount, questionTypes, focus } = options;

    const maxContentLength = 3000; // Increased for better context
    const optimizedContent = content.length > maxContentLength
      ? content.substring(0, maxContentLength) + "..."
      : content;

    return `Generate exactly ${questionCount} high-quality ${difficulty} test questions from this content:

CONTENT:
${optimizedContent}

REQUIREMENTS:
- Question Types: ${questionTypes.join(", ")}
- Difficulty: ${difficulty}
- Each question must be directly answerable from the provided content
- Include exact source text that supports each answer
${focus ? `- Focus areas: ${focus}` : ""}

RESPONSE FORMAT - Return valid JSON only:
{
  "questions": [
    {
      "id": "q1",
      "type": "multiple-choice",
      "question": "Clear, specific question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Brief explanation referencing the source",
      "difficulty": "${difficulty}",
      "points": ${difficulty === "easy" ? 1 : difficulty === "medium" ? 2 : 3},
      "sourceText": "Exact text from content that supports this question and answer"
    }
  ]
}

Generate ${questionCount} questions now:`;
  }

  private parseAIResponse(text: string): any {
    try {
      // Check if response looks like gibberish or is too short
      if (!text || text.trim().length < 10) {
        throw new Error("Response is too short or empty");
      }

      // Check for common gibberish patterns
      const gibberishPatterns = [
        /^[^\w\s]*$/, // Only symbols/no alphanumeric
        /(\w{20,})/, // Very long words (likely gibberish)
        /^.{0,50}$/, // Too short for valid JSON response
        /(.)\1{10,}/, // Repeated characters
      ];

      if (gibberishPatterns.some(pattern => pattern.test(text))) {
        throw new Error("Response appears to be gibberish or malformed");
      }

      let jsonText = text.trim();

      // Remove markdown code blocks
      jsonText = jsonText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      jsonText = jsonText.replace(/^```\s*/, "").replace(/\s*```$/, "");

      // Find JSON object - try multiple patterns
      let jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        // Try to find JSON in a larger context
        jsonMatch = jsonText.match(/\{[\s\S]{50,}\}/);
      }

      if (!jsonMatch) {
        throw new Error("No valid JSON object found in response");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate structure
      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error("Invalid response format - questions array missing");
      }

      if (parsed.questions.length === 0) {
        throw new Error("No questions generated");
      }

      // Validate each question has required fields
      for (const question of parsed.questions) {
        if (!question.question || typeof question.question !== 'string') {
          throw new Error("Invalid question format - missing or invalid question text");
        }
        if (!question.correctAnswer || typeof question.correctAnswer !== 'string') {
          throw new Error("Invalid question format - missing or invalid correct answer");
        }
      }

      return parsed;
    } catch (error) {
      console.error("Failed to parse AI response:", error);
      console.error("Response preview:", text.substring(0, 300) + "...");
      throw new Error(`Invalid JSON response from AI: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private processGeneratedQuestions(parsedResponse: any, options: GenerateQuestionsOptions): AIResponse {
    const questions = parsedResponse.questions || [];

    const processedQuestions = questions.map((q: any, index: number) => {
      // Enhanced source text matching
      let sourceText = q.sourceText || "Generated from your content";
      let sourceOffset = 0;
      let sourceLength = 0;

      if (q.sourceText && options.content && q.sourceText !== "Generated from your content") {
        const { text, offset, length } = this.findBestSourceMatch(q.sourceText, options.content);
        sourceText = text;
        sourceOffset = offset;
        sourceLength = length;
      }

      return {
        id: q.id || `q${index + 1}`,
        type: q.type || "multiple-choice",
        question: q.question || `Generated question ${index + 1}`,
        options: q.options || ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: q.correctAnswer || q.options?.[0] || "Option A",
        explanation: q.explanation || "Explanation based on source content",
        difficulty: q.difficulty || options.difficulty,
        points: q.points || (options.difficulty === "easy" ? 1 : options.difficulty === "medium" ? 2 : 3),
        sourceText,
        sourceOffset,
        sourceLength,
        confidence: 0.85
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

  private findBestSourceMatch(sourceText: string, content: string): { text: string; offset: number; length: number } {
    const contentLower = content.toLowerCase();
    const sourceTextLower = sourceText.toLowerCase();
    
    // Try exact match first
    let foundIndex = contentLower.indexOf(sourceTextLower);
    if (foundIndex !== -1) {
      return {
        text: content.substring(foundIndex, foundIndex + sourceText.length),
        offset: foundIndex,
        length: sourceText.length
      };
    }

    // Try partial matching with key phrases
    const phrases = sourceText.split(/[.!?;,]/).filter(p => p.trim().length > 10);
    for (const phrase of phrases) {
      const phraseIndex = contentLower.indexOf(phrase.toLowerCase().trim());
      if (phraseIndex !== -1) {
        // Expand to find sentence boundaries
        let start = phraseIndex;
        let end = phraseIndex + phrase.length;
        
        // Expand backwards to sentence start
        while (start > 0 && !/[.!?\n]/.test(content[start - 1])) {
          start--;
        }
        
        // Expand forwards to sentence end
        while (end < content.length && !/[.!?\n]/.test(content[end])) {
          end++;
        }
        
        if (end < content.length && /[.!?]/.test(content[end])) {
          end++;
        }
        
        return {
          text: content.substring(start, end).trim(),
          offset: start,
          length: end - start
        };
      }
    }

    // Fallback: return original source text
    return { text: sourceText, offset: 0, length: 0 };
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

    const prompt = `Analyze this test performance and provide actionable insights:

PERFORMANCE SUMMARY:
- Score: ${testResult.score}% (${testResult.totalQuestions - wrongQuestions.length}/${testResult.totalQuestions} correct)
- Test: ${testResult.testTitle}

INCORRECT QUESTIONS (showing up to 3):
${wrongQuestions.slice(0, 3).map((q, i) => `
${i + 1}. Question: ${q.question}
   Correct Answer: ${testResult.correctAnswers[q.id]}
   User Answer: ${testResult.userAnswers[q.id] || "Not answered"}
   Topic: ${q.sourceText.substring(0, 100)}...
`).join("")}

Provide insights in JSON format:
{
  "overallPerformance": "Clear assessment of performance level",
  "strengths": ["2-3 specific strengths observed"],
  "weaknesses": ["2-3 specific areas needing improvement"],
  "studyRecommendations": ["3-4 actionable study strategies"],
  "focusAreas": ["2-3 specific topics to review"]
}`;

    try {
      const providerId = this.getAvailableProvider();
      if (!providerId) {
        return this.generateBasicInsights(testResult);
      }

      const response = await this.makeProviderRequest(providerId, prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const insights = JSON.parse(jsonMatch[0]);
        console.log(`✅ Generated insights using ${this.providers.get(providerId)?.name}`);
        return insights;
      }

      return this.generateBasicInsights(testResult);
    } catch (error) {
      console.error("Insights generation failed:", error);
      return this.generateBasicInsights(testResult);
    }
  }

  private generateBasicInsights(testResult: any) {
    const score = testResult.score;
    const totalQuestions = testResult.totalQuestions;
    const wrongCount = totalQuestions - Math.floor((score / 100) * totalQuestions);

    return {
      overallPerformance: score >= 90 ? "Excellent performance demonstrating strong mastery" :
                         score >= 80 ? "Good performance with solid understanding" :
                         score >= 70 ? "Satisfactory performance with room for improvement" :
                         score >= 60 ? "Below average performance requiring focused study" :
                         "Poor performance indicating need for comprehensive review",
      strengths: score >= 70 ? [
        "Demonstrated good comprehension of key concepts",
        `Correctly answered ${totalQuestions - wrongCount} questions`,
        "Showed engagement with the material"
      ] : [
        "Completed the full assessment",
        "Identified areas needing improvement"
      ],
      weaknesses: wrongCount > 0 ? [
        `Missed ${wrongCount} out of ${totalQuestions} questions`,
        "Some key concepts need reinforcement",
        score < 60 ? "Fundamental understanding needs strengthening" : "Minor knowledge gaps present"
      ] : ["No significant weaknesses identified"],
      studyRecommendations: [
        "Review explanations for all incorrect answers",
        "Create summary notes of missed concepts",
        "Practice with similar question types",
        "Focus on understanding rather than memorization",
        wrongCount > totalQuestions / 2 ? "Consider re-reading the source material" : "Target specific weak areas"
      ].slice(0, 4),
      focusAreas: [
        "Topics from incorrectly answered questions",
        "Key concepts from the source material",
        score < 70 ? "Fundamental principles and definitions" : "Advanced applications and details"
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
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
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

  private logProviderStatus(): void {
    console.log("📊 Provider Status:");
    for (const [key, provider] of this.providers) {
      console.log(`  ${provider.name}: ${provider.available ? '✅' : '❌'} (${provider.requestCount}/${provider.maxRequests})`);
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
        priority: provider.priority,
        costPerToken: provider.costPerToken,
        maxTokens: provider.maxTokens
      };
    }

    return status;
  }

  public async healthCheck(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    for (const [key, provider] of this.providers) {
      try {
        // Simple test request to check if provider is working
        await this.makeProviderRequest(key, "Test: Generate one simple question about mathematics. Respond with valid JSON containing a questions array with one question.");
        results[key] = true;
        console.log(`✅ Health check passed for ${provider.name}`);
      } catch (error) {
        results[key] = false;
        console.log(`❌ Health check failed for ${provider.name}:`, error instanceof Error ? error.message : 'Unknown error');
      }
      
      // Small delay between health checks
      await this.sleep(1000);
    }
    
    return results;
  }
}

export const aiService = new MultiProviderAIService();
export type { GenerateQuestionsOptions, GeneratedQuestion, AIResponse };
