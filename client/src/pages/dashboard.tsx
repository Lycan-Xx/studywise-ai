import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Sparkles } from "lucide-react";
import { TestWizard } from "@/components/test";

export default function Dashboard() {
  const [notes, setNotes] = useState("");
  const [showWizard, setShowWizard] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerateQuiz = () => {
    if (!notes.trim()) {
      // TODO: Show validation error
      return;
    }
    setShowWizard(true);
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();


reader.onload = (e) => {
  const result = e.target?.result;
  if (typeof result === 'string') {
    setNotes(result);
  }
};
reader.onerror = () => {
  console.error('Failed to read file');
};

      reader.readAsText(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-studywise-gray-900 mb-2" data-testid="text-dashboard-title">
          Welcome to StudyWise AI
        </h1>
      </div>

      {/* Note Upload Area */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
        {/* Text Input Area */}
        <div className="flex-1 w-full">

          <div className="relative">
            <Textarea
              id="notes-input"
              placeholder="paste your notes here or click the '+' icon to upload"
              className="w-full h-48 resize-none focus:ring-2 focus:ring-primary focus:border-transparent text-studywise-gray-700"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              data-testid="textarea-notes-input"
            />
            <button
              onClick={handleFileUpload}
              className="absolute bottom-4 left-4 w-8 h-8 bg-studywise-gray-100 hover:bg-studywise-gray-200 rounded-full flex items-center justify-center transition-colors"
              data-testid="button-upload-file"
            >
              <Plus className="text-studywise-gray-600 text-sm" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Generate Button */}
        <div className="lg:pl-6">
          <Button
            onClick={handleGenerateQuiz}
            className="bg-primary hover:bg-blue-600 px-8 py-3 font-medium flex items-center gap-2 shadow-sm"
            data-testid="button-generate-quiz"
          >
            <Sparkles className="w-4 h-4" />
            Generate Quiz
          </Button>
        </div>
      </div>

      {showWizard && (
        <div className="mt-12 pt-8 border-t border-studywise-gray-200">
          <TestWizard
            notes={notes}
            onClose={() => setShowWizard(false)}
          />
        </div>
      )}
    </div>
  );
}
