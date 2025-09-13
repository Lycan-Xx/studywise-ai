import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  List,
  CheckCircle2,
  Circle,
  AlertTriangle,
  X,
  Menu,
  FileText,
  ArrowLeft
} from "lucide-react";
import { Question } from "@/types";
import { useTestSessionStore } from "@/stores";

interface TestTakingOverlayProps {
  testTitle: string;
  questions: Question[];
  timeLimit: number | null; // in minutes
  onSubmit: (answers: Record<number, string>) => void;
  onBack: () => void;
}

export function TestTakingOverlay({
  testTitle,
  questions,
  timeLimit,
  onSubmit,
  onBack
}: TestTakingOverlayProps) {
  // ALL HOOKS MUST BE CALLED FIRST - NEVER CONDITIONALLY
  const { answerQuestion, currentSession, updateTimer } = useTestSessionStore();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState<number | null>(
    timeLimit ? timeLimit * 60 : null
  );
  const [showQuestionList, setShowQuestionList] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  // Initialize userAnswers from session if available
  useEffect(() => {
    if (currentSession?.userAnswers) {
      setUserAnswers(currentSession.userAnswers);
    }
  }, [currentSession?.userAnswers]);

  // Timer effect - ALWAYS CALL THIS HOOK
  useEffect(() => {
    if (!timeRemaining) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = prev ? prev - 1 : null;
        if (prev && prev <= 1) {
          // Auto-submit when time runs out
          onSubmit(userAnswers);
          return 0;
        }
        // Sync with session store
        if (newTime !== null) {
          updateTimer(newTime);
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, onSubmit, userAnswers, updateTimer]);

  // Reset question index when questions change - ALWAYS CALL THIS HOOK
  useEffect(() => {
    if (questions && questions.length > 0) {
      setCurrentQuestionIndex(0);
    }
  }, [questions]);

  // NOW do conditional rendering AFTER all hooks are called
  if (!questions || questions.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
        <div className="text-center p-6">
          <h2 className="text-lg font-semibold mb-2">Loading Test...</h2>
          <p className="text-gray-600">Please wait while we prepare your questions.</p>
        </div>
      </div>
    );
  }

  // Safe array access
  const safeCurrentQuestionIndex = Math.min(Math.max(currentQuestionIndex, 0), questions.length - 1);
  const currentQuestion = questions[safeCurrentQuestionIndex];

  if (!currentQuestion) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
        <div className="text-center p-6">
          <h2 className="text-lg font-semibold mb-2 text-red-600">Error</h2>
          <p className="text-gray-600">Unable to load test questions. Please try again.</p>
          <button 
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Rest of your component logic using safeCurrentQuestionIndex
  const progress = ((safeCurrentQuestionIndex + 1) / questions.length) * 100;

  const handleAnswerSelect = (answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer
    }));
    // Also update the session store
    answerQuestion(parseInt(currentQuestion.id), answer);
  };

  const handlePrevious = () => {
    if (safeCurrentQuestionIndex > 0) {
      setCurrentQuestionIndex(safeCurrentQuestionIndex - 1);
    }
  };

  const handleNext = () => {
    if (safeCurrentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(safeCurrentQuestionIndex + 1);
    }
  };

  const toggleFlag = () => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentQuestion.id)) {
        newSet.delete(currentQuestion.id);
      } else {
        newSet.add(currentQuestion.id);
      }
      return newSet;
    });
  };

  const handleSubmit = () => {
    onSubmit(userAnswers);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getQuestionStatus = (questionIndex: number) => {
    const question = questions[questionIndex];
    const hasAnswer = userAnswers[question.id];
    const isFlagged = flaggedQuestions.has(question.id);
    
    if (hasAnswer) return 'answered';
    if (isFlagged) return 'flagged';
    return 'unanswered';
  };

  const answeredCount = questions.filter(q => userAnswers[q.id]).length;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-3 sm:p-4 flex-shrink-0">
        <div className="max-w-6xl mx-auto">
          {/* Desktop Header Layout */}
          <div className="hidden sm:flex items-center justify-between">
            {/* Exit button - Left */}
            <Button
              onClick={() => setShowExitModal(true)}
              variant="outline"
              size="lg"
              className="border-2 px-6 py-3 border-black text-slate-700 hover:border-slate-300 hover:bg-slate-50 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Exit</span>
            </Button>

            {/* Page Title - Centered */}
            <div className="text-center flex-1 mx-4">
              <h1 className="text-xl sm:text-2xl font-bold flex items-center justify-center gap-2">
                <FileText className="w-6 h-6 text-primary" />
                Test in Progress
              </h1>
              <p className="text-sm sm:text-base text-slate-600">{testTitle}</p>
            </div>

            {/* Question and Flag buttons - Right */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowQuestionList(!showQuestionList)}
                variant="outline"
                size="sm"
                className="flex items-center gap-1 px-3 py-2 text-sm"
              >
                <Menu className="w-4 h-4" />
                <span className="hidden lg:inline">Questions</span>
              </Button>

              <Button
                onClick={toggleFlag}
                variant="outline"
                size="sm"
                className={`flex items-center gap-1 px-3 py-2 text-sm ${
                  flaggedQuestions.has(currentQuestion.id)
                    ? 'bg-yellow-50 border-yellow-300 text-yellow-700'
                    : ''
                }`}
              >
                <Flag className="w-4 h-4" />
                <span className="hidden lg:inline">Flag</span>
              </Button>
            </div>
          </div>

          {/* Mobile Header Layout - Compact */}
          <div className="sm:hidden space-y-3">
            {/* Title at top */}
            <div className="text-center">
              <h1 className="text-xl font-bold flex items-center justify-center gap-2">
                <FileText className="w-6 h-6 text-primary" />
                Test in Progress
              </h1>
              <p className="text-sm text-slate-600">{testTitle}</p>
            </div>

            {/* Exit button below */}
            <div className="flex justify-start">
              <Button
                onClick={() => setShowExitModal(true)}
                variant="outline"
                size="lg"
                className="border-2 px-6 py-3 border-black text-slate-700 hover:border-slate-300 hover:bg-slate-50 flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Exit</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Test Area */}


        <div className="flex-1 flex flex-col">
          {/* Progress Bar */}
          <Progress value={progress} className="h-1.5 sm:h-2" />

          {/* Question Info */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-slate-600 py-4 sm:py-6">
            <span className="whitespace-nowrap">Q {safeCurrentQuestionIndex + 1}/{questions.length}</span>
            <span className="hidden sm:inline">•</span>
            <span className="whitespace-nowrap">{answeredCount} done</span>
            {timeRemaining && (
              <>
                <span className="hidden sm:inline">•</span>
                <div className={`flex items-center gap-1 whitespace-nowrap px-2 py-1 rounded-md ${timeRemaining < 300 ? 'bg-red-100 text-red-700 font-bold' : 'bg-blue-100 text-blue-700 font-semibold'}`}>
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base font-mono">{formatTime(timeRemaining)}</span>
                </div>
              </>
            )}
          </div>

          {/* Question Content */}
          <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-4 sm:space-y-6">
                    <h2 className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed">
                      {currentQuestion.question}
                    </h2>

                    <div className="space-y-2 sm:space-y-3">
                      {currentQuestion.options.map((option, index) => {
                        const isSelected = userAnswers[currentQuestion.id] === option;
                        return (
                          <Label
                            key={index}
                            className={`flex items-start p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200'
                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                            onClick={() => handleAnswerSelect(option)}
                          >
                            <div className="flex items-start gap-3 sm:gap-4 w-full">
                              <span 
                                className={`inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 text-xs sm:text-sm font-semibold flex-shrink-0 mt-0.5 transition-colors ${
                                  isSelected
                                    ? 'bg-blue-500 border-blue-500 text-white'
                                    : 'border-slate-300 text-slate-600'
                                }`}
                              >
                                {String.fromCharCode(65 + index)}
                              </span>
                              <span className="text-sm sm:text-base text-slate-700 leading-relaxed flex-1">
                                {option}
                              </span>
                            </div>
                          </Label>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Navigation */}
          <div className="bg-white border-t border-slate-200 p-3 sm:p-4 flex-shrink-0">
            <div className="max-w-4xl mx-auto">
              {/* Mobile: Two-row layout with flag/questions buttons on top, navigation on bottom */}
              <div className="block sm:hidden space-y-3">
                {/* Top row: Flag and Questions buttons */}
                <div className="flex justify-center gap-3">
                  <Button
                    onClick={toggleFlag}
                    variant="outline"
                    size="sm"
                    className={`flex items-center gap-2 px-4 py-2 text-sm ${
                      flaggedQuestions.has(currentQuestion.id) 
                        ? 'bg-yellow-50 border-yellow-300 text-yellow-700'
                        : 'border-slate-300 text-slate-600'
                    }`}
                  >
                    <Flag className="w-4 h-4" />
                    {flaggedQuestions.has(currentQuestion.id) ? 'Unflag' : 'Flag'}
                  </Button>
                  
                  <Button
                    onClick={() => setShowQuestionList(!showQuestionList)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 px-4 py-2 text-sm border-slate-300 text-slate-600"
                  >
                    <Menu className="w-4 h-4" />
                    Questions
                  </Button>
                </div>
                
                {/* Bottom row: Navigation buttons */}
                <div className="flex justify-between items-center">
                  <Button
                    onClick={handlePrevious}
                    disabled={safeCurrentQuestionIndex === 0}
                    variant="outline"
                    size="sm"
                    className="border-2 px-4 py-2 border-black text-slate-700 hover:border-slate-300 hover:bg-slate-50 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="text-sm">Previous</span>
                  </Button>

                  {safeCurrentQuestionIndex === questions.length - 1 ? (
                    <Button
                      onClick={handleSubmit}
                      size="sm"
                      className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium"
                    >
                      Submit Test
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNext}
                      size="sm"
                      className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1 text-sm"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Desktop: Single row layout (original) */}
              <div className="hidden sm:flex justify-between items-center gap-4">
                <Button
                  onClick={handlePrevious}
                  disabled={safeCurrentQuestionIndex === 0}
                  variant="outline"
                  size="sm"
                  className="border-2 px-6 py-3 border-black text-slate-700 hover:border-slate-300 hover:bg-slate-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="text-base">Previous</span>
                </Button>

                {safeCurrentQuestionIndex === questions.length - 1 ? (
                  <Button
                    onClick={handleSubmit}
                    size="sm"
                    className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white text-base font-medium"
                  >
                    Submit Test
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    size="sm"
                    className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-2 text-base"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Question List Sidebar - Hidden on small screens by default, overlay on medium screens */}
        {showQuestionList && (
          <>
            {/* Mobile overlay backdrop */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
              onClick={() => setShowQuestionList(false)}
            />
            
            {/* Sidebar */}
            <div className="fixed right-0 top-0 bottom-0 w-80 bg-slate-50 border-l border-slate-200 overflow-y-auto flex-shrink-0 z-20 md:relative md:w-72 lg:w-80">
              <div className="p-3 sm:p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900 text-sm sm:text-base">Question Navigator</h3>
                  <button
                    onClick={() => setShowQuestionList(false)}
                    className="p-1.5 hover:bg-slate-200 rounded transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-5 gap-1.5 sm:gap-2 mb-4 sm:mb-6">
                  {questions.map((question, index) => {
                    const status = getQuestionStatus(index);
                    const isCurrent = index === safeCurrentQuestionIndex;
                    
                    return (
                      <button
                        key={question.id}
                        onClick={() => {
                          setCurrentQuestionIndex(index);
                          if (window.innerWidth < 768) {
                            setShowQuestionList(false);
                          }
                        }}
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg text-xs sm:text-sm font-medium border transition-all duration-200 ${
                          isCurrent
                            ? 'bg-slate-900 text-white border-slate-900 scale-110'
                            : status === 'answered'
                            ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200 hover:scale-105'
                            : status === 'flagged'
                            ? 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200 hover:scale-105'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:scale-105'
                        }`}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />
                    <span className="text-slate-600">Answered ({answeredCount})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Flag className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600 flex-shrink-0" />
                    <span className="text-slate-600">Flagged ({flaggedQuestions.size})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Circle className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 flex-shrink-0" />
                    <span className="text-slate-600">Unanswered ({questions.length - answeredCount})</span>
                  </div>
                </div>

                {timeRemaining && timeRemaining < 300 && (
                  <div className="mt-4 sm:mt-6 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="font-medium text-xs sm:text-sm">Time Warning</span>
                    </div>
                    <p className="text-xs sm:text-sm text-red-600 mt-1">
                      Less than 5 minutes remaining!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Exit Confirmation Modal */}
      <Dialog open={showExitModal} onOpenChange={setShowExitModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Exit Test</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit and exit the test? Your answers will be saved and you'll see your results.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowExitModal(false)}
              className="w-full sm:w-auto"
            >
              Cancel and Return
            </Button>
            <Button
              onClick={() => {
                setShowExitModal(false);
                handleSubmit(); // Submit the test first
                onBack(); // Then exit
              }}
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white"
            >
              Submit and Exit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
