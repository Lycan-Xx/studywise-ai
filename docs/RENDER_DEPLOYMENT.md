# StudyWise AI Backend - Render Deployment Guide

This guide will help you deploy your StudyWise AI backend to Render as a web service.

## Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **API Keys**: All your API keys and configuration ready

## Step 1: Prepare Your Environment Variables

### Create Environment Secrets in Render

Go to your Render dashboard and create the following environment secrets:

1. **GEMINI_API_KEY**: Your Google Gemini API key
2. **VITE_GEMINI_API_KEY**: Same as above (for client-side use)
3. **OPENROUTER_API_KEY**: Your OpenRouter API key (optional)
4. **VITE_OPENROUTER_API_KEY**: Same as above
5. **OPENAI_API_KEY**: Your OpenAI API key (optional)
6. **VITE_OPENAI_API_KEY**: Same as above
7. **ANTHROPIC_API_KEY**: Your Anthropic API key (optional)
8. **VITE_ANTHROPIC_API_KEY**: Same as above
9. **VITE_SUPABASE_URL**: Your Supabase project URL
10. **VITE_SUPABASE_ANON_KEY**: Your Supabase anonymous key
11. **GOOGLE_OAUTH_CLIENT_ID**: Your Google OAuth client ID
12. **GOOGLE_OAUTH_CLIENT_SECRET**: Your Google OAuth client secret
13. **PORT**: This will be automatically set by Render

## Step 2: Deploy Using Render Blueprint

### Option A: Blueprint Deployment (Recommended)

1. **Connect your GitHub repository** to Render
2. **Create a new Blueprint** from your repository
3. **Use the `render.yaml` file** that's already in your repository
4. **Configure environment secrets** as listed above
5. **Deploy**

The `render.yaml` file will automatically:
- Set up a Node.js web service
- Install dependencies with `npm install`
- Start the server with `npx tsx server/index.ts`
- Configure all environment variables

### Option B: Manual Web Service Deployment

If you prefer manual setup:

1. **Create a new Web Service** in Render
2. **Connect your GitHub repository**
3. **Configure the service**:
   - **Runtime**: Node.js
   - **Build Command**: `npm install`
   - **Start Command**: `npx tsx server/index.ts`
4. **Add environment variables** as secrets
5. **Deploy**

## Step 3: Configure Your Frontend

After deployment, update your frontend to use the Render backend URL:

1. **Get your Render service URL** (e.g., `https://studywise-ai-backend.onrender.com`)
2. **Update your client configuration** to point API calls to this URL
3. **Update CORS settings** if needed in your server

## Step 4: Database Setup

Make sure your Supabase database has the correct schema:

1. **Run the database schema** from `apply_schema.sql` in your Supabase SQL editor
2. **Verify tables are created**: `test_results`, `user_profiles`, etc.
3. **Check RLS policies** are properly configured

## Step 5: Test Your Deployment

### Health Check
Visit: `https://your-service.onrender.com/health`

### API Endpoints
- `POST /api/tests/generate` - Generate questions
- `POST /api/tests/flashcards` - Generate flashcards
- `POST /api/tests/:testId/results` - Save test results
- `POST /api/tests/:testId/insights` - Generate insights

## Troubleshooting

### Common Issues

1. **Port Issues**: Render automatically sets the `PORT` environment variable. Your server uses `process.env.PORT || 5000`.

2. **Environment Variables**: Make sure all secrets are properly configured in Render.

3. **Build Failures**: Check that all dependencies are listed in `package.json`.

4. **CORS Issues**: Your server has CORS enabled for all origins in development. For production, you may want to restrict this.

5. **Database Connection**: Ensure your Supabase configuration is correct.

### Logs and Debugging

- **View logs** in your Render dashboard under the service
- **Check environment variables** are loaded correctly
- **Verify API keys** are accessible

## Performance Optimization

### For Production

1. **Enable caching** for AI responses
2. **Use connection pooling** for database connections
3. **Implement rate limiting** for API endpoints
4. **Add monitoring** and error tracking

### Render-Specific Optimizations

1. **Use Render's persistent disks** if you need file storage
2. **Configure health checks** for automatic restarts
3. **Set up monitoring** alerts
4. **Use Render's cron jobs** for scheduled tasks if needed

## Security Considerations

1. **API Keys**: Never commit API keys to your repository
2. **Environment Variables**: Use Render's secret management
3. **CORS**: Configure appropriate CORS policies for production
4. **Authentication**: Ensure proper authentication middleware
5. **Rate Limiting**: Implement rate limiting to prevent abuse

## Cost Optimization

Render's free tier includes:
- 750 hours/month
- 1GB RAM
- 1GB disk

For production workloads, consider:
- Upgrading to paid plans for more resources
- Implementing caching to reduce API calls
- Optimizing database queries

## Support

If you encounter issues:
1. Check Render's documentation
2. Review your server logs
3. Verify environment configuration
4. Test API endpoints individually

Your StudyWise AI backend should now be successfully deployed and ready to handle requests!
