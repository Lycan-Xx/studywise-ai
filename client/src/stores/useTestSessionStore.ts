import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { TestSession, Question } from '@/types';

interface TestSessionStore {
  // State
  currentSession: TestSession | null;
  isActive: boolean;

  // Actions
  startTest: (testId: string, testTitle: string, questions: Question[], timeLimit: number | null) => void;
  answerQuestion: (questionId: number, answer: string) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  setCurrentQuestion: (index: number) => void;
  submitTest: () => void;
  resetSession: () => void;
  updateTimer: (timeRemaining: number) => void;

  // Getters
  getCurrentQuestion: () => Question | null;
  getProgress: () => { current: number; total: number; percentage: number };
  getAnsweredCount: () => number;
  canGoNext: () => boolean;
  canGoPrevious: () => boolean;
}

export const useTestSessionStore = create<TestSessionStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentSession: null,
      isActive: false,

      // Actions
      startTest: (testId, testTitle, questions, timeLimit) => {
        const session: TestSession = {
          testId,
          testTitle,
          questions,
          currentQuestionIndex: 0,
          userAnswers: {},
          timeLimit,
          timeRemaining: timeLimit ? timeLimit * 60 : null, // convert to seconds
          startedAt: new Date().toISOString(),
          isSubmitted: false
        };

        set({ 
          currentSession: session, 
          isActive: true 
        }, false, 'startTest');
      },

      answerQuestion: (questionId, answer) => {
        set(state => {
          if (!state.currentSession) return state;
          
          return {
            currentSession: {
              ...state.currentSession,
              userAnswers: {
                ...state.currentSession.userAnswers,
                [questionId]: answer
              }
            }
          };
        }, false, 'answerQuestion');
      },

      nextQuestion: () => {
        set(state => {
          if (!state.currentSession || !get().canGoNext()) return state;
          
          return {
            currentSession: {
              ...state.currentSession,
              currentQuestionIndex: state.currentSession.currentQuestionIndex + 1
            }
          };
        }, false, 'nextQuestion');
      },

      previousQuestion: () => {
        set(state => {
          if (!state.currentSession || !get().canGoPrevious()) return state;
          
          return {
            currentSession: {
              ...state.currentSession,
              currentQuestionIndex: state.currentSession.currentQuestionIndex - 1
            }
          };
        }, false, 'previousQuestion');
      },

      setCurrentQuestion: (index) => {
        set(state => {
          if (!state.currentSession || index < 0 || index >= state.currentSession.questions.length) {
            return state;
          }
          
          return {
            currentSession: {
              ...state.currentSession,
              currentQuestionIndex: index
            }
          };
        }, false, 'setCurrentQuestion');
      },

      submitTest: () => {
        set(state => {
          if (!state.currentSession) return state;
          
          return {
            currentSession: {
              ...state.currentSession,
              isSubmitted: true
            },
            isActive: false
          };
        }, false, 'submitTest');
      },

      resetSession: () => {
        set({ 
          currentSession: null, 
          isActive: false 
        }, false, 'resetSession');
      },

      updateTimer: (timeRemaining) => {
        set(state => {
          if (!state.currentSession) return state;
          
          return {
            currentSession: {
              ...state.currentSession,
              timeRemaining
            }
          };
        }, false, 'updateTimer');
      },

      // Getters
      getCurrentQuestion: () => {
        const session = get().currentSession;
        if (!session) return null;
        
        return session.questions[session.currentQuestionIndex] || null;
      },

      getProgress: () => {
        const session = get().currentSession;
        if (!session) return { current: 0, total: 0, percentage: 0 };
        
        const current = session.currentQuestionIndex + 1;
        const total = session.questions.length;
        const percentage = Math.round((current / total) * 100);
        
        return { current, total, percentage };
      },

      getAnsweredCount: () => {
        const session = get().currentSession;
        if (!session) return 0;
        
        return Object.keys(session.userAnswers).length;
      },

      canGoNext: () => {
        const session = get().currentSession;
        if (!session) return false;
        
        return session.currentQuestionIndex < session.questions.length - 1;
      },

      canGoPrevious: () => {
        const session = get().currentSession;
        if (!session) return false;
        
        return session.currentQuestionIndex > 0;
      }
    }),
    { name: 'test-session-store' }
  )
);