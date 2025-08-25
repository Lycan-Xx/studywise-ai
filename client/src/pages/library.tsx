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
import { useLibraryStore } from "@/stores";

export default function Library() {
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [testToDelete, setTestToDelete] = useState<string | null>(null);

  // Zustand store
  const { 
    savedTests, 
    isLoading, 
    error, 
    loadTests, 
    deleteTest, 
    getTestById 
  } = useLibraryStore();

  // Load tests on component mount
  useEffect(() => {
    loadTests();
  }, [loadTests]);

  const handleTestClick = (testId: string) => {
    setSelectedTest(testId);
  };

  const handleStartTest = (testId: string) => {
    // Start test directly from card
    setSelectedTest(testId);
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

  // Show NotePreview if a test is selected
  if (selectedTestData) {
    return (
      <NotePreview
        testId={selectedTestData.id}
        title={selectedTestData.title}
        subject={selectedTestData.subject}
        initialNotes={selectedTestData.notes}
        onClose={() => setSelectedTest(null)}
        onSave={handleSaveNotes}
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
          My Tests
        </h1>
      </div>

      {/* Empty state */}
      {savedTests.length === 0 && (
        <div className="text-center py-12">
          <p className="text-studywise-gray-600 mb-4">No tests saved yet.</p>
          <Button onClick={() => window.location.href = '/dashboard'}>
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
                <h3 className="font-semibold text-studywise-gray-900 mb-2 text-lg" data-testid={`text-test-title-${test.id}`}>
                  {test.title}
                </h3>
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
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartTest(test.id);
                  }}
                  className="flex-1 border-primary text-primary hover:bg-blue-50 hover:border-blue-600 flex items-center gap-2"
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
              Are you sure you want to delete this test? This action cannot be undone and will permanently remove the test and all its questions.
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
              Delete Test
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
