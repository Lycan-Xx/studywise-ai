import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TestConfig } from "./types";
import { List } from "lucide-react";
import { TestSettings } from "./TestSettings";

interface TestPreviewProps {
  config: TestConfig;
  notes: string;
  onClose: () => void;
}

// Mock generated questions based on config
const generateMockQuestions = (config: TestConfig) => {
  const questions = [];
  
  for (let i = 1; i <= config.numberOfQuestions; i++) {
    if (config.questionType === 'mcq') {
      questions.push({
        id: i,
        type: 'mcq',
        question: `Which of the following is NOT a characteristic of a well-designed user interface?`,
        options: [
          'A. Consistency',
          'B. Clarity', 
          'C. Efficiency',
          'D. Complexity'
        ]
      });
    } else {
      questions.push({
        id: i,
        type: 'true-false',
        question: `User experience design focuses primarily on visual aesthetics rather than functionality.`,
        options: ['True', 'False']
      });
    }
  }
  
  return questions;
};

export function TestPreview({ config, notes, onClose }: TestPreviewProps) {
  const [showSettings, setShowSettings] = useState(false);
  const questions = generateMockQuestions(config);

  const handleStartTest = () => {
    setShowSettings(true);
  };

  const handleStartTestWithSettings = (timeLimit: number | null) => {
    // TODO: Navigate to test taking interface with time limit
    console.log("Starting test with time limit:", timeLimit);
    onClose();
  };

  const handleSaveToLibrary = () => {
    // TODO: Save test to library
    console.log("Saving test to library");
    onClose();
  };

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
          
          <div className="space-y-6">
            {questions.slice(0, 3).map((question, index) => (
              <div key={question.id} className="border border-studywise-gray-200 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <List className="w-5 h-5 text-studywise-gray-400 mt-1" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-studywise-gray-900 mb-2">
                      Question {question.id}
                    </h3>
                    <div className="text-studywise-gray-600 mb-3">
                      {question.options.join(' ')}
                    </div>
                    <p className="text-studywise-gray-700">
                      {question.question}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {questions.length > 3 && (
              <div className="text-center py-4 text-studywise-gray-500">
                ... and {questions.length - 3} more questions
              </div>
            )}
          </div>
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