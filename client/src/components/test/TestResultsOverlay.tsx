import { useState } from "react";
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
  ExternalLink
} from "lucide-react";
import { Question } from "@/types";
import { SourcePreviewModal } from "./SourcePreviewModal";

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
}

export function TestResultsOverlay({
  testTitle,
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
  onBack
}: TestResultsOverlayProps) {
  const [selectedTab, setSelectedTab] = useState("summary");
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [sourceModalOpen, setSourceModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  const correctCount = questions.filter(q => userAnswers[q.id] === q.correctAnswer).length;
  const wrongCount = totalQuestions - correctCount;
  const percentage = Math.round((correctCount / totalQuestions) * 100);

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
        <div className="flex items-center gap-4 p-4 max-w-6xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Back to Dashboard</span>
          </button>
          
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <Trophy className="w-6 h-6 text-primary" />
              Test Results: {testTitle}
            </h1>
          </div>
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
                      {timeSpent && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-600" />
                          {formatTime(timeSpent)}
                        </div>
                      )}
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

            {timeSpent && (
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
            )}
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
                <h3 className="font-semibold text-slate-900 mb-4">Performance Analysis</h3>
                <div className="space-y-4">
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
                        Focus on understanding the underlying concepts rather than memorization.
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Sticky Footer with Action Buttons */}
      <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button
              onClick={onRetake}
              className="bg-primary hover:bg-blue-600 text-white flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retake Full Test
            </Button>
            
            {/* {wrongCount > 0 && (
              <Button
                onClick={onRetakeWrong}
                variant="outline"
                className="border-orange-300 text-orange-700 hover:bg-orange-50 flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4" />
                Retake Wrong ({wrongCount})
              </Button>
            )}
             */}
            <Button
              onClick={() => setNotesModalOpen(true)}
              variant="outline"
              className="border-green-300 text-green-700 hover:bg-green-50 flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              View Notes
            </Button>
            
            <Button
              onClick={onBack}
              variant="outline"
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Back to Dashboard
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
