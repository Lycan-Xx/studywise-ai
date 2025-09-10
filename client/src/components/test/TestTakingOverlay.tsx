import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
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
  Menu
} from "lucide-react";
import { Question } from "@/types";

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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState<number | null>(
    timeLimit ? timeLimit * 60 : null
  );
  const [showQuestionList, setShowQuestionList] = useState(false);

  // Timer effect - ALWAYS CALL THIS HOOK
  useEffect(() => {
    if (!timeRemaining) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev && prev <= 1) {
          // Auto-submit when time runs out
          onSubmit(userAnswers);
          return 0;
        }
        return prev ? prev - 1 : null;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, onSubmit, userAnswers]);

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
            Back to Dashboard
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
      <div className="bg-white border-b border-slate-200 p-4 flex-shrink-0">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={onBack}
                variant="outline"
                size="lg"
                className="border-2 px-6 py-3 border-black text-slate-700 hover:border-slate-300 hover:bg-slate-50 flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Exit Test</span>
              </Button>
              
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900">{testTitle}</h1>
                <div className="flex items-center gap-4 text-sm text-slate-600 mt-1">
                  <span>Question {safeCurrentQuestionIndex + 1} of {questions.length}</span>
                  <span>•</span>
                  <span>{answeredCount} answered</span>
                  {timeRemaining && (
                    <>
                      <span>•</span>
                      <div className={`flex items-center gap-1 ${timeRemaining < 300 ? 'text-red-600 font-semibold' : ''}`}>
                        <Clock className="w-4 h-4" />
                        {formatTime(timeRemaining)}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowQuestionList(!showQuestionList)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Menu className="w-4 h-4" />
                <span className="hidden sm:inline">Questions</span>
              </Button>
              
              <Button
                onClick={toggleFlag}
                variant="outline"
                size="sm"
                className={`flex items-center gap-2 ${
                  flaggedQuestions.has(currentQuestion.id) 
                    ? 'bg-yellow-50 border-yellow-300 text-yellow-700'
                    : ''
                }`}
              >
                <Flag className="w-4 h-4" />
                <span className="hidden sm:inline">Flag</span>
              </Button>
            </div>
          </div>

          <Progress value={progress} className="h-2" />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Test Area */}
        <div className="flex-1 flex flex-col">
          {/* Question Content */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              <Card className="border-slate-200">
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <h2 className="text-lg font-medium text-slate-900">
                      {currentQuestion.question}
                    </h2>

                    <RadioGroup
                      value={userAnswers[currentQuestion.id] || ""}
                      onValueChange={handleAnswerSelect}
                    >
                      <div className="space-y-3">
                        {currentQuestion.options.map((option, index) => (
                          <div key={index} className="flex items-start space-x-3">
                            <RadioGroupItem
                              value={option}
                              id={`option-${index}`}
                              className="text-primary mt-1"
                            />
                            <Label
                              htmlFor={`option-${index}`}
                              className="flex-1 text-base cursor-pointer p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                            >
                              <span className="font-medium text-slate-700 mr-2">
                                {String.fromCharCode(65 + index)}.
                              </span>
                              {option}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Navigation */}
          <div className="bg-white border-t border-slate-200 p-4 flex-shrink-0">
            <div className="max-w-4xl mx-auto">
              <div className="flex justify-between">
                <Button
                  onClick={handlePrevious}
                  disabled={safeCurrentQuestionIndex === 0}
                  variant="outline"
                  size="lg"
                  className="border-2 px-6 py-3 border-black text-slate-700 hover:border-slate-300 hover:bg-slate-50 flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>

                {safeCurrentQuestionIndex === questions.length - 1 ? (
                  <Button
                    onClick={handleSubmit}
                    size="lg"
                    className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white"
                  >
                    Submit Test
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    size="lg"
                    className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-2"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Question List Sidebar */}
        {showQuestionList && (
          <div className="w-80 bg-slate-50 border-l border-slate-200 overflow-y-auto flex-shrink-0">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">Question Navigator</h3>
                <button
                  onClick={() => setShowQuestionList(false)}
                  className="p-1 hover:bg-slate-200 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-5 gap-2 mb-6">
                {questions.map((question, index) => {
                  const status = getQuestionStatus(index);
                  const isCurrent = index === safeCurrentQuestionIndex;
                  
                  return (
                    <button
                      key={question.id}
                      onClick={() => setCurrentQuestionIndex(index)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium border transition-colors ${
                        isCurrent
                          ? 'bg-primary text-white border-primary'
                          : status === 'answered'
                          ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
                          : status === 'flagged'
                          ? 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-slate-600">Answered ({answeredCount})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Flag className="w-4 h-4 text-yellow-600" />
                  <span className="text-slate-600">Flagged ({flaggedQuestions.size})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Circle className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">Unanswered ({questions.length - answeredCount})</span>
                </div>
              </div>

              {timeRemaining && timeRemaining < 300 && (
                <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-medium">Time Warning</span>
                  </div>
                  <p className="text-sm text-red-600 mt-1">
                    Less than 5 minutes remaining!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
