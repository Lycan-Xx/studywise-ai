# Security Audit Report — Exposed Credentials & Remediation

**Project:** StudyWise AI (`study-ai` workspace)
**Date:** 2026-10-13
**Trigger:** Google suspended Google Cloud project `gen-lang-client-0670164873`
after detecting publicly exposed API keys / service-account credentials
**Remediation commit:** `f789f6d` — *"security: remove exposed key fragments +
isolate AI keys server-side"* (7 files, +179/−33)
**Follow-up:** git history purge + force-push (see section 5)

---

## 1. Findings

### Finding 1 (HIGH) — Truncated API key prefixes committed to public docs

**File:** `docs/AI_PROVIDER_SETUP.md` (lines 49–52), committed 2026-06-22 in
`6c41825`, still on `main` at HEAD. Exposed:

- `GEMINI_API_KEY=***REMOVED***...` (Google key prefix)
- `OPENROUTER_API_KEY=sk-or-v1-***REMOVED***...`
- `DEEPSEEK_API_KEY=sk-***REMOVED***...`
- `SUPABASE_URL=https://***REMOVED***...` (project-subdomain prefix)

Google's scanners flag even partial `AIzaSy` strings in public repos. These sat in a
public GitHub repo (pushed to `origin` and `lovable` remotes) for ~4 months.

### Finding 2 (MEDIUM) — Real Supabase project ID in tracked config

**File:** `supabase/config.toml` held `project_id = "***REMOVED***"`
(full, valid project ref, committed).

### Finding 3 (HIGH) — Server API keys readable via `VITE_*` vars

**File:** `server/services/AIService.ts` — 14 occurrences across all 6 providers
(Gemini, Groq, Cerebras, DeepSeek, OpenRouter, Anthropic), in both provider-init and
request methods, plus `scripts/test-anthropic.ts`.
Pattern: `process.env.X_API_KEY || process.env.VITE_X_API_KEY`.

Why dangerous: Vite statically inlines every `VITE_*` variable into the frontend JS
bundle. Anyone setting a `VITE_GEMINI_API_KEY` (as the repo's own docs and
`config/render.yaml` instructed) would ship their key to every visitor's browser.

### Finding 4 (MEDIUM) — Deployment config mirrored secrets into `VITE_*` vars


## 2. Fixes applied (commit `f789f6d`)

| # | File | Change |
|---|------|--------|
| 1 | `docs/AI_PROVIDER_SETUP.md` | 3 key prefixes + Supabase URL prefix redacted |
| 2 | `docs/archive/AI_PROVIDER_SETUP.md` | Template key-pattern line redacted |
| 3 | `supabase/config.toml` | Real project ID replaced with placeholder |
| 4 | `server/services/AIService.ts` | All 14 `VITE_*_API_KEY` fallbacks removed (server-side only) |
| 5 | `scripts/test-anthropic.ts` | Same `VITE_` fallback removal |
| 6 | `config/render.yaml` | 4 `VITE_*_KEY` mappings removed (server secrets kept) |
| 7 | `client/src/vite-env.d.ts` | `VITE_*_API_KEY` typings removed |

Post-fix verification: all secret-pattern scans return zero hits; tree clean.

## 3. Outstanding actions (operator)

1. Rotate keys in Google Cloud Console (redaction does not un-compromise keys
   public for months). Treat Gemini/OpenRouter/DeepSeek/Supabase creds as burned.
2. Harden new keys: HTTP-referrer + API restrictions, OpenRouter spend cap,
   $1 billing budget alert.
3. Local env: ensure `.env` defines `GEMINI_API_KEY` (server no longer reads the
   `VITE_` variant). Re-link the real Supabase project ref locally via
   `supabase link` — do NOT commit the real ID back into `supabase/config.toml`.

## 4. Suggested appeal statement for Google

> On 2026-10-13 I removed all credential fragments from my public repository
> (commit `f789f6d`: redacted API-key prefixes from documentation and the Supabase
> project ID from tracked config), purged the fragments from full git history,
> eliminated a code pattern that could inline server API keys into the client
> JavaScript bundle (all provider keys are now server-side environment variables
> only), and rotated the affected keys in project `gen-lang-client-0670164873`.
> I have also applied HTTP-referrer and API-method restrictions to the new keys.

## 5. History purge log

- Tool: `git filter-repo --replace-text` (replacements file temp-only, never committed)
- Strings scrubbed across all refs: `***REMOVED***`, `***REMOVED***`, `***REMOVED***`,
  `***REMOVED***`, `***REMOVED***`, `your_openrouter_api_key`
  replaced with `***REMOVED***`
- Force-pushed: `origin main` (+ secondary remote `lovable main`)
- Post-purge verification: rev-list grep for all six patterns returns zero hits

**File:** `config/render.yaml` — 4 mappings (`VITE_GEMINI_API_KEY`,
`VITE_OPENROUTER_API_KEY`, `VITE_OPENAI_API_KEY`, `VITE_ANTHROPIC_API_KEY`).
**File:** `client/src/vite-env.d.ts` — typed the same unsafe `VITE_*_API_KEY` vars.

### Verified clean (no action needed)

- No full-length live keys in the working tree (scans for `AIzaSy(20+)`,
  `sk-or-v1-...`, Supabase JWTs, Groq `gsk_` all zero hits).
- `.env` is gitignored/untracked; only placeholder `.env.example` is tracked.
- `dist/` gitignored; `SETUP_COMPLETE.txt` and `netlify.toml` contain no secrets.
- All AI API calls originate server-side only; the frontend never calls providers.
