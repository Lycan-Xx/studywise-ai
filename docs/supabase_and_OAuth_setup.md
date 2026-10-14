# StudyWise AI: Project Setup and Configuration Guide

## 1. Supabase Project Setup

### 1.1 Create Supabase Project
- Visit [supabase.com](https://supabase.com)
- Create a new project
- Note your Project URL and anon public key

### 1.2 Environment Configuration
1. Locate `client/.env.example`
2. Copy to `client/.env.local`
3. Add Supabase credentials:
   ```
   SUPABASE_URL=your_project_url
   SUPABASE_ANON_KEY=your_anon_key
   ```

### 1.3 Optional API Key Configuration
- Add AI API keys for:
  - Gemini
  - OpenAI

## 2. Database Schema Setup

### 2.1 Database Configuration
- Open Supabase dashboard
- Navigate to SQL Editor
- Run `database_schema.sql`

## 3. Authentication Configuration

### 3.1 Supabase Authentication Settings
- Go to Authentication > Settings
- Enable email authentication
- Optional: Enable Google OAuth provider

## 4. Google OAuth Configuration

### 4.1 Google Cloud Project Setup
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project

### 4.2 OAuth Consent Screen Configuration
- Navigate: APIs & Services > OAuth consent screen
- Complete required information

### 4.3 OAuth 2.0 Credentials Creation
1. Go to: APIs & Services > Credentials
2. Click "Create Credentials" > "OAuth client ID"
3. Application Type: Web application
4. **Authorised JavaScript origins** — add one line per origin your app runs on:
   - `http://localhost:8080` (Vite dev server — see `config/vite.config.ts`)
   - `http://localhost:5000` (Express API, if you ever serve the client from it)
   - `https://<your-netlify-site>.netlify.app` (production frontend)
   - NOTE: with the Supabase Auth flow (section 4.4 below) Google never talks to
     your backend directly — origins are only needed if you keep a direct
     Google Identity Services button. Do NOT add secrets here.
5. **Authorised redirect URIs:**
   - Google login in this app goes through **Supabase Auth**
     (`supabase.auth.signInWithOAuth({ provider: 'google' })`), so the URI Google
     redirects to is Supabase's callback, NOT your app:
     `https://<your-project-ref>.supabase.co/auth/v1/callback`
     (find your exact ref in Supabase Dashboard > Project Settings > General)
   - For local Supabase CLI development only, also add:
     `http://localhost:54321/auth/v1/callback`
   - The old Replit-style `/oauth2callback` URI below is obsolete — do not use it.

### 4.4 Environment Variable Setup
Store in Replit environment:
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`

## 5. Supabase Site URL Configuration

### 5.1 Allowed URLs (Supabase Dashboard > Authentication > URL Configuration)
- **Site URL:** your production frontend origin
  (e.g. `https://<your-netlify-site>.netlify.app`; use `http://localhost:8080` for dev)
- **Redirect URLs (allowlist):** add every URL your app passes as `redirectTo`
  in `AuthContext.tsx` — Supabase rejects anything not listed here:
  - `http://localhost:8080/auth?mode=signup&step=2&oauth=true`
  - `http://localhost:8080/auth?mode=reset&type=recovery`
  - `https://<your-netlify-site>.netlify.app/auth?mode=signup&step=2&oauth=true`
  - `https://<your-netlify-site>.netlify.app/auth?mode=reset&type=recovery`
- Ensure callback URLs are correctly configured

## 6. Supabase Storage (Optional)

### 6.1 File Upload Bucket
- Create bucket: "study-materials"

## 7. Security Recommendations

### 7.1 Callback URL Whitelist
- Whitelist the Supabase callback URL (section 4.3) in Google Console
- Whitelist your app's `/auth` URLs in Supabase (section 5.1)
- Verify redirect URI matches exactly (scheme, host, port, and path all matter)

### 7.2 Environment Security
- Never commit `.env.local` to version control
- Use `.gitignore` to prevent accidental exposure

## Troubleshooting

### Common Issues
- Verify all URLs and credentials match exactly
- Check environment variable spelling
- Ensure Google Cloud and Supabase configurations align

### Support
For additional help, refer to:
- [Supabase Documentation](https://supabase.com/docs)
- [Google OAuth Guide](https://developers.google.com/identity/protocols/oauth2)

---

<b>Note:</b> Always keep your credentials confidential and rotate them periodically.