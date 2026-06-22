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

// ─── Provider directory (June 2026) ────────────────────────────────────────
//
// FREE TIER PROVIDERS — zero-cost, permanent:
//
//  Google AI Studio (api.google.dev / aistudio)
//    gemini-2.5-flash        1 M context  1,500 RPD  10 RPM  FREE ✅
//    gemini-2.5-flash-lite   1 M context  1,500 RPD  15 RPM  FREE ✅
//    NOTE: gemini-2.0-flash was retired June 1 2026 — do not use.
//          Pro models are now paid-only as of April 2026.
//
//  Groq (api.groq.com — OpenAI-compatible)
//    llama-3.1-8b-instant    128 K context  14,400 RPD  30 RPM  FREE ✅  fastest/highest volume
//    llama-3.3-70b-versatile 128 K context   1,000 RPD  30 RPM  FREE ✅  best quality open model
//    llama-4-scout            10 M context   1,000 RPD  30 RPM  FREE ✅  massive context window
//    NOTE: rate limits are per-organisation, not per-key.
//
//  Cerebras (api.cerebras.ai — OpenAI-compatible, world's fastest inference)
//    llama-3.3-70b           128 K context  1 M tokens/day  30 RPM  FREE ✅
//    NOTE: free tier context window starts at 8 K; request expansion via dashboard.
//          1 M tokens/day is the daily budget (input+output combined).
//
//  OpenRouter free tier (:free suffix — 20 RPM, 200 RPD without credits)
//    meta-llama/llama-4-scout:free        10 M context  large-doc champion  FREE ✅
//    deepseek/deepseek-r1:free           128 K context  best free reasoning  FREE ✅
//    qwen/qwen3-235b-a22b:free           128 K context  best free coding     FREE ✅
//    openai/gpt-oss-120b:free            131 K context  strong general model FREE ✅
//    meta-llama/llama-3.3-70b:free       128 K context  reliable fallback    FREE ✅
//    NOTE: :free roster rotates — check openrouter.ai/models?order=top-weekly&supported_parameters=tools
//
// PAID (your account — lowest cost per token):
//  DeepSeek (api.deepseek.com — OpenAI-compatible)
//    deepseek-v4-flash     1 M context  $0.14/M in  $0.28/M out  YOUR KEY ✅
//    NOTE: legacy aliases deepseek-chat / deepseek-reasoner deprecated 2026-07-24.
//           Update to deepseek-v4-flash before then.
// ──────────────────────────────────────────────────────────────────────────

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
    // ── 1. Google Gemini (AI Studio free tier) ──────────────────────────────
    // gemini-2.0-flash was shut down June 1 2026 — using 2.5 Flash now.
    const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (geminiKey) {
      this.geminiAI = new GoogleGenerativeAI(geminiKey);

      // Primary: Gemini 2.5 Flash — 1M context, best balance, 1,500 RPD free
      this.providers.set("gemini-2.5-flash", {
        name: "Gemini 2.5 Flash (Google AI Studio)",
        available: true,
        requestCount: 0,
        lastReset: Date.now(),
        maxRequests: 10,      // 10 RPM on free tier (conservative)
        resetInterval: 60 * 1000,
        priority: 1,
        costPerToken: 0,
        maxTokens: 1_000_000,
      });

      // Secondary: Gemini 2.5 Flash-Lite — cheaper/faster, same 1M context, 1,500 RPD free
      this.providers.set("gemini-2.5-flash-lite", {
        name: "Gemini 2.5 Flash-Lite (Google AI Studio)",
        available: true,
        requestCount: 0,
        lastReset: Date.now(),
        maxRequests: 15,      // 15 RPM on free tier
        resetInterval: 60 * 1000,
        priority: 2,
        costPerToken: 0,
        maxTokens: 1_000_000,
      });

      console.log("✅ Gemini 2.5 Flash + Flash-Lite initialized (free tier, 1M context)");
    }

    // ── 2. Groq (LPU inference — ultra fast, fully OpenAI-compatible) ───────
    // Free tier: no credit card. Rate limits are per-organisation.
    const groqKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
    if (groqKey && groqKey !== "your_groq_api_key") {
      // Llama 3.1 8B — 14,400 RPD free; best for high-volume, fast tasks
      this.providers.set("groq-llama-3.1-8b", {
        name: "Llama 3.1 8B Instant (Groq Free)",
        available: true,
        requestCount: 0,
        lastReset: Date.now(),
        maxRequests: 30,      // 30 RPM
        resetInterval: 60 * 1000,
        priority: 3,
        costPerToken: 0,
        maxTokens: 128_000,
      });

      // Llama 3.3 70B — 1,000 RPD free; best quality open model on Groq
      this.providers.set("groq-llama-3.3-70b", {
        name: "Llama 3.3 70B Versatile (Groq Free)",
        available: true,
        requestCount: 0,
        lastReset: Date.now(),
        maxRequests: 30,      // 30 RPM
        resetInterval: 60 * 1000,
        priority: 2,
        costPerToken: 0,
        maxTokens: 128_000,
      });

      // Llama 4 Scout — 1,000 RPD free; 10M native context window (massive docs)
      this.providers.set("groq-llama-4-scout", {
        name: "Llama 4 Scout 17B (Groq Free, 10M ctx)",
        available: true,
        requestCount: 0,
        lastReset: Date.now(),
        maxRequests: 30,      // 30 RPM
        resetInterval: 60 * 1000,
        priority: 2,
        costPerToken: 0,
        maxTokens: 10_000_000, // 10M context window — perfect for 15-20 page docs
      });

      console.log("✅ Groq initialized: Llama 3.1 8B (14.4K RPD) + Llama 3.3 70B + Llama 4 Scout (10M ctx)");
    } else {
      console.log("ℹ️ GROQ_API_KEY not set — Groq providers disabled (free, worth enabling)");
    }

    // ── 3. Cerebras (wafer-scale WSE — fastest inference on the planet) ─────
    // Free tier: 1M tokens/day, 30 RPM, no credit card.
    // Sign up at cloud.cerebras.ai — takes < 5 min.
    const cerebrasKey = process.env.CEREBRAS_API_KEY || process.env.VITE_CEREBRAS_API_KEY;
    if (cerebrasKey && cerebrasKey !== "your_cerebras_api_key") {
      this.providers.set("cerebras-llama-3.3-70b", {
        name: "Llama 3.3 70B (Cerebras Free, 2300 tok/s)",
        available: true,
        requestCount: 0,
        lastReset: Date.now(),
        maxRequests: 30,      // 30 RPM free tier
        resetInterval: 60 * 1000,
        priority: 3,
        costPerToken: 0,
        maxTokens: 128_000,   // request 128K expansion in dashboard (default 8K)
      });

      console.log("✅ Cerebras initialized: Llama 3.3 70B @ ~2,300 tok/s (1M tokens/day free)");
    } else {
      console.log("ℹ️ CEREBRAS_API_KEY not set — Cerebras disabled (free, sign up at cloud.cerebras.ai)");
    }

    // ── 4. DeepSeek (your paid key — best value frontier model) ─────────────
    // deepseek-chat alias maps to deepseek-v4-flash until 2026-07-24, then deprecated.
    // Using explicit deepseek-v4-flash now to avoid breakage.
    // 1M context window, $0.14/M input tokens.
    const deepseekKey = process.env.DEEPSEEK_API_KEY || process.env.VITE_DEEPSEEK_API_KEY;
    if (deepseekKey && deepseekKey !== "your_deepseek_api_key") {
      this.providers.set("deepseek-v4-flash", {
        name: "DeepSeek V4 Flash (1M ctx, your key)",
        available: true,
        requestCount: 0,
        lastReset: Date.now(),
        maxRequests: 60,
        resetInterval: 60 * 1000,
        priority: 2,
        costPerToken: 0.00014,   // $0.14/M input tokens
        maxTokens: 1_000_000,
      });

      console.log("✅ DeepSeek V4 Flash initialized (1M context, paid key)");
    }

    // ── 5. OpenRouter free tier (28+ free models via :free suffix) ──────────
    // 20 RPM / 200 RPD without credits; $10 one-time credit → 1,000 RPD permanently.
    // Free models include heavy hitters: Llama 4 Scout 10M ctx, DeepSeek R1, Qwen3 235B.
    const openrouterKey = process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY;
    if (openrouterKey && openrouterKey !== "your_openrouter_api_key") {
      // Llama 4 Scout — 10M context, ideal for very long documents (15-20 pages = ~30K-50K tokens)
      this.providers.set("or-llama-4-scout", {
        name: "Llama 4 Scout 10M ctx (OpenRouter :free)",
        available: true,
        requestCount: 0,
        lastReset: Date.now(),
        maxRequests: 20,      // 20 RPM on OpenRouter free
        resetInterval: 60 * 1000,
        priority: 2,
        costPerToken: 0,
        maxTokens: 10_000_000,
      });

      // DeepSeek R1 free — best free reasoning model, 128K context
      this.providers.set("or-deepseek-r1", {
        name: "DeepSeek R1 (OpenRouter :free)",
        available: true,
        requestCount: 0,
        lastReset: Date.now(),
        maxRequests: 20,
        resetInterval: 60 * 1000,
        priority: 3,
        costPerToken: 0,
        maxTokens: 128_000,
      });

      // Qwen3 235B — best free general/coding model, 128K context
      this.providers.set("or-qwen3-235b", {
        name: "Qwen3 235B (OpenRouter :free)",
        available: true,
        requestCount: 0,
        lastReset: Date.now(),
        maxRequests: 20,
        resetInterval: 60 * 1000,
        priority: 3,
        costPerToken: 0,
        maxTokens: 128_000,
      });

      // GPT-OSS 120B — OpenAI's open-weight model, 131K context, strong general capability
      this.providers.set("or-gpt-oss-120b", {
        name: "GPT-OSS 120B (OpenRouter :free)",
        available: true,
        requestCount: 0,
        lastReset: Date.now(),
        maxRequests: 20,
        resetInterval: 60 * 1000,
        priority: 4,
        costPerToken: 0,
        maxTokens: 131_000,
      });

      // Llama 3.3 70B — reliable fallback, widely available free
      this.providers.set("or-llama-3.3-70b", {
        name: "Llama 3.3 70B Instruct (OpenRouter :free)",
        available: true,
        requestCount: 0,
        lastReset: Date.now(),
        maxRequests: 20,
        resetInterval: 60 * 1000,
        priority: 5,
        costPerToken: 0,
        maxTokens: 128_000,
      });

      console.log("✅ OpenRouter initialized: 5 free models (Llama 4 Scout 10M + DeepSeek R1 + Qwen3 235B + GPT-OSS 120B + Llama 3.3 70B)");
    } else {
      console.log("ℹ️ OPENROUTER_API_KEY not set — OpenRouter free models disabled");
    }

    // ── 6. Mock AI fallback (always available, zero quality — last resort) ───
    this.providers.set("mock-ai", {
      name: "Mock AI (Fallback — no real AI)",
      available: true,
      requestCount: 0,
      lastReset: Date.now(),
      maxRequests: 100,
      resetInterval: 60 * 1000,
      priority: 99,
      costPerToken: 0,
      maxTokens: 10_000,
    });

    console.log(`🤖 Multi-provider AI service ready — ${this.providers.size} providers`);
    setTimeout(() => this.healthCheck(), 1500);
  }

  private resetProviderLimits() {
    const now = Date.now();
    for (const [, provider] of this.providers) {
      if (now - provider.lastReset >= provider.resetInterval) {
        provider.requestCount = 0;
        provider.lastReset = now;
      }
    }
  }

  private getAvailableProvider(options?: GenerateQuestionsOptions): string | null {
    const contentLength = options?.content?.length || 0;

    const available = Array.from(this.providers.entries())
      .filter(([, p]) => {
        const now = Date.now();
        if (p.cooldownUntil && now > p.cooldownUntil) {
          p.available = true;
          p.cooldownUntil = undefined;
          p.requestCount = 0;
          console.log(`✅ Provider ${p.name} cooldown expired — back online`);
        }
        if (!p.available || p.requestCount >= p.maxRequests) return false;
        // Skip if content is too large for this provider
        // Rule of thumb: 1 token ≈ 4 chars; apply 50% safety buffer
        if (p.maxTokens && contentLength > p.maxTokens * 4 * 0.5) return false;
        return true;
      })
      .sort(([, a], [, b]) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return (a.costPerToken || 0) - (b.costPerToken || 0);
      });

    if (available.length === 0) {
      console.warn("⚠️ No available providers. Current status:");
      this.logProviderStatus();
      return null;
    }

    return available[0][0];
  }

  // ── Request helpers ──────────────────────────────────────────────────────

  private async makeGeminiRequest(model: string, prompt: string): Promise<string> {
    const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!geminiKey) throw new Error("Gemini API key not configured");

    // Map internal provider IDs to actual Gemini model names
    const modelMap: Record<string, string> = {
      "gemini-2.5-flash": "gemini-2.5-flash",
      "gemini-2.5-flash-lite": "gemini-2.5-flash-lite",
    };
    const modelName = modelMap[model] ?? "gemini-2.5-flash";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3 },
          }),
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        const err = await response.text().catch(() => response.statusText);
        throw new Error(`Gemini API error ${response.status}: ${err}`);
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Invalid response format from Gemini API");

      clearTimeout(timeoutId);
      return text;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Request timeout: Gemini API did not respond within 30 s");
      }
      throw error;
    }
  }

  /** Generic OpenAI-compatible request — used by Groq, Cerebras, DeepSeek, OpenRouter */
  private async makeOpenAICompatibleRequest(
    baseUrl: string,
    apiKey: string,
    model: string,
    prompt: string,
    extraHeaders: Record<string, string> = {},
    timeoutMs = 45_000
  ): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          ...extraHeaders,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 2000,
          temperature: 0.3,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = await response.text().catch(() => response.statusText);
        throw new Error(`API error ${response.status}: ${err}`);
      }

      const data = await response.json();
      clearTimeout(timeoutId);
      return data.choices[0].message.content as string;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Request timeout after ${timeoutMs / 1000}s`);
      }
      throw error;
    }
  }

  private async makeGroqRequest(providerId: string, prompt: string): Promise<string> {
    const groqKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
    if (!groqKey) throw new Error("Groq API key not configured");

    const modelMap: Record<string, string> = {
      "groq-llama-3.1-8b": "llama-3.1-8b-instant",
      "groq-llama-3.3-70b": "llama-3.3-70b-versatile",
      "groq-llama-4-scout": "meta-llama/llama-4-scout-17b-16e-instruct",
    };
    const model = modelMap[providerId];
    if (!model) throw new Error(`Unknown Groq provider: ${providerId}`);

    return this.makeOpenAICompatibleRequest(
      "https://api.groq.com/openai/v1",
      groqKey,
      model,
      prompt
    );
  }

  private async makeCerebrasRequest(providerId: string, prompt: string): Promise<string> {
    const cerebrasKey = process.env.CEREBRAS_API_KEY || process.env.VITE_CEREBRAS_API_KEY;
    if (!cerebrasKey) throw new Error("Cerebras API key not configured");

    const modelMap: Record<string, string> = {
      "cerebras-llama-3.3-70b": "llama-3.3-70b",
    };
    const model = modelMap[providerId];
    if (!model) throw new Error(`Unknown Cerebras provider: ${providerId}`);

    return this.makeOpenAICompatibleRequest(
      "https://api.cerebras.ai/v1",
      cerebrasKey,
      model,
      prompt
    );
  }

  private async makeDeepSeekRequest(providerId: string, prompt: string): Promise<string> {
    const deepseekKey = process.env.DEEPSEEK_API_KEY || process.env.VITE_DEEPSEEK_API_KEY;
    if (!deepseekKey) throw new Error("DeepSeek API key not configured");

    const modelMap: Record<string, string> = {
      // Legacy alias deepseek-chat maps to deepseek-v4-flash until 2026-07-24;
      // using explicit name to avoid the deprecation cutover.
      "deepseek-v4-flash": "deepseek-v4-flash",
    };
    const model = modelMap[providerId] ?? "deepseek-v4-flash";

    return this.makeOpenAICompatibleRequest(
      "https://api.deepseek.com",
      deepseekKey,
      model,
      prompt
    );
  }

  private async makeOpenRouterRequest(providerId: string, prompt: string): Promise<string> {
    const openrouterKey = process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY;
    if (!openrouterKey || openrouterKey === "your_openrouter_api_key") {
      throw new Error("OpenRouter API key not configured");
    }

    // Always append :free to get free-tier routing (vs paid passthrough same model ID)
    const modelMap: Record<string, string> = {
      "or-llama-4-scout": "meta-llama/llama-4-scout:free",
      "or-deepseek-r1": "deepseek/deepseek-r1:free",
      "or-qwen3-235b": "qwen/qwen3-235b-a22b:free",
      "or-gpt-oss-120b": "openai/gpt-oss-120b:free",
      "or-llama-3.3-70b": "meta-llama/llama-3.3-70b-instruct:free",
    };
    const model = modelMap[providerId];
    if (!model) throw new Error(`Unknown OpenRouter provider: ${providerId}`);

    const siteUrl = process.env.SITE_URL || process.env.VITE_SITE_URL || "http://localhost:3000";
    const appName = process.env.APP_NAME || process.env.VITE_APP_NAME || "StudyWise AI";

    return this.makeOpenAICompatibleRequest(
      "https://openrouter.ai/api/v1",
      openrouterKey,
      model,
      prompt,
      {
        "HTTP-Referer": siteUrl,
        "X-Title": appName,
      },
      60_000  // OpenRouter free tier can be slower — 60 s timeout
    );
  }

  private async makeMockRequest(_model: string, prompt: string): Promise<string> {
    console.log("🤖 Using Mock AI fallback — all real providers exhausted or unavailable");

    const questionCountMatch = prompt.match(/Generate exactly (\d+) high-quality/);
    const questionCount = questionCountMatch ? parseInt(questionCountMatch[1]) : 5;
    const difficultyMatch = prompt.match(/high-quality (\w+) test questions/);
    const difficulty = difficultyMatch ? difficultyMatch[1] : "medium";

    const templates = [
      "What is the main topic discussed in the content?",
      "Which of the following is mentioned as an important concept?",
      "According to the content, what would be the result of…?",
      "The content suggests that…",
      "Which statement best describes the information provided?",
    ];

    const questions = Array.from({ length: questionCount }, (_, i) => ({
      id: `q${i + 1}`,
      type: "multiple-choice",
      question: `${templates[i % templates.length]} (Question ${i + 1})`,
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: "Option A",
      explanation: "This is a mock response generated as a fallback when AI services are unavailable.",
      difficulty,
      points: difficulty === "easy" ? 1 : difficulty === "medium" ? 2 : 3,
      sourceText: "Generated from your content (mock response)",
    }));

    return JSON.stringify({ questions }, null, 2);
  }

  // ── Provider dispatch ────────────────────────────────────────────────────

  private async makeProviderRequest(providerId: string, prompt: string): Promise<string> {
    const provider = this.providers.get(providerId);
    if (!provider) throw new Error(`Provider ${providerId} not found`);

    provider.requestCount++;

    try {
      let response: string;

      if (providerId.startsWith("gemini-")) {
        response = await this.makeGeminiRequest(providerId, prompt);
      } else if (providerId.startsWith("groq-")) {
        response = await this.makeGroqRequest(providerId, prompt);
      } else if (providerId.startsWith("cerebras-")) {
        response = await this.makeCerebrasRequest(providerId, prompt);
      } else if (providerId.startsWith("deepseek-")) {
        response = await this.makeDeepSeekRequest(providerId, prompt);
      } else if (providerId.startsWith("or-")) {
        response = await this.makeOpenRouterRequest(providerId, prompt);
      } else if (providerId === "mock-ai") {
        response = await this.makeMockRequest(providerId, prompt);
      } else {
        throw new Error(`Unhandled provider type: ${providerId}`);
      }

      console.log(`✅ Request successful via ${provider.name}`);
      return response;
    } catch (error) {
      console.error(`❌ ${provider.name} failed: ${error instanceof Error ? error.message : error}`);

      if (error instanceof Error) {
        const msg = error.message;

        if (msg.includes("401") || msg.includes("invalid") || msg.includes("expired") || msg.includes("Unauthorized")) {
          provider.available = false;
          console.log(`🔐 ${provider.name} auth failed — disabled for session`);
        } else if (msg.includes("429") || msg.toLowerCase().includes("rate limit")) {
          provider.available = false;
          provider.cooldownUntil = Date.now() + 60_000;
          console.log(`⏳ ${provider.name} rate-limited — 60 s cooldown`);
        } else if (msg.includes("quota") || msg.includes("insufficient") || msg.includes("billing")) {
          provider.available = false;
          provider.cooldownUntil = Date.now() + 3_600_000;
          console.log(`💰 ${provider.name} quota/billing issue — 1 h cooldown`);
        } else if (msg.includes("503") || msg.includes("502") || msg.includes("unavailable") || msg.includes("timeout")) {
          provider.available = false;
          provider.cooldownUntil = Date.now() + 30_000;
          console.log(`🌐 ${provider.name} temporarily unavailable — 30 s cooldown`);
        }
      }

      throw error;
    }
  }

  // ── Failover orchestration ───────────────────────────────────────────────

  private async executeWithFailover(prompt: string, _options?: GenerateQuestionsOptions): Promise<string> {
    const attemptedProviders = new Set<string>();
    let lastError: Error | null = null;
    const maxAttempts = 6;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const now = Date.now();

      const available = Array.from(this.providers.entries())
        .filter(([, p]) => {
          const cooldownOk = !p.cooldownUntil || now >= p.cooldownUntil;
          if (!cooldownOk && p.cooldownUntil && now >= p.cooldownUntil) {
            p.available = true;
            p.cooldownUntil = undefined;
          }
          return p.available && p.requestCount < p.maxRequests && cooldownOk;
        })
        .sort(([, a], [, b]) => a.priority - b.priority);

      if (available.length === 0) {
        console.warn("⚠️ No providers available — waiting 2 s…");
        await this.sleep(2000);
        continue;
      }

      if (attempt === 0) {
        console.log(`🔍 Available providers: ${available.map(([, p]) => p.name).join(", ")}`);
      }

      // Prefer untried providers; fall back to top available if all tried
      const providerId =
        available.find(([id]) => !attemptedProviders.has(id))?.[0] ?? available[0][0];

      attemptedProviders.add(providerId);
      const provider = this.providers.get(providerId)!;

      try {
        console.log(`🔄 [Attempt ${attempt + 1}/${maxAttempts}] Trying ${provider.name}`);
        return await this.makeProviderRequest(providerId, prompt);
      } catch (error) {
        lastError = error as Error;
        console.warn(`❌ ${provider.name} failed: ${lastError.message}`);
        await this.sleep(1000);
      }
    }

    throw lastError ?? new Error("All AI providers exhausted after multiple attempts");
  }

  // ── Public API ───────────────────────────────────────────────────────────

  async generateQuestions(options: GenerateQuestionsOptions): Promise<AIResponse> {
    const contentHash = this.generateContentHash(options);
    const cached = this.getCachedQuestions(contentHash);
    if (cached) {
      console.log("📋 Returning cached questions");
      return cached;
    }

    console.log(`🤖 Generating ${options.questionCount} questions — content length: ${options.content.length} chars`);
    const prompt = this.buildPrompt(options);

    try {
      const response = await this.executeWithFailover(prompt, options);
      const parsed = this.parseAIResponse(response);
      this.validateQuestionsResponse(parsed);
      const result = this.processGeneratedQuestions(parsed, options);
      this.setCachedQuestions(contentHash, result);
      return result;
    } catch (error) {
      console.error("Critical AI failure — falling back to Mock AI:", error);
      const response = await this.makeMockRequest("mock-ai", prompt);
      return this.processGeneratedQuestions(this.parseAIResponse(response), options);
    }
  }

  private buildPrompt(options: GenerateQuestionsOptions): string {
    const { content, difficulty, questionCount, questionTypes, focus } = options;

    // 15-20 pages ≈ 30K-50K chars; we pass full content and let the model handle it.
    // Cap at 80K chars (well within every provider's context window) to keep prompts sane.
    const MAX_CONTENT = 80_000;
    const optimizedContent =
      content.length > MAX_CONTENT
        ? content.substring(0, MAX_CONTENT) + "\n\n[Content truncated — focus on the above section]"
        : content;

    const isTrueFalseOnly =
      questionTypes.length === 1 && questionTypes[0] === "true-false";

    const exampleQuestion = isTrueFalseOnly
      ? {
          id: "q1",
          type: "true-false",
          question: "The Earth is flat.",
          options: ["True", "False"],
          correctAnswer: "False",
          explanation: "Scientific evidence confirms Earth is an oblate spheroid.",
          difficulty,
          points: difficulty === "easy" ? 1 : difficulty === "medium" ? 2 : 3,
          sourceText: "Evidence from satellite imagery confirms the Earth is round.",
        }
      : {
          id: "q1",
          type: "multiple-choice",
          question: "What is the capital of France?",
          options: ["London", "Berlin", "Paris", "Madrid"],
          correctAnswer: "Paris",
          explanation: "Paris is the capital and largest city of France.",
          difficulty,
          points: difficulty === "easy" ? 1 : difficulty === "medium" ? 2 : 3,
          sourceText: "The capital of France is Paris.",
        };

    return `Generate exactly ${questionCount} high-quality ${difficulty} test questions from this content:

CONTENT:
${optimizedContent}

REQUIREMENTS:
- Question Types: ${questionTypes.join(", ")}
- Difficulty: ${difficulty}
- Each question must be directly answerable from the provided content
- Include exact source text that supports each answer
- Do NOT hallucinate facts — only use information present in the content above
${focus ? `- Focus areas: ${focus}` : ""}

RESPONSE FORMAT — Return valid JSON only (no markdown, no preamble):
{
  "questions": [
    ${JSON.stringify(exampleQuestion, null, 2)}
  ]
}

${
  isTrueFalseOnly
    ? 'IMPORTANT: ONLY provide true-false questions with ["True", "False"] as options.'
    : "IMPORTANT: If multiple question types were requested, provide a balanced mix."
}

Generate ${questionCount} questions now:`;
  }

  private parseAIResponse(text: string): any {
    if (!text || text.trim().length < 10) throw new Error("Response too short or empty");

    let jsonText = text.trim()
      .replace(/^```json\s*/i, "")
      .replace(/\s*```$/,      "")
      .replace(/^```\s*/,      "")
      .replace(/\s*```$/,      "");

    // Find the outermost JSON object or array
    const objStart  = jsonText.indexOf("{");
    const arrStart  = jsonText.indexOf("[");
    let startIdx = -1, endIdx = -1;

    if (objStart !== -1 && (arrStart === -1 || objStart < arrStart)) {
      startIdx = objStart;
      endIdx   = jsonText.lastIndexOf("}") + 1;
    } else if (arrStart !== -1) {
      startIdx = arrStart;
      endIdx   = jsonText.lastIndexOf("]") + 1;
    }

    if (startIdx === -1) throw new Error("No JSON found in AI response");

    try {
      return JSON.parse(jsonText.substring(startIdx, endIdx));
    } catch (e) {
      console.error("JSON parse failed. Preview:", jsonText.substring(startIdx, startIdx + 300));
      throw new Error(`Invalid JSON from AI: ${e instanceof Error ? e.message : e}`);
    }
  }

  private validateQuestionsResponse(parsed: any): void {
    if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      throw new Error("Response missing questions array or empty");
    }
    for (const q of parsed.questions) {
      if (!q.question || typeof q.question !== "string") {
        throw new Error("Question missing or invalid question text");
      }
      if (!q.correctAnswer && !q.correct_answer) {
        throw new Error("Question missing correct answer");
      }
    }
  }

  private processGeneratedQuestions(parsedResponse: any, options: GenerateQuestionsOptions): AIResponse {
    const questions = parsedResponse.questions || [];

    const processed: GeneratedQuestion[] = questions.map((q: any, index: number) => {
      let sourceText = q.sourceText || "Generated from your content";
      let sourceOffset = 0;
      let sourceLength = 0;

      if (q.sourceText && options.content && q.sourceText !== "Generated from your content") {
        const match = this.findBestSourceMatch(q.sourceText, options.content);
        sourceText   = match.text;
        sourceOffset = match.offset;
        sourceLength = match.length;
      }

      return {
        id: q.id || `q${index + 1}`,
        type: q.type || "multiple-choice",
        question: q.question || `Generated question ${index + 1}`,
        options: q.options || ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: q.correctAnswer || q.correct_answer || q.options?.[0] || "Option A",
        explanation: q.explanation || "Explanation based on source content",
        difficulty: q.difficulty || options.difficulty,
        points: q.points || (options.difficulty === "easy" ? 1 : options.difficulty === "medium" ? 2 : 3),
        sourceText,
        sourceOffset,
        sourceLength,
        confidence: 0.85,
      };
    });

    return {
      questions: processed,
      metadata: {
        totalQuestions: processed.length,
        estimatedTime: processed.length * (options.difficulty === "easy" ? 1 : options.difficulty === "medium" ? 2 : 3),
        difficulty: options.difficulty,
        subject: options.subject,
        contentHash: this.generateContentHash(options),
      },
    };
  }

  private findBestSourceMatch(
    sourceText: string,
    content: string
  ): { text: string; offset: number; length: number } {
    const contentLower = content.toLowerCase();
    const sourceLower  = sourceText.toLowerCase();

    const exactIdx = contentLower.indexOf(sourceLower);
    if (exactIdx !== -1) {
      return { text: content.substring(exactIdx, exactIdx + sourceText.length), offset: exactIdx, length: sourceText.length };
    }

    for (const phrase of sourceText.split(/[.!?;,]/).filter(p => p.trim().length > 10)) {
      const phraseIdx = contentLower.indexOf(phrase.toLowerCase().trim());
      if (phraseIdx !== -1) {
        let start = phraseIdx;
        let end   = phraseIdx + phrase.length;
        while (start > 0 && !/[.!?\n]/.test(content[start - 1])) start--;
        while (end < content.length && !/[.!?\n]/.test(content[end])) end++;
        if (end < content.length && /[.!?]/.test(content[end])) end++;
        return { text: content.substring(start, end).trim(), offset: start, length: end - start };
      }
    }

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
      q => testResult.userAnswers[q.id] !== testResult.correctAnswers[q.id]
    );

    const prompt = `Analyze this test performance and provide actionable insights:

PERFORMANCE SUMMARY:
- Score: ${testResult.score}% (${testResult.totalQuestions - wrongQuestions.length}/${testResult.totalQuestions} correct)
- Test: ${testResult.testTitle}

INCORRECT QUESTIONS (up to 3):
${wrongQuestions
  .slice(0, 3)
  .map(
    (q, i) => `${i + 1}. Question: ${q.question}
   Correct Answer: ${testResult.correctAnswers[q.id]}
   User Answer: ${testResult.userAnswers[q.id] || "Not answered"}
   Topic: ${(q.sourceText ?? "").substring(0, 100)}…`
  )
  .join("\n\n")}

Provide insights in JSON format:
{
  "overallPerformance": "Clear assessment of performance level",
  "strengths": ["2-3 specific strengths"],
  "weaknesses": ["2-3 specific areas needing improvement"],
  "studyRecommendations": ["3-4 actionable study strategies"],
  "focusAreas": ["2-3 specific topics to review"]
}`;

    try {
      const response = await this.executeWithFailover(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
      return this.generateBasicInsights(testResult);
    } catch {
      return this.generateBasicInsights(testResult);
    }
  }

  private generateBasicInsights(testResult: any) {
    const { score, totalQuestions } = testResult;
    const wrongCount = totalQuestions - Math.floor((score / 100) * totalQuestions);

    return {
      overallPerformance:
        score >= 90 ? "Excellent — strong mastery of the material" :
        score >= 80 ? "Good — solid understanding with minor gaps" :
        score >= 70 ? "Satisfactory — room for improvement in several areas" :
        score >= 60 ? "Below average — focused study needed" :
                      "Needs significant review — revisit core concepts",
      strengths: score >= 70
        ? ["Good comprehension of key concepts", `Correctly answered ${totalQuestions - wrongCount} questions`, "Showed engagement with the material"]
        : ["Completed the full assessment", "Identified areas needing improvement"],
      weaknesses: wrongCount > 0
        ? [`Missed ${wrongCount}/${totalQuestions} questions`, "Some key concepts need reinforcement",
           score < 60 ? "Fundamental understanding needs strengthening" : "Minor knowledge gaps remain"]
        : ["No significant weaknesses identified"],
      studyRecommendations: [
        "Review explanations for all incorrect answers",
        "Summarise missed concepts in your own words",
        "Practice similar question types",
        wrongCount > totalQuestions / 2 ? "Re-read the source material" : "Target specific weak areas",
      ],
      focusAreas: [
        "Topics from incorrectly answered questions",
        "Key concepts from the source material",
        score < 70 ? "Fundamental principles and definitions" : "Advanced applications and details",
      ],
    };
  }

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
    const prompt = `You are an expert educational content organiser. Analyse the following content and break it into logical study modules.

${options.context ? `Context: ${options.context}\n\n` : ""}Content:
${options.content.substring(0, 8000)}${options.content.length > 8000 ? "…" : ""}

Instructions:
1. Identify natural divisions (chapters, sections, topics)
2. Create 3-8 modules; each should be self-contained
3. Give each a clear, descriptive title
4. Include the full text for each module

Return a JSON array only — no preamble, no markdown:
[
  { "title": "Module Title", "content": "Full module text…", "order": 1 }
]`;

    try {
      const response = await this.executeWithFailover(prompt);
      const parsed = this.parseAIResponse(response);

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("Invalid module structure returned");
      }

      return parsed.map((m: any, i: number) => ({
        course_id: options.courseId,
        title: m.title || `Module ${i + 1}`,
        content: m.content || "",
        module_order: m.order || i + 1,
        word_count: (m.content || "").split(/\s+/).length,
        estimated_read_time: Math.ceil((m.content || "").split(/\s+/).length / 200),
      }));
    } catch (error) {
      console.error("Module parsing error:", error);
      throw error;
    }
  }

  // ── Cache helpers ────────────────────────────────────────────────────────

  private generateContentHash(options: GenerateQuestionsOptions): string {
    const input = `${options.content.substring(0, 1000)}-${options.difficulty}-${options.questionCount}-${options.questionTypes.join(",")}`;
    return createHash("md5").update(input).digest("hex");
  }

  private getCachedQuestions(hash: string): AIResponse | null {
    const entry = this.cache.get(hash);
    if (!entry) return null;
    if (Date.now() >= entry.expiresAt) { this.cache.delete(hash); return null; }
    return entry.data;
  }

  private setCachedQuestions(hash: string, response: AIResponse): void {
    this.cache.set(hash, { data: response, timestamp: Date.now(), expiresAt: Date.now() + 24 * 60 * 60 * 1000 });
  }

  private cleanupCache(): void {
    const now = Date.now();
    let n = 0;
    for (const [k, v] of this.cache.entries()) {
      if (now > v.expiresAt) { this.cache.delete(k); n++; }
    }
    if (n > 0) console.log(`🧹 Cache cleanup: removed ${n} expired entries`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ── Status / diagnostics ─────────────────────────────────────────────────

  private logProviderStatus(): void {
    console.log("📊 Provider status:");
    for (const [id, p] of this.providers) {
      const status = p.available ? "✅" : "❌";
      const cooldown = p.cooldownUntil ? ` (cooldown ${Math.ceil((p.cooldownUntil - Date.now()) / 1000)}s)` : "";
      console.log(`  ${status} [${id}] ${p.name} — ${p.requestCount}/${p.maxRequests} RPM${cooldown}`);
    }
  }

  public getProviderStatus(): Record<string, any> {
    const out: Record<string, any> = {};
    for (const [id, p] of this.providers) {
      out[id] = {
        name: p.name,
        available: p.available,
        requestsUsed: p.requestCount,
        maxRequests: p.maxRequests,
        priority: p.priority,
        costPerToken: p.costPerToken,
        maxContextTokens: p.maxTokens,
        cooldownUntil: p.cooldownUntil,
      };
    }
    return out;
  }

  public async healthCheck(): Promise<Record<string, boolean>> {
    console.log("🩺 Running provider health checks…");
    const results: Record<string, boolean> = {};
    console.log("🤖 Running AI Provider Health Checks...");

    for (const [id, provider] of this.providers) {
      if (id === "mock-ai") { results[id] = true; continue; }
      try {
        await this.makeProviderRequest(id, 'Respond with valid JSON only: {"questions":[]}');
        results[id] = true;
        console.log(`  ✅ ${provider.name}`);
      } catch (err) {
        results[id] = false;
        console.log(`  ❌ ${provider.name}: ${err instanceof Error ? err.message : err}`);
      }
      await this.sleep(800);
    }

    return results;
  }
}

export const aiService = new MultiProviderAIService();
export type { GenerateQuestionsOptions, GeneratedQuestion, AIResponse };