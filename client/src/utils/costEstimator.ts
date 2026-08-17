// @/utils/costEstimator.ts
//
// Runs entirely client-side, instantly, the moment a file finishes parsing.
// Gives the student a quote BEFORE they commit to generating a course —
// this is the mechanism the pay-as-you-go pricing model depends on.
//
// Two numbers matter here and they are deliberately different:
//   - This file produces an ESTIMATE shown to the user before generation.
//   - server/services/AIService.ts records ACTUAL token usage per call after
//     generation, which is the ground truth used to reconcile the wallet hold.
// The estimate is intentionally conservative (rounds up, includes a margin)
// so the quoted price is always >= the real cost — never surprise the user
// with a bill higher than what they were shown.

export interface CostEstimate {
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedModulesCount: number;
  estimatedQuestionsCount: number;
  costUSD: number;
}

/**
 * Rough token estimate — not a real tokenizer, this is a quote, not a bill.
 * GPT/Gemini-family tokenizers average ~4 chars/token for English prose;
 * 3.5 is deliberately conservative so estimates round up, not down.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3.5);
}

/**
 * Per-token pricing — MUST stay in sync with PROVIDER_PRICING in
 * server/services/AIService.ts for the first-priority provider (Gemini
 * 2.5 Flash-Lite). If that priority ordering changes, update this too.
 */
const COST_PER_TOKEN = {
  input: 0.05 / 1_000_000,
  output: 0.20 / 1_000_000,
};

/**
 * Safety margin applied to the raw estimate. Covers the case where the
 * request fails over to a pricier provider (e.g. Gemini 2.5 Flash proper)
 * mid-failover, or where the real token count runs slightly over estimate.
 * This margin is why the server should always end up charging <= the quote.
 */
const MARGIN_MULTIPLIER = 1.4;

/**
 * Estimate the full cost of generating a course from this text: one
 * module-parsing call + one question-generation call per resulting module.
 *
 * @param text          Extracted document text (from DocumentProcessor)
 * @param questionsPerModule  From the user's profile preferences (default_questions_per_module)
 */
export function estimateCourseCost(text: string, questionsPerModule: number): CostEstimate {
  const inputTokens = estimateTokens(text);

  // Module parsing: input = full doc, output = same doc restructured (verbatim) + titles.
  // Output is slightly larger than input because titles/JSON structure add overhead.
  const moduleParsingOutputTokens = Math.ceil(inputTokens * 1.1);

  // Matches the 3–8 module range logic in parseContentIntoModules — used only
  // for the estimate display, the server decides the real count independently.
  const estimatedModules = Math.min(Math.max(Math.ceil(text.length / 15_000), 3), 8);

  // Each module gets its own question-generation call. Input tokens are the
  // module's share of the document; output is roughly 80 tokens per question
  // (structured JSON: question text, 4 options, explanation, source text).
  const avgModuleInputTokens = inputTokens / estimatedModules;
  const questionGenInputTotal = avgModuleInputTokens * estimatedModules; // same content, reused
  const questionGenOutputTotal = questionsPerModule * estimatedModules * 80;

  const totalInputTokens = inputTokens + questionGenInputTotal;
  const totalOutputTokens = moduleParsingOutputTokens + questionGenOutputTotal;

  const rawCostUSD =
    totalInputTokens * COST_PER_TOKEN.input +
    totalOutputTokens * COST_PER_TOKEN.output;

  return {
    estimatedInputTokens: Math.round(totalInputTokens),
    estimatedOutputTokens: Math.round(totalOutputTokens),
    estimatedModulesCount: estimatedModules,
    estimatedQuestionsCount: questionsPerModule * estimatedModules,
    costUSD: rawCostUSD * MARGIN_MULTIPLIER,
  };
}

/**
 * Format a USD cost estimate for display, with an optional local-currency
 * conversion. Pass a live FX rate fetched from the server (see
 * server/services/currencyService.ts) — never hardcode a rate here, it goes
 * stale immediately.
 */
export function formatEstimate(
  estimate: CostEstimate,
  localCurrency?: { code: string; symbol: string; rate: number }
): string {
  if (!localCurrency) {
    return `$${estimate.costUSD.toFixed(4)}`;
  }
  const localAmount = estimate.costUSD * localCurrency.rate;
  // Most African currencies don't use sub-unit decimals in everyday display
  // (nobody prices things at ₦45.23) — round to the nearest whole unit for
  // amounts under 1000, keep 2dp only for very small currency units.
  const rounded = localAmount < 10 ? localAmount.toFixed(2) : Math.round(localAmount).toString();
  return `${localCurrency.symbol}${rounded}`;
}
