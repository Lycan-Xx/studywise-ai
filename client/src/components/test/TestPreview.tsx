import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { TestConfig } from "@/types";
import { List } from "lucide-react";
import { TestSettings } from "./TestSettings";
import { TestTaking } from "./TestTaking";
import { TestResults } from "./TestResults";
import { useTestWorkflow, useResultsStore, useTestStore } from "@/stores";

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

  // Use workflow hook for coordinated store operations
  const { generateAndSaveTest, completeTest } = useTestWorkflow();
  const { generatedQuestions, isGenerating, generateQuestions } = useTestStore();
  const { currentResult } = useResultsStore();

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
    await handleTestSubmit(answers);
    setShowTest(false);
    setShowResults(true);
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

  const handleSaveToLibrary = async () => {
    try {
      await generateAndSaveTest(config, notes, `${config.subject} Test`);
      onClose();
    } catch (error) {
      console.error("Failed to save test:", error);
    }
  };

  // Show TestResults if test is completed
  if (showResults && currentResult) {
    return (
      <TestResults
        testTitle={currentResult.testTitle}
        questions={currentResult.questions}
        userAnswers={currentResult.userAnswers}
        correctAnswers={currentResult.correctAnswers}
        onBack={handleResultsBack}
      />
    );
  }

  // Show TestTaking if test is started
  if (showTest) {
    return (
      <TestTaking
        testTitle={`${config.subject} Test`}
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
        testTitle={`${config.subject} Test`}
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
          Test Preview
        </h1>
        <p className="text-studywise-gray-600">
          Review the questions generated from your notes before starting the test.
        </p>
      </div>

      {/* Test Info */}
      <div className="bg-studywise-gray-50 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-studywise-gray-700">Subject:</span>
            <span className="ml-2 text-studywise-gray-900">{config.subject}</span>
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
        ) : (
          <div className="space-y-6">
            {generatedQuestions.slice(0, 3).map((question) => (
              <div key={question.id} className="border border-studywise-gray-200 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <List className="w-5 h-5 text-studywise-gray-400 mt-1" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-studywise-gray-900 mb-2">
                      Question {question.id}
                    </h3>
                    <p className="text-studywise-gray-700 mb-3">
                      {question.question}
                    </p>
                    <div className="text-studywise-gray-600">
                      {question.options.map((option, idx) => (
                        <div key={idx} className="mb-1">• {option}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {generatedQuestions.length > 3 && (
              <div className="text-center py-4 text-studywise-gray-500">
                ... and {generatedQuestions.length - 3} more questions
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
            className="px-6"
          >
            Save to Library
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="px-6"
          >
            Generate New Test
          </Button>
        </div>

        <Button
          onClick={handleStartTest}
          className="bg-primary hover:bg-blue-600 px-8"
        >
          Start Test
        </Button>
      </div>
    </div>
  );
}