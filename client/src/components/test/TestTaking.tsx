import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTestSessionStore } from "@/stores";
import { Question } from "@/types";

/**
 * TestTaking — Full-screen "Locked Focus Mode" with improved mobile UX:
 * - Full viewport overlay with portal rendering and scroll lock
 * - beforeunload guard to prevent accidental exit during test
 * - Fixed timer logic (single interval, robust to re-renders)
 * - Larger tap targets for mobile options
 * - Bottom navigation redesigned for clearer primary CTA
 * - Keyboard/viewport handling so focused elements are visible above keyboard
 * - Autosave answers to localStorage (debounced)
 * - Small question index modal (jump to question)
 * - Accessibility: aria-live timer announcements, keyboard handlers on options
 */

interface TestTakingProps {
  testTitle: string;
  questions: Question[];
  timeLimit: number | null; // in minutes
  onSubmit: (answers: Record<number, string>) => void;
  onBack?: () => void;
  onShowResults: (answers: Record<number, string>) => void;
}

export function TestTaking({
  testTitle,
  questions,
  timeLimit,
  onSubmit,
  onShowResults,
}: TestTakingProps) {
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [showQuestionIndex, setShowQuestionIndex] = useState(false);

  // store from zustand
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
    canGoPrevious
  } = useTestSessionStore();

  // initialize test session
  useEffect(() => {
    if (!currentSession) {
      startTest(Date.now().toString(), testTitle, questions, timeLimit);
    }
  }, [testTitle, questions, timeLimit, startTest, currentSession]);

  // Full-screen overlay and scroll lock
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

  // derived data
  const currentQuestion = getCurrentQuestion();
  const progress = getProgress();
  const answers = currentSession?.userAnswers || {};
  const sessionId = currentSession?.testId ?? "no-session";
  const timeRemaining = currentSession?.timeRemaining ?? null;

  // ------- TIMER: robust single-interval implementation -------
  // keep a ref to latest timeRemaining so our interval can read the freshest value
  const timeRef = useRef<number | null>(timeRemaining);
  useEffect(() => {
    timeRef.current = timeRemaining;
  }, [timeRemaining]);

  useEffect(() => {
    if (timeRef.current === null || timeRef.current === undefined) return;

    // if timer is already 0, auto submit immediately
    if (timeRef.current <= 0) {
      handleAutoSubmit();
      return;
    }

    // create single interval that always reads from timeRef
    const id = window.setInterval(() => {
      const curr = timeRef.current;
      if (curr === null || curr === undefined) return;

      if (curr <= 1) {
        // last tick: clear and auto-submit
        clearInterval(id);
        // ask store to set to 0
        try {
          updateTimer(0);
        } catch {
          // best-effort
        }
        handleAutoSubmit();
        return;
      }

      // decrement by 1 second
      try {
        updateTimer(curr - 1);
      } catch {
        // fallback - do nothing
      }
    }, 1000);

    return () => {
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateTimer, sessionId]); // restart interval if session changes

  // auto-submit when timer runs out (shared handler)
  const handleAutoSubmit = () => {
    try {
      // use current answers snapshot
      onSubmit(answers);
    } catch {
      // silent fail-safe
    }
    setShowResultDialog(true);
  };

  // ---------- ANSWER HANDLING ----------
  const handleAnswerSelect = (answer: string) => {
    if (!currentQuestion) return;
    answerQuestion(currentQuestion.id, answer);

    // small UX: after selecting on mobile, advance automatically (if allowed)
    const ms = window.innerWidth < 768 ? 350 : 0;
    if (ms > 0 && canGoNext()) {
      setTimeout(() => nextQuestion(), ms);
    }
  };

  // ensure focused element gets into view on mobile (keyboard)
  const ensureVisible = (el?: HTMLElement | null) => {
    if (!el) return;
    const vw = window.innerWidth;
    if (vw < 768) {
      setTimeout(() => {
        try {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        } catch {
          // ignore
        }
      }, 260);
    }
  };

  // ---------- NAVIGATION ----------
  const handlePrevious = () => {
    previousQuestion();
  };

  const handleNext = () => {
    nextQuestion();
  };

  const handleSubmitClick = () => {
    setShowSubmitDialog(true);
  };

  const handleConfirmSubmit = () => {
    // instruct store to submit then notify parent
    submitTest();
    onSubmit(answers);
    setShowSubmitDialog(false);
    setShowResultDialog(true);
  };

  const handleShowResults = () => {
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

  // ---------- AUTOSAVE (debounced) ----------
  const autosaveTimer = useRef<number | null>(null);
  useEffect(() => {
    // save answers to localStorage after 1s of inactivity
    if (!sessionId) return;
    if (autosaveTimer.current) {
      clearTimeout(autosaveTimer.current);
    }
    autosaveTimer.current = window.setTimeout(() => {
      try {
        const key = `test_answers_${sessionId}`;
        localStorage.setItem(key, JSON.stringify(answers));
      } catch {
        // ignore storage errors
      }
    }, 1000);

    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [answers, sessionId]);

  // ---------- JUMP-TO-QUESTION (index modal) ----------
  const handleJumpTo = (index: number) => {
    setShowQuestionIndex(false);
    setCurrentQuestion(index);
  };

  // ---------- RENDER FULL-SCREEN OVERLAY ----------
  const content = (
    <div className="fixed inset-0 z-[100] bg-white">
      <div className="flex flex-col h-full">
        {/* MOBILE LAYOUT */}
        <div className="md:hidden flex flex-col h-full">
          {/* Header (compact) */}
          <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowQuestionIndex(true)}
                  aria-label="Open question index"
                  className="px-2 py-1 rounded-md hover:bg-gray-100"
                >
                  <span className="text-sm font-medium">Q</span>
                </button>

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
                <h1 className="text-base font-semibold text-studywise-gray-900">
                  {testTitle}
                </h1>
                <p className="text-xs text-studywise-gray-600">
                  {progress.current}/{progress.total}
                </p>
              </div>

              {/* right area: placeholder for settings/back if needed */}
              <div className="w-8" />
            </div>
          </div>

          {/* Scrollable question area with safe bottom padding */}
          <div className="flex-1 overflow-y-auto px-4 py-6 pb-40">
            {currentQuestion && (
              <div className="space-y-5">
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
                        onClick={() => {
                          handleAnswerSelect(option);
                          // make sure selection is visible
                          // find clicked element and ensure visible
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          const el = (event?.currentTarget as any) as HTMLElement | undefined;
                          ensureVisible(el);
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
                        }`}
                      >
                        <div className="flex items-start mt-0.5">
                          <input
                            type="radio"
                            checked={selected}
                            onChange={() => handleAnswerSelect(option)}
                            className="w-5 h-5 text-primary border-gray-300 focus:ring-primary mt-0.5"
                            aria-checked={selected}
                            aria-label={`Select option ${index + 1}`}
                          />
                        </div>
                        <label className="flex-1 text-studywise-gray-900 cursor-pointer leading-relaxed">
                          {option}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Bottom navigation — mobile optimized */}
          <div className="fixed left-0 right-0 bottom-0 z-40 bg-white border-t border-gray-200 p-3">
            <div className="max-w-3xl mx-auto px-3">
              <div className="flex items-center gap-3">
                {/* Prev (small) */}
                <Button
                  onClick={handlePrevious}
                  disabled={!canGoPrevious()}
                  variant="outline"
                  size="sm"
                  className="min-w-[64px] px-3"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                {/* Next (primary, large) */}
                <Button
                  onClick={handleNext}
                  disabled={!canGoNext()}
                  size="sm"
                  className="flex-1 bg-primary text-white"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>

                {/* Submit (confirm) */}
                <Button
                  onClick={handleSubmitClick}
                  size="sm"
                  className="ml-2 bg-green-600 text-white"
                >
                  Submit
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* DESKTOP LAYOUT (unchanged visually but with some polish) */}
        <div className="hidden md:block w-full max-w-4xl mx-auto p-6">
          <div className="text-sm text-studywise-gray-500 mb-4">Practice / Quiz</div>

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
            <p className="text-studywise-gray-600">Question {progress.current} of {progress.total}</p>
          </div>

          {/* Question card */}
          {currentQuestion && (
            <Card className="mb-8">
              <CardContent className="p-8">
                <h2 className="text-lg font-medium text-studywise-gray-900 mb-6">{currentQuestion.question}</h2>

                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => {
                    const selected = answers[currentQuestion.id] === option;
                    return (
                      <div
                        key={index}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleAnswerSelect(option)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleAnswerSelect(option); }}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${selected ? "border-primary bg-blue-50" : "border-studywise-gray-200 hover:border-studywise-gray-300" }`}
                      >
                        <div className="flex items-center">
                          <div className="flex items-center h-5">
                            <input
                              type="radio"
                              checked={selected}
                              onChange={() => handleAnswerSelect(option)}
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
            <Button onClick={previousQuestion} disabled={!canGoPrevious()} variant="outline" className="flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" /> Previous
            </Button>

            <Button onClick={handleSubmitClick} className="bg-green-600 hover:bg-green-700 px-6">Submit Test</Button>

            <Button onClick={nextQuestion} disabled={!canGoNext()} className="bg-primary hover:bg-blue-600 flex items-center gap-2">
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Submit dialog (shared) */}
        <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Submit Test</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to submit your test? You have answered {Object.keys(answers).length} out of {progress.total} questions.
                Once submitted, you cannot make any changes.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Continue Test</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmSubmit} className="bg-green-600 hover:bg-green-700">
                Submit Test
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Submitted dialog */}
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
              <AlertDialogAction onClick={handleShowResults} className="bg-primary hover:bg-blue-600 w-full">
                Show Results
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Question Index Modal (simple) */}
        {showQuestionIndex && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
            {/* backdrop */}
            <div className="absolute inset-0 bg-black/30" onClick={() => setShowQuestionIndex(false)} />
            <div className="relative w-full md:w-96 bg-white rounded-t-lg md:rounded-lg p-4 max-h-[80vh] overflow-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Questions</h3>
                <button className="text-sm text-studywise-gray-600" onClick={() => setShowQuestionIndex(false)}>Close</button>
              </div>
              <div className="grid grid-cols-8 gap-2">
                {questions.map((_, i) => {
                  const answered = Boolean(answers[questions[i].id]);
                  return (
                    <button
                      key={i}
                      onClick={() => handleJumpTo(i)}
                      className={`py-2 rounded-md text-sm ${answered ? "bg-primary text-white" : "bg-gray-100 text-gray-800"}`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Render using portal to mount at document.body for guaranteed overlay
  return createPortal(content, document.body);
}
