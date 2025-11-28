# Course-Centric Architecture Diagram

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER UPLOADS FILE                        │
│                    (PDF, DOCX, TXT, MD)                         │
│                    + Optional Context                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND: AI PARSING                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  1. Extract text from file                               │  │
│  │  2. Call AI to parse into modules                        │  │
│  │  3. If AI fails → Fallback (single module)              │  │
│  │  4. Create course + modules in database                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      COURSE VIEW                                 │
│  ┌──────────────┐  ┌────────────────────────────────────────┐  │
│  │   SIDEBAR    │  │         CONTENT AREA                   │  │
│  │              │  │                                        │  │
│  │  Course      │  │  Module Title                         │  │
│  │  Title       │  │  ─────────────                        │  │
│  │              │  │                                        │  │
│  │  Module 1 ◀──┼──│  Full module content...               │  │
│  │  Module 2    │  │                                        │  │
│  │  Module 3    │  │  Lorem ipsum dolor sit amet...        │  │
│  │  ...         │  │                                        │  │
│  │              │  │                                        │  │
│  │              │  │  ┌──────────────────────────────────┐ │  │
│  │              │  │  │  [Take Test: Module Name]        │ │  │
│  │              │  │  └──────────────────────────────────┘ │  │
│  └──────────────┘  └────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ User clicks "Take Test"
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   TEST GENERATION                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  1. Get user preferences (from settings)                 │  │
│  │  2. Generate questions from module content               │  │
│  │  3. Create test record in database                       │  │
│  │  4. Show preview modal (first time only)                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      TEST TAKING                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Course > Module > Test                                  │  │
│  │  ─────────────────────────                               │  │
│  │                                                           │  │
│  │  Question 1 of 10                                        │  │
│  │  What is...?                                             │  │
│  │                                                           │  │
│  │  ○ Option A                                              │  │
│  │  ○ Option B                                              │  │
│  │  ○ Option C                                              │  │
│  │  ○ Option D                                              │  │
│  │                                                           │  │
│  │  Timer: 15:00                                            │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ User submits
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     TEST SUMMARY                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Your Score: 80%                                         │  │
│  │  Module Average: 75%                                     │  │
│  │  Course Average: 78%                                     │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────┐    │  │
│  │  │  Question Review                                 │    │  │
│  │  │  ✓ Q1: Correct                                   │    │  │
│  │  │  ✗ Q2: Incorrect (Your: B, Correct: A)          │    │  │
│  │  │  ✓ Q3: Correct                                   │    │  │
│  │  └─────────────────────────────────────────────────┘    │  │
│  │                                                           │  │
│  │  [Retake Test]  [Request AI Analysis]  [Back to Course] │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────┐    │  │
│  │  │  AI Insights (if requested)                     │    │  │
│  │  │  • Weak areas: Topic A, Topic B                 │    │  │
│  │  │  • Strong areas: Topic C                        │    │  │
│  │  │  • Recommendations: Focus on...                 │    │  │
│  │  └─────────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Database Schema

```
┌──────────────────┐
│  user_profiles   │
│  ──────────────  │
│  id (PK)         │
│  email           │
│  preferences     │
└────────┬─────────┘
         │
         │ user_id
         ▼
┌──────────────────┐
│     courses      │
│  ──────────────  │
│  id (PK)         │
│  user_id (FK)    │
│  title           │
│  source_content  │
│  parsing_status  │
│  used_fallback   │
│  total_modules   │
└────────┬─────────┘
         │
         │ course_id
         ▼
┌──────────────────┐
│     modules      │
│  ──────────────  │
│  id (PK)         │
│  course_id (FK)  │
│  title           │
│  content         │
│  module_order    │
└────────┬─────────┘
         │
         │ module_id
         ▼
┌──────────────────┐
│      tests       │
│  ──────────────  │
│  id (PK)         │
│  module_id (FK)  │
│  user_id (FK)    │
│  question_count  │
│  difficulty      │
│  status          │
└────────┬─────────┘
         │
         │ test_id
         ▼
┌──────────────────┐
│    questions     │
│  ──────────────  │
│  id (PK)         │
│  test_id (FK)    │
│  question_text   │
│  options         │
│  correct_answer  │
│  source_text     │
└──────────────────┘

┌──────────────────┐
│  user_answers    │
│  ──────────────  │
│  id (PK)         │
│  test_id (FK)    │
│  question_id(FK) │
│  user_answer     │
│  is_correct      │
└──────────────────┘

┌──────────────────┐
│  test_results    │
│  ──────────────  │
│  id (PK)         │
│  test_id (FK)    │
│  module_id (FK)  │
│  score_percentage│
│  insights_text   │
│  weak_areas      │
│  strong_areas    │
└──────────────────┘
```

## Component Hierarchy

```
App
├── AuthProvider
│   └── Router
│       ├── Landing
│       ├── AuthRoot
│       └── Layout
│           ├── Header
│           └── Pages
│               ├── Dashboard (new)
│               │   ├── FileUploadZone
│               │   └── GenerationLoadingOverlay
│               │
│               ├── CourseView
│               │   ├── ModuleSidebar
│               │   └── ModuleContent
│               │
│               ├── TestTaking
│               │   └── TestPreviewModal
│               │
│               ├── TestSummary
│               │
│               ├── Results (new)
│               │   └── CourseResultCard
│               │       └── ModuleResultCard
│               │
│               ├── Settings (new)
│               │   └── QuestionGenerationSettings
│               │
│               └── Library (new)
│                   └── CourseCard
```

## State Management

```
┌─────────────────────────────────────────────────────────────┐
│                    useCourseStore                            │
│  ─────────────────────────────────────────────────────────  │
│  • currentCourse                                             │
│  • currentModule                                             │
│  • modules[]                                                 │
│  • isGenerating                                              │
│  • generateCourse()                                          │
│  • loadCourse()                                              │
│  • selectModule()                                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  Legacy Stores (Keep)                        │
│  ─────────────────────────────────────────────────────────  │
│  • useTestStore - Test configuration                         │
│  • useTestSessionStore - Active test session                 │
│  • useResultsStore - Test results                            │
│  • useLibraryStore - Saved tests (legacy)                    │
└─────────────────────────────────────────────────────────────┘
```

## API Endpoints

```
Course Management:
  POST   /api/courses/generate
  GET    /api/courses
  GET    /api/courses/:courseId
  GET    /api/courses/:courseId/modules
  DELETE /api/courses/:courseId

Test Generation:
  POST   /api/courses/:courseId/modules/:moduleId/test/generate
  POST   /api/tests/:testId/submit
  POST   /api/tests/:testId/insights/request

Results & Analytics:
  GET    /api/results/courses
  GET    /api/results/courses/:courseId/modules
  GET    /api/tests/:testId/result
  GET    /api/tests/:testId/questions
  GET    /api/tests/:testId/answers
  GET    /api/tests/:testId/stats

User Profile:
  GET    /api/user/profile
  PUT    /api/user/profile
```

## Key Differences from Old Architecture

### Before (Test-Centric)
```
User → Upload → Generate Test → Take Test → Results
                    ↓
              Flat structure
              No organization
              Per-test customization
```

### After (Course-Centric)
```
User → Upload + Context → Generate Course → Browse Modules → Take Test → Summary
                              ↓
                        Hierarchical structure
                        Course → Module → Test
                        Global preferences
```

## Benefits

1. **Better Organization**
   - Clear hierarchy
   - No orphaned tests
   - Logical grouping

2. **Improved UX**
   - Simpler flow
   - Less cognitive load
   - Intuitive navigation

3. **Cost Effective**
   - On-demand insights
   - Cached AI responses
   - Efficient API usage

4. **Scalable**
   - Modular architecture
   - Easy to extend
   - Maintainable code

5. **User-Friendly**
   - Minimalistic UI
   - Clear feedback
   - Obvious next steps
