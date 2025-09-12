import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Clock,
  Target,
  RefreshCw,
  BookOpen,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Brain,
  Loader2
} from "lucide-react";
import { Question } from "@/types";
import { SourcePreviewModal } from "./SourcePreviewModal";
import { useLocation } from "wouter";

interface TestResultsOverlayProps {
  testTitle: string;
  testId: string;
  questions: Question[];
  userAnswers: Record<number, string>;
  correctAnswers: Record<number, string>;
  score: number;
  totalQuestions: number;
  timeSpent?: number; // in seconds
  notes: string;
  onRetake: () => void;
  onRetakeWrong: () => void;
  onViewNotes: () => void;
  onBack: () => void;
  onReturnToLibrary?: () => void; // Optional callback for navigation
}

export function TestResultsOverlay({
  testTitle,
  testId,
  questions,
  userAnswers,
  correctAnswers,
  score,
  totalQuestions,
  timeSpent,
  notes,
  onRetake,
  onRetakeWrong,
  onViewNotes,
  onBack,
  onReturnToLibrary
}: TestResultsOverlayProps) {
  const [selectedTab, setSelectedTab] = useState("summary");
  const [, setLocation] = useLocation();
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [sourceModalOpen, setSourceModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [, navigate] = useLocation();
  const [insights, setInsights] = useState<any>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null); // State for insights error

  // Dummy `result` object and `setIsLoadingInsights` to make the provided changes runnable.
  // In a real scenario, `result` would be passed as a prop or fetched.
  const result = { testId, questions, userAnswers, correctAnswers, score, totalQuestions, testTitle };
  const setIsLoadingInsights = setInsightsLoading; // Alias for clarity with the provided snippet

  // Use the passed score prop instead of calculating it
  const percentage = score;
  const correctCount = questions.filter(q => userAnswers[q.id] === q.correctAnswer).length;
  const wrongCount = totalQuestions - correctCount;

  // Generate AI insights when component mounts
  useEffect(() => {
    if (result && !insights) {
      console.log('🔍 Starting insights generation...');
      generateInsights();
    }
  }, [result, insights]);

  const generateInsights = async () => {
    if (!result) return;

    setIsLoadingInsights(true);
    setInsightsError(null);

    try {
      console.log('📊 Generating insights for result:', result.testId);

      // Reconstruct source content from questions
      const sourceContent = result.questions?.map(q => q.sourceText).join(' ') || '';

      // Create the test result payload for insights
      const testResultPayload = {
        score: result.score,
        totalQuestions: result.totalQuestions,
        questions: result.questions || [],
        userAnswers: result.userAnswers || {},
        correctAnswers: result.correctAnswers || {},
        testTitle: result.testTitle,
        sourceContent
      };

      console.log('📤 Sending insights request payload:', testResultPayload);

      const response = await fetch(`/api/tests/${result.testId}/insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testResultPayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Insights API error:', response.status, errorText);
        throw new Error(`Failed to generate insights: ${response.statusText}`);
      }

      const insightsData = await response.json();
      console.log('✅ Insights generated:', insightsData);
      setInsights(insightsData);

    } catch (error) {
      console.error('❌ Error generating insights:', error);
      setInsightsError(error instanceof Error ? error.message : 'Failed to generate insights');

      // Provide fallback insights if API fails
      const fallbackInsights = {
        overallPerformance: result.score >= 70 ? "Good performance!" : "Room for improvement",
        strengths: result.score >= 70 ? ["Good understanding of concepts"] : ["Completed the test"],
        weaknesses: result.score < 70 ? ["Review missed questions"] : [],
        studyRecommendations: ["Review explanations", "Focus on weak areas"],
        focusAreas: ["Key concepts from the material"]
      };

      setInsights(fallbackInsights);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreMessage = (score: number) => {
    if (score >= 90) return "Excellent work! You've mastered this material.";
    if (score >= 80) return "Great job! You have a solid understanding.";
    if (score >= 70) return "Good effort! A few areas could use more study.";
    if (score >= 60) return "Fair performance. Consider reviewing the material.";
    return "Keep studying! This material needs more attention.";
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes === 0) return `${remainingSeconds}s`;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const wrongQuestions = questions.filter(q => userAnswers[q.id] !== q.correctAnswer);

  const handleViewSource = (question: Question) => {
    setSelectedQuestion(question);
    setSourceModalOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200">
        <div className="flex items-center justify-center p-4 max-w-6xl mx-auto">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-primary" />
            Test Results
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="breakdown">Question Breakdown</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-6 mt-6">
            {/* Score Overview */}
            <Card className="border-slate-200">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className={`text-6xl font-bold ${getScoreColor(percentage)}`}>
                    {percentage}%
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-slate-900">
                      {getScoreMessage(percentage)}
                    </h3>
                    <div className="flex justify-center items-center gap-6 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        {correctCount} Correct
                      </div>
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-600" />
                        {wrongCount} Incorrect
                      </div>


                      {/* {timeSpent && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-600" />
                          {formatTime(timeSpent)}
                        </div>
                      )} */}



                    </div>
                  </div>
                </div>

                <Progress value={percentage} className="h-3 mt-6" />
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-slate-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Target className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="text-sm text-slate-600">Accuracy</p>
                      <p className="text-xl font-bold text-slate-900">{percentage}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="text-sm text-slate-600">Correct</p>
                      <p className="text-xl font-bold text-slate-900">{correctCount}/{totalQuestions}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

            {/* {timeSpent && (
              <Card className="border-slate-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Clock className="w-8 h-8 text-purple-600" />
                    <div>
                      <p className="text-sm text-slate-600">Time Spent</p>
                      <p className="text-xl font-bold text-slate-900">{formatTime(timeSpent)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )} */}
            </div>
          </TabsContent>

          <TabsContent value="breakdown" className="space-y-4 mt-6">
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {questions.map((question, index) => {
                const userAnswer = userAnswers[question.id];
                const isCorrect = userAnswer === question.correctAnswer;

                return (
                  <Card key={question.id} className="border-slate-200">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-slate-900">
                            {index + 1}. {question.question}
                          </h4>
                          <Badge variant={isCorrect ? "default" : "destructive"}>
                            {isCorrect ? "Correct" : "Incorrect"}
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          {question.options.map((option, optionIndex) => (
                            <div
                              key={optionIndex}
                              className={`p-2 rounded-lg border text-sm ${
                                option === question.correctAnswer
                                  ? 'bg-green-50 border-green-200 text-green-800'
                                  : option === userAnswer && !isCorrect
                                  ? 'bg-red-50 border-red-200 text-red-800'
                                  : 'bg-slate-50 border-slate-200 text-slate-700'
                              }`}
                            >
                              <span className="font-medium">
                                {String.fromCharCode(65 + optionIndex)}.
                              </span>{' '}
                              {option}
                              {option === question.correctAnswer && (
                                <span className="ml-2 text-green-600 text-xs">✓ Correct Answer</span>
                              )}
                              {option === userAnswer && !isCorrect && (
                                <span className="ml-2 text-red-600 text-xs">✗ Your Answer</span>
                              )}
                            </div>
                          ))}
                        </div>

                        {question.sourceText && (
                          <div className="mt-3 pt-3 border-t border-slate-200">
                            <Button
                              onClick={() => handleViewSource(question)}
                              variant="ghost"
                              size="sm"
                              className="text-primary hover:text-primary/80 p-0 h-auto font-normal"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              View source in notes
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4 mt-6">
            <Card className="border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-slate-900">AI-Powered Performance Analysis</h3>
                </div>

                {insightsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="ml-2 text-slate-600">Analyzing your performance...</span>
                  </div>
                ) : insights ? (
                  <div className="space-y-4">
                    {/* Overall Performance */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-800 mb-2">Overall Performance</h4>
                      <p className="text-blue-700">{insights.overallPerformance}</p>
                    </div>

                    {/* Strengths */}
                    {insights.strengths && insights.strengths.length > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="font-medium text-green-800 mb-2">Strengths</h4>
                        <ul className="text-green-700 space-y-1">
                          {insights.strengths.map((strength: string, index: number) => (
                            <li key={index}>• {strength}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Areas for Improvement */}
                    {insights.weaknesses && insights.weaknesses.length > 0 && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <h4 className="font-medium text-orange-800 mb-2">Areas for Improvement</h4>
                        <ul className="text-orange-700 space-y-1">
                          {insights.weaknesses.map((weakness: string, index: number) => (
                            <li key={index}>• {weakness}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Study Recommendations */}
                    {insights.studyRecommendations && insights.studyRecommendations.length > 0 && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <h4 className="font-medium text-purple-800 mb-2">Study Recommendations</h4>
                        <ul className="text-purple-700 space-y-1">
                          {insights.studyRecommendations.map((recommendation: string, index: number) => (
                            <li key={index}>• {recommendation}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Focus Areas */}
                    {insights.focusAreas && insights.focusAreas.length > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 className="font-medium text-yellow-800 mb-2">Key Topics to Review</h4>
                        <ul className="text-yellow-700 space-y-1">
                          {insights.focusAreas.map((area: string, index: number) => (
                            <li key={index}>• {area}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Fallback to original static insights */}
                    {percentage >= 80 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="font-medium text-green-800 mb-2">Strengths</h4>
                        <p className="text-green-700">
                          You demonstrate strong comprehension of the material. Your performance indicates solid understanding of key concepts.
                        </p>
                      </div>
                    )}

                    {wrongCount > 0 && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <h4 className="font-medium text-orange-800 mb-2">Areas for Improvement</h4>
                        <p className="text-orange-700">
                          Consider reviewing the material related to the {wrongCount} incorrect answer{wrongCount > 1 ? 's' : ''}.
                          Focus on understanding the concepts rather than memorization.
                        </p>
                      </div>
                    )}

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-800 mb-2">Recommendations</h4>
                      <ul className="text-blue-700 space-y-1">
                        {percentage < 70 && (
                          <li>• Review your notes thoroughly before taking another test</li>
                        )}
                        {wrongCount > 0 && (
                          <li>• Retake questions you got wrong to reinforce learning</li>
                        )}
                        <li>• Practice with similar questions to build confidence</li>
                        {percentage >= 80 && (
                          <li>• Consider moving to more advanced material or increasing difficulty</li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}

                {insightsError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                    <h4 className="font-medium text-red-800 mb-2">Error Generating Insights</h4>
                    <p className="text-red-700">{insightsError}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Sticky Footer with Action Buttons */}
      <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between">
            <Button
              onClick={() => {
                // Use client-side navigation to avoid page refresh
                setLocation('/library');
                onBack();
              }}
              variant="outline"
              size="lg"
              className="border-2 px-6 py-3 border-black text-slate-700 hover:border-slate-300 hover:bg-slate-50"
            >
              Return to Library
            </Button>
            <Button
              onClick={onRetake}
              size="lg"
              className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retake Full Test
            </Button>
          </div>
        </div>
      </div>

      {/* Notes Preview Modal */}
      <SourcePreviewModal
        isOpen={notesModalOpen}
        onClose={() => setNotesModalOpen(false)}
        notes={notes}
        sourceText={undefined}
        sourceOffset={undefined}
        sourceLength={undefined}
        questionText={`Course Notes: ${testTitle}`}
      />

      {/* Source Preview Modal */}
      {selectedQuestion && (
        <SourcePreviewModal
          isOpen={sourceModalOpen}
          onClose={() => {
            setSourceModalOpen(false);
            setSelectedQuestion(null);
          }}
          notes={notes}
          sourceText={selectedQuestion.sourceText}
          sourceOffset={selectedQuestion.sourceOffset}
          sourceLength={selectedQuestion.sourceLength}
          questionText={selectedQuestion.question}
        />
      )}
    </div>
  );
}