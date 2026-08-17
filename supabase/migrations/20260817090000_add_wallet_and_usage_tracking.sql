-- Migration: pay-as-you-go wallet system + AI usage tracking
--
-- Two concerns, two table groups:
--   1. wallet_balances / wallet_transactions — the money the student has and spent.
--      A ledger, not a mutable counter, so every charge/refund/topup has an
--      immutable, auditable record with a reference back to the course it paid for.
--   2. ai_usage_log — the ACTUAL token cost of every AI provider call, independent
--      of what was quoted to the user. This is ground truth used to reconcile
--      against the pre-authorized hold and to refund any overcharge.

-- ─── Wallet balance (fast lookup, one row per user) ────────────────────────

CREATE TABLE IF NOT EXISTS public.wallet_balances (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance_usd NUMERIC(12, 6) NOT NULL DEFAULT 0 CHECK (balance_usd >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.wallet_balances IS
  'Current spendable balance per user, in USD. Kept in sync with wallet_transactions via apply_wallet_transaction(). Never write to balance_usd directly — always go through the function so the ledger and balance can never drift apart.';

-- ─── Wallet transaction ledger (immutable audit trail) ─────────────────────

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'topup',              -- student adds funds via Paystack/Flutterwave/mobile money
    'course_generation',  -- pre-authorization hold when a course generation starts
    'test_regeneration',  -- pre-authorization hold for regenerating a module test
    'refund',             -- difference between quoted and actual cost, returned
    'referral_bonus',     -- credit from a successful referral
    'free_trial'          -- the one free course grant on signup
  )),
  amount_usd NUMERIC(12, 6) NOT NULL, -- negative = spend, positive = topup/refund/bonus
  balance_after_usd NUMERIC(12, 6) NOT NULL,
  reference_id UUID, -- course_id for generation/refund rows, payment_id for topups
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_user_time
  ON public.wallet_transactions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_reference
  ON public.wallet_transactions(reference_id) WHERE reference_id IS NOT NULL;

COMMENT ON TABLE public.wallet_transactions IS
  'Immutable ledger of every wallet movement. This is the audit trail a student can be shown if they dispute a charge — always has a reference_id pointing at the exact course/payment involved.';

-- ─── Atomic transaction application ────────────────────────────────────────
-- Wraps the balance update + ledger insert in one transaction so they can
-- never drift apart, and raises an exception on insufficient balance instead
-- of allowing a negative balance to be written.

CREATE OR REPLACE FUNCTION public.apply_wallet_transaction(
  p_user_id UUID,
  p_type TEXT,
  p_amount_usd NUMERIC,
  p_reference_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
) RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance NUMERIC;
BEGIN
  -- Ensure a balance row exists for this user (first transaction ever)
  INSERT INTO public.wallet_balances (user_id, balance_usd)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Lock the row for update to prevent concurrent spend races
  UPDATE public.wallet_balances
  SET balance_usd = balance_usd + p_amount_usd,
      updated_at = now()
  WHERE user_id = p_user_id
  RETURNING balance_usd INTO v_new_balance;

  IF v_new_balance < 0 THEN
    RAISE EXCEPTION 'Insufficient wallet balance for user %: attempted amount %, would result in %',
      p_user_id, p_amount_usd, v_new_balance
      USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.wallet_transactions
    (user_id, type, amount_usd, balance_after_usd, reference_id, description)
  VALUES
    (p_user_id, p_type, p_amount_usd, v_new_balance, p_reference_id, p_description);

  RETURN v_new_balance;
END;
$$;

COMMENT ON FUNCTION public.apply_wallet_transaction IS
  'The ONLY sanctioned way to move wallet funds. Atomically updates wallet_balances and inserts the corresponding wallet_transactions row. Raises an exception (does not silently fail) if the resulting balance would go negative — callers must catch this and treat it as insufficient funds.';

-- ─── AI usage log (ground truth for actual provider cost) ──────────────────

CREATE TABLE IF NOT EXISTS public.ai_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  call_type TEXT NOT NULL CHECK (call_type IN (
    'module_parsing', 'question_generation', 'test_insights'
  )),
  provider_id TEXT NOT NULL,     -- e.g. 'gemini-2.5-flash-lite'
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd NUMERIC(12, 8) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_course
  ON public.ai_usage_log(course_id) WHERE course_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_time
  ON public.ai_usage_log(user_id, created_at DESC);

COMMENT ON TABLE public.ai_usage_log IS
  'Ground-truth record of actual token usage + cost per AI provider call. Used to reconcile against the pre-authorized wallet hold for a course generation — the difference between quoted and actual cost is refunded via apply_wallet_transaction(type=refund). Also the dataset for tightening the client-side cost estimator over time.';

-- ─── Row Level Security ─────────────────────────────────────────────────────

ALTER TABLE public.wallet_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own wallet balance" ON public.wallet_balances;
CREATE POLICY "Users can view own wallet balance" ON public.wallet_balances
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own wallet transactions" ON public.wallet_transactions;
CREATE POLICY "Users can view own wallet transactions" ON public.wallet_transactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own usage log" ON public.ai_usage_log;
CREATE POLICY "Users can view own usage log" ON public.ai_usage_log
  FOR SELECT USING (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE policies for regular users on any of these three
-- tables — all writes go through apply_wallet_transaction() (SECURITY DEFINER)
-- or the server's service-role key. This is intentional: a student's client
-- must never be able to credit their own wallet directly.

-- ─── Grant the one free course on signup ───────────────────────────────────
-- Existing users get a free trial credit retroactively; new users get it via
-- the application's signup flow calling apply_wallet_transaction directly.

INSERT INTO public.wallet_balances (user_id, balance_usd)
SELECT id, 0.05 -- ~one free course generation at current provider rates
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
