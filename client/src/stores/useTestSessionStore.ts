import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { TestSession, Question, SavedTestSession } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface TestSessionStore {
  // State
  currentSession: TestSession | null;
  savedSessions: SavedTestSession[];
  isActive: boolean;

  // Actions
  startTest: (testId: string, testTitle: string, questions: Question[], timeLimit: number | null) => void;
  resumeTest: (savedSession: SavedTestSession) => void;
  answerQuestion: (questionId: number, answer: string) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  jumpToQuestion: (questionIndex: number) => void;
  setCurrentQuestion: (index: number) => void;
  submitTest: () => void;
  saveTestForLater: () => SavedTestSession | null;
  deleteSavedSession: (sessionId: string) => void;
  resetSession: () => void;
  updateTimer: (timeRemaining: number) => void;

  // Getters
  getCurrentQuestion: () => Question | null;
  getProgress: () => { current: number; total: number; percentage: number };
  getAnsweredCount: () => number;
  canGoNext: () => boolean;
  canGoPrevious: () => boolean;
  getSavedSessionByTestId: (testId: string) => SavedTestSession | null;
  hasSavedSession: (testId: string) => boolean;
}

export const useTestSessionStore = create<TestSessionStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentSession: null,
        savedSessions: [],
        isActive: false,

        // Actions
        startTest: (testId, testTitle, questions, timeLimit) => {
          const session: TestSession = {
            id: uuidv4(),
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

        resumeTest: (savedSession) => {
          const session: TestSession = {
            id: savedSession.id,
            testId: savedSession.testId,
            testTitle: savedSession.testTitle,
            questions: savedSession.questions,
            currentQuestionIndex: savedSession.currentQuestionIndex,
            userAnswers: savedSession.userAnswers,
            timeLimit: savedSession.timeLimit,
            timeRemaining: savedSession.timeRemaining,
            startedAt: savedSession.startedAt,
            isSubmitted: false
          };

          set({ 
            currentSession: session, 
            isActive: true 
          }, false, 'resumeTest');
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

      jumpToQuestion: (questionIndex) => {
        set(state => {
          if (!state.currentSession || questionIndex < 0 || questionIndex >= state.currentSession.questions.length) {
            return state;
          }
          
          return {
            currentSession: {
              ...state.currentSession,
              currentQuestionIndex: questionIndex
            }
          };
        }, false, 'jumpToQuestion');
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
          
          // Remove saved session when test is submitted
          const updatedSavedSessions = state.savedSessions.filter(
            session => session.testId !== state.currentSession?.testId
          );
          
          return {
            currentSession: {
              ...state.currentSession,
              isSubmitted: true
            },
            savedSessions: updatedSavedSessions,
            isActive: false
          };
        }, false, 'submitTest');
      },

      saveTestForLater: () => {
        const state = get();
        if (!state.currentSession) return null;

        const savedSession: SavedTestSession = {
          id: state.currentSession.id,
          testId: state.currentSession.testId,
          testTitle: state.currentSession.testTitle,
          questions: state.currentSession.questions,
          currentQuestionIndex: state.currentSession.currentQuestionIndex,
          userAnswers: state.currentSession.userAnswers,
          timeLimit: state.currentSession.timeLimit,
          timeRemaining: state.currentSession.timeRemaining,
          startedAt: state.currentSession.startedAt,
          savedAt: new Date().toISOString(),
          questionsAnswered: Object.keys(state.currentSession.userAnswers).length,
          totalQuestions: state.currentSession.questions.length
        };

        set(state => {
          // Remove any existing saved session for this test
          const filteredSessions = state.savedSessions.filter(
            session => session.testId !== savedSession.testId
          );
          
          const newState = {
            savedSessions: [...filteredSessions, savedSession],
            currentSession: null,
            isActive: false
          };
          
          console.log('Saving test for later:', savedSession.testId, 'Total saved sessions:', newState.savedSessions.length);
          
          return newState;
        }, false, 'saveTestForLater');

        return savedSession;
      },

      deleteSavedSession: (sessionId) => {
        set(state => ({
          savedSessions: state.savedSessions.filter(session => session.id !== sessionId)
        }), false, 'deleteSavedSession');
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
      },

      getSavedSessionByTestId: (testId) => {
        return get().savedSessions.find(session => session.testId === testId) || null;
      },

      hasSavedSession: (testId) => {
        const sessions = get().savedSessions;
        const hasSession = sessions.some(session => session.testId === testId);
        console.log(`Checking hasSavedSession for ${testId}:`, hasSession, 'Total sessions:', sessions.length);
        return hasSession;
      }
      }),
      {
        name: 'studywise-test-sessions',
        storage: createJSONStorage(() => localStorage),
      }
    ),
    { name: 'test-session-store' }
  )
);
