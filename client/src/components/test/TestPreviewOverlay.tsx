import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Clock,
  Edit3,
  FileText,
  PlayCircle,
  ArrowLeft,
  ChevronLeft,
  ExternalLink
} from "lucide-react";
import { Question, TestConfig } from "@/types";
import { SourcePreviewModal } from "./SourcePreviewModal";

interface TestPreviewOverlayProps {
  config: TestConfig;
  questions: Question[];
  notes: string;
  onStartTest: (timeLimit: number | null) => void;
  onRegenerateAll: () => void;
  onSaveToLibrary: () => void;
  onBack: () => void;
}

export function TestPreviewOverlay({
  config,
  questions,
  notes,
  onStartTest,
  onRegenerateAll,
  onSaveToLibrary,
  onBack
}: TestPreviewOverlayProps) {
  const [selectedTimeLimit, setSelectedTimeLimit] = useState<number | null>(null);
  const [showTimeSelector, setShowTimeSelector] = useState(false);
  const [sourceModalOpen, setSourceModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

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

  const handleViewSource = (question: Question) => {
    setSelectedQuestion(question);
    setSourceModalOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between p-4 max-w-6xl mx-auto">
          <Button
            onClick={onBack}
            variant="outline"
            size="lg"
            className="border-2 px-6 py-3 border-black text-slate-700 hover:border-slate-300 hover:bg-slate-50 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
          </Button>

          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Test Preview
          </h1>

          <div className="w-32"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Note Title */}
        <div className="text-center">
          <h2 className="text-lg font-medium text-studywise-gray-900">{config.title}</h2>
        </div>

        {/* Test Info */}
        <div className="bg-slate-200 border border-primary rounded-xl p-4">
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
            ))}
            {questions.length > 3 && (
              <div className="text-center text-slate-500 text-sm py-2">
                ... and {questions.length - 3} more questions
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Footer with Action Buttons */}
      <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-end gap-3">
            <Button
              onClick={onSaveToLibrary}
              variant="outline"
              size="lg"
              className="border-2 px-6 py-3 border-primary text-black hover:border-green-400 hover:bg-green-50 flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Save to Library
            </Button>
            <Button
              onClick={handleStartTest}
              size="lg"
              className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-2"
            >
              <PlayCircle className="w-4 h-4" />
              {showTimeSelector ? 'Start Test Now' : 'Start Test'}
            </Button>
          </div>
        </div>
      </div>

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
