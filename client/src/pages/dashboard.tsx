import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Paperclip } from "lucide-react";
import { TestWizard } from "@/components/test";

export default function Dashboard() {
  const [notes, setNotes] = useState("");
  const [showWizard, setShowWizard] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleGenerateQuiz = () => {
    if (!notes.trim()) return;
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
        if (typeof result === "string") setNotes(result);
      };
      reader.readAsText(file);
    }
  };

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [notes]);

  return (
    <div className="h-full md:h-auto flex flex-col">
      {!showWizard ? (
        <>
          {/* MOBILE */}
          <div className="md:hidden flex flex-col h-screen bg-gray-50">
            {/* Mobile Header (Centered) */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
              <h1
                className="text-2xl font-semibold text-studywise-gray-900"
                data-testid="text-dashboard-title-mobile"
              >
                Welcome to StudyWise AI
              </h1>
              <p className="text-sm text-studywise-gray-600 mt-2">
                Paste your notes to generate a quiz
              </p>
            </div>

            {/* Mobile Input Area */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-end gap-3">
                {/* Upload button */}
                <button
                  onClick={handleFileUpload}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors active:scale-95"
                  data-testid="button-upload-file-mobile"
                >
                  <Paperclip className="w-5 h-5 text-gray-600" />
                </button>

                {/* Textarea */}
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    placeholder="Type your notes here..."
                    className="w-full min-h-[60px] max-h-[40vh] px-4 py-3 pr-12 bg-gray-100 border-0 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-900 placeholder-gray-500 text-base leading-5 overflow-y-auto"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={1}
                    data-testid="textarea-notes-input-mobile"
                  />
                  {/* Generate */}
                  <button
                    onClick={handleGenerateQuiz}
                    disabled={!notes.trim()}
                    className={`absolute right-2 bottom-2 w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-95 ${notes.trim()
                        ? "bg-blue-500 hover:bg-blue-600 text-white shadow-sm"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* DESKTOP */}
          <div className="hidden md:flex flex-col h-full">
            {/* Header */}
            <div className="flex-shrink-0 p-8 bg-white text-center">
              <h1
                className="text-3xl font-bold text-studywise-gray-900"
                data-testid="text-dashboard-title"
              >
                Welcome to StudyWise AI
              </h1>
              <p className="text-base text-studywise-gray-600 mt-2">
                Paste your notes to generate a quiz
              </p>
            </div>

            {/* Content */}
            <div className="flex-1 flex justify-center items-start bg-white">
              <div className="w-full max-w-6xl p-8">
                <div className="flex items-start gap-4">
                  {/* Upload */}
                  <button
                    onClick={handleFileUpload}
                    className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <Paperclip className="w-6 h-6 text-gray-600" />
                  </button>

                  {/* Textarea */}
                  <div className="flex-1">
                    <textarea
                      ref={textareaRef}
                      placeholder="Type your notes here..."
                      className="w-full min-h-[200px] md:min-h-[300px] max-h-[60vh] px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-500 text-gray-900 placeholder-gray-500 text-base leading-6 overflow-y-auto"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={5}
                      data-testid="textarea-notes-input-desktop"
                    />
                  </div>

                  {/* Generate */}
                  <Button
                    onClick={handleGenerateQuiz}
                    disabled={!notes.trim()}
                    className="bg-primary hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed px-6 py-3 h-12 font-medium flex items-center gap-2 shadow-sm transition-all"
                  >
                    <Sparkles className="w-5 h-5" />
                    Generate Quiz
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        </>
      ) : (
        <TestWizard notes={notes} onClose={() => setShowWizard(false)} />
      )}
    </div>
  );
}
