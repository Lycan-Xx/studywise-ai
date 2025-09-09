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
import { TestTaking } from "./TestTaking";
import { ArrowLeft, Save, Play, Paperclip } from "lucide-react";
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
  onStartTest?: (testId: string) => void;
}

export function NotePreview({ testId, title, subject, initialNotes, highlightText, onClose, onSave, onStartTest }: NotePreviewProps) {
  const [notes, setNotes] = useState(initialNotes);
  // const [showResumeTest, setShowResumeTest] = useState(false);
  // const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>(initialNotes);
  const [hasBeenModifiedAndSaved, setHasBeenModifiedAndSaved] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // const { hasSavedSession, getSavedSessionByTestId, resumeTest } = useTestSessionStore();

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
        textarea.scrollTop = Math.max(
          0,
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

    // If the notes were modified from the original, mark as needing regeneration
    if (notes !== initialNotes) {
      setHasBeenModifiedAndSaved(true);
    }
  };

  const handleCreateTest = () => {
    if (hasChanges) {
      // Auto-save before starting test
      onSave(testId, notes);
      setHasChanges(false);

      // If the notes were modified from the original, mark as needing regeneration
      if (notes !== initialNotes) {
        setHasBeenModifiedAndSaved(true);
      }
    }

    // Reset the modification flag since we're generating new questions
    setHasBeenModifiedAndSaved(false);
    // Navigate back to dashboard with notes pre-filled
    // This would require updating the dashboard to accept pre-filled notes
    console.log("Navigate to dashboard with notes for regeneration");
  };

  const handleStartExistingTest = () => {
    if (hasChanges) {
      // Auto-save before starting test
      onSave(testId, notes);
      setHasChanges(false);
    }
    if (onStartTest) {
      onStartTest(testId);
    }
  };

  /* const handleResumeTest = () => {
    setShowResumeDialog(true);
  };

  const handleConfirmResume = () => {
    const savedSession = getSavedSessionByTestId(testId);
    if (!savedSession) {
      console.error("No saved session found for testId:", testId);
      return;
    }
    resumeTest(savedSession);
    setShowResumeDialog(false);
    setShowResumeTest(true);
  }; */

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

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === "string") {
        setNotes(result);
        setHasChanges(true);
      }
    };
    reader.onerror = () => console.error("Failed to read file");
    reader.readAsText(file);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const textFile = files.find(file => 
      file.type === "text/plain" || 
      file.name.endsWith(".txt") || 
      file.name.endsWith(".md") ||
      file.name.endsWith(".doc") ||
      file.name.endsWith(".docx")
    );
    
    if (textFile) {
      processFile(textFile);
    }
  };

  const maxLength = 50000;
  const characterCount = notes.length;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex flex-col gap-4">
          <div>
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Return to Library</span>
            </Button>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-studywise-gray-900">
              {title}
            </h1>
          </div>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          {/* {hasSavedSession(testId) && (
            <Button
              onClick={handleResumeTest}
              variant="outline"
              className="border-blue-200 text-blue-600 hover:bg-blue-50 px-6 py-3 flex items-center gap-2 flex-1 sm:flex-none"
            >
              <Play className="w-4 h-4" />
              Resume Test
            </Button>
          )} */}
          <Button
            onClick={handleStartExistingTest}
            variant="outline"
            size="lg"
            disabled={hasBeenModifiedAndSaved}
            className={`border-2 px-6 py-3 flex items-center gap-2 flex-1 sm:flex-none transition-colors ${hasBeenModifiedAndSaved
              ? 'border-gray-300 text-gray-400 cursor-not-allowed bg-gray-50'
              : 'border-black text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
          >
            <Play className="w-4 h-4" />
            Start Test
          </Button>
          <Button
            onClick={handleCreateTest}
            size="lg"
            disabled={!hasBeenModifiedAndSaved && notes === initialNotes}
            className={`px-8 py-3 flex-1 sm:flex-none transition-colors ${!hasBeenModifiedAndSaved && notes === initialNotes
              ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed text-gray-200'
              : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
          >
            Update Questions
          </Button>
        </div>
      </div>
      {/* Main Content */}
      <div className="max-w-5xl mx-auto">
        {/* Notes Updated Message */}
        {hasBeenModifiedAndSaved && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800 flex items-start gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
              <span>
                <strong>Notes updated!</strong> Your previously generated test questions may no longer match your notes.
                Please update to generate new practice test to ensure questions reflect your current content.
              </span>
            </p>
          </div>
        )}

        {/* Text Area with Upload Button and Character Counter */}
        <div className="mb-8">
          <div className={`relative transition-colors ${isDragOver ? 'bg-blue-50' : ''}`}>
            <div className="flex items-start gap-4 border-2 border-black rounded-2xl p-6">
              {/* Upload Button */}
              <button
                onClick={handleFileUpload}
                className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                title="Upload file"
              >
                <Paperclip className="w-5 h-5 text-gray-600" />
              </button>
              {/* Textarea */}
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={notes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  placeholder="Edit your study notes here. Drag and drop files or use the upload button..."
                  className="w-full h-80 resize-none border-0 bg-transparent text-base leading-relaxed focus:ring-0 focus:outline-none focus-visible:ring-0 shadow-none pr-20 p-0 [&:focus]:shadow-none [&:focus-visible]:shadow-none"
                  maxLength={maxLength}
                />
                {/* Character Counter */}
					<div className="absolute bottom-2 right-2 text-sm text-gray-500 bg-white px-2 py-1 rounded">
						{notes.length.toLocaleString()}/{maxLength.toLocaleString()}
					</div>
              </div>
            </div>

            {/* Drag overlay */}
            {isDragOver && (
              <div className="absolute inset-0 bg-blue-100 bg-opacity-50 border-2 border-dashed border-blue-400 rounded-2xl flex items-center justify-center">
                <div className="text-blue-600 text-center">
                  <Paperclip className="w-8 h-8 mx-auto mb-2" />
                  <p className="font-medium">Drop your file here</p>
                </div>
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4 justify-center items-center">
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
            variant="outline"
            size="lg"
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
      {/* <AlertDialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resume Test</AlertDialogTitle>
            <AlertDialogDescription>
              {(() => {
                const savedSession = getSavedSessionByTestId(testId);
                if (!savedSession) return "No saved session found.";

                const savedDate = new Date(savedSession.savedAt).toLocaleDateString();
                const timeSpent = savedSession.startedAt
                  ? Math.round(
                    (new Date(savedSession.savedAt).getTime() -
                      new Date(savedSession.startedAt).getTime()) /
                    60000
                  )
                  : 0;

                return (
                  <div className="space-y-2">
                    <p>Would you like to resume the test you left?</p>
                    <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">
                      <p>
                        <strong>Test:</strong> {savedSession.testTitle}
                      </p>
                      <p>
                        <strong>Saved on:</strong> {savedDate}
                      </p>
                      <p>
                        <strong>Progress:</strong> {savedSession.questionsAnswered} of {savedSession.totalQuestions} questions answered
                      </p>
                      {savedSession.timeRemaining && (
                        <p>
                          <strong>Time remaining:</strong> {Math.floor(savedSession.timeRemaining / 60)}:
                          {(savedSession.timeRemaining % 60).toString().padStart(2, "0")}
                        </p>
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
      </AlertDialog> */}
    </div>
  );
}