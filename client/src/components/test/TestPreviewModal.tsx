import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Edit3, FileText, PlayCircle } from "lucide-react";
import { Question, TestConfig } from "@/types";

interface TestPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: TestConfig;
  questions: Question[];
  onStartTest: (timeLimit: number | null) => void;
  onRegenerateAll: () => void;
  onSaveToLibrary: () => void;
}

export function TestPreviewModal({ 
  open, 
  onOpenChange, 
  config, 
  questions, 
  onStartTest, 
  onRegenerateAll,
  onSaveToLibrary 
}: TestPreviewModalProps) {
  const [selectedTimeLimit, setSelectedTimeLimit] = useState<number | null>(null);
  const [showTimeSelector, setShowTimeSelector] = useState(false);

  const timeLimits = [
    { value: null, label: "No time limit" },
    { value: 5, label: "5 minutes" },
    { value: 10, label: "10 minutes" },
    { value: 15, label: "15 minutes" },
    { value: 20, label: "20 minutes" },
    { value: 30, label: "30 minutes" },
    { value: 45, label: "45 minutes" },
    { value: 60, label: "60 minutes" }
  ];

  const handleStartTest = () => {
    if (showTimeSelector) {
      onStartTest(selectedTimeLimit);
      setShowTimeSelector(false);
    } else {
      setShowTimeSelector(true);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 60) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Test Preview: {config.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Test Info */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-slate-600">Questions:</span>
                <div className="font-semibold text-slate-900">{questions.length}</div>
              </div>
              <div>
                <span className="font-medium text-slate-600">Type:</span>
                <div className="font-semibold text-slate-900">
                  {config.questionType === 'mcq' ? 'Multiple Choice' : 'True/False'}
                </div>
              </div>
              <div>
                <span className="font-medium text-slate-600">Difficulty:</span>
                <div className="font-semibold text-slate-900 capitalize">{config.difficulty}</div>
              </div>
              <div>
                <span className="font-medium text-slate-600">Topics:</span>
                <div className="font-semibold text-slate-900">{config.topics}</div>
              </div>
            </div>
          </div>

          {/* Time Selector */}
          {showTimeSelector && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Select Time Limit
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {timeLimits.map((limit) => (
                  <button
                    key={limit.value}
                    onClick={() => setSelectedTimeLimit(limit.value)}
                    className={`p-3 text-sm font-medium rounded-lg border transition-colors ${
                      selectedTimeLimit === limit.value
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'
                    }`}
                  >
                    {limit.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Questions Preview */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Question Preview</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {questions.slice(0, 3).map((question, index) => (
                <Card key={question.id} className="border-slate-200">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-slate-900">
                          {index + 1}. {question.question}
                        </h4>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-2">
                        {question.options.map((option, optionIndex) => (
                          <div
                            key={optionIndex}
                            className={`p-2 rounded-lg border text-sm ${
                              option === question.correctAnswer
                                ? 'bg-green-50 border-green-200 text-green-800'
                                : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            <span className="font-medium">
                              {String.fromCharCode(65 + optionIndex)}.
                            </span>{' '}
                            {option}
                            {option === question.correctAnswer && (
                              <span className="ml-2 text-green-600 text-xs">✓ Correct</span>
                            )}
                          </div>
                        ))}
                      </div>

                      {question.sourceText && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-xs text-blue-600 font-medium mb-1">Source Reference:</p>
                          <p className="text-sm text-blue-800">"{question.sourceText}"</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {questions.length > 3 && (
                <div className="text-center text-slate-500 text-sm py-2">
                  ... and {questions.length - 3} more questions
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-slate-200">
            <Button
              onClick={onRegenerateAll}
              variant="outline"
              className="border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              Regenerate All
            </Button>
            
            <Button
              onClick={onSaveToLibrary}
              variant="outline"
              className="border-green-300 text-green-700 hover:bg-green-50 flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Save to Library
            </Button>
            
            <Button
              onClick={handleStartTest}
              className="bg-primary hover:bg-blue-600 text-white flex items-center gap-2"
            >
              <PlayCircle className="w-4 h-4" />
              {showTimeSelector ? 'Start Test Now' : 'Start Test'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}