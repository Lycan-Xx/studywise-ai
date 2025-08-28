import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { TestWizard } from "./TestWizard";
import { TestTaking } from "./TestTaking";
import { ArrowLeft, Save, Play } from "lucide-react";
import { useTestSessionStore } from "@/stores";

interface NotePreviewProps {
  testId: string;
  title: string;
  subject: string;
  initialNotes: string;
  highlightText?: string | null;
  onClose: () => void;
  onSave: (testId: string, notes: string) => void;
  onSubmit?: (answers: Record<number, string>) => void;
  onShowResults?: (answers: Record<number, string>) => void;
}

export function NotePreview({ testId, title, subject, initialNotes, highlightText, onClose, onSave }: NotePreviewProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [showWizard, setShowWizard] = useState(false);
  const [showResumeTest, setShowResumeTest] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>(initialNotes);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle text highlighting when component mounts or highlightText changes
  useEffect(() => {
    if (highlightText && textareaRef.current) {
      const textarea = textareaRef.current;
      const text = textarea.value;
      
      // Find the text to highlight
      const index = text.toLowerCase().indexOf(highlightText.toLowerCase());
      
      if (index !== -1) {
        // Focus the textarea and select the found text
        textarea.focus();
        textarea.setSelectionRange(index, index + highlightText.length);
        
        // Scroll to make the selection visible
        textarea.scrollTop = Math.max(0, 
          (index / text.length) * textarea.scrollHeight - textarea.clientHeight / 2
        );
      }
    }
  }, [highlightText]);

  const handleNotesChange = (value: string) => {
    setNotes(value);
    setHasChanges(value !== lastSaved);
  };

  const handleSave = () => {
    onSave(testId, notes);
    setLastSaved(notes);
    setHasChanges(false);
  };

  const handleStartTest = () => {
    if (hasChanges) {
      // Auto-save before starting test
      onSave(testId, notes);
      setHasChanges(false);
    }
    setShowWizard(true);
  };

  const handleResumeTest = () => {
    setShowResumeDialog(true);
  };

  const handleConfirmResume = () => {
    const savedSession = getSavedSessionByTestId(testId);
    if (savedSession) {
      resumeTest(savedSession);
      setShowResumeDialog(false);
      setShowResumeTest(true);
    }
  };

  const handleTestSubmit = (answers: Record<number, string>) => {
    if (onSubmit) {
      onSubmit(answers);
    }
  };

  const handleShowResults = (answers: Record<number, string>) => {
    if (onShowResults) {
      onShowResults(answers);
    }
  };

  if (showResumeTest) {
    const savedSession = getSavedSessionByTestId(testId);
    if (savedSession) {
      return (
        <TestTaking
          testTitle={savedSession.testTitle}
          questions={savedSession.questions}
          timeLimit={savedSession.timeLimit}
          onSubmit={handleTestSubmit}
          onBack={() => {
            setShowResumeTest(false);
            onClose(); // This will take us back to the library
          }}
          onShowResults={handleShowResults}
        />
      );
    }
  }

  if (showWizard) {
    return (
      <TestWizard
        notes={notes}
        onClose={() => setShowWizard(false)}
      />
    );
  }

  const maxLength = 50000;
  const characterCount = notes.length;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button
            onClick={onClose}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Return to Library</span>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-studywise-gray-900">
              {title}
            </h1>
          </div>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          {hasSavedSession(testId) && (
            <Button
              onClick={handleResumeTest}
              variant="outline"
              className="border-blue-200 text-blue-600 hover:bg-blue-50 px-6 py-3 flex items-center gap-2 flex-1 sm:flex-none"
            >
              <Play className="w-4 h-4" />
              Resume Test
            </Button>
          )}
          <Button
            onClick={handleStartTest}
            size="lg"
            className="bg-primary hover:bg-primary/90 px-8 py-3 flex-1 sm:flex-none"
          >
            Create Practice Test
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto">
        {/* Text Area with Character Counter */}
        <div className="mb-8">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Edit your study notes here. All changes are automatically saved when you create a test..."
              className="w-full h-96 resize-none border-2 border-studywise-gray-300 rounded-2xl p-6 text-base leading-relaxed focus:ring-2 focus:ring-primary focus:border-transparent pr-20"
              maxLength={maxLength}
            />
            {/* Character Counter */}
            <div className="absolute bottom-4 right-4 text-sm text-studywise-gray-500 bg-white px-2 py-1 rounded">
              {characterCount.toLocaleString()}/{maxLength.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
            variant="outline"
            className="px-8 py-3 border-2 border-studywise-gray-300 hover:bg-studywise-gray-50 disabled:opacity-50 flex items-center gap-2 w-full sm:w-auto"
          >
            <Save className="w-4 h-4" />
            {hasChanges ? "Save Changes" : "Saved"}
          </Button>

          {hasChanges && (
            <p className="text-sm text-amber-600 flex items-center gap-1">
              <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
              You have unsaved changes
            </p>
          )}
        </div>
      </div>

      {/* Resume Test Confirmation Dialog */}
      <AlertDialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resume Test</AlertDialogTitle>
            <AlertDialogDescription>
              {(() => {
                const savedSession = getSavedSessionByTestId(testId);
                if (!savedSession) return "No saved session found.";
                
                const savedDate = new Date(savedSession.savedAt).toLocaleDateString();
                const timeSpent = savedSession.startedAt ? 
                  Math.round((new Date(savedSession.savedAt).getTime() - new Date(savedSession.startedAt).getTime()) / 60000) : 0;
                
                return (
                  <div className="space-y-2">
                    <p>Would you like to resume the test you left?</p>
                    <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">
                      <p><strong>Test:</strong> {savedSession.testTitle}</p>
                      <p><strong>Saved on:</strong> {savedDate}</p>
                      <p><strong>Progress:</strong> {savedSession.questionsAnswered} of {savedSession.totalQuestions} questions answered</p>
                      {savedSession.timeRemaining && (
                        <p><strong>Time remaining:</strong> {Math.floor(savedSession.timeRemaining / 60)}:{(savedSession.timeRemaining % 60).toString().padStart(2, '0')}</p>
                      )}
                    </div>
                  </div>
                );
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmResume}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Resume Test
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}