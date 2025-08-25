import { useState, useEffect } from "react";
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
import { useLocation } from "wouter";

interface Question {
  id: number;
  type: 'mcq' | 'true-false';
  question: string;
  options: string[];
}

interface TestTakingProps {
  testTitle: string;
  questions: Question[];
  timeLimit: number | null; // in minutes, null for no limit
  onSubmit: (answers: Record<number, string>) => void;
  onBack: () => void;
}

export function TestTaking({ testTitle, questions, timeLimit, onSubmit, onBack }: TestTakingProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(
    timeLimit ? timeLimit * 60 : null // convert minutes to seconds
  );
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [, setLocation] = useLocation();

  const currentQuestion = questions[currentQuestionIndex];

  // Timer effect
  useEffect(() => {
    if (timeRemaining === null) return;

    if (timeRemaining <= 0) {
      // Auto-submit when time runs out
      handleAutoSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => prev ? prev - 1 : null);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const handleAutoSubmit = () => {
    onSubmit(answers);
    setShowResultDialog(true);
  };

  const handleAnswerSelect = (answer: string) => {
    setAnswers(prev => ({
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

  const handleSubmitClick = () => {
    setShowSubmitDialog(true);
  };

  const handleConfirmSubmit = () => {
    onSubmit(answers);
    setShowSubmitDialog(false);
    setShowResultDialog(true);
  };

  const handleShowResults = () => {
    setLocation("/results");
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return {
      minutes: minutes.toString().padStart(2, '0'),
      seconds: remainingSeconds.toString().padStart(2, '0')
    };
  };

  const timeDisplay = timeRemaining ? formatTime(timeRemaining) : null;
  const isTimeRunningOut = timeRemaining && timeRemaining <= 60; // Last minute warning

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Breadcrumb */}
      <div className="text-sm text-studywise-gray-500 mb-4">
        Practice / Quiz
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-studywise-gray-900 mb-2">
          {testTitle}
        </h1>
        <p className="text-studywise-gray-600">
          Question {currentQuestionIndex + 1} of {questions.length}
        </p>
      </div>

      {/* Question Card */}
      <Card className="mb-8">
        <CardContent className="p-8">
          <h2 className="text-lg font-medium text-studywise-gray-900 mb-6">
            {currentQuestion.question}
          </h2>

          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  answers[currentQuestion.id] === option
                    ? 'border-primary bg-blue-50'
                    : 'border-studywise-gray-200 hover:border-studywise-gray-300'
                }`}
                onClick={() => handleAnswerSelect(option)}
              >
                <div className="flex items-center">
                  <div className="flex items-center h-5">
                    <input
                      type="radio"
                      checked={answers[currentQuestion.id] === option}
                      onChange={() => handleAnswerSelect(option)}
                      className="w-4 h-4 text-primary border-studywise-gray-300 focus:ring-primary"
                    />
                  </div>
                  <label className="ml-3 text-studywise-gray-900 cursor-pointer">
                    {option}
                  </label>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center mb-8">
        <Button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          variant="outline"
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>

        <Button
          onClick={handleSubmitClick}
          className="bg-green-600 hover:bg-green-700 px-6"
        >
          Submit Test
        </Button>

        <Button
          onClick={handleNext}
          disabled={currentQuestionIndex === questions.length - 1}
          className="bg-primary hover:bg-blue-600 flex items-center gap-2"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Timer */}
      {timeDisplay && (
        <div className="flex justify-center">
          <div className="flex gap-4">
            <div className={`text-center p-4 rounded-lg ${
              isTimeRunningOut ? 'bg-red-100' : 'bg-studywise-gray-100'
            }`}>
              <div className={`text-2xl font-bold ${
                isTimeRunningOut ? 'text-red-600' : 'text-studywise-gray-900'
              }`}>
                {timeDisplay.minutes}
              </div>
              <div className="text-sm text-studywise-gray-600">Minutes</div>
            </div>
            <div className={`text-center p-4 rounded-lg ${
              isTimeRunningOut ? 'bg-red-100' : 'bg-studywise-gray-100'
            }`}>
              <div className={`text-2xl font-bold ${
                isTimeRunningOut ? 'text-red-600' : 'text-studywise-gray-900'
              }`}>
                {timeDisplay.seconds}
              </div>
              <div className="text-sm text-studywise-gray-600">Seconds</div>
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Test</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to submit your test? You have answered {Object.keys(answers).length} out of {questions.length} questions. 
              Once submitted, you cannot make any changes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Test</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmSubmit}
              className="bg-green-600 hover:bg-green-700"
            >
              Submit Test
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Test Submitted Dialog */}
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
            <AlertDialogCancel onClick={onBack}>
              Back to Library
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleShowResults}
              className="bg-primary hover:bg-blue-600"
            >
              Show Results
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}