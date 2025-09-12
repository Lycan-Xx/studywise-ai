import { useCallback, useMemo } from 'react';
import { useTestStore, useLibraryStore, useTestSessionStore, useResultsStore } from './index';
import { TestConfig, SavedTest, TestResult } from '@/types';

/**
 * Custom hook that provides high-level workflow functions
 * that coordinate between multiple stores
 */
export const useTestWorkflow = () => {
  const testStore = useTestStore();
  const libraryStore = useLibraryStore();
  const sessionStore = useTestSessionStore();
  const resultsStore = useResultsStore();

  /**
   * Generate questions and save test to library
   */
  const generateAndSaveTest = useCallback(async (config: TestConfig, notes: string, title?: string) => {
    try {
      // Generate questions using test store
      await testStore.generateQuestions(config, notes);
      
      // Create saved test object
      const savedTest: Omit<SavedTest, 'id' | 'createdDate'> = {
        title: title || `${config.topics || 'Study'} Test`,
        questionCount: config.numberOfQuestions,
        config,
        questions: testStore.generatedQuestions,
        notes,
        gradient: getRandomGradient()
      };

      // Save to library
      await libraryStore.saveTest(savedTest);

      return savedTest;
    } catch (error) {
      console.error('Failed to generate and save test:', error);
      throw error;
    }
  }, [testStore, libraryStore]);

  /**
   * Start a test session from a saved test
   */
  const startTestFromLibrary = useCallback((testId: string) => {
    const test = libraryStore.getTestById(testId);
    if (!test) {
      throw new Error('Test not found');
    }

    sessionStore.startTest(
      test.id,
      test.title,
      test.questions,
      null // No time limit by default
    );

    return test;
  }, [libraryStore, sessionStore]);

  /**
   * Complete a test and save results
   */
  const completeTest = useCallback(async (userAnswers?: Record<number, string>) => {
    console.log('🚀 Starting completeTest workflow...');
    
    const session = sessionStore.currentSession;
    if (!session) {
      console.error('🚀 No active test session found');
      throw new Error('No active test session');
    }

    console.log('🚀 Active session found:', session.testTitle);
    console.log('🚀 Session questions count:', session.questions.length);

    // Use provided answers or session answers
    const answers = userAnswers || session.userAnswers;

    console.log('🚀 completeTest called with answers:', Object.keys(answers).length);
    console.log('🚀 Answer details:', Object.entries(answers).map(([qId, answer]) => ({ questionId: qId, answer })));
    console.log('🚀 Session questions:', session.questions.length);

    // Calculate score
    const totalQuestions = session.questions.length;
    const correctAnswers: Record<number, string> = {};

    // Extract correct answers from questions
    session.questions.forEach(q => {
      if (q.correctAnswer) {
        correctAnswers[q.id] = q.correctAnswer;
      }
    });

    console.log('🚀 Correct answers:', Object.entries(correctAnswers).map(([qId, answer]) => ({ questionId: qId, correctAnswer: answer })));

    const correctCount = session.questions.filter(
      q => answers[q.id] === q.correctAnswer
    ).length;

    const score = Math.round((correctCount / totalQuestions) * 100);

    console.log('🚀 Score calculation:');
    console.log('🚀 - Correct answers:', correctCount);
    console.log('🚀 - Total questions:', totalQuestions);
    console.log('🚀 - Final score:', score, '%');

    // Create result object
    const result: Omit<TestResult, 'id' | 'completedAt'> = {
      testId: session.testId,
      testTitle: session.testTitle,
      userAnswers: answers,
      correctAnswers,
      score,
      totalQuestions,
      timeSpent: session.timeLimit && session.timeRemaining
        ? (session.timeLimit * 60) - session.timeRemaining
        : undefined,
      questions: session.questions
    };

    console.log('🚀 Complete result object created:', {
      testId: result.testId,
      testTitle: result.testTitle,
      score: result.score,
      totalQuestions: result.totalQuestions,
      answerCount: Object.keys(result.userAnswers).length
    });

    console.log('🚀 Saving result to store...');
    // Save result
    await resultsStore.saveResult(result);
    console.log('🚀 Result saved successfully');

    // Submit test in session store
    sessionStore.submitTest();
    console.log('🚀 Test session submitted');

    return result;
  }, [sessionStore, resultsStore]);

  /**
   * Reset all stores to initial state
   */
  const resetAllStores = useCallback(() => {
    testStore.clearTest();
    sessionStore.resetSession();
    resultsStore.setCurrentResult(null);
  }, [testStore, sessionStore, resultsStore]);

  /**
   * Get performance analytics across all tests
   */
  const getPerformanceAnalytics = useCallback(() => {
    const results = resultsStore.testResults;
    const tests = libraryStore.savedTests;

    return {
      totalTests: tests.length,
      totalTestsTaken: results.length,
      averageScore: resultsStore.averageScore,
      bestScore: resultsStore.bestScore,
      recentResults: resultsStore.recentResults,
      testCompletionRate: tests.length > 0 ? (results.length / tests.length) * 100 : 0
    };
  }, [resultsStore, libraryStore]);

  return useMemo(() => ({
    // High-level workflow functions
    generateAndSaveTest,
    startTestFromLibrary,
    completeTest,
    resetAllStores,
    getPerformanceAnalytics,

    // Direct store access for fine-grained control
    testStore,
    libraryStore,
    sessionStore,
    resultsStore
  }), [
    generateAndSaveTest,
    startTestFromLibrary,
    completeTest,
    resetAllStores,
    getPerformanceAnalytics,
    testStore,
    libraryStore,
    sessionStore,
    resultsStore
  ]);
};

/**
 * Helper function to get random gradient for test cards
 */
const getRandomGradient = () => {
  const gradients = [
    "from-blue-600 to-blue-700",
    "from-green-600 to-green-700",
    "from-purple-600 to-purple-700",
    "from-orange-600 to-orange-700",
    "from-red-600 to-red-700",
    "from-indigo-600 to-indigo-700",
    "from-pink-600 to-pink-700",
    "from-teal-600 to-teal-700"
  ];
  
  return gradients[Math.floor(Math.random() * gradients.length)];
};
