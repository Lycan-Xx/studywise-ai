# AI Provider Setup & Troubleshooting

## Current Issue
Your app is failing to generate questions because:
1. **OpenRouter API key is invalid or expired**
2. The system is trying OpenRouter providers before falling back to Gemini

## Solutions

### Option 1: Use Gemini Only (Recommended - Free & Reliable)

1. **Get a Gemini API Key:**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy the key

2. **Set Environment Variable:**
   
   Create or update `.env` file in your project root:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

   Or if using Vite environment variables:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Remove or Fix OpenRouter Key:**
   
   Either remove the OpenRouter key:
   ```env
   # OPENROUTER_API_KEY=  # Comment out or remove
   ```
   
   Or set it to the placeholder to disable:
   ```env
   OPENROUTER_API_KEY=your_openrouter_api_key
   ```

4. **Restart your server:**
   ```bash
   # Stop the server (Ctrl+C) and restart
   npm run dev
   ```

### Option 2: Fix OpenRouter Key

1. **Get a valid OpenRouter API Key:**
   - Go to [OpenRouter.ai](https://openrouter.ai/)
   - Sign up and get your API key
   - Add credits if needed

2. **Update Environment Variable:**
   ```env
   OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
   ```

3. **Restart your server**

### Option 3: Use Both (Best for Reliability)

Configure both providers:
```env
GEMINI_API_KEY=your_gemini_key
OPENROUTER_API_KEY=your_openrouter_key
```

The system will:
- Try Gemini first (priority 1)
- Fall back to OpenRouter if Gemini fails
- Automatically disable providers with invalid keys

## What I Fixed

1. **Provider Selection Priority:**
   - Gemini providers are now always prioritized first
   - OpenRouter providers are used as fallback

2. **Error Handling:**
   - When OpenRouter fails with auth errors, all OpenRouter providers are disabled
   - System automatically falls back to Gemini
   - Better error messages showing which providers are available

3. **Retry Logic:**
   - Improved retry loop that skips already-attempted providers
   - Faster fallback (1-3 seconds instead of 10 seconds)
   - Better logging to see which providers are being tried

## Verification

After setting up your API keys, check the server console on startup. You should see:

```
✅ Gemini providers initialized
ℹ️ OpenRouter API key not configured - OpenRouter providers disabled
🤖 Multi-provider AI service initialized with 2 providers
```

Or if OpenRouter is configured:
```
✅ Gemini providers initialized
✅ OpenRouter providers initialized
🤖 Multi-provider AI service initialized with 6 providers
```

## Testing

1. Try generating questions from the dashboard
2. Check server console logs - you should see:
   ```
   🔄 Attempt 1/5: Using Gemini Flash
   ✅ Successfully generated 10 questions with Gemini Flash
   ```

## Troubleshooting

### "No AI providers configured"
- Make sure `GEMINI_API_KEY` is set in your `.env` file
- Restart the server after adding the key
- Check that the key is valid (not expired)

### "OpenRouter API key is invalid"
- Either fix the OpenRouter key (Option 2)
- Or disable it (Option 1)
- The system will automatically use Gemini as fallback

### Still not working?
1. Check server console for provider status logs
2. Verify environment variables are loaded: `console.log(process.env.GEMINI_API_KEY)`
3. Make sure you restarted the server after changing `.env`

