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
import { useLibraryStore, useTestSessionStore, useResultsStore, useTestWorkflow } from "@/stores";
import { useLocation } from "wouter";
import { TestConfig } from "@/types";

export default function Library() {
  const [location] = useLocation();
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [testToDelete, setTestToDelete] = useState<string | null>(null);
  const [startingTest, setStartingTest] = useState<string | null>(null);
  const [showTestPreview, setShowTestPreview] = useState(false);
  const [testTimeLimit, setTestTimeLimit] = useState<number | null>(null);
  const [highlightText, setHighlightText] = useState<string | null>(null);

  // Zustand stores
  const { 
    savedTests, 
    isLoading, 
    error, 
    loadTests, 
    deleteTest, 
    getTestById 
  } = useLibraryStore();
  
  const { 
    startTest,
    // resumeTest,
    submitTest,
    resetSession,
    currentSession,
    getCurrentQuestion,
    getProgress,
    // hasSavedSession,
    // getSavedSessionByTestId,
    // savedSessions
  } = useTestSessionStore();
  
  const { currentResult } = useResultsStore();
  const { completeTest } = useTestWorkflow();

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

  // Force re-render when returning to library (to update badges)
  /* useEffect(() => {
    // This effect will run when saved sessions change
    console.log('Saved sessions updated:', savedSessions.length);
  }, [savedSessions]); */

  const handleTestClick = (testId: string) => {
    setSelectedTest(testId);
  };

  const handleStartTest = (testId: string) => {
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
      startTest(test.id, test.title, test.questions, timeLimit);
      setTestTimeLimit(timeLimit);
      setShowTestPreview(false);
      // Navigate to test taking overlay - this would need to be handled by the parent component
      // For now, we'll just log that the test should start
      console.log("Starting test with time limit:", timeLimit);
    } else {
      console.error("Starting test is null");
    }
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
    const words = notes.split(' ').slice(0, 8).join(' ');
    return words.length < notes.length ? `${words}...` : words;
  };

  const handleSaveNotes = (testId: string, notes: string) => {
    // TODO: Save notes to backend/storage
    console.log("Saving notes for test:", testId, notes);
  };

  const selectedTestData = selectedTest ? getTestById(selectedTest) : null;
  const startingTestData = startingTest ? getTestById(startingTest) : null;

  // Show TestPreviewOverlay if user clicked Start Test
  if (showTestPreview && startingTestData) {
    // Create a TestConfig object from the test data
    const testConfig: TestConfig = {
      title: startingTestData.title,
      topics: startingTestData.config?.topics || "General",
      questionType: startingTestData.config?.questionType || 'mcq',
      numberOfQuestions: startingTestData.questionCount,
      difficulty: startingTestData.config?.difficulty || 'medium'
    };

    return (
      <TestPreviewOverlay
        config={testConfig}
        questions={startingTestData.questions}
        notes={startingTestData.notes}
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
        subject={selectedTestData.config?.topics || "General"}
        initialNotes={selectedTestData.notes}
        highlightText={highlightText}
        onClose={() => {
          setSelectedTest(null);
          setHighlightText(null);
        }}
        onSave={handleSaveNotes}
        onSubmit={() => {}} // Placeholder - not used in new flow
        onShowResults={() => {}} // Placeholder - not used in new flow
        onStartTest={handleStartTest}
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
      {savedTests.length === 0 && (
        <div className="text-center py-12">
          <p className="text-studywise-gray-600 mb-4">No study materials saved yet. Start by creating your first test!</p>
          <Button 
            onClick={() => window.location.href = '/dashboard'}
            size="lg"
            className="bg-primary hover:bg-primary/90"
          >
            Create Your First Test
          </Button>
        </div>
      )}

      {/* Test Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="grid-tests">
        {savedTests.map((test) => (
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
                  {/* {hasSavedSession(test.id) && (
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                      In Progress
                    </span>
                  )} */}
                </div>
                <p className="text-sm text-studywise-gray-600 mb-2 line-clamp-2" data-testid={`text-test-notes-${test.id}`}>
                  {getNotesPreview(test.notes)}
                </p>
                <p className="text-xs text-studywise-gray-500 mb-1" data-testid={`text-test-date-${test.id}`}>
                  Created on {test.createdDate}
                </p>
                <p className="text-xs text-studywise-gray-500" data-testid={`text-question-count-${test.id}`}>
                  {test.questionCount} questions
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
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the note and it's generated questions? This action cannot be undone.
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
