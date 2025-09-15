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
4. Redirect URIs:
   - `http://<your-replit-url>/oauth2callback`
   - Replace `<your-replit-url>` with actual Replit URL

### 4.4 Environment Variable Setup
Store in Replit environment:
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`

## 5. Supabase Site URL Configuration

### 5.1 Allowed URLs
- Add primary authorization link to site URL configuration
- Ensure callback URLs are correctly configured

## 6. Supabase Storage (Optional)

### 6.1 File Upload Bucket
- Create bucket: "study-materials"

## 7. Security Recommendations

### 7.1 Callback URL Whitelist
- Whitelist Supabase callback URL in Google Console
- Verify redirect URI matches exactly

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