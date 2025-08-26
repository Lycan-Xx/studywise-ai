import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TestWizard } from "./TestWizard";
import { ArrowLeft, Save } from "lucide-react";

interface NotePreviewProps {
  testId: string;
  title: string;
  subject: string;
  initialNotes: string;
  onClose: () => void;
  onSave: (testId: string, notes: string) => void;
}

export function NotePreview({ testId, title, subject, initialNotes, onClose, onSave }: NotePreviewProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [showWizard, setShowWizard] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleNotesChange = (value: string) => {
    setNotes(value);
    setHasChanges(value !== initialNotes);
  };

  const handleSave = () => {
    onSave(testId, notes);
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
            <span className="hidden sm:inline">Back to Library</span>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-studywise-gray-900">
              {title}
            </h1>
          </div>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button
            onClick={handleStartTest}
            className="bg-primary hover:bg-blue-600 px-6 py-3 flex-1 sm:flex-none"
          >
            Start Test
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto">
        {/* Text Area with Character Counter */}
        <div className="mb-8">
          <div className="relative">
            <Textarea
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Enter your study notes here or upload a file to get started..."
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
    </div>
  );
}