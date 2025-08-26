// Shared types for the application
export interface TestConfig {
  subject: string;
  topics: string;
  questionType: 'mcq' | 'true-false';
  numberOfQuestions: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface Question {
  id: number;
  type: 'mcq' | 'true-false';
  question: string;
  options: string[];
  correctAnswer?: string;
  sourceText?: string; // Reference to original notes
}

export interface SavedTest {
  id: string;
  title: string;
  subject: string;
  createdDate: string;
  questionCount: number;
  config: TestConfig;
  questions: Question[];
  notes: string;
  gradient?: string;
  image?: string;
  hasSavedSession?: boolean; // Indicates if there's a saved test session
}

export interface TestResult {
  id: string;
  testId: string;
  testTitle: string;
  userAnswers: Record<number, string>;
  correctAnswers: Record<number, string>;
  score: number;
  totalQuestions: number;
  timeSpent?: number; // in seconds
  completedAt: string;
  questions: Question[];
}

export interface TestSession {
  id: string;
  testId: string;
  testTitle: string;
  questions: Question[];
  currentQuestionIndex: number;
  userAnswers: Record<number, string>;
  timeLimit: number | null; // in minutes
  timeRemaining: number | null; // in seconds
  startedAt: string;
  isSubmitted: boolean;
}

export interface SavedTestSession {
  id: string;
  testId: string;
  testTitle: string;
  questions: Question[];
  currentQuestionIndex: number;
  userAnswers: Record<number, string>;
  timeLimit: number | null;
  timeRemaining: number | null;
  startedAt: string;
  savedAt: string;
  questionsAnswered: number;
  totalQuestions: number;
}