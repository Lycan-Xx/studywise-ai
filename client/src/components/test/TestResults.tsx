import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, X, List, ExternalLink } from "lucide-react";
import { useLocation } from "wouter";
import { Question } from "@/types";

interface TestResultsProps {
  testTitle: string;
  testId?: string;
  questions: Question[];
  userAnswers: Record<number, string>;
  correctAnswers: Record<number, string>;
  onBack: () => void;
}

export function TestResults({ testTitle, testId, questions, userAnswers, correctAnswers, onBack }: TestResultsProps) {
  const [, setLocation] = useLocation();

  // Calculate score
  const totalQuestions = questions.length;
  const correctCount = questions.filter(q => userAnswers[q.id] === correctAnswers[q.id]).length;

  const handleBackToLibrary = () => {
    setLocation("/library");
  };

  const handleViewInNotes = (question: Question) => {
    if (!testId || !question.sourceText) return;
    
    const params = new URLSearchParams({
      open: testId,
      q: encodeURIComponent(question.sourceText.substring(0, 50))
    });
    setLocation(`/library?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Breadcrumb */}
      <div className="text-sm text-studywise-gray-500 mb-4">
        My Library / Test Results
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-studywise-gray-900 mb-2">
          How Did You Do?
        </h1>
        <p className="text-studywise-gray-600">
          Here's your performance breakdown. Review each question to understand what you got right and where you can improve.
        </p>
      </div>

      {/* Summary */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-studywise-gray-900 mb-4">
          Your Score
        </h2>
        <div className="bg-studywise-gray-50 rounded-lg p-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-studywise-gray-900 mb-2">
              {correctCount}/{totalQuestions}
            </p>
            <p className="text-lg text-studywise-gray-600">
              {Math.round((correctCount/totalQuestions) * 100)}% Correct
            </p>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-studywise-gray-900 mb-6">
          Questions
        </h2>
        
        <div className="space-y-4">
          {questions.map((question, index) => {
            const userAnswer = userAnswers[question.id];
            const correctAnswer = correctAnswers[question.id];
            const isCorrect = userAnswer === correctAnswer;
            
            return (
              <Card key={question.id} className="border border-studywise-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <List className="w-5 h-5 text-studywise-gray-400 mt-1" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-medium text-studywise-gray-900">
                          Question {index + 1}
                        </h3>
                        <div className="flex-shrink-0 ml-4">
                          {isCorrect ? (
                            <Check className="w-5 h-5 text-green-600" />
                          ) : (
                            <X className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <p className={`text-sm ${
                          isCorrect ? 'text-green-600' : 'text-red-600'
                        }`}>
                          Your Answer: {userAnswer || 'No answer'} {isCorrect ? '(Correct)' : '(Incorrect)'}
                        </p>
                        {!isCorrect && (
                          <p className="text-sm text-studywise-gray-600 mt-1">
                            Correct Answer: {correctAnswer}
                          </p>
                        )}
                      </div>
                      
                      <p className="text-studywise-gray-700 mb-3">
                        {question.question}
                      </p>

                      {/* Source Link */}
                      {testId && question.sourceText && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewInNotes(question)}
                          className="text-xs text-primary hover:text-primary/80 p-0 h-auto font-normal"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          View in Notes
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Feedback Section */}
      <div className="mb-8">
        <div className="border border-studywise-gray-200 rounded-lg p-4">
          <textarea
            placeholder="Provide feedback on the test (optional)"
            className="w-full h-24 p-3 border-0 resize-none focus:outline-none text-studywise-gray-700 placeholder-studywise-gray-400"
          />
        </div>
      </div>

      {/* Back to Library Button */}
      <div className="flex justify-start">
        <div className="flex gap-4">
          <Button 
            onClick={handleBackToLibrary}
            size="lg"
            className="bg-primary hover:bg-primary/90 px-8"
          >
            Back to Library
          </Button>
          <Button 
            onClick={onBack}
            variant="outline"
            size="lg"
            className="px-8"
          >
            Study Again
          </Button>
        </div>
      </div>
    </div>
  );
}