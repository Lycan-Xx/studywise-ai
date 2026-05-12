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
  cooldownUntil?: number;
}

class MultiProviderAIService {
  private providers: Map<string, AIProvider> = new Map();
  private geminiAI: GoogleGenerativeAI | null = null;
  private cache = new Map<string, { data: AIResponse; timestamp: number; expiresAt: number }>();

  constructor() {
    this.initializeProviders();
    setInterval(() => this.cleanupCache(), 60 * 60 * 1000);
    setInterval(() => this.resetProviderLimits(), 60 * 1000);
    // List available models on startup
    this.listAvailableGeminiModels();
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
        priority: 2,
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

    // Initialize OpenAI
    const openaiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
    if (openaiKey && openaiKey !== 'your_openai_api_key') {
      this.providers.set('gpt-4o-mini', {
        name: 'GPT-4o Mini',
        available: true,
        requestCount: 0,
        lastReset: Date.now(),
        maxRequests: 20,
        resetInterval: 60 * 1000,
        priority: 2,
        costPerToken: 0.00015,
        maxTokens: 128000
      });
      console.log("✅ OpenAI providers initialized");
    }

    // Initialize Anthropic
    const anthropicKey = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;
    if (anthropicKey && anthropicKey !== 'your_anthropic_api_key') {
      this.providers.set('claude-3-haiku', {
        name: 'Claude 3 Haiku',
        available: true,
        requestCount: 0,
        lastReset: Date.now(),
        maxRequests: 10,
        resetInterval: 60 * 1000,
        priority: 3,
        costPerToken: 0.00025,
        maxTokens: 200000
      });
      console.log("✅ Anthropic providers initialized");
    }

    // Initialize DeepSeek
    const deepseekKey = process.env.DEEPSEEK_API_KEY || process.env.VITE_DEEPSEEK_API_KEY;
    if (deepseekKey && deepseekKey !== 'your_deepseek_api_key') {
      this.providers.set('deepseek-chat', {
        name: 'DeepSeek Chat',
        available: true,
        requestCount: 0,
        lastReset: Date.now(),
        maxRequests: 30,
        resetInterval: 60 * 1000,
        priority: 1,
        costPerToken: 0.00014,
        maxTokens: 128000
      });
      console.log("✅ DeepSeek providers initialized");
    }

    // Initialize Kimi (Moonshot)
    const kimiKey = process.env.MOONSHOT_API_KEY || process.env.VITE_MOONSHOT_API_KEY || process.env.KIMI_API_KEY;
    if (kimiKey && kimiKey !== 'your_kimi_api_key') {
      this.providers.set('moonshot-v1-8k', {
        name: 'Kimi (Moonshot)',
        available: true,
        requestCount: 0,
        lastReset: Date.now(),
        maxRequests: 10,
        resetInterval: 60 * 1000,
        priority: 5,
        costPerToken: 0.0006,
        maxTokens: 8192
      });
      console.log("✅ Kimi providers initialized");
    }

    // Initialize OpenRouter (supports 200+ models)
    const openrouterKey = process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY;
    if (openrouterKey && openrouterKey !== 'your_openrouter_api_key') {
      // Add a few balanced OpenRouter models as versatile fallbacks
      this.providers.set('or-llama-3-8b', {
        name: 'Llama 3 8B (OpenRouter)',
        available: true,
        requestCount: 0,
        lastReset: Date.now(),
        maxRequests: 15,
        resetInterval: 60 * 1000,
        priority: 6,
        costPerToken: 0.00002,
        maxTokens: 32768
      });

      this.providers.set('or-mistral-7b', {
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
      this.providers.set('hf-distilgpt2', {
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
    
    // Perform initial health check in background
    setTimeout(() => this.healthCheck(), 1000);
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
        const now = Date.now();
        if (!provider.available || provider.requestCount >= provider.maxRequests) {
          // Check if cooldown has expired
          if (provider.cooldownUntil && now > provider.cooldownUntil) {
            provider.available = true;
            provider.cooldownUntil = undefined;
            provider.requestCount = 0;
            console.log(`✅ Provider ${provider.name} cooldown expired - back online`);
          } else {
            return false;
          }
        }
        
        // Check if provider can handle content size
        if (provider.maxTokens && contentLength > provider.maxTokens * 0.6) { // 60% buffer
          return false;
        }
        
        return true;
      })
      .sort(([_, a], [__, b]) => {
        // Respect the priority property (lower number = higher priority)
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        
        // Otherwise use cost as tie-breaker
        return (a.costPerToken || 0) - (b.costPerToken || 0);
      });

    if (availableProviders.length === 0) {
      console.warn('⚠️ No available providers found. Checking provider status...');
      this.logProviderStatus();
      return null;
    }

    return availableProviders[0][0];
  }

  private async makeGeminiRequest(model: string, prompt: string): Promise<string> {
    const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!geminiKey) throw new Error("Gemini API key not configured");

    // Use the current Gemini model names (Google API v1)
    const modelName = model === 'gemini-flash' ? 'gemini-2.0-flash' : 'gemini-2.5-pro';

    // Use AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${geminiKey}`, {
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
            temperature: 0.3,
          }
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Gemini API error (${response.status}):`, errorText);
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
        throw new Error('Invalid response format from Gemini API');
      }

      clearTimeout(timeoutId);
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout: Connection to Gemini API timed out after 30 seconds');
      }
      throw error;
    }
  }

  private async makeOpenAIRequest(model: string, prompt: string): Promise<string> {
    const openaiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
    if (!openaiKey) throw new Error("OpenAI API key not configured");

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private async makeAnthropicRequest(model: string, prompt: string): Promise<string> {
    const anthropicKey = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;
    if (!anthropicKey) throw new Error("Anthropic API key not configured");

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  private async makeDeepSeekRequest(model: string, prompt: string): Promise<string> {
    const deepseekKey = process.env.DEEPSEEK_API_KEY || process.env.VITE_DEEPSEEK_API_KEY;
    if (!deepseekKey) throw new Error("DeepSeek API key not configured");

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepseekKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private async makeKimiRequest(model: string, prompt: string): Promise<string> {
    const kimiKey = process.env.MOONSHOT_API_KEY || process.env.VITE_MOONSHOT_API_KEY || process.env.KIMI_API_KEY;
    if (!kimiKey) throw new Error("Kimi API key not configured");

    const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${kimiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`Kimi API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
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
      'or-llama-3-8b': 'meta-llama/llama-3-8b-instruct',
      'or-mistral-7b': 'mistralai/mistral-7b-instruct'
    };

    const openrouterModel = modelMapping[model] || model;

    // Use AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // Increased timeout to 60s for OR

    try {
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
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`OpenRouter API error (${response.status}):`, errorText);
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      clearTimeout(timeoutId);
      return data.choices[0].message.content;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async makeHuggingFaceRequest(model: string, prompt: string): Promise<string> {
    const hfToken = process.env.HUGGINGFACE_API_TOKEN || process.env.VITE_HUGGINGFACE_API_TOKEN;

    if (!hfToken) {
      throw new Error('Hugging Face API token not configured');
    }

    // Map internal model names to Hugging Face model IDs
    const modelMapping: Record<string, string> = {
      'hf-distilgpt2': 'distilgpt2'
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
      throw new Error(`Hugging Face API error: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data[0].generated_text : data.generated_text;
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
      } else if (providerId.startsWith('gpt')) {
        response = await this.makeOpenAIRequest(providerId, prompt);
      } else if (providerId.startsWith('claude')) {
        response = await this.makeAnthropicRequest(providerId, prompt);
      } else if (providerId.startsWith('deepseek')) {
        response = await this.makeDeepSeekRequest(providerId, prompt);
      } else if (providerId.startsWith('moonshot')) {
        response = await this.makeKimiRequest(providerId, prompt);
      } else if (providerId.startsWith('or-')) {
        response = await this.makeOpenRouterRequest(providerId, prompt);
      } else if (providerId.startsWith('hf-')) {
        response = await this.makeHuggingFaceRequest(providerId, prompt);
      } else if (providerId === 'mock-ai') {
        response = await this.makeMockRequest(providerId, prompt);
      } else {
        throw new Error(`Unhandled provider type for ${providerId}`);
      }

      console.log(`✅ Request successful with ${provider.name}`);
      return response;

    } catch (error) {
      console.error(`❌ Request failed with ${provider.name}:`, error);

      // Handle different types of errors
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('invalid') || error.message.includes('User not found') || error.message.includes('expired')) {
          // Authentication/API key errors - disable provider permanently for this session
          provider.available = false;
          console.log(`🔐 Provider ${provider.name} authentication failed - disabled for session`);
          // Also disable all other OpenRouter providers if one fails with auth error
          if (providerId.includes('gpt') || providerId.includes('claude') || providerId.includes('mistral')) {
            for (const [key, p] of this.providers.entries()) {
              if (key !== providerId && (key.includes('gpt') || key.includes('claude') || key.includes('mistral'))) {
                p.available = false;
                console.log(`🔐 Disabling related OpenRouter provider: ${p.name}`);
              }
            }
          }
        } else if (error.message.includes('429') || error.message.includes('rate limit')) {
          provider.available = false;
          provider.cooldownUntil = Date.now() + 60000; // 60 second cooldown
          console.log(`⏳ Provider ${provider.name} rate limited, cooldown for 60 seconds`);
        } else if (error.message.includes('quota') || error.message.includes('insufficient')) {
          provider.available = false;
          provider.cooldownUntil = Date.now() + 3600000; // 1 hour cooldown
          console.log(`💰 Provider ${provider.name} quota exceeded, disabling for 1 hour`);
        } else if (error.message.includes('temporarily unavailable') || error.message.includes('5')) {
          // Temporary server errors - retry after delay
          provider.available = false;
          provider.cooldownUntil = Date.now() + 30000; // 30 second cooldown
          console.log(`🌐 Provider ${provider.name} temporarily unavailable, cooldown for 30 seconds`);
        }
      }

      throw error;
    }
  }

  /**
   * Universal AI call with automatic failover and retries
   */
  private async executeWithFailover(prompt: string, options?: any): Promise<string> {
    const allProviderIds = Array.from(this.providers.keys());
    const attemptedProviders = new Set<string>();
    let lastError: Error | null = null;
    
    // Allow up to 5 attempts across different providers
    const maxAttempts = 5;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Find best available provider based on priority and availability
      const availableProviders = Array.from(this.providers.entries())
        .filter(([id, p]) => {
          const now = Date.now();
          const isAvailable = p.available && p.requestCount < p.maxRequests;
          const isCooldownOver = !p.cooldownUntil || now > p.cooldownUntil;
          return isAvailable || isCooldownOver;
        })
        .sort(([_, a], [__, b]) => a.priority - b.priority);

      if (availableProviders.length === 0) {
        console.warn("⚠️ No providers available for failover, waiting 2s...");
        await this.sleep(2000);
        continue;
      }

      // Log status of available providers
      if (attempt === 0) {
        console.log(`🔍 Available providers for this request: ${availableProviders.map(([_, p]) => p.name).join(', ')}`);
      }

      // Try to find a provider we haven't tried in this specific chain yet
      let providerId = availableProviders.find(([id]) => !attemptedProviders.has(id))?.[0];
      
      // If all available have been tried at least once, just pick the top one
      if (!providerId) {
        providerId = availableProviders[0][0];
      }

      attemptedProviders.add(providerId);
      const provider = this.providers.get(providerId)!;

      try {
        console.log(`🔄 [Failover Attempt ${attempt + 1}/${maxAttempts}] Using ${provider.name}`);
        const response = await this.makeProviderRequest(providerId, prompt);
        return response;
      } catch (error) {
        lastError = error as Error;
        console.warn(`❌ Provider ${provider.name} failed:`, error instanceof Error ? error.message : error);
        
        // Wait a bit before next attempt to allow for transient issues or cooldowns
        await this.sleep(1000);
      }
    }

    throw lastError || new Error("All AI providers failed after multiple attempts");
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

    try {
      const response = await this.executeWithFailover(prompt, options);
      const parsedResponse = this.parseAIResponse(response);
      
      // Validate specifically for questions
      this.validateQuestionsResponse(parsedResponse);
      
      const processedResponse = this.processGeneratedQuestions(parsedResponse, options);

      // Cache the successful response
      this.setCachedQuestions(contentHash, processedResponse);

      return processedResponse;
    } catch (error) {
      console.error("Critical AI Failure in generateQuestions, falling back to Mock AI:", error);
      
      // Ultimate fallback to Mock AI
      const response = await this.makeMockRequest('mock-ai', prompt);
      const parsedResponse = this.parseAIResponse(response);
      return this.processGeneratedQuestions(parsedResponse, options);
    }
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

      let jsonText = text.trim();

      // Remove markdown code blocks
      jsonText = jsonText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      jsonText = jsonText.replace(/^```\s*/, "").replace(/\s*```$/, "");

      // Find JSON object or array
      let jsonMatch = jsonText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      
      if (!jsonMatch) {
        throw new Error("No valid JSON object or array found in response");
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return parsed;
    } catch (error) {
      console.error("Failed to parse AI response:", error);
      console.error("Response preview:", text.substring(0, 300) + "...");
      throw new Error(`Invalid JSON response from AI: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private validateQuestionsResponse(parsed: any): void {
    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error("Invalid response format - questions array missing");
    }

    if (parsed.questions.length === 0) {
      throw new Error("No questions generated");
    }

    for (const question of parsed.questions) {
      if (!question.question || typeof question.question !== 'string') {
        throw new Error("Invalid question format - missing or invalid question text");
      }
      if (!question.correctAnswer && !question.correct_answer) {
        throw new Error("Invalid question format - missing correct answer");
      }
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
      const response = await this.executeWithFailover(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const insights = JSON.parse(jsonMatch[0]);
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

  public async listAvailableGeminiModels(): Promise<void> {
    const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!geminiKey) {
      console.log('❌ No Gemini API key found');
      return;
    }

    try {
      // Try v1 API first (current API)
      console.log('🔍 Checking available Gemini models...');
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${geminiKey}`);
      if (!response.ok) {
        console.log(`❌ v1 API failed: ${response.status} - ${response.statusText}`);
        // Try v1beta API as fallback
        const betaResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`);
        if (!betaResponse.ok) {
          console.log(`❌ v1beta API also failed: ${betaResponse.status} - ${betaResponse.statusText}`);
          return;
        }
        const betaData = await betaResponse.json();
        console.log('📋 Available models in v1beta API:');
        betaData.models?.forEach((model: any) => {
          console.log(`  - ${model.name} (supports: ${model.supportedGenerationMethods?.join(', ') || 'unknown'})`);
        });
        return;
      }
      const data = await response.json();
      console.log('📋 Available models in v1 API:');
      data.models?.forEach((model: any) => {
        console.log(`  - ${model.name} (supports: ${model.supportedGenerationMethods?.join(', ') || 'unknown'})`);
      });
    } catch (error) {
      console.error('❌ Failed to list models:', error);
    }
  }


  /**
   * Parse content into structured modules
   */
  async parseContentIntoModules(options: {
    content: string;
    context?: string;
    courseId: string;
  }): Promise<Array<{
    course_id: string;
    title: string;
    content: string;
    module_order: number;
    word_count: number;
    estimated_read_time: number;
  }>> {
    const prompt = `You are an expert educational content organizer. Analyze the following content and break it down into logical study modules/chapters.

${options.context ? `Context: ${options.context}\n\n` : ''}

Content to analyze:
${options.content.substring(0, 5000)}${options.content.length > 5000 ? '...' : ''}

Instructions:
1. Identify natural divisions in the content (chapters, sections, topics)
2. Create 3-8 modules (unless content is very short or very long)
3. Each module should be a complete, self-contained learning unit
4. Provide a clear, descriptive title for each module
5. Include the full text content for each module

Return a JSON array of modules in this exact format:
[
  {
    "title": "Module Title",
    "content": "Full module text content here...",
    "order": 1
  }
]

IMPORTANT: Return ONLY the JSON array, no additional text.`;

    try {
      const response = await this.executeWithFailover(prompt);
      const parsed = this.parseAIResponse(response);

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('Invalid module structure returned');
      }

      // Transform to database format
      return parsed.map((module: any, index: number) => ({
        course_id: options.courseId,
        title: module.title || `Module ${index + 1}`,
        content: module.content || '',
        module_order: module.order || index + 1,
        word_count: (module.content || '').split(/\s+/).length,
        estimated_read_time: Math.ceil((module.content || '').split(/\s+/).length / 200),
      }));
    } catch (error) {
      console.error('Module parsing error:', error);
      throw error;
    }
  }
}

export const aiService = new MultiProviderAIService();
export type { GenerateQuestionsOptions, GeneratedQuestion, AIResponse };
