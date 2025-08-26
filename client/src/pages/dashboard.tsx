import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Paperclip, ArrowUp, Plus } from "lucide-react";
import { TestWizard } from "@/components/test";

/**
 * Dashboard component — responsive UI:
 * - Desktop: centered hero, rounded card with upload + textarea, generate button OUTSIDE the card to the right.
 * - Mobile: giant centered headline, bottom-fixed floating pill containing upload (+), textarea, send (arrow up).
 *
 * Accessible labels included. Textarea auto-resizes and has different min/max per screen size.
 */

export default function Dashboard() {
  const [notes, setNotes] = useState("");
  const [showWizard, setShowWizard] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

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
      reader.onerror = () => console.error("Failed to read file");
      reader.readAsText(file);
    }
  };

  // Auto-resize textarea with viewport-aware min/max
  const adjustTextareaHeight = () => {
    const ta = textareaRef.current;
    if (!ta) return;

    // reset to auto to measure scrollHeight
    ta.style.height = "auto";

    // compute min/max according to screen width
    const vw = window.innerWidth || 1024;
    const vh = window.innerHeight || 800;

    // Digit-by-digit safe arithmetic for min/max
    // mobile breakpoint < 768
    let minPx = 48; // mobile default min
    // Account for header (~70px) + bottom padding (~24px) + some buffer (~50px)
    let maxPx = Math.round(vh * 0.25); // mobile max 25vh to avoid header overlap

    if (vw >= 768) {
      // desktop
      minPx = 140; // desktop min ~140px
      maxPx = Math.round(vh * 0.6); // desktop max 60vh
    }

    // measure natural content height
    const contentHeight = ta.scrollHeight;

    // clamp
    const newHeight = Math.max(minPx, Math.min(contentHeight, maxPx));
    ta.style.height = `${newHeight}px`;
  };

  useEffect(() => {
    adjustTextareaHeight();
    // Recalculate on orientation changes and resize
    const onResize = () => adjustTextareaHeight();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes]);

  // When focusing on the textarea on mobile, ensure it's visible above the keyboard
  const handleFocus = () => {
    const vw = window.innerWidth || 1024;
    if (vw < 768) {
      // small delay to let keyboard open
      setTimeout(() => {
        textareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  };

  return (
    <div className="h-full md:h-auto flex flex-col ">
      {!showWizard ? (
        <>
          {/* MOBILE VERSION */}
          <div className="md:hidden flex flex-col h-[100dvh] overflow-hidden">
            {/* Hero: giant centered headline near top */}
            <div className="flex-1 flex items-start justify-start pt-12 px-6 pb-32">
                <h1
                  className="mx-auto text-[3.6rem] leading-tight font-light text-[var(--studywise-gray-900)]"
                  style={{ lineHeight: 1 }}
                >
                  Turn your notes into smart tests
                </h1>
            </div>

            {/* Bottom floating pill input - fixed - minimal chrome */}
            <div className="fixed left-4 right-4 bottom-6 z-50">
              <div className="bg-white rounded-full border border-gray-400 shadow-lg flex items-center gap-3 px-4 py-3">
                {/* Upload (plus) */}
                <button
                  onClick={handleFileUpload}
                  aria-label="Upload notes"
                  className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center border border-gray-400 active:scale-95 transition-transform"
                >
                  <Plus className="w-6 h-6 text-studywise-gray-700" />
                </button>

                {/* Single-line textarea that can expand up to mobile max */}
                  <textarea
                    ref={textareaRef}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    onInput={adjustTextareaHeight}
                    onFocus={handleFocus}
                    placeholder="Paste your notes here to get started..."
                    aria-label="Study notes input"
                    className="flex-1 min-h-[48px] max-h-[40vh] resize-none bg-transparent outline-none placeholder:text-gray-400 text-base text-gray-900"
                  />

                {/* Send / up arrow (same icon used on desktop generate) */}
                <button
                  onClick={handleGenerateQuiz}
                  aria-label="Send"
                  disabled={!notes.trim()}
                  className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all active:scale-95 ${notes.trim()
                      ? "bg-[var(--studywise-primary)] text-white border-transparent"
                      : "bg-white text-gray-400 border-gray-200 cursor-not-allowed"
                    }`}
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Hidden file input shared by both upload buttons */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* DESKTOP VERSION */}
          <div className="hidden md:flex flex-col">
            {/* Hero */}
            <div className="flex-shrink-0 p-8  text-center">
                <h1
                  className="text-3xl md:text-4xl font-semibold text-[var(--studywise-gray-900)]"
                  data-testid="text-dashboard-title"
                >
                  Create Your Perfect Study Test
                </h1>
                <p className="text-base text-[var(--studywise-gray-600)] mt-2">
                  Upload your study materials or paste notes to generate personalized practice questions
                </p>
            </div>

            {/* Content area with centered card and external generate */}
            <div className="flex-1 flex justify-center items-start ">
              <div className="w-full max-w-6xl p-8 flex items-start justify-center">
                <div className="flex items-start gap-4 w-full">
                  {/* Card: upload + textarea */}
                  <div className="flex-1 bg-white rounded-2xl border border-black shadow-sm p-6 flex items-start gap-4">
                    {/* Upload (paperclip) */}
                    <button
                      onClick={handleFileUpload}
                      aria-label="Upload notes"
                      className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 active:scale-95 transition-transform"
                    >
                      <Paperclip className="w-6 h-6 text-gray-600" />
                    </button>

                    {/* Multi-line textarea */}
                    <textarea
                      ref={textareaRef}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      onInput={adjustTextareaHeight}
                      placeholder="Paste your study notes, textbook content, or lecture materials here..."
                      aria-label="Study materials input"
                      className="flex-1 min-h-[140px] md:min-h-[180px] max-h-[60vh] resize-none bg-transparent outline-none placeholder:text-gray-400 text-gray-900 px-2 py-1"
                    />
                  </div>

                  {/* Generate button OUTSIDE the card (aligned vertically) */}
                  <div className="flex items-start">
                    <button
                      onClick={handleGenerateQuiz}
                      aria-label="Generate test"
                      disabled={!notes.trim()}
                      className={`ml-3 mt-6 h-12 px-4 rounded-full flex items-center gap-2 transition-shadow active:scale-95 ${notes.trim()
                          ? "bg-[var(--studywise-primary)] text-white border-transparent shadow-sm"
                          : "bg-white text-gray-400 border border-gray-200 cursor-not-allowed"
                        }`}
                    >
                      <ArrowUp className="w-4 h-4" />
                      <span className="hidden lg:inline">Generate Test</span>
                    </button>
                  </div>
                </div>

                {/* Hidden file input (again for desktop flow) */}
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
