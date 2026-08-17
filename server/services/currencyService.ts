// server/services/currencyService.ts
//
// Cheap, cached FX conversion for displaying wallet costs/balances in the
// student's local currency. Not billing-grade precision — the wallet ledger
// (wallet_transactions) always stores and settles in USD; this is purely a
// display convenience layer.

interface FxCache {
  rates: Record<string, number>;
  fetchedAt: number;
}

let cache: FxCache | null = null;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours — FX doesn't need to be live-to-the-second here

// Free-tier FX API — no key required, updates daily. If this ever goes down,
// getExchangeRate falls back to the last cached rates rather than failing.
const FX_API_URL = "https://open.er-api.com/v6/latest/USD";

async function refreshCache(): Promise<void> {
  try {
    const res = await fetch(FX_API_URL);
    if (!res.ok) throw new Error(`FX API returned ${res.status}`);
    const data = await res.json();
    if (!data.rates) throw new Error("FX API response missing rates");
    cache = { rates: data.rates, fetchedAt: Date.now() };
    console.log(`💱 FX rates refreshed — ${Object.keys(data.rates).length} currencies cached`);
  } catch (error) {
    console.error("⚠️  FX rate refresh failed (using stale cache if available):", error);
    // Deliberately don't clear the existing cache on failure — stale rates
    // are far better than no rates for a display-only feature.
  }
}

/**
 * Get the USD → target currency exchange rate, using a 6-hour cache.
 * Returns 1 (i.e. treats as USD) if the currency is unknown or FX is
 * completely unavailable — better to show a USD-equivalent number than crash.
 */
export async function getExchangeRate(currencyCode: string): Promise<number> {
  const isStale = !cache || Date.now() - cache.fetchedAt > CACHE_TTL_MS;
  if (isStale) await refreshCache();

  return cache?.rates?.[currencyCode.toUpperCase()] ?? 1;
}

/**
 * Common currencies for the African-market-first launch, mapped to symbols.
 * Extend this as you add support for more countries — the FX rate lookup
 * itself works for any ISO code, this map is just for display formatting.
 */
export const SUPPORTED_CURRENCIES: Record<string, { symbol: string; name: string }> = {
  NGN: { symbol: "₦", name: "Nigerian Naira" },
  KES: { symbol: "KSh", name: "Kenyan Shilling" },
  GHS: { symbol: "GH₵", name: "Ghanaian Cedi" },
  ZAR: { symbol: "R", name: "South African Rand" },
  EGP: { symbol: "E£", name: "Egyptian Pound" },
  USD: { symbol: "$", name: "US Dollar" },
  GBP: { symbol: "£", name: "British Pound" },
  EUR: { symbol: "€", name: "Euro" },
};

export async function convertUsdToLocal(
  amountUsd: number,
  currencyCode: string
): Promise<{ amount: number; code: string; symbol: string }> {
  const code = currencyCode.toUpperCase();
  const rate = await getExchangeRate(code);
  const meta = SUPPORTED_CURRENCIES[code];

  return {
    amount: amountUsd * rate,
    code,
    symbol: meta?.symbol ?? code + " ",
  };
}

// Prime the cache once at server startup so the first request doesn't pay
// the FX API round-trip latency.
refreshCache();
