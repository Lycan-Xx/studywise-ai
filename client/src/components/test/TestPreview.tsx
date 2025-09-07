import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { TestConfig } from "@/types";
import { List, ExternalLink } from "lucide-react";
import { TestSettings } from "./TestSettings";
import { TestTaking } from "./TestTaking";
import { TestResults } from "./TestResults";
import { SourcePreviewModal } from "./SourcePreviewModal";
import { useTestWorkflow, useResultsStore, useTestStore, useTestSessionStore } from "@/stores";

interface TestPreviewProps {
  config: TestConfig;
  notes: string;
  onClose: () => void;
}

export function TestPreview({ config, notes, onClose }: TestPreviewProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [showTest, setShowTest] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [testTimeLimit, setTestTimeLimit] = useState<number | null>(null);
  const [sourceModalOpen, setSourceModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [showAllQuestions, setShowAllQuestions] = useState(false);

  // Use workflow hook for coordinated store operations
  const { generateAndSaveTest, completeTest } = useTestWorkflow();
  const { generatedQuestions, isGenerating, generateQuestions } = useTestStore();
  const { currentResult } = useResultsStore();
  const { startTest, resetSession } = useTestSessionStore();

  // Generate questions when component mounts or config changes
  useEffect(() => {
    if (config && notes) {
      generateQuestions(config, notes);
    }
  }, [config, notes, generateQuestions]);

  // Mock correct answers for demonstration (will be replaced with AI-generated answers)
  const correctAnswers: Record<number, string> = {
    1: "Energy production",
    2: "Complexity", 
    3: "Converting sunlight to energy",
    4: "Object-oriented programming",
    5: "Au",
    6: "False",
    7: "True",
    8: "False", 
    9: "True",
    10: "True"
  };

  const handleStartTest = () => {
    setShowSettings(true);
  };

  const handleStartTestWithSettings = (timeLimit: number | null) => {
    console.log("Starting test with time limit:", timeLimit);
    setTestTimeLimit(timeLimit);
    setShowSettings(false);
    setShowTest(true);
  };

  const handleTestSubmit = async (answers: Record<number, string>) => {
    try {
      await completeTest();
    } catch (error) {
      console.error("Failed to save test result:", error);
    }
  };

  const handleShowResults = async (answers: Record<number, string>) => {
    try {
      // Complete the test and save results
      await completeTest();
      setShowTest(false);
      setShowResults(true);
    } catch (error) {
      console.error("Failed to complete test:", error);
    }
  };

  const handleTestBack = () => {
    setShowTest(false);
    setShowSettings(false);
  };

  const handleResultsBack = () => {
    setShowResults(false);
    setShowTest(false);
    setShowSettings(false);
  };

  // Retake functionality for TestPreview context
  const handleRetake = () => {
    if (currentResult) {
      // Reset session and start fresh test with same data
      resetSession();
      startTest(
        currentResult.testId,
        currentResult.testTitle, 
        currentResult.questions, 
        testTimeLimit
      );
      setShowResults(false);
      setShowTest(true);
    }
  };

  const handleSaveToLibrary = async () => {
    try {
      await generateAndSaveTest(config, notes, config.title || 'Untitled Test');
      onClose();
    } catch (error) {
      console.error("Failed to save test:", error);
    }
  };

  const handleViewSource = (question: any) => {
    setSelectedQuestion(question);
    setSourceModalOpen(true);
  };

  // Show TestResults if test is completed
  if (showResults && currentResult) {
    return (
      <TestResults
        testTitle={currentResult.testTitle}
        testId={currentResult.testId}
        questions={currentResult.questions}
        userAnswers={currentResult.userAnswers}
        correctAnswers={currentResult.correctAnswers}
        notes={notes}
        onRetake={handleRetake}
      />
    );
  }

  // Show TestTaking if test is started
  if (showTest) {
    return (
      <TestTaking
        testTitle={config.title || 'Untitled Test'}
        questions={generatedQuestions}
        timeLimit={testTimeLimit}
        onSubmit={handleTestSubmit}
        onBack={handleTestBack}
        onShowResults={handleShowResults}
      />
    );
  }

  // Show TestSettings if user clicked Start Test
  if (showSettings) {
    return (
      <TestSettings
        testTitle={config.title || 'Untitled Test'}
        questionCount={config.numberOfQuestions}
        onStartTest={handleStartTestWithSettings}
        onBack={() => setShowSettings(false)}
      />
    );
  }

  return (
    <div className="w-full">
      {/* Breadcrumb */}
      <div className="text-sm text-studywise-gray-500 mb-4">
        Dashboard / Test Preview
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-studywise-gray-900 mb-2">
          Your Test is Ready!
        </h1>
        <p className="text-studywise-gray-600">
          Here's a preview of your personalized practice test. Review the questions below or start testing immediately.
        </p>
      </div>

      {/* Test Info */}
      <div className="bg-studywise-gray-50 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-studywise-gray-700">Title:</span>
            <span className="ml-2 text-studywise-gray-900">{config.title}</span>
          </div>
          <div>
            <span className="font-medium text-studywise-gray-700">Question Type:</span>
            <span className="ml-2 text-studywise-gray-900">
              {config.questionType === 'mcq' ? 'Multiple Choice' : 'True/False'}
            </span>
          </div>
          <div>
            <span className="font-medium text-studywise-gray-700">Questions:</span>
            <span className="ml-2 text-studywise-gray-900">{config.numberOfQuestions}</span>
          </div>
        </div>
      </div>

      {/* Questions Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-studywise-gray-900 mb-6">
          Questions
        </h2>

        {isGenerating ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-studywise-gray-600">Generating questions...</p>
          </div>
        ) : generatedQuestions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-studywise-gray-600">No questions generated yet.</p>
            <button 
              onClick={() => generateQuestions(config, notes)}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              Retry Generation
            </button>
          </div>
        ) : (
          <div className="space-y-6">

            {(showAllQuestions ? generatedQuestions : generatedQuestions.slice(0, 3)).map((question) => {
              // Ensure True/False questions have options
              let displayOptions = question.options;
              if (config.questionType === 'true-false' && (!displayOptions || displayOptions.length === 0)) {
                displayOptions = ['True', 'False'];
              }
              
              return (
                <div key={question.id} className="border border-studywise-gray-200 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <List className="w-5 h-5 text-studywise-gray-400 mt-1" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-studywise-gray-900 mb-2">
                        Question {question.id}
                      </h3>
                      <p className="text-studywise-gray-700 mb-4">
                        {question.question}
                      </p>
                      <div className="space-y-2">
                        {displayOptions && displayOptions.length > 0 ? (
                          displayOptions.map((option, idx) => (
                            <div 
                              key={idx} 
                              className="flex items-center gap-3 p-3 border border-studywise-gray-200 rounded-lg bg-studywise-gray-50"
                            >
                              <div className="w-4 h-4 border-2 border-studywise-gray-300 rounded-full bg-white"></div>
                              <span className="text-studywise-gray-700">{option}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-studywise-gray-500 italic">
                            No options available for this question
                          </div>
                        )}
                      </div>
                    
                    {/* Source Link */}
                    {question.sourceText && (
                      <div className="mt-3 pt-3 border-t border-studywise-gray-200">
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
                  </div>
                </div>
              );
            })}

            {generatedQuestions.length > 3 && (
              <div className="text-center py-4">
                {!showAllQuestions ? (
                  <button 
                    onClick={() => setShowAllQuestions(true)}
                    className="text-primary hover:text-primary/80 underline cursor-pointer"
                  >
                    Show all {generatedQuestions.length} questions
                  </button>
                ) : (
                  <button 
                    onClick={() => setShowAllQuestions(false)}
                    className="text-primary hover:text-primary/80 underline cursor-pointer"
                  >
                    Show less
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="flex gap-4">
          <Button
            onClick={handleSaveToLibrary}
            variant="outline"
            size="lg"
            className="border-2 px-6 py-3 border-black text-slate-700 hover:border-slate-300 hover:bg-slate-50"
          >
            Save for Later
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            size="lg"
            className="border-2 px-6 py-3 border-black text-slate-700 hover:border-slate-300 hover:bg-slate-50"
          >
            Regenerate Questions
          </Button>
        </div>

        <Button
          onClick={handleStartTest}
          size="lg"
          className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white"
        >
          Start Practice Test
        </Button>
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
