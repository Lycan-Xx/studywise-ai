import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTestSessionStore } from "@/stores";
import { Question } from "@/types";

/**
 * Updated TestTaking with:
 * - drawer stays open when jumping questions (only closes by clicking outside or Close)
 * - prominent Jump-to-Question buttons (mobile + desktop)
 * - smooth transition when switching questions
 * - fixes for submit modal usage / race conditions
 */

interface TestTakingProps {
  testTitle: string;
  questions: Question[];
  timeLimit: number | null; // minutes
  onSubmit: (answers: Record<number, string>) => void;
  onBack?: () => void;
  onShowResults: (answers: Record<number, string>) => void;
}

function saveTestForLater() {
  return true;
}

export function TestTaking({
  testTitle,
  questions,
  timeLimit,
  onSubmit,
  onBack,
  onShowResults,
}: TestTakingProps) {
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [showQuestionIndex, setShowQuestionIndex] = useState(false);
  const [showSaveForLaterDialog, setShowSaveForLaterDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // local transition state to animate question changes
  const [transitioning, setTransitioning] = useState(false);
  const transitionTimeoutRef = useRef<number | null>(null);

  const {
    currentSession,
    startTest,
    answerQuestion,
    nextQuestion,
    previousQuestion,
    setCurrentQuestion,
    submitTest,
    updateTimer,
    getCurrentQuestion,
    getProgress,
    canGoNext,
    canGoPrevious,
    resetSession,
  } = useTestSessionStore();

  useEffect(() => {
    // Always reset previous session and start a new one
    if (questions.length > 0) {
      resetSession();
      startTest(Date.now().toString(), testTitle, questions, timeLimit);
      setIsSubmitting(false); // Reset submitting state for new test
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testTitle, questions, timeLimit]);

  // Full-screen overlay & beforeunload
  useEffect(() => {
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // Timer logic (keeps same as before)
  const currentQuestion = getCurrentQuestion();
  const progress = getProgress();
  const answers = currentSession?.userAnswers || {};
  const sessionId = currentSession?.testId ?? "no-session";
  const timeRemaining = currentSession?.timeRemaining ?? null;

  const timeRef = useRef<number | null>(timeRemaining);
  useEffect(() => {
    timeRef.current = timeRemaining;
  }, [timeRemaining]);

  useEffect(() => {
    if (timeRef.current === null || timeRef.current === undefined) return;
    if (timeRef.current <= 0) {
      void handleAutoSubmit();
      return;
    }

    const id = window.setInterval(() => {
      const curr = timeRef.current;
      if (curr === null || curr === undefined) return;
      if (curr <= 1) {
        clearInterval(id);
        try {
          updateTimer(0);
        } catch {}
        void handleAutoSubmit();
        return;
      }
      try {
        updateTimer(curr - 1);
      } catch {}
    }, 1000);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateTimer, sessionId]);

  const handleAutoSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      submitTest();
      await onSubmit(answers);
    } catch (err) {
      console.error("Auto-submit failed:", err);
    } finally {
      setIsSubmitting(false);
      setShowResultDialog(true);
    }
  };

  // ---------- ANSWERS ----------
  const handleAnswerSelect = (answer: string) => {
    if (!currentQuestion || isSubmitting) return;
    answerQuestion(currentQuestion.id, answer);
  };

  // ensure focused element is visible on mobile keyboard
  const ensureVisible = (el?: HTMLElement | null) => {
    if (!el) return;
    const vw = window.innerWidth;
    if (vw < 768) {
      setTimeout(() => {
        try {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        } catch {}
      }, 260);
    }
  };

  // ---------- NAV ----------
  const handlePrevious = () => {
    if (isSubmitting) return;
    previousQuestion();
  };

  const handleNext = () => {
    if (isSubmitting) return;
    nextQuestion();
  };

  const handleSubmitClick = () => {
    console.log('handleSubmitClick called, isSubmitting:', isSubmitting);
    if (isSubmitting) return;
    console.log('Setting showSubmitDialog to true');
    setShowSubmitDialog(true);
  };

  const handleSaveForLater = () => {
    if (isSubmitting) return;
    const saved = saveTestForLater();
    if (saved) setShowSaveForLaterDialog(true);
  };

  const handleConfirmSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    // Close the dialog UI first (so user sees feedback)
    setShowSubmitDialog(false);

    try {
      submitTest();
      await onSubmit(answers);
    } catch (err) {
      console.error("Submit failed:", err);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    setShowResultDialog(true);
  };

  const handleShowResults = () => {
    if (isSubmitting) return;
    onShowResults(answers);
  };

  // ---------- TIME DISPLAY ----------
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return {
      minutes: minutes.toString().padStart(2, "0"),
      seconds: remainingSeconds.toString().padStart(2, "0"),
    };
  };

  const timeDisplay =
    timeRemaining !== null && timeRemaining !== undefined
      ? formatTime(timeRemaining)
      : null;
  const isTimeRunningOut =
    timeRemaining !== null && timeRemaining !== undefined && timeRemaining <= 60;

  // ---------- AUTOSAVE ----------
  const autosaveTimer = useRef<number | null>(null);
  useEffect(() => {
    if (!sessionId) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = window.setTimeout(() => {
      try {
        const key = `test_answers_${sessionId}`;
        localStorage.setItem(key, JSON.stringify(answers));
      } catch {}
    }, 1000);

    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [answers, sessionId]);

  // ---------- JUMP-TO-QUESTION ----------
  // NOTE: this no longer closes the index drawer — user can jump multiple questions.
  const handleJumpTo = (index: number) => {
    if (isSubmitting) return;
    setCurrentQuestion(index);
    // keep drawer open: user can tap multiple numbers
    // if you want a "close after jump" UX for mobile only, you could check window.innerWidth here
  };

  // ---------- Transition on question change ----------
  useEffect(() => {
    // whenever the current question changes, trigger a brief transition
    // clear previous timer
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
    setTransitioning(true);
    transitionTimeoutRef.current = window.setTimeout(() => {
      setTransitioning(false);
      transitionTimeoutRef.current = null;
    }, 260); // transition duration
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
        transitionTimeoutRef.current = null;
      }
    };
  }, [currentQuestion?.id, currentQuestion?.question, progress.current]);

  // ---------- RENDER ----------
  const content = (
    <div className="fixed inset-0 z-50 bg-white">
      <div className="flex flex-col h-full">
        {/* MOBILE LAYOUT */}
        <div className="md:hidden flex flex-col h-full">
          {/* Header (compact) */}
          <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Prominent Jump button on mobile */}
                <Button
                  onClick={() => setShowQuestionIndex(true)}
                  disabled={isSubmitting}
                  size="sm"
                  className="px-3 py-1 rounded-md"
                >
                  Jump ({progress.current}/{progress.total})
                </Button>

                {timeDisplay && (
                  <div
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                      isTimeRunningOut ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                    }`}
                    aria-live="polite"
                  >
                    {timeDisplay.minutes}:{timeDisplay.seconds}
                  </div>
                )}
              </div>

              <div className="text-center">
                <h1 className="text-base font-semibold text-studywise-gray-900">{testTitle}</h1>
                <p className="text-xs text-studywise-gray-600">
                  {progress.current}/{progress.total}
                </p>
              </div>

              <div className="w-8" />
            </div>
          </div>

          {/* Scrollable question area */}
          <div className="flex-1 overflow-y-auto px-4 py-6 pb-40">
            {currentQuestion && (
              <div
                className={`space-y-5 transition-all duration-300 ease-in-out transform ${
                  transitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
                }`}
              >
                <h2 className="text-lg font-medium text-studywise-gray-900 leading-relaxed">
                  {currentQuestion.question}
                </h2>

                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => {
                    const selected = answers[currentQuestion.id] === option;
                    return (
                      <div
                        key={index}
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          handleAnswerSelect(option);
                          ensureVisible(e.currentTarget as HTMLElement);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleAnswerSelect(option);
                          }
                        }}
                        className={`border rounded-xl p-4 cursor-pointer transition-all active:scale-[0.98] flex items-start gap-3 min-h-[56px] ${
                          selected
                            ? "border-primary bg-blue-50 shadow-sm"
                            : "border-gray-200 hover:border-gray-300 active:border-gray-400 bg-white"
                        } ${isSubmitting ? "pointer-events-none opacity-50" : ""}`}
                      >
                        <div className="flex items-start mt-0.5">
                          <input
                            type="radio"
                            checked={selected}
                            onChange={() => handleAnswerSelect(option)}
                            disabled={isSubmitting}
                            className="w-5 h-5 text-primary border-gray-300 focus:ring-primary mt-0.5"
                            aria-checked={selected}
                            aria-label={`Select option ${index + 1}`}
                          />
                        </div>
                        <label className="flex-1 text-studywise-gray-900 cursor-pointer leading-relaxed">{option}</label>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Bottom navigation */}
          <div className="fixed left-0 right-0 bottom-0 z-40 bg-white border-t border-gray-200 p-3">
            <div className="max-w-3xl mx-auto px-3">
              <div className="flex items-center gap-3">
                <Button
                  onClick={handlePrevious}
                  disabled={!canGoPrevious() || isSubmitting}
                  variant="outline"
                  size="sm"
                  className="min-w-[64px] px-3"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <Button
                  onClick={handleNext}
                  disabled={!canGoNext() || isSubmitting}
                  size="sm"
                  className="flex-1 bg-primary text-white"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>

                <Button
                  onClick={(e) => {
                    console.log('Mobile submit button clicked');
                    e.stopPropagation();
                    handleSubmitClick();
                  }}
                  disabled={isSubmitting}
                  size="sm"
                  className="ml-2 bg-green-600 text-white"
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* DESKTOP */}
        <div className="hidden md:block w-full max-w-4xl mx-auto p-6">
          {timeDisplay && (
            <div className="flex justify-center mb-8" aria-live="polite">
              <div
                className={`flex items-center gap-6 px-8 py-4 rounded-2xl border-2 shadow-lg ${
                  isTimeRunningOut ? "bg-red-50 border-red-200" : "bg-white border-gray-200"
                }`}
              >
                <div className="text-center">
                  <div className={`text-4xl font-bold tabular-nums ${isTimeRunningOut ? "text-red-600" : "text-studywise-gray-900"}`}>
                    {timeDisplay.minutes}
                  </div>
                  <div className="text-sm font-medium text-studywise-gray-600 uppercase tracking-wide">Minutes</div>
                </div>
                <div className={`text-3xl font-light ${isTimeRunningOut ? "text-red-400" : "text-studywise-gray-400"}`}>:</div>
                <div className="text-center">
                  <div className={`text-4xl font-bold tabular-nums ${isTimeRunningOut ? "text-red-600" : "text-studywise-gray-900"}`}>
                    {timeDisplay.seconds}
                  </div>
                  <div className="text-sm font-medium text-studywise-gray-600 uppercase tracking-wide">Seconds</div>
                </div>
              </div>
            </div>
          )}

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-studywise-gray-900 mb-2">{testTitle}</h1>
            <div className="flex items-center justify-center gap-4">
              <p className="text-studywise-gray-600">Question {progress.current} of {progress.total}</p>

              {/* Prominent desktop Jump button */}
              <Button
                onClick={() => setShowQuestionIndex(true)}
                disabled={isSubmitting}
                size="sm"
                className="px-3 py-1 bg-primary text-white hover:bg-primary/95"
              >
                Jump to Question
              </Button>
            </div>
          </div>

          {/* Question card with transition */}
          {currentQuestion && (
            <Card className="mb-8">
              <CardContent className={`p-8 transition-all duration-300 transform ${transitioning ? "opacity-0 -translate-y-2" : "opacity-100 translate-y-0"}`}>
                <h2 className="text-lg font-medium text-studywise-gray-900 mb-6">{currentQuestion.question}</h2>

                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => {
                    const selected = answers[currentQuestion.id] === option;
                    return (
                      <div
                        key={index}
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          handleAnswerSelect(option);
                          ensureVisible(e.currentTarget as HTMLElement);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAnswerSelect(option);
                        }}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          selected ? "border-primary bg-blue-50" : "border-studywise-gray-200 hover:border-studywise-gray-300"
                        } ${isSubmitting ? "pointer-events-none opacity-50" : ""}`}
                      >
                        <div className="flex items-center">
                          <div className="flex items-center h-5">
                            <input
                              type="radio"
                              checked={selected}
                              onChange={() => handleAnswerSelect(option)}
                              disabled={isSubmitting}
                              className="w-4 h-4 text-primary border-studywise-gray-300 focus:ring-primary"
                            />
                          </div>
                          <label className="ml-3 text-studywise-gray-900 cursor-pointer">{option}</label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Desktop navigation */}
          <div className="flex justify-between items-center">
            <Button
              onClick={handlePrevious}
              disabled={!canGoPrevious() || isSubmitting}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </Button>

            <Button
              onClick={(e) => {
                console.log('Desktop submit button clicked');
                e.stopPropagation();
                handleSubmitClick();
              }}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 px-6"
            >
              {isSubmitting ? "Submitting..." : "Submit Test"}
            </Button>

            <Button
              onClick={handleNext}
              disabled={!canGoNext() || isSubmitting}
              className="bg-primary hover:bg-blue-600 flex items-center gap-2"
            >
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Submit dialog (shared) - using normal button for confirm action to avoid Radix auto-close race */}
        <AlertDialog
          open={showSubmitDialog}
          onOpenChange={(open) => {
            console.log('AlertDialog onOpenChange called with:', open, 'isSubmitting:', isSubmitting);
            if (!isSubmitting) {
              setShowSubmitDialog(open);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Submit Test</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to submit your test? You have answered {Object.keys(answers).length} out of {progress.total} questions.
                Once submitted, you cannot make any changes.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSubmitting}>Continue Test</AlertDialogCancel>
              {/* use a regular button that invokes the handler */}
              <button
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit Test"}
              </button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Results dialog */}
        <AlertDialog open={showResultDialog} onOpenChange={setShowResultDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Test Submitted Successfully!</AlertDialogTitle>
              <AlertDialogDescription>
                Your test has been submitted and your answers have been saved.
                {timeRemaining === 0 && " Time has elapsed and your test was automatically submitted."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <button
                onClick={() => {
                  setShowResultDialog(false);
                  handleShowResults();
                }}
                className="w-full inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium bg-primary text-white hover:bg-primary/95"
              >
                Show Results
              </button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Question Index Drawer (bottom sheet) */}
        {showQuestionIndex && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            {/* backdrop */}
            <div
              className="absolute inset-0 bg-black/30"
              onClick={() => !isSubmitting && setShowQuestionIndex(false)}
            />

            {/* sheet */}
            <div className="relative w-full max-w-2xl bg-white rounded-t-2xl p-6 max-h-[70vh] overflow-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Jump to Question</h3>
                <button
                  className="text-studywise-gray-600 hover:text-studywise-gray-800 px-3 py-1"
                  onClick={() => setShowQuestionIndex(false)}
                  disabled={isSubmitting}
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-6 md:grid-cols-10 gap-3">
                {questions.map((_, i) => {
                  const answered = Boolean(answers[questions[i].id]);
                  const isCurrent = progress.current === i + 1;
                  return (
                    <button
                      key={i}
                      onClick={() => handleJumpTo(i)}
                      disabled={isSubmitting}
                      className={`h-12 w-12 rounded-full flex items-center justify-center font-semibold text-sm transition-colors border-2 ${
                        isCurrent
                          ? "bg-primary/20 border-primary text-primary-foreground"
                          : answered
                          ? "bg-green-500 border-green-500 text-green-700 font-bold"
                          : "bg-transparent border-border hover:bg-accent"
                      } disabled:opacity-50`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex justify-between text-sm text-studywise-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-100 rounded"></div>
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary rounded"></div>
                  <span>Current</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-100 rounded"></div>
                  <span>Not answered</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
