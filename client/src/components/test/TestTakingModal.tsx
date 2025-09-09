import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
  AlertTriangle
} from "lucide-react";
import { Question } from "@/types";

interface TestTakingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testTitle: string;
  questions: Question[];
  timeLimit: number | null; // in minutes
  onSubmit: (answers: Record<number, string>) => void;
}

export function TestTakingModal({ 
  open, 
  onOpenChange, 
  testTitle, 
  questions, 
  timeLimit,
  onSubmit 
}: TestTakingModalProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState<number | null>(
    timeLimit ? timeLimit * 60 : null
  );
  const [showQuestionList, setShowQuestionList] = useState(false);

  // Timer effect
  useEffect(() => {
    if (!timeRemaining || !open) return;

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
  }, [timeRemaining, open, onSubmit, userAnswers]);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleAnswerSelect = (answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer
    }));
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] p-0 overflow-hidden">
        <div className="flex h-[90vh]">
          {/* Main Test Area */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">{testTitle}</h1>
                  <div className="flex items-center gap-4 text-sm text-slate-600 mt-1">
                    <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                    <span>•</span>
                    <span>{answeredCount} answered</span>
                    {timeRemaining && (
                      <>
                        <span>•</span>
                        <div className={`flex items-center gap-1 ${timeRemaining < 300 ? 'text-red-600' : ''}`}>
                          <Clock className="w-4 h-4" />
                          {formatTime(timeRemaining)}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setShowQuestionList(!showQuestionList)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <List className="w-4 h-4" />
                    Questions
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
                    Flag
                  </Button>
                </div>
              </div>

              <Progress value={progress} className="h-2" />
            </div>

            {/* Question Content */}
            <div className="flex-1 p-6 overflow-y-auto">
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
                          <div key={index} className="flex items-center space-x-3">
                            <RadioGroupItem
                              value={option}
                              id={`option-${index}`}
                              className="text-primary"
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

            {/* Navigation */}
            <div className="bg-white border-t border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <Button
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>

                <div className="flex items-center gap-3">
                  {currentQuestionIndex === questions.length - 1 ? (
                    <Button
                      onClick={handleSubmit}
                      className="bg-green-600 hover:bg-green-700 text-white px-8"
                    >
                      Submit Test
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNext}
                      className="flex items-center gap-2"
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
            <div className="w-80 bg-slate-50 border-l border-slate-200 overflow-y-auto">
              <div className="p-4">
                <h3 className="font-semibold text-slate-900 mb-4">Question Navigator</h3>
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((question, index) => {
                    const status = getQuestionStatus(index);
                    const isCurrent = index === currentQuestionIndex;
                    
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

                <div className="mt-6 space-y-3 text-sm">
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
      </DialogContent>
    </Dialog>
  );
}