# Course-Centric Refactor Implementation Guide

## Overview

This guide walks you through implementing the complete course-centric refactor of StudyWise AI. The refactor transforms the app from test-centric to course-centric, with a minimalistic UI and improved user experience.

## Phase 1: Database Schema ✅ COMPLETED

### Step 1: Deploy New Schema

1. Open your Supabase SQL Editor
2. Copy the entire contents of `docs/new_course_centric_schema.sql`
3. Run the SQL script
4. Verify all tables are created successfully

**What this does:**
- Drops all existing user data tables (preserves auth)
- Creates new course-centric schema
- Sets up RLS policies
- Creates analytics views and helper functions

## Phase 2: Backend API ✅ COMPLETED

### Step 2: Add Course Controller

**File created:** `server/controllers/CourseController.ts`

This controller handles:
- Course generation from uploaded files
- AI parsing with fallback support
- Course and module retrieval
- Course deletion

### Step 3: Update AIService

**File updated:** `server/services/AIService.ts`

Added `parseContentIntoModules()` method that:
- Uses AI to break content into logical modules
- Returns structured module data
- Handles parsing failures gracefully

### Step 4: Add API Routes

Add these routes to your `server/index.ts`:

```typescript
import { CourseController } from './controllers/CourseController';

// Course routes
app.post('/api/courses/generate', authMiddleware, CourseController.generateCourse);
app.get('/api/courses', authMiddleware, CourseController.getUserCourses);
app.get('/api/courses/:courseId', authMiddleware, CourseController.getCourse);
app.get('/api/courses/:courseId/modules', authMiddleware, CourseController.getCourseModules);
app.delete('/api/courses/:courseId', authMiddleware, CourseController.deleteCourse);
```

## Phase 3: Frontend Stores ✅ COMPLETED

### Step 5: Create Course Store

**File created:** `client/src/stores/useCourseStore.ts`

This store manages:
- Current course and module state
- Course generation workflow
- Module navigation
- Loading states

## Phase 4: Dashboard Redesign ✅ COMPLETED

### Step 6: New Dashboard Components

**Files created:**
- `client/src/pages/dashboard-new.tsx` - Simplified upload interface
- `client/src/components/dashboard/FileUploadZone.tsx` - Drag-and-drop upload
- `client/src/components/dashboard/GenerationLoadingOverlay.tsx` - Full-screen loading

**Key features:**
- Large drag-and-drop zone
- Optional context input (500 char limit)
- Single "Generate Course" button
- Full-screen loading overlay during generation

### Step 7: Replace Old Dashboard

```bash
# Backup old dashboard
mv client/src/pages/dashboard.tsx client/src/pages/dashboard-old.tsx

# Use new dashboard
mv client/src/pages/dashboard-new.tsx client/src/pages/dashboard.tsx
```

## Phase 5: Course View (NotePreview Replacement) ✅ COMPLETED

### Step 8: Create Course View Components

**Files created:**
- `client/src/pages/course-view.tsx` - Main course viewing page
- `client/src/components/course/ModuleSidebar.tsx` - Left sidebar navigation
- `client/src/components/course/ModuleContent.tsx` - Right content area

**Key features:**
- Documentation-style layout (sidebar + content)
- Fallback warning for AI parsing failures
- Module navigation
- "Take Test" button at bottom of content
- Progress indicator

### Step 9: Add Route

Update `client/src/App.tsx`:

```typescript
import CourseView from './pages/course-view';

// Add route
<Route path="/courses/:courseId" component={CourseView} />
```

## Phase 6: Test Flow Updates (TODO)

### Step 10: Create Test Preview Modal

Create `client/src/components/test/TestPreviewModal.tsx`:

```typescript
interface TestPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: () => void;
  moduleName: string;
  questionCount: number;
  sampleQuestion?: Question;
}

export function TestPreviewModal({ ... }) {
  // Lightweight modal shown before first test only
  // Shows: module name, question count, sample question
  // Buttons: "Start Test" or "Back"
}
```

### Step 11: Update Test Generation

Create `server/controllers/ModuleTestController.ts`:

```typescript
export class ModuleTestController {
  static async generateModuleTest(req: Request, res: Response) {
    const { courseId, moduleId } = req.params;
    const userId = req.user?.id;
    
    // Get user preferences
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('default_question_type, default_difficulty, default_questions_per_module')
      .eq('id', userId)
      .single();
    
    // Get module content
    const { data: module } = await supabase
      .from('modules')
      .select('content')
      .eq('id', moduleId)
      .single();
    
    // Generate questions using AI
    const questions = await aiService.generateQuestions({
      content: module.content,
      difficulty: profile.default_difficulty,
      questionCount: profile.default_questions_per_module,
      questionTypes: [profile.default_question_type],
    });
    
    // Create test record
    const { data: test } = await supabase
      .from('tests')
      .insert({
        module_id: moduleId,
        user_id: userId,
        question_count: questions.questions.length,
        question_type: profile.default_question_type,
        difficulty: profile.default_difficulty,
        status: 'generated',
      })
      .select()
      .single();
    
    // Insert questions
    await supabase.from('questions').insert(
      questions.questions.map((q, index) => ({
        test_id: test.id,
        question_text: q.question,
        question_type: q.type,
        question_order: index + 1,
        options: q.options,
        correct_answer: q.correctAnswer,
        source_text: q.sourceText,
        source_offset: q.sourceOffset,
        explanation: q.explanation,
      }))
    );
    
    return res.json({ test, questions: questions.questions });
  }
}
```

### Step 12: Update Test Taking Page

Update `client/src/pages/test-taking.tsx`:

- Add breadcrumb: "Course > Module > Test"
- Always show timer (no customization)
- Use module context for all operations

### Step 13: Create Test Summary Page

Create `client/src/pages/test-summary.tsx`:

```typescript
export default function TestSummary() {
  const { testId } = useParams();
  const [result, setResult] = useState(null);
  const [insights, setInsights] = useState(null);
  const [requestingInsights, setRequestingInsights] = useState(false);
  
  // Load test result
  useEffect(() => {
    loadTestResult(testId);
  }, [testId]);
  
  const handleRequestInsights = async () => {
    setRequestingInsights(true);
    const response = await fetch(`/api/tests/${testId}/insights/request`, {
      method: 'POST',
    });
    const data = await response.json();
    setInsights(data);
    setRequestingInsights(false);
  };
  
  return (
    <div>
      {/* Header: Score, Module Average, Course Average */}
      {/* Questions Review: Show all Q&A with correct/incorrect */}
      {/* Action Buttons: Retake, Request Analysis, Back to Course */}
      {/* AI Insights Section (if requested) */}
    </div>
  );
}
```

## Phase 7: Results Tab Redesign (TODO)

### Step 14: Update Results Page

Update `client/src/pages/results.tsx`:

```typescript
export default function Results() {
  const [courses, setCourses] = useState([]);
  
  // Load all courses with performance data
  useEffect(() => {
    loadCoursesWithPerformance();
  }, []);
  
  return (
    <div>
      {courses.map(course => (
        <CourseResultCard
          key={course.id}
          course={course}
          onExpand={() => loadModuleResults(course.id)}
        />
      ))}
    </div>
  );
}

function CourseResultCard({ course, onExpand }) {
  const [expanded, setExpanded] = useState(false);
  const [modules, setModules] = useState([]);
  
  return (
    <div>
      {/* Course title, progress, best score, average, last studied */}
      <button onClick={() => {
        setExpanded(!expanded);
        if (!expanded) onExpand();
      }}>
        {expanded ? 'Collapse' : 'Expand'}
      </button>
      
      {expanded && (
        <div>
          {modules.map(module => (
            <ModuleResultCard key={module.id} module={module} />
          ))}
        </div>
      )}
    </div>
  );
}
```

## Phase 8: Settings Page (TODO)

### Step 15: Add Question Generation Settings

Update `client/src/pages/settings.tsx`:

```typescript
export default function Settings() {
  const [profile, setProfile] = useState(null);
  
  return (
    <div>
      <section>
        <h2>Question Generation</h2>
        
        <div>
          <label>Question Type</label>
          <RadioGroup value={profile.default_question_type}>
            <Radio value="mcq">Multiple Choice</Radio>
            <Radio value="true_false">True/False</Radio>
            <Radio value="mixed">Mixed</Radio>
          </RadioGroup>
        </div>
        
        <div>
          <label>Difficulty Level</label>
          <Select value={profile.default_difficulty}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </Select>
        </div>
        
        <div>
          <label>Questions Per Module</label>
          <Input
            type="number"
            min={5}
            max={50}
            value={profile.default_questions_per_module}
          />
        </div>
        
        <Button onClick={saveSettings}>Save Settings</Button>
      </section>
    </div>
  );
}
```

## Phase 9: Library Tab Update (TODO)

### Step 16: Update Library to Show Courses

Update `client/src/pages/library.tsx`:

```typescript
export default function Library() {
  const [courses, setCourses] = useState([]);
  
  return (
    <div>
      <h1>My Courses</h1>
      
      <div className="grid">
        {courses.map(course => (
          <CourseCard
            key={course.id}
            course={course}
            onClick={() => navigate(`/courses/${course.id}`)}
          />
        ))}
      </div>
    </div>
  );
}

function CourseCard({ course, onClick }) {
  return (
    <div onClick={onClick} className="cursor-pointer">
      <h3>{course.title}</h3>
      <p>{course.total_modules} modules</p>
      <p>Last studied: {formatDate(course.last_studied_at)}</p>
      {course.used_fallback && (
        <Badge variant="warning">Fallback Mode</Badge>
      )}
    </div>
  );
}
```

## Phase 10: Testing & Refinement

### Step 17: Test Complete Flow

1. **Upload & Generation:**
   - Upload a PDF/DOCX file
   - Add optional context
   - Verify loading overlay appears
   - Check course is created successfully
   - Verify modules are generated (or fallback works)

2. **Course Viewing:**
   - Navigate through modules using sidebar
   - Verify content displays correctly
   - Check fallback warning appears if needed
   - Test "Take Test" button

3. **Test Taking:**
   - Generate test from module
   - Verify questions are relevant to module
   - Complete test
   - Check results are saved

4. **Test Summary:**
   - View score and averages
   - Review questions
   - Request AI insights
   - Verify insights are generated

5. **Results Tab:**
   - View all courses
   - Expand course to see modules
   - Check calculations are correct

6. **Settings:**
   - Update question preferences
   - Verify they apply to new tests

## Key Implementation Notes

### Minimalistic UI Principles

1. **Dashboard:** Just upload + context. No clutter.
2. **Course View:** Clean sidebar + content. No pagination.
3. **Test Flow:** Lightweight modal, not full page.
4. **Settings:** Global preferences, not per-test customization.

### Data Flow

```
Upload → AI Parsing → Course + Modules → View Module → Generate Test → Take Test → Summary → Results
```

### Error Handling

- AI parsing failures → Fallback to single module
- Network errors → Show helpful messages
- Missing data → Graceful degradation

### Performance

- Cache AI responses
- Lazy load module content
- Optimize database queries with indexes

## Deployment Checklist

- [ ] Deploy new schema to Supabase
- [ ] Update backend with new controllers
- [ ] Deploy backend to Render
- [ ] Update frontend with new components
- [ ] Deploy frontend to Netlify/Vercel
- [ ] Test complete user flow
- [ ] Monitor for errors

## Rollback Plan

If issues arise:

1. Keep old dashboard as `dashboard-old.tsx`
2. Keep old schema as backup
3. Can revert routes in App.tsx
4. Database migration can be reversed (but loses data)

## Success Metrics

- Course generation success rate > 90%
- AI parsing success rate > 70%
- Fallback mode works 100% of time
- User can complete full flow without errors
- Loading states feel responsive
- UI feels clean and uncluttered
