
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, Play, Loader2 } from "lucide-react";
import { NotePreview } from "@/components/test/NotePreview";
import { TestPreviewOverlay } from "@/components/test/TestPreviewOverlay";
import { TestTakingOverlay } from "@/components/test/TestTakingOverlay";
import { TestResultsOverlay } from "@/components/test/TestResultsOverlay";
import { useLibraryStore, useTestSessionStore, useResultsStore, useTestWorkflow } from "@/stores";
import { useLocation } from "wouter";
import { TestConfig } from "@/types";

export default function Library() {
  const [location, setLocation] = useLocation();
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [testToDelete, setTestToDelete] = useState<string | null>(null);
  const [startingTest, setStartingTest] = useState<string | null>(null);
  const [showTestPreview, setShowTestPreview] = useState(false);
  const [showTestResults, setShowTestResults] = useState(false);
  const [testTimeLimit, setTestTimeLimit] = useState<number | null>(null);
  const [highlightText, setHighlightText] = useState<string | null>(null);
  const [completedTestData, setCompletedTestData] = useState<{
    testTitle: string;
    questions: any[];
    userAnswers: Record<number, string>;
    correctAnswers: Record<number, string>;
    score: number;
    totalQuestions: number;
    timeSpent?: number;
    notes: string;
  } | null>(null);

  // Zustand stores - updated to use correct interface
  const { 
    tests, 
    loading: isLoading, 
    error, 
    loadTests, 
    deleteTest 
  } = useLibraryStore();
  
  const { 
    startTest,
    submitTest,
    resetSession,
    currentSession,
    getCurrentQuestion,
    getProgress,
  } = useTestSessionStore();
  
  const { currentResult } = useResultsStore();
  const { completeTest } = useTestWorkflow();

  // Helper function to get test by ID
  const getTestById = (testId: string) => {
    return tests.find(test => test.id === testId) || null;
  };

  // Load tests on component mount and handle query parameters
  useEffect(() => {
    loadTests();

    // Check for query parameters to auto-open test and highlight text
    const params = new URLSearchParams(location.split('?')[1] || '');
    const openTestId = params.get('open');
    const highlightQuery = params.get('q');

    if (openTestId) {
      setSelectedTest(openTestId);
    }
    if (highlightQuery) {
      setHighlightText(decodeURIComponent(highlightQuery));
    }
  }, [loadTests, location]);

  const handleTestClick = (testId: string) => {
    setSelectedTest(testId);
  };

  const handleStartTest = (testId: string) => {
    console.log('Starting test from library:', testId);
    setStartingTest(testId);
    setShowTestPreview(true);
  };

  const handleStartTestFromPreview = (timeLimit: number | null) => {
    if (startingTest) {
      const test = getTestById(startingTest);
      if (!test) {
        console.error("Test data not found for testId:", startingTest);
        return;
      }
      
      // Convert Supabase test format to expected format
      const questions = test.metadata?.questions || [];
      startTest(test.id, test.title, questions, timeLimit);
      setTestTimeLimit(timeLimit);
      setShowTestPreview(false);
      console.log("Starting test with time limit:", timeLimit);
    } else {
      console.error("Starting test is null");
    }
  };

  const handleTestSubmit = async (answers: Record<number, string>) => {
    try {
      console.log('Submitting test with answers:', Object.keys(answers).length);
      const result = await completeTest(answers);
      console.log('Test result saved:', result);

      // Prepare test data for results overlay
      if (currentSession) {
        const testData = {
          testTitle: currentSession.testTitle,
          questions: currentSession.questions,
          userAnswers: answers,
          correctAnswers: currentSession.questions.reduce((acc, q) => ({
            ...acc,
            [q.id]: q.correctAnswer
          }), {}),
          score: result.score,
          totalQuestions: currentSession.questions.length,
          timeSpent: result.timeSpent,
          notes: startingTestData?.metadata?.notes || ''
        };

        setCompletedTestData(testData);
        setShowTestResults(true);
        console.log("Test submitted, showing results overlay");
      }
    } catch (error) {
      console.error("Failed to submit test:", error);
    }
  };

  const handleTestExit = () => {
    // When exiting test, go back to library
    resetSession();
    setStartingTest(null);
    setShowTestPreview(false);
    setTestTimeLimit(null);
    setSelectedTest(null);
  };

  const handleRegenerateTest = () => {
    // Handle regenerating the test - for now just log
    console.log("Regenerating test");
  };

  const handleSaveToLibrary = () => {
    // Handle saving to library - for now just log
    console.log("Saving to library");
  };

  const handleBackToLibrary = () => {
    setStartingTest(null);
    setShowTestPreview(false);
    setTestTimeLimit(null);
    setSelectedTest(null); // Reset selected test to return to the grid
  };

  const handleResultsBack = () => {
    // Reset all test-related state and return to library
    resetSession();
    setStartingTest(null);
    setShowTestPreview(false);
    setShowTestResults(false);
    setTestTimeLimit(null);
    setSelectedTest(null);
    setCompletedTestData(null);
  };

  const handleRetakeTest = () => {
    // Reset session and restart the test
    if (startingTest) {
      const test = getTestById(startingTest);
      if (test) {
        resetSession();
        const questions = test.metadata?.questions || [];
        startTest(test.id, test.title, questions, testTimeLimit);
        setShowTestResults(false);
        setCompletedTestData(null);
      }
    }
  };

  const handleDeleteClick = (testId: string) => {
    setTestToDelete(testId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (testToDelete) {
      try {
        await deleteTest(testToDelete);
        setDeleteDialogOpen(false);
        setTestToDelete(null);
      } catch (error) {
        console.error("Failed to delete test:", error);
      }
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setTestToDelete(null);
  };

  // Helper function to get first few words from notes
  const getNotesPreview = (notes: string) => {
    if (!notes) return "";
    const words = notes.split(' ').slice(0, 8).join(' ');
    return words.length < notes.length ? `${words}...` : words;
  };

  const handleSaveNotes = (testId: string, notes: string) => {
    // Update the test in the library store
    try {
      // For now, we'll just log the save operation
      console.log("Saving notes for test:", testId);
    } catch (error) {
      console.error("Failed to update test notes:", error);
    }
  };

  const selectedTestData = selectedTest ? getTestById(selectedTest) : null;
  const startingTestData = startingTest ? getTestById(startingTest) : null;

  // Show TestResultsOverlay if test is completed and results should be shown
  if (showTestResults && completedTestData) {
    return (
      <TestResultsOverlay
        testTitle={completedTestData.testTitle}
        testId={currentSession?.testId || ""}
        questions={completedTestData.questions}
        userAnswers={completedTestData.userAnswers}
        correctAnswers={completedTestData.correctAnswers}
        score={completedTestData.score}
        totalQuestions={completedTestData.totalQuestions}
        timeSpent={completedTestData.timeSpent}
        notes={completedTestData.notes}
        onRetake={handleRetakeTest}
        onRetakeWrong={() => {
          // Handle retake wrong questions - for now just retake full test
          handleRetakeTest();
        }}
        onViewNotes={() => {
          // Could show notes modal or navigate to note preview
          console.log("View notes clicked");
        }}
        onBack={handleResultsBack}
        onReturnToLibrary={() => {
          // Reset all test-related state and return to library main view
          resetSession();
          setStartingTest(null);
          setShowTestPreview(false);
          setShowTestResults(false);
          setTestTimeLimit(null);
          setSelectedTest(null);
          setCompletedTestData(null);
        }}
      />
    );
  }

  // Show TestTakingOverlay if there's an active test session
  if (currentSession && !currentSession.isSubmitted) {
    return (
      <TestTakingOverlay
        testTitle={currentSession.testTitle}
        questions={currentSession.questions}
        timeLimit={currentSession.timeLimit}
        onSubmit={handleTestSubmit}
        onBack={handleTestExit}
      />
    );
  }

  // Show TestPreviewOverlay if user clicked Start Test
  if (showTestPreview && startingTestData) {
    // Create a TestConfig object from the test data
    const testConfig: TestConfig = {
      title: startingTestData.title,
      topics: startingTestData.subject || "General",
      questionType: startingTestData.question_types?.[0] === 'multiple-choice' ? 'mcq' : 'tf',
      numberOfQuestions: startingTestData.question_count,
      difficulty: startingTestData.difficulty || 'medium'
    };

    const questions = startingTestData.metadata?.questions || [];

    return (
      <TestPreviewOverlay
        config={testConfig}
        questions={questions}
        notes={startingTestData.metadata?.notes || ""}
        onStartTest={handleStartTestFromPreview}
        onRegenerateAll={handleRegenerateTest}
        onSaveToLibrary={handleSaveToLibrary}
        onBack={handleBackToLibrary}
      />
    );
  }

  // Show NotePreview if a test note is selected for editing
  if (selectedTestData) {
    return (
      <NotePreview
        testId={selectedTestData.id}
        title={selectedTestData.title}
        subject={selectedTestData.subject || "General"}
        initialNotes={selectedTestData.metadata?.notes || ""}
        highlightText={highlightText}
        onClose={() => {
          setSelectedTest(null);
          setHighlightText(null);
        }}
        onSave={handleSaveNotes}
        onStartTest={handleStartTest}
        questionCount={selectedTestData.question_count}
        questionType={selectedTestData.question_types?.[0] === 'multiple-choice' ? 'Multiple Choice' : 'True/False'}
        difficulty={selectedTestData.difficulty || 'medium'}
      />
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-studywise-gray-600">Loading your tests...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading tests: {error}</p>
          <Button onClick={loadTests} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-studywise-gray-900 mb-2" data-testid="text-library-title">
          My Study Library
        </h1>
      </div>

      {/* Empty state */}
      {tests.length === 0 && (
        <div className="text-center py-12">
          <p className="text-studywise-gray-600 mb-4">No study materials saved yet. Start by creating your first test!</p>
          <Button 
            onClick={() => setLocation('/dashboard')}
            size="lg"
            className="bg-primary hover:bg-primary/90"
          >
            Create Your First Test
          </Button>
        </div>
      )}

      {/* Test Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="grid-tests">
        {tests.map((test) => (
          <Card
            key={test.id}
            className="shadow-sm border-studywise-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            data-testid={`card-test-${test.id}`}
            onClick={() => handleTestClick(test.id)}
          >
            <CardContent className="p-6">
              <div className="mb-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-studywise-gray-900 text-lg" data-testid={`text-test-title-${test.id}`}>
                    {test.title}
                  </h3>
                </div>
                <p className="text-sm text-studywise-gray-600 mb-2 line-clamp-2" data-testid={`text-test-notes-${test.id}`}>
                  {getNotesPreview(test.description || "")}
                </p>
                <p className="text-xs text-studywise-gray-500 mb-1" data-testid={`text-test-date-${test.id}`}>
                  Created on {new Date(test.created_at).toLocaleDateString()}
                </p>
                <p className="text-xs text-studywise-gray-500" data-testid={`text-question-count-${test.id}`}>
                  {test.question_count} questions
                </p>
              </div>

              <div className="flex gap-2 pt-4 border-t border-studywise-gray-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(test.id);
                  }}
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 p-2"
                  data-testid={`button-delete-test-${test.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>

                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartTest(test.id);
                  }}
                  className="flex-1 bg-primary hover:bg-blue-600 text-white flex items-center gap-2"
                  data-testid={`button-start-test-${test.id}`}
                >
                  <Play className="w-4 h-4" />
                  Start Test
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Test</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this test and its generated questions? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
