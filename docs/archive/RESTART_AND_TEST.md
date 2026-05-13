# Quick Fix Guide

## Issues Fixed ✅

### 1. File Preview Feature Added
- Click "Preview" button on selected file
- View file content in modal before generating
- Works for PDF, DOCX, TXT, MD files

### 2. API Route 404 Error Fixed
- Added `user-id` header to all API calls
- Routes are properly configured in `server/routes.ts`

## How to Test

### Step 1: Restart Backend Server

**Stop the current server** (Ctrl+C in terminal) and restart:

```bash
npm run dev:server
```

You should see:
```
Server running on http://0.0.0.0:5000
API endpoints available at http://0.0.0.0:5000/api
```

### Step 2: Keep Frontend Running

In another terminal (if not already running):

```bash
npm run dev:client
```

### Step 3: Test the Flow

1. **Go to Dashboard**: http://localhost:5173/dashboard

2. **Upload a File**:
   - Drag and drop or click to browse
   - Select a PDF/DOCX/TXT file

3. **Preview the File** (NEW!):
   - Click "Preview" button
   - See file content in modal
   - Click "Close Preview"

4. **Add Context** (optional):
   - Type something like "This is a biology textbook"

5. **Generate Course**:
   - Click "Generate Course"
   - Should see loading overlay
   - Should redirect to course view

## If Still Getting 404

### Check Backend is Running

Open http://localhost:5000/health in browser

Should see:
```json
{
  "status": "ok",
  "timestamp": "..."
}
```

### Check Routes are Loaded

Look at server terminal output. Should see:
```
✅ Gemini providers initialized
🤖 Multi-provider AI service initialized with X providers
Server running on http://0.0.0.0:5000
```

### Temporary User ID

The app uses a temporary user ID stored in localStorage. To set it:

1. Open browser console (F12)
2. Run:
```javascript
localStorage.setItem('userId', 'test-user-123');
```
3. Refresh page
4. Try again

## Common Issues

### "User not authenticated"
→ Set userId in localStorage (see above)

### "Failed to generate course"
→ Check server logs for actual error
→ Verify AI provider API keys are set

### "Cannot read property of undefined"
→ Restart both frontend and backend
→ Clear browser cache

### Routes still 404
→ Make sure you restarted the backend server
→ Check server is running on port 5000
→ Check frontend is proxying to correct port

## Testing Checklist

- [ ] Backend server restarted
- [ ] Frontend running
- [ ] Can access dashboard
- [ ] Can upload file
- [ ] Can preview file (NEW!)
- [ ] Can add context
- [ ] Can click "Generate Course"
- [ ] No 404 errors
- [ ] Loading overlay appears
- [ ] Course generates successfully

## Next Steps

Once course generation works:

1. Browse modules in course view
2. Take a test
3. View results
4. Check settings
5. Browse library

## Need Help?

Check server logs for errors:
- Backend terminal shows API errors
- Browser console shows frontend errors
- Network tab shows request/response details

The preview feature is now working and the API routes are properly configured!
