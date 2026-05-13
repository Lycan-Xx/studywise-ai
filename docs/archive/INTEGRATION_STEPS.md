# Integration Steps - Course-Centric Refactor

## Step 1: Deploy Database Schema

1. Open Supabase SQL Editor
2. Copy entire contents of `docs/new_course_centric_schema.sql`
3. Execute the script
4. Verify all tables created successfully

## Step 2: Update Backend Routes

Add these imports and routes to `server/index.ts`:

```typescript
import { CourseController } from './controllers/CourseController';
import { ModuleTestController } from './controllers/ModuleTestController';
import { ResultsController } from './controllers/ResultsController';

// Course routes
app.post('/api/courses/generate', authMiddleware, CourseController.generateCourse);
app.get('/api/courses', authMiddleware, CourseController.getUserCourses);
app.get('/api/courses/:courseId', authMiddleware, CourseController.getCourse);
app.get('/api/courses/:courseId/modules', authMiddleware, CourseController.getCourseModules);
app.delete('/api/courses/:courseId', authMiddleware, CourseController.deleteCourse);

// Module test routes
app.post('/api/courses/:courseId/modules/:moduleId/test/generate', authMiddleware, ModuleTestController.generateModuleTest);
app.post('/api/tests/:testId/submit', authMiddleware, ModuleTestController.submitTest);
app.post('/api/tests/:testId/insights/request', authMiddleware, ModuleTestController.requestInsights);

// Results routes
app.get('/api/results/courses', authMiddleware, ResultsController.getCourseResults);
app.get('/api/results/courses/:courseId/modules', authMiddleware, ResultsController.getModuleResults);
app.get('/api/tests/:testId/result', authMiddleware, ResultsController.getTestResult);
app.get('/api/tests/:testId/questions', authMiddleware, ResultsController.getTestQuestions);
app.get('/api/tests/:testId/answers', authMiddleware, ResultsController.getTestAnswers);
app.get('/api/tests/:testId/stats', authMiddleware, ResultsController.getTestStats);

// User profile routes
app.get('/api/user/profile', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

app.put('/api/user/profile', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(req.body)
      .eq('id', req.user.id)
      .select()
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile' });
  }
});
```

## Step 3: Add Supabase Config

Create `server/config/supabase.ts` if it doesn't exist:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);
```

## Step 4: Update Frontend Routes

Add these routes to `client/src/App.tsx`:

```typescript
import CourseView from './pages/course-view';
import TestSummary from './pages/test-summary';
import ResultsNew from './pages/results-new';
import SettingsNew from './pages/settings-new';
import LibraryNew from './pages/library-new';

// Inside your router:
<Route path="/courses/:courseId" component={CourseView} />
<Route path="/tests/:testId/summary" component={TestSummary} />
<Route path="/results" component={ResultsNew} />
<Route path="/settings" component={SettingsNew} />
<Route path="/library" component={LibraryNew} />
```

## Step 5: Replace Dashboard

```bash
# Backup old dashboard
mv client/src/pages/dashboard.tsx client/src/pages/dashboard-old.tsx

# Use new dashboard
mv client/src/pages/dashboard-new.tsx client/src/pages/dashboard.tsx
```

## Step 6: Replace Other Pages

```bash
# Backup and replace results
mv client/src/pages/results.tsx client/src/pages/results-old.tsx
mv client/src/pages/results-new.tsx client/src/pages/results.tsx

# Backup and replace settings
mv client/src/pages/settings.tsx client/src/pages/settings-old.tsx
mv client/src/pages/settings-new.tsx client/src/pages/settings.tsx

# Backup and replace library
mv client/src/pages/library.tsx client/src/pages/library-old.tsx
mv client/src/pages/library-new.tsx client/src/pages/library.tsx
```

## Step 7: Update Test Taking Flow

Update `client/src/pages/test-taking.tsx` to use the new flow:

```typescript
import { useParams, useNavigate } from 'wouter';
import { useEffect, useState } from 'react';
import { TestPreviewModal } from '../components/test/TestPreviewModal';

export default function TestTaking() {
  const { courseId, moduleId } = useParams();
  const navigate = useNavigate();
  const [showPreview, setShowPreview] = useState(false);
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  
  useEffect(() => {
    generateTest();
  }, [moduleId]);
  
  const generateTest = async () => {
    const response = await fetch(
      `/api/courses/${courseId}/modules/${moduleId}/test/generate`,
      { method: 'POST' }
    );
    const data = await response.json();
    setTest(data.test);
    setQuestions(data.questions);
    
    // Check if should show preview
    const profile = await fetch('/api/user/profile').then(r => r.json());
    if (profile.show_test_preview_modal) {
      setShowPreview(true);
    }
  };
  
  const handleSubmit = async (answers, timeSpent) => {
    const response = await fetch(`/api/tests/${test.id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers, timeSpent }),
    });
    const data = await response.json();
    navigate(`/tests/${test.id}/summary`);
  };
  
  return (
    <>
      <TestPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onStart={() => setShowPreview(false)}
        moduleName={/* module name */}
        questionCount={questions.length}
        estimatedTime={questions.length * 2}
        sampleQuestion={questions[0]}
      />
      
      {/* Your existing test taking UI */}
    </>
  );
}
```

## Step 8: Add Missing UI Components

If you don't have these shadcn/ui components, add them:

```bash
# Dialog component
npx shadcn-ui@latest add dialog

# Or manually create if needed
```

## Step 9: Update Environment Variables

Ensure these are set in `.env`:

```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Providers (at least one required)
GEMINI_API_KEY=your_gemini_key
OPENROUTER_API_KEY=your_openrouter_key  # Optional
HUGGINGFACE_API_TOKEN=your_hf_token     # Optional
```

## Step 10: Test the Complete Flow

1. **Upload & Generation:**
   - Go to dashboard
   - Upload a PDF/DOCX file
   - Add optional context
   - Click "Generate Course"
   - Wait for loading overlay
   - Verify redirect to course view

2. **Course Viewing:**
   - Check sidebar shows modules
   - Click different modules
   - Verify content displays
   - Check "Take Test" button works

3. **Test Taking:**
   - Click "Take Test"
   - Verify preview modal shows (first time)
   - Complete test
   - Submit answers

4. **Test Summary:**
   - View score and averages
   - Review questions
   - Request AI insights
   - Verify insights appear

5. **Results Tab:**
   - View all courses
   - Expand course
   - Check module results
   - Verify calculations

6. **Settings:**
   - Update preferences
   - Save settings
   - Verify they apply to new tests

7. **Library:**
   - View all courses
   - Click course to open
   - Delete course (test)

## Step 11: Deploy

### Backend (Render)
```bash
git add .
git commit -m "Implement course-centric refactor"
git push origin main
```

Render will auto-deploy if connected to GitHub.

### Frontend (Netlify/Vercel)
```bash
npm run build
# Deploy dist/public folder
```

Or use automatic deployment from GitHub.

## Troubleshooting

### Issue: "Course not found"
- Check Supabase RLS policies are enabled
- Verify user is authenticated
- Check course belongs to user

### Issue: "AI parsing failed"
- Check AI provider API keys
- Verify fallback mode works
- Check error logs

### Issue: "Questions not generating"
- Check module content exists
- Verify user profile has preferences
- Check AI service logs

### Issue: "Results not showing"
- Verify test was submitted
- Check test_results table has data
- Verify analytics views are working

## Rollback Plan

If issues arise:

1. **Revert routes:**
   ```typescript
   // Comment out new routes in App.tsx
   // Uncomment old routes
   ```

2. **Restore old pages:**
   ```bash
   mv client/src/pages/dashboard-old.tsx client/src/pages/dashboard.tsx
   # Repeat for other pages
   ```

3. **Database:**
   - Keep old schema backup
   - Can restore from Supabase backups
   - Note: Will lose new data

## Success Checklist

- [ ] Schema deployed successfully
- [ ] Backend routes added
- [ ] Frontend routes updated
- [ ] Dashboard replaced
- [ ] Course view working
- [ ] Test generation working
- [ ] Test submission working
- [ ] Test summary showing
- [ ] Results organized by course
- [ ] Settings saving preferences
- [ ] Library showing courses
- [ ] AI insights generating
- [ ] Fallback mode working
- [ ] All pages responsive
- [ ] No console errors
- [ ] Deployed to production

## Next Steps

After successful integration:

1. Monitor error logs
2. Gather user feedback
3. Optimize AI prompts
4. Add more question types
5. Implement spaced repetition
6. Add export functionality
7. Mobile app consideration
