import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { Button } from '../components/ui/button';
import { ArrowLeft, RotateCcw, Sparkles, CheckCircle2, XCircle } from 'lucide-react';
import { ApiService } from '../services/apiService';

interface TestResult {
  id: string;
  test_id: string;
  module_id: string;
  total_questions: number;
  correct_answers: number;
  score_percentage: number;
  total_time_seconds: number;
  insights_requested: boolean;
  insights_text?: string;
  weak_areas?: string[];
  strong_areas?: string[];
  recommendations?: string;
}

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  options?: string[];
  correct_answer: string;
  explanation?: string;
}

interface UserAnswer {
  question_id: string;
  user_answer: string;
  is_correct: boolean;
}

export default function TestSummary() {
  const { testId } = useParams<{ testId: string }>();
  const [, setLocation] = useLocation();
  
  const [result, setResult] = useState<TestResult | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [moduleStats, setModuleStats] = useState<any>(null);
  const [courseStats, setCourseStats] = useState<any>(null);
  const [requestingInsights, setRequestingInsights] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTestSummary();
  }, [testId]);

  const loadTestSummary = async () => {
    try {
      // Load test result
      const resultData = await ApiService.getTestResult(testId!);
      setResult(resultData);

      // Load questions and answers
      const questionsData = await ApiService.getTestQuestions(testId!);
      setQuestions(questionsData);

      const answersData = await ApiService.getTestAnswers(testId!);
      setUserAnswers(answersData);

      // Load module and course stats
      const statsData = await ApiService.getTestStats(testId!);
      setModuleStats(statsData.module);
      setCourseStats(statsData.course);

      setLoading(false);
    } catch (error) {
      console.error('Failed to load test summary:', error);
      setLoading(false);
    }
  };

  const handleRequestInsights = async () => {
    setRequestingInsights(true);
    try {
      const data = await ApiService.requestAIAnalysis(testId!);
      setResult(prev => prev ? { ...prev, ...data } : null);
    } catch (error) {
      console.error('Failed to request insights:', error);
    }
    setRequestingInsights(false);
  };

  const handleRetakeTest = () => {
    if (result) {
      setLocation(`/courses/${courseStats.course_id}/modules/${result.module_id}/test`);
    }
  };

  const handleBackToCourse = () => {
    if (courseStats) {
      setLocation(`/courses/${courseStats.course_id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-studywise-gray-600">Loading results...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-studywise-gray-600">Test result not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-studywise-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <h1 className="text-3xl font-bold text-studywise-gray-900 mb-6">
            Test Complete!
          </h1>

          {/* Score Display */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <p className="text-sm text-studywise-gray-600 mb-1">Your Score</p>
              <p className="text-4xl font-bold text-primary">
                {result.score_percentage}%
              </p>
              <p className="text-sm text-studywise-gray-600 mt-1">
                {result.correct_answers}/{result.total_questions} correct
              </p>
            </div>

            {moduleStats && (
              <div className="text-center p-4 bg-studywise-gray-50 rounded-lg">
                <p className="text-sm text-studywise-gray-600 mb-1">Module Average</p>
                <p className="text-3xl font-bold text-studywise-gray-900">
                  {moduleStats.average_score}%
                </p>
                <p className="text-sm text-studywise-gray-600 mt-1">
                  {moduleStats.total_attempts} attempts
                </p>
              </div>
            )}

            {courseStats && (
              <div className="text-center p-4 bg-studywise-gray-50 rounded-lg">
                <p className="text-sm text-studywise-gray-600 mb-1">Course Average</p>
                <p className="text-3xl font-bold text-studywise-gray-900">
                  {courseStats.average_score}%
                </p>
                <p className="text-sm text-studywise-gray-600 mt-1">
                  All modules
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleBackToCourse} variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Course
            </Button>
            <Button onClick={handleRetakeTest} variant="outline" className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Retake This Test
            </Button>
            {!result.insights_requested && (
              <Button
                onClick={handleRequestInsights}
                disabled={requestingInsights}
                className="gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {requestingInsights ? 'Generating...' : 'Request AI Analysis'}
              </Button>
            )}
          </div>
        </div>

        {/* AI Insights */}
        {result.insights_requested && result.insights_text && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-studywise-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI Analysis
            </h2>
            
            <div className="prose prose-studywise max-w-none">
              <p className="text-studywise-gray-700 mb-4">{result.insights_text}</p>
              
              {result.weak_areas && result.weak_areas.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-studywise-gray-900 mb-2">
                    Areas to Focus On:
                  </h3>
                  <ul className="list-disc list-inside space-y-1">
                    {Array.isArray(result.weak_areas) && result.weak_areas.map((area, index) => (
                      <li key={index} className="text-studywise-gray-700">{area}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {result.strong_areas && result.strong_areas.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-studywise-gray-900 mb-2">
                    Your Strengths:
                  </h3>
                  <ul className="list-disc list-inside space-y-1">
                    {Array.isArray(result.strong_areas) && result.strong_areas.map((area, index) => (
                      <li key={index} className="text-studywise-gray-700">{area}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {result.recommendations && (
                <div>
                  <h3 className="text-sm font-semibold text-studywise-gray-900 mb-2">
                    Recommendations:
                  </h3>
                  <p className="text-studywise-gray-700">{result.recommendations}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Questions Review */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-studywise-gray-900 mb-6">
            Question Review
          </h2>

          <div className="space-y-6">
            {questions.map((question, index) => {
              const userAnswer = userAnswers.find(a => a.question_id === question.id);
              const isCorrect = userAnswer?.is_correct ?? false;

              return (
                <div
                  key={question.id}
                  className={`border-l-4 pl-4 ${
                    isCorrect ? 'border-green-500' : 'border-red-500'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    {isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-studywise-gray-900 mb-2">
                        {index + 1}. {question.question_text}
                      </p>

                      {Array.isArray(question.options) && (
                        <div className="space-y-2 mb-3">
                          {question.options.map((option, optIndex) => {
                            const isUserAnswer = userAnswer?.user_answer === option;
                            const isCorrectAnswer = question.correct_answer === option;

                            return (
                              <div
                                key={optIndex}
                                className={`px-3 py-2 rounded text-sm ${
                                  isCorrectAnswer
                                    ? 'bg-green-50 text-green-900 font-medium'
                                    : isUserAnswer
                                    ? 'bg-red-50 text-red-900'
                                    : 'bg-studywise-gray-50 text-studywise-gray-700'
                                }`}
                              >
                                {option}
                                {isCorrectAnswer && ' ✓'}
                                {isUserAnswer && !isCorrectAnswer && ' ✗'}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {question.explanation && (
                        <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-900">
                          <p className="font-medium mb-1">Explanation:</p>
                          <p>{question.explanation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
