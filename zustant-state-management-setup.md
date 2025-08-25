# StudyWise AI: Zustand State Management Implementation Plan

## Current App Lifecycle Analysis

### Data Flow
1. **Test Creation Flow**
   - TestWizard → StepOne (subject/topics)
   - StepTwo (question type)
   - StepThree (parameters)
   - TestPreview
   - TestSettings
   - TestTaking
   - TestResults

### Current Mock Data Locations
- **Library Page**: Mock tests array
- **TestPreview**: Mock questions generation
- **TestTaking**: Local state user answers
- **TestResults**: Answers and correct answers as props

### Data Entities
- **Tests**: Metadata, questions, configuration
- **Test Results**: User answers, scores, performance
- **User Preferences**: Quiz settings
- **Test Sessions**: Active test state and progress

## Zustand State Management Plan

### Phase 1: Setup and Core Stores

#### 1.1 Installation
```bash
npm install zustand
```

#### 1.2 Store Structure
```
client/src/stores/
├── useTestStore.ts          # Test creation and management
├── useLibraryStore.ts       # Saved tests library
├── useTestSessionStore.ts   # Active test session state
├── useResultsStore.ts       # Test results and performance
└── index.ts                 # Export all stores
```

### Phase 2: Store Implementation

#### 2.1 Test Store (useTestStore.ts)
```typescript
interface TestStore {
  // State
  currentConfig: TestConfig | null
  generatedQuestions: Question[]
  isGenerating: boolean
  
  // Actions
  updateConfig: (config: Partial<TestConfig>) => void
  generateQuestions: (config: TestConfig, notes: string) => Promise<void>
  clearTest: () => void
}
```

#### 2.2 Library Store (useLibraryStore.ts)
```typescript
interface LibraryStore {
  // State
  savedTests: SavedTest[]
  isLoading: boolean
  
  // Actions
  loadTests: () => Promise<void>
  saveTest: (test: SavedTest) => Promise<void>
  deleteTest: (testId: string) => Promise<void>
  updateTest: (testId: string, updates: Partial<SavedTest>) => Promise<void>
}
```

#### 2.3 Test Session Store (useTestSessionStore.ts)
```typescript
interface TestSessionStore {
  // State
  currentTest: Test | null
  currentQuestionIndex: number
  userAnswers: Record<number, string>
  timeRemaining: number | null
  isSubmitted: boolean
  
  // Actions
  startTest: (test: Test, timeLimit: number | null) => void
  answerQuestion: (questionId: number, answer: string) => void
  nextQuestion: () => void
  previousQuestion: () => void
  submitTest: () => void
  resetSession: () => void
}
```

#### 2.4 Results Store (useResultsStore.ts)
```typescript
interface ResultsStore {
  // State
  testResults: TestResult[]
  currentResult: TestResult | null
  
  // Actions
  saveResult: (result: TestResult) => Promise<void>
  loadResults: () => Promise<void>
  getResultById: (resultId: string) => TestResult | null
}
```

### Phase 3: Component Integration

#### 3.1 TestWizard Flow
- **StepOne/Two/Three**: Use `useTestStore` for config management
- **TestPreview**: Use `useTestStore` for questions, `useLibraryStore` for saving

#### 3.2 Library Page
- Replace mock data with `useLibraryStore`
- Implement CRUD operations

#### 3.3 Test Taking Flow
- **TestSettings**: Initialize `useTestSessionStore`
- **TestTaking**: Use session store for answers and navigation
- **TestResults**: Use `useResultsStore` for saving and displaying

### Phase 4: Data Persistence

#### 4.1 Local Storage Integration
```typescript
import { persist } from 'zustand/middleware'

const useLibraryStore = create(
  persist(
    (set, get) => ({
      














      I'll continue the markdown document from where we left off:

```typescript
    // Store implementation
    }),
    {
      name: 'studywise-library',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
```

#### 4.2 API Integration Points
- Prepare stores for future backend integration
- Use async actions that can switch from localStorage to API calls

### Phase 5: Implementation Steps

#### Step 1: Create Base Stores
- Install Zustand
- Create store files with TypeScript interfaces
- Implement basic state and actions

#### Step 2: Replace Library Mock Data
- Update `client/src/pages/library.tsx` to use `useLibraryStore`
- Remove mock tests array
- Implement save/delete functionality

#### Step 3: Update Test Creation Flow
- Modify TestWizard components to use `useTestStore`
- Update TestPreview to use store for questions
- Implement save to library functionality

#### Step 4: Implement Test Session Management
- Update TestTaking to use `useTestSessionStore`
- Implement proper answer tracking and navigation
- Add timer management to store

#### Step 5: Results Management
- Update TestResults to use `useResultsStore`
- Implement result saving and retrieval
- Add performance tracking

### Phase 6: Advanced Features

#### 6.1 Computed Values
```typescript
interface LibraryStore {
  // ... existing state
  
  // Computed
  get testCount(): number
  get averageScore(): number
  get recentTests(): SavedTest[]
}
```

#### 6.2 Cross-Store Communication
```typescript
useTestSessionStore.subscribe(
  (state) => state.isSubmitted,
  (isSubmitted) => {
    if (isSubmitted) {
      const result = createTestResult(/* ... */);
      useResultsStore.getState().saveResult(result);
    }
  }
)
```

## Benefits of This Approach

### Advantages
1. **Centralized State**: All test-related data in predictable locations
2. **Type Safety**: Full TypeScript support with proper interfaces
3. **Persistence**: Automatic localStorage integration
4. **Scalability**: Easy to switch to API calls later
5. **Performance**: Zustand's minimal re-renders
6. **Developer Experience**: DevTools support and clear state structure

### Migration Strategy

#### Implementation Approach
- **Gradual Migration**: Replace one component at a time
- **Backward Compatibility**: Keep mock data during transition
- **Testing**: Ensure each store works before moving to next component
- **Documentation**: Update component documentation with new store usage

## Example Complete Store Implementation

```typescript
import create from 'zustand';
import { persist } from 'zustand/middleware';

// Test Store Example
interface TestConfig {
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
}

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
}

interface TestStore {
  // State
  currentConfig: TestConfig | null;
  generatedQuestions: Question[];
  isGenerating: boolean;

  // Actions
  updateConfig: (config: Partial<TestConfig>) => void;
  generateQuestions: (config: TestConfig) => Promise<void>;
  clearTest: () => void;
}

const useTestStore = create<TestStore>(
  persist(
    (set, get) => ({
      currentConfig: null,
      generatedQuestions: [],
      isGenerating: false,

      updateConfig: (config) => 
        set((state) => ({ 
          currentConfig: { ...state.currentConfig, ...config } 
        })),

      generateQuestions: async (config) => {
        set({ isGenerating: true });
        try {
          // Simulate AI question generation
          const questions = await mockAIQuestionGeneration(config);
          set({ 
            generatedQuestions: questions, 
            isGenerating: false 
          });
        } catch (error) {
          set({ isGenerating: false });
          // Handle error
        }
      },

      clearTest: () => 
        set({ 
          currentConfig: null, 
















          I'll continue the markdown document:

```typescript
          generatedQuestions: [],
          isGenerating: false
        })
    }),
    {
      name: 'test-generation-store',
      getStorage: () => localStorage
    }
  )
);

// Library Store Example
interface SavedTest {
  id: string;
  title: string;
  subject: string;
  createdAt: Date;
  questions: Question[];
}

interface LibraryStore {
  savedTests: SavedTest[];
  addTest: (test: SavedTest) => void;
  removeTest: (testId: string) => void;
  updateTest: (testId: string, updates: Partial<SavedTest>) => void;
}

const useLibraryStore = create<LibraryStore>(
  persist(
    (set) => ({
      savedTests: [],

      addTest: (test) => set((state) => ({
        savedTests: [...state.savedTests, test]
      })),

      removeTest: (testId) => set((state) => ({
        savedTests: state.savedTests.filter(test => test.id !== testId)
      })),

      updateTest: (testId, updates) => set((state) => ({
        savedTests: state.savedTests.map(test => 
          test.id === testId ? { ...test, ...updates } : test
        )
      }))
    }),
    {
      name: 'library-store',
      getStorage: () => localStorage
    }
  )
);

// Test Session Store
interface TestSession {
  currentTest: SavedTest | null;
  currentQuestionIndex: number;
  userAnswers: Record<string, string>;
  startTime: Date | null;
  endTime: Date | null;
}

interface TestSessionStore {
  session: TestSession;
  startTest: (test: SavedTest) => void;
  answerQuestion: (questionId: string, answer: string) => void;
  moveToNextQuestion: () => void;
  moveToPreviousQuestion: () => void;
  endTest: () => void;
  resetSession: () => void;
}

const useTestSessionStore = create<TestSessionStore>((set, get) => ({
  session: {
    currentTest: null,
    currentQuestionIndex: 0,
    userAnswers: {},
    startTime: null,
    endTime: null
  },

  startTest: (test) => set({
    session: {
      currentTest: test,
      currentQuestionIndex: 0,
      userAnswers: {},
      startTime: new Date(),
      endTime: null
    }
  }),

  answerQuestion: (questionId, answer) => set((state) => ({
    session: {
      ...state.session,
      userAnswers: {
        ...state.session.userAnswers,
        [questionId]: answer
      }
    }
  })),

  moveToNextQuestion: () => set((state) => {
    const { currentTest, currentQuestionIndex } = state.session;
    if (!currentTest) return state;

    return {
      session: {
        ...state.session,
        currentQuestionIndex: Math.min(
          currentQuestionIndex + 1, 
          currentTest.questions.length - 1
        )
      }
    };
  }),

  moveToPreviousQuestion: () => set((state) => ({
    session: {
      ...state.session,
      currentQuestionIndex: Math.max(state.session.currentQuestionIndex - 1, 0)
    }
  })),

  endTest: () => set((state) => ({
    session: {
      ...state.session,
      endTime: new Date()
    }
  })),

  resetSession: () => set({
    session: {
      currentTest: null,
      currentQuestionIndex: 0,
      userAnswers: {},
      startTime: null,
      endTime: null
    }
  })
}));

// Results Store
interface TestResult {
  id: string;
  testId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number













  I'll continue the markdown document:

```typescript
  completedAt: Date;
  timeTaken: number;
}

interface ResultsStore {
  results: TestResult[];
  addResult: (result: TestResult) => void;
  getResultById: (resultId: string) => TestResult | undefined;
  calculateOverallPerformance: () => {
    averageScore: number;
    totalTests: number;
    bestScore: number;
  };
}

const useResultsStore = create<ResultsStore>(
  persist(
    (set, get) => ({
      results: [],

      addResult: (result) => set((state) => ({
        results: [...state.results, result]
      })),

      getResultById: (resultId) => 
        get().results.find(result => result.id === resultId),

      calculateOverallPerformance: () => {
        const { results } = get();
        const totalTests = results.length;
        
        if (totalTests === 0) return {
          averageScore: 0,
          totalTests: 0,
          bestScore: 0
        };

        const totalScore = results.reduce((sum, result) => sum + result.score, 0);
        const averageScore = totalScore / totalTests;
        const bestScore = Math.max(...results.map(r => r.score));

        return {
          averageScore,
          totalTests,
          bestScore
        };
      }
    }),
    {
      name: 'results-store',
      getStorage: () => localStorage
    }
  )
);

// Hooks for Cross-Store Communication
const useTestWorkflow = () => {
  const testStore = useTestStore();
  const libraryStore = useLibraryStore();
  const sessionStore = useTestSessionStore();
  const resultsStore = useResultsStore();

  const generateAndSaveTest = async (config: TestConfig) => {
    // Generate questions
    await testStore.generateQuestions(config);
    
    // Create saved test
    const savedTest: SavedTest = {
      id: `test-${Date.now()}`,
      title: `${config.subject} Test`,
      subject: config.subject,
      createdAt: new Date(),
      questions: testStore.generatedQuestions
    };

    // Save to library
    libraryStore.addTest(savedTest);

    return savedTest;
  };

  const completeTest = (session: TestSession) => {
    if (!session.currentTest) return;

    // Calculate score
    const totalQuestions = session.currentTest.questions.length;
    const correctAnswers = session.currentTest.questions.filter(
      (q, index) => session.userAnswers[q.id] === q.correctAnswer
    ).length;

    const result: TestResult = {
      id: `result-${Date.now()}`,
      testId: session.currentTest.id,
      score: (correctAnswers / totalQuestions) * 100,
      totalQuestions,
      correctAnswers,
      completedAt: new Date(),
      timeTaken: session.endTime 
        ? session.endTime.getTime() - (session.startTime?.getTime() || 0) 
        : 0
    };

    // Save result
    resultsStore.addResult(result);

    // Reset session
    sessionStore.resetSession();

    return result;
  };

  return {
    generateAndSaveTest,
    completeTest
  };
};

// Example Component Usage
function TestGenerationComponent() {
  const testStore = useTestStore();
  const { generateAndSaveTest } = useTestWorkflow();

  const handleGenerateTest = async () => {
    const config: TestConfig = {
      subject: 'Mathematics',
      difficulty: 'medium',
      questionCount: 10
    };

    const savedTest = await generateAndSaveTest(config);
    // Additional logic if needed
  };

  return (
    <div>
      <button onClick={handleGenerateTest}>
        Generate Test
      </button>
    </div>
  );
}

// Export stores for global access
export {
  useTestStore,














  