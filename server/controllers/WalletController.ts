import { Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { convertUsdToLocal } from '../services/currencyService';

/**
 * WalletController — the pay-as-you-go metering layer.
 *
 * Flow this supports (see CourseController.generateCourse for the spend side):
 *   1. Client computes an instant estimate locally (costEstimator.ts) — no
 *      network round-trip needed just to show a number while typing/uploading.
 *   2. Before generating, the client can call POST /wallet/quote to get a
 *      SERVER-AUTHORITATIVE quote in the user's local currency — this is what
 *      actually gets pre-authorized, not the client's local estimate.
 *   3. GET /wallet/balance — shown in the UI header/dashboard.
 *   4. GET /wallet/transactions — the ledger, for a "billing history" screen
 *      and for resolving any "why was I charged X" support question.
 *   5. POST /wallet/topup/confirm — called after a Paystack/Flutterwave/
 *      mobile-money webhook confirms payment succeeded. This controller does
 *      NOT integrate a specific payment provider — that webhook handler calls
 *      this same apply_wallet_transaction path (or this endpoint directly,
 *      if you want the payment provider's webhook to hit an internal route).
 */

// Keep in sync with client/src/utils/costEstimator.ts — this is the
// server-authoritative version of the same formula. The client's copy exists
// purely to render an instant number before the network round-trip completes;
// THIS is the number that actually gets pre-authorized against the wallet.
const COST_PER_TOKEN = {
  input: 0.05 / 1_000_000,   // Gemini 2.5 Flash-Lite, first-priority provider
  output: 0.20 / 1_000_000,
};
const MARGIN_MULTIPLIER = 1.4;

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3.5);
}

export interface ServerCostEstimate {
  estimatedModulesCount: number;
  estimatedQuestionsCount: number;
  costUSD: number;
}

/**
 * The single source of truth for what a course generation will be
 * pre-authorized at. CourseController.generateCourse calls this directly
 * (not via HTTP) before taking the wallet hold, so the two are guaranteed
 * to agree — this export is what makes that possible.
 */
export function computeServerQuote(content: string, questionsPerModule: number): ServerCostEstimate {
  const inputTokens = estimateTokens(content);
  const moduleParsingOutputTokens = Math.ceil(inputTokens * 1.1);
  const estimatedModules = Math.min(Math.max(Math.ceil(content.length / 15_000), 3), 8);

  const avgModuleInputTokens = inputTokens / estimatedModules;
  const questionGenInputTotal = avgModuleInputTokens * estimatedModules;
  const questionGenOutputTotal = questionsPerModule * estimatedModules * 80;

  const totalInputTokens = inputTokens + questionGenInputTotal;
  const totalOutputTokens = moduleParsingOutputTokens + questionGenOutputTotal;

  const rawCostUSD =
    totalInputTokens * COST_PER_TOKEN.input +
    totalOutputTokens * COST_PER_TOKEN.output;

  return {
    estimatedModulesCount: estimatedModules,
    estimatedQuestionsCount: questionsPerModule * estimatedModules,
    costUSD: rawCostUSD * MARGIN_MULTIPLIER,
  };
}

export class WalletController {
  /**
   * POST /api/wallet/quote
   * Body: { content: string, questionsPerModule: number, currency?: string }
   *
   * Server-authoritative quote, shown as the final confirmation number right
   * before the student commits to spending ("Generate Course — ₦85"). The
   * client's own costEstimator.ts renders a number instantly on file upload;
   * this endpoint is called once, right before the actual generate request,
   * so the number the student approves is the number that gets held.
   */
  static async getQuote(req: Request, res: Response) {
    try {
      const { content, questionsPerModule, currency } = req.body;
      const userId = req.user?.id;

      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      if (!content || typeof content !== 'string') {
        return res.status(400).json({ message: 'content is required' });
      }

      const qpm = Number.isFinite(questionsPerModule) ? questionsPerModule : 10;
      const estimate = computeServerQuote(content, qpm);

      let local: { amount: number; code: string; symbol: string } | null = null;
      if (currency) {
        local = await convertUsdToLocal(estimate.costUSD, currency);
      }

      // Also return current balance so the client can immediately show
      // "insufficient funds" without a second round-trip.
      const { data: balanceRow } = await supabase
        .from('wallet_balances')
        .select('balance_usd')
        .eq('user_id', userId)
        .maybeSingle();

      const balanceUsd = balanceRow?.balance_usd ?? 0;

      return res.json({
        estimatedModulesCount: estimate.estimatedModulesCount,
        estimatedQuestionsCount: estimate.estimatedQuestionsCount,
        costUSD: estimate.costUSD,
        local,
        currentBalanceUSD: balanceUsd,
        sufficientBalance: balanceUsd >= estimate.costUSD,
      });
    } catch (error) {
      console.error('Wallet quote error:', error);
      return res.status(500).json({ message: 'Failed to compute quote' });
    }
  }

  /**
   * GET /api/wallet/balance
   */
  static async getBalance(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const { data, error } = await supabase
        .from('wallet_balances')
        .select('balance_usd, updated_at')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      // No row yet means the user has never had a transaction — treat as 0,
      // don't error. A row is created lazily on first apply_wallet_transaction call.
      return res.json({
        balanceUSD: data?.balance_usd ?? 0,
        updatedAt: data?.updated_at ?? null,
      });
    } catch (error) {
      console.error('Get balance error:', error);
      return res.status(500).json({ message: 'Failed to fetch balance' });
    }
  }

  /**
   * GET /api/wallet/transactions?limit=20&before=<timestamp>
   * Paginated ledger — powers a "billing history" screen.
   */
  static async getTransactions(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const limit = Math.min(Number(req.query.limit) || 20, 100);
      const before = req.query.before as string | undefined;

      let query = supabase
        .from('wallet_transactions')
        .select('id, type, amount_usd, balance_after_usd, reference_id, description, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (before) query = query.lt('created_at', before);

      const { data, error } = await query;
      if (error) throw error;

      return res.json({ transactions: data ?? [] });
    } catch (error) {
      console.error('Get transactions error:', error);
      return res.status(500).json({ message: 'Failed to fetch transaction history' });
    }
  }

  /**
   * POST /api/wallet/topup/confirm
   * Body: { amountUSD: number, paymentReference: string, provider: string }
   *
   * Called after your payment provider (Paystack/Flutterwave/mobile money)
   * confirms a successful charge — either from that provider's webhook
   * handler, or from the client after redirect-based confirmation, depending
   * on which integration pattern you use. This endpoint does NOT verify the
   * payment itself; that verification must happen against the payment
   * provider's API (or webhook signature) BEFORE this is called, otherwise
   * anyone could top up their own wallet for free by hitting this endpoint
   * directly. Wire that verification in wherever you integrate Paystack/
   * Flutterwave — this function assumes it has already happened.
   */
  static async confirmTopup(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const { amountUSD, paymentReference, provider } = req.body;
      if (!amountUSD || amountUSD <= 0) {
        return res.status(400).json({ message: 'amountUSD must be a positive number' });
      }
      if (!paymentReference) {
        return res.status(400).json({ message: 'paymentReference is required' });
      }

      // Idempotency guard — if this exact payment reference was already
      // applied, don't double-credit (webhooks can fire more than once).
      const { data: existing } = await supabase
        .from('wallet_transactions')
        .select('id')
        .eq('reference_id', paymentReference)
        .eq('type', 'topup')
        .maybeSingle();

      if (existing) {
        return res.json({ message: 'Already processed', duplicate: true });
      }

      const { data: newBalance, error } = await supabase.rpc('apply_wallet_transaction', {
        p_user_id: userId,
        p_type: 'topup',
        p_amount_usd: amountUSD,
        p_reference_id: paymentReference,
        p_description: `Top-up via ${provider ?? 'unknown provider'}`,
      });

      if (error) throw error;

      return res.json({ newBalanceUSD: newBalance });
    } catch (error) {
      console.error('Topup confirmation error:', error);
      return res.status(500).json({ message: 'Failed to confirm top-up' });
    }
  }
}
