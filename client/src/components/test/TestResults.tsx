import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, X, List } from "lucide-react";
import { useLocation } from "wouter";

interface Question {
  id: number;
  type: 'mcq' | 'true-false';
  question: string;
  options: string[];
}

interface TestResultsProps {
  testTitle: string;
  questions: Question[];
  userAnswers: Record<number, string>;
  correctAnswers: Record<number, string>;
  onBack: () => void;
}

export function TestResults({ testTitle, questions, userAnswers, correctAnswers, onBack }: TestResultsProps) {
  const [, setLocation] = useLocation();

  // Calculate score
  const totalQuestions = questions.length;
  const correctCount = questions.filter(q => userAnswers[q.id] === correctAnswers[q.id]).length;

  const handleBackToLibrary = () => {
    setLocation("/library");
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
          Test Results
        </h1>
        <p className="text-studywise-gray-600">
          Review your performance on the test and see which questions you answered correctly or incorrectly.
        </p>
      </div>

      {/* Summary */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-studywise-gray-900 mb-4">
          Summary
        </h2>
        <div className="bg-studywise-gray-50 rounded-lg p-4">
          <p className="text-lg font-medium text-studywise-gray-900">
            Total Score: {correctCount}/{totalQuestions}
          </p>
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
                      
                      <p className="text-studywise-gray-700">
                        {question.question}
                      </p>
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
        <Button 
          onClick={handleBackToLibrary}
          className="bg-primary hover:bg-blue-600 px-6"
        >
          Back to Library
        </Button>
      </div>
    </div>
  );
}