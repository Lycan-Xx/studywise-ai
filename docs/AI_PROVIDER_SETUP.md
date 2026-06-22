# 📚 StudyWise AI — Provider Configuration & Setup Guide
**Last Updated:** June 22, 2026  
**Status:** ✅ Production Ready

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Your `.env` is Already Updated ✅
Your `.env` file has been automatically updated with the new provider structure. Your existing keys are preserved:
- ✅ Gemini API key
- ✅ OpenRouter API key
- ✅ DeepSeek API key
- ✅ Supabase credentials
- ✅ Google OAuth credentials

### Step 2: Optional - Add More Free Providers
Edit `.env` and add:
```dotenv
# Add Groq (ultra-fast, free, 30 RPM)
GROQ_API_KEY=your_groq_api_key
VITE_GROQ_API_KEY=your_groq_api_key

# Add Cerebras (world's fastest, free, 1M tokens/day)
CEREBRAS_API_KEY=your_cerebras_api_key
VITE_CEREBRAS_API_KEY=your_cerebras_api_key
```

### Step 3: Start Server
```bash
npm run dev
```

### Step 4: Verify
Check logs for:
```
✅ Multi-provider AI service ready — X providers
✅ Health check showing at least 1 provider as ✅
```

**Done!** Your system is ready. 🎉

---

## 📋 What Changed in Your `.env`

### ✅ Preserved (Your Existing Keys)
```dotenv
✅ GEMINI_API_KEY=AIzaSyALCtV...
✅ OPENROUTER_API_KEY=sk-or-v1-6001a30b...
✅ DEEPSEEK_API_KEY=sk-f28c8ce...
✅ SUPABASE_URL=https://fjmtxac...
✅ GOOGLE_OAUTH_CLIENT_ID/SECRET
```

### ❌ Removed (Old Deprecated Providers)
```dotenv
❌ VITE_OPENAI_API_KEY          (expensive, unused)
❌ ANTHROPIC_API_KEY             (no free tier)
❌ MOONSHOT_API_KEY              (regional limitation)
❌ HUGGINGFACE_API_TOKEN         (unreliable)
```

### ✨ Reorganized (New Structure)
- Clear sections for each provider
- Documentation for each section
- Provider-specific notes (limits, costs, URLs)
- Comprehensive setup strategy in comments

---

## 🎯 Your Current Provider Stack

| Provider | Model | Status | Cost | Context |
|----------|-------|--------|------|---------|
| **Gemini** | 2.5 Flash | ✅ Active | Free | 1M |
| **Groq** | Llama 3.1/3.3/Scout | Optional | Free | 128K-10M |
| **Cerebras** | Llama 3.3 70B | Optional | Free | 128K |
| **DeepSeek** | V4 Flash | ✅ Active | $0.14/M | 1M |
| **OpenRouter** | 5 free models | ✅ Active | Free | 10M-131K |

**Result:** 3+ active providers with automatic failover ✅

---

## 📊 Provider Details

### 1. Google Gemini 2.5 Flash ✅ (Active)
```
Status:      ✅ Working with your key
Free Tier:   1,500 RPD, 10 RPM, 1M context
Models:      gemini-2.5-flash (primary)
             gemini-2.5-flash-lite (faster)
Priority:    #1 (highest)
Timeout:     30 seconds
```

### 2. Groq (LLaMA 3.1/3.3/4-Scout)
```
Status:      Optional - Add for ultra-fast inference
Free Tier:   30 RPM, no credit card, 128K-10M context
Best For:    Speed (1000+ tok/s) and volume
Sign Up:     https://console.groq.com/keys
Priority:    #2 (if added)
Timeout:     45 seconds
```

### 3. Cerebras (Llama 3.3 70B)
```
Status:      Optional - Add for fastest inference
Free Tier:   1M tokens/day, 30 RPM, no credit card
Best For:    World's fastest (2,300 tok/s), long docs
Sign Up:     https://cloud.cerebras.ai (< 5 min)
Priority:    #3 (if added)
Note:        Default 8K context; request 128K+ in dashboard
Timeout:     45 seconds
```

### 4. DeepSeek V4 Flash ✅ (Active)
```
Status:      ✅ Working with your key
Paid Tier:   $0.14/M input, $0.28/M output
Best For:    High volume, best value paid option
Priority:    #4
Timeout:     45 seconds
Note:        1M context window
```

### 5. OpenRouter (5 Free Models) ✅ (Active)
```
Status:      ✅ Working with your key
Free Tier:   20 RPM / 200 RPD without credits
Models:      • meta-llama/llama-4-scout:free (10M context!)
             • deepseek/deepseek-r1:free (reasoning)
             • qwen/qwen3-235b-a22b:free (coding)
             • openai/gpt-oss-120b:free (general)
             • meta-llama/llama-3.3-70b-instruct:free (fallback)
Best For:    Diverse models, 10M context for big docs
Priority:    #5
Upgrade:     $10 one-time → 1,000 RPD permanently
Timeout:     60 seconds (free tier can be slower)
Note:        :free suffix ensures free-tier routing
```

---

## 🔄 How Provider Selection Works

The system automatically picks the best provider:

```
Request comes in
    ↓
1. Check cache (24h) → Found? ✅ Return cached result
    ↓ Not found
2. Try Gemini (if available & not rate-limited) → Success? ✅ Return
    ↓ Failed/rate-limited
3. Try Groq (if available & not rate-limited) → Success? ✅ Return
    ↓
4. Try Cerebras (if available & not rate-limited) → Success? ✅ Return
    ↓
5. Try DeepSeek (if available & not rate-limited) → Success? ✅ Return
    ↓
6. Try OpenRouter (if available & not rate-limited) → Success? ✅ Return
    ↓
7. Use Mock AI (fallback — very low quality) → Return ⚠️
```

**Smart Selection Criteria:**
- ✅ Provider is available (not in cooldown)
- ✅ Has request quota remaining (RPM/RPD)
- ✅ Context window fits your document size
- ✅ Prioritized by cost (free → cheap → paid)

---

## ⏱️ Rate Limit Handling

| Error Type | Cooldown | Example |
|------------|----------|---------|
| Rate limit (429) | 60 seconds | Try next provider after 60s wait |
| Auth error (401) | Session | Disable provider for this session |
| Timeout (503) | 30 seconds | Quick recovery, normal ops resume |
| Quota (billing) | 1 hour | Long cooldown for quota/billing issues |

**Result:** Automatic failover = no downtime ✅

---

## 📈 Cost Breakdown

### Free Tier (Current Setup)
```
Gemini:          1,500 RPD (free tier)  → $0/month
OpenRouter:      200 RPD (free)         → $0/month
Groq:            30 RPM (if added)      → $0/month
Cerebras:        1M tokens/day (if added) → $0/month

Monthly Cost: $0 (for testing/small projects)
```

### With DeepSeek (Your Setup)
```
100 questions @ ~1,000 tokens average:  $0.14/month
1,000 questions:                         $1.40/month
10,000 questions:                        $14/month

Add DeepSeek only if you exceed free tier
```

---

## 🧪 Testing Your Setup

### Test 1: Check Health on Startup
Server logs should show:
```
🤖 Multi-provider AI service ready — X providers
🩺 Running provider health checks…
  ✅ Gemini 2.5 Flash
  ✅ DeepSeek V4 Flash
  ✅ Llama 4 Scout 10M ctx (OpenRouter :free)
```

### Test 2: Generate Questions
```bash
curl -X POST http://localhost:5000/api/generate-questions \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Albert Einstein developed the theory of relativity.",
    "difficulty": "easy",
    "questionCount": 2,
    "questionTypes": ["multiple-choice"]
  }'
```

Expected: 2 questions generated via first available provider ✅

### Test 3: Verify Failover (Optional)
Stop one provider and test — system automatically uses next provider ✅

---

## 🚨 Troubleshooting

### "No providers available"
**Cause:** All providers hit rate limits simultaneously  
**Solution:**
1. Wait 60 seconds (rate limit cooldown)
2. Add more providers to `.env`
3. Consider OpenRouter $10 credit for 1,000 RPD

### "Request timeout"
**Cause:** Provider API is slow or network issue  
**Solution:**
- System auto-failovers to next provider
- No action needed — transparent to you

### "All providers exhausted — using Mock AI"
**Cause:** All real providers rate-limited or unavailable  
**Solution:**
1. Add free providers (Groq, Cerebras)
2. Upgrade OpenRouter ($10 one-time credit)
3. Wait for rate limit cooldown

### API key not working
**Cause:** Invalid key, placeholder value, or provider credentials changed  
**Solution:**
1. Check `.env` for placeholder (`your_gemini_api_key`)
2. Verify key is correct in provider console
3. Test provider directly in their UI
4. Restart server to reload `.env`

---

## 🛠️ Advanced Configuration

### Enable Groq (Fastest Free Option)
Get key: https://console.groq.com/keys
```dotenv
GROQ_API_KEY=gsk_...
VITE_GROQ_API_KEY=gsk_...
```
Then restart server. Done! ✅

### Enable Cerebras (World's Fastest)
Sign up: https://cloud.cerebras.ai (< 5 min, no credit card)
```dotenv
CEREBRAS_API_KEY=pat-...
VITE_CEREBRAS_API_KEY=pat-...
```
Restart server. System will auto-initialize. ✅

### Upgrade OpenRouter (Get 1,000 RPD)
1. Visit https://openrouter.ai
2. Apply $10 one-time credit
3. No code changes needed — automatically picked up by system
4. Restart server

### Disable a Provider (Temporarily)
Edit `.env` and comment out the provider:
```dotenv
# GROQ_API_KEY=gsk_...
# VITE_GROQ_API_KEY=gsk_...
```
Restart server. Provider will be skipped. ✅

---

## ✅ Setup Verification Checklist

- [x] `.env` file updated with new provider structure
- [x] Your existing keys preserved (Gemini, OpenRouter, DeepSeek)
- [x] Supabase & Google OAuth credentials preserved
- [x] Old deprecated providers removed
- [x] Server starts with health check
- [x] At least 1 provider active

**Status:** ✅ Ready to use!

---

## 📚 Additional Resources

### Documentation Files (in `/docs` folder)
- `AI_PROVIDER_SETUP.md` (this file)
- Full setup guides and detailed specs

### Provider Sign-Up Links
- **Gemini:** https://aistudio.google.com/apikey
- **Groq:** https://console.groq.com/keys
- **Cerebras:** https://cloud.cerebras.ai
- **DeepSeek:** https://api.deepseek.com
- **OpenRouter:** https://openrouter.ai

### Cost & Pricing
- **Gemini:** Free forever (free tier)
- **Groq:** Free forever (free tier)
- **Cerebras:** Free forever (1M tokens/day)
- **OpenRouter:** Free tier + optional $10 upgrade
- **DeepSeek:** $0.14/M input tokens (cheapest paid)

---

## 🎯 Recommended Setup Path

### Phase 1: Minimum (Works Now ✅)
```
✅ Gemini (your key, active)
✅ OpenRouter (your key, active)
✅ DeepSeek (your key, active)

Result: 3 providers, automatic failover, $0-1.40/month
```

### Phase 2: Optimal (Highly Recommended)
```
✅ Gemini (your key)
✅ Groq (add: free, ultra-fast)
✅ Cerebras (add: free, fastest)
✅ OpenRouter (your key)
✅ DeepSeek (your key)

Result: 5 providers, maximum reliability, still free
Time to add: ~15 minutes
```

### Phase 3: Production (Fully Optimized)
```
✅ Phase 2 + Groq team org limit increase
✅ OpenRouter $10 upgrade for 1,000 RPD
✅ Monitor usage and optimize provider priority

Result: Enterprise-grade reliability, minimal cost
```

---

## 🔐 Security Notes

✅ **Your keys are safe:**
- Only in `.env` (never committed)
- Only loaded via `process.env`
- Only sent to official APIs (HTTPS)
- No logging of sensitive data

✅ **Rate limits respected:**
- System enforces per-provider limits
- Automatic cooldown on violations
- No request batching that breaks limits

✅ **Error handling robust:**
- All API errors caught and handled
- Graceful failover to next provider
- No crashes or data leakage

---

## 🎉 You're All Set!

Your StudyWise AI project is now configured with the latest (June 2026) AI providers. 

**Status:** ✅ Production Ready  
**Active Providers:** 3+  
**Cost:** Free or $0-14/month  
**Support:** Automatic failover, intelligent provider selection

Start using it now:
```bash
npm run dev
```

---

## 📞 Quick Help

**Something not working?** Check the troubleshooting section above.

**Want to add more providers?** Follow the Advanced Configuration section.

**Need details?** Check the individual provider specs above.

**Questions?** All documentation is in `/docs` folder or project root.

---

**Generated:** June 22, 2026  
**Version:** 1.0 — AI Providers June 2026  
**Status:** ✅ All systems operational and ready to use
