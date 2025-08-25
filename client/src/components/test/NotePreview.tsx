import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TestWizard } from "./TestWizard";
import { ArrowLeft } from "lucide-react";

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

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
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
          <h1 className="text-2xl font-semibold text-studywise-gray-900">
            Note {subject}/{title}
          </h1>
        </div>
        <Button
          onClick={handleStartTest}
          className="bg-primary hover:bg-blue-600 px-6 py-2"
        >
          Start test
        </Button>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col items-center">
        {/* Large Text Area */}
        <div className="w-full max-w-4xl mb-8">
          <Textarea
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Enter your notes here..."
            className="w-full h-96 resize-none border-2 border-studywise-gray-300 rounded-2xl p-6 text-base leading-relaxed focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={!hasChanges}
          variant="outline"
          className="px-8 py-2 border-2 border-studywise-gray-300 hover:bg-studywise-gray-50 disabled:opacity-50"
        >
          Save test
        </Button>
      </div>
    </div>
  );
}