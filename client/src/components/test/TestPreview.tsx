import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TestConfig } from "./types";
import { List } from "lucide-react";
import { TestSettings } from "./TestSettings";
import { TestTaking } from "./TestTaking";
import { TestResults } from "./TestResults";

interface TestPreviewProps {
  config: TestConfig;
  notes: string;
  onClose: () => void;
}

// Mock generated questions based on config
const generateMockQuestions = (config: TestConfig) => {
  const questions = [];

  const mcqQuestions = [
    {
      question: "What is the main function of the mitochondria in a cell?",
      options: ["Protein synthesis", "Energy production", "Waste disposal", "Cell division"]
    },
    {
      question: "Which of the following is NOT a characteristic of a well-designed user interface?",
      options: ["Consistency", "Clarity", "Efficiency", "Complexity"]
    },
    {
      question: "What is the primary purpose of photosynthesis in plants?",
      options: ["Water absorption", "Converting sunlight to energy", "Root growth", "Seed production"]
    },
    {
      question: "Which programming paradigm focuses on objects and classes?",
      options: ["Functional programming", "Object-oriented programming", "Procedural programming", "Logic programming"]
    },
    {
      question: "What is the chemical symbol for gold?",
      options: ["Go", "Gd", "Au", "Ag"]
    }
  ];

  const trueFalseQuestions = [
    {
      question: "User experience design focuses primarily on visual aesthetics rather than functionality.",
      options: ["True", "False"]
    },
    {
      question: "The mitochondria is known as the powerhouse of the cell.",
      options: ["True", "False"]
    },
    {
      question: "JavaScript is a compiled programming language.",
      options: ["True", "False"]
    },
    {
      question: "Water boils at 100 degrees Celsius at sea level.",
      options: ["True", "False"]
    },
    {
      question: "The Earth is the third planet from the Sun.",
      options: ["True", "False"]
    }
  ];

  for (let i = 1; i <= config.numberOfQuestions; i++) {
    if (config.questionType === 'mcq') {
      const questionData = mcqQuestions[(i - 1) % mcqQuestions.length];
      questions.push({
        id: i,
        type: 'mcq' as const,
        question: questionData.question,
        options: questionData.options
      });
    } else {
      const questionData = trueFalseQuestions[(i - 1) % trueFalseQuestions.length];
      questions.push({
        id: i,
        type: 'true-false' as const,
        question: questionData.question,
        options: questionData.options
      });
    }
  }

  return questions;
};

export function TestPreview({ config, notes, onClose }: TestPreviewProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [showTest, setShowTest] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [testTimeLimit, setTestTimeLimit] = useState<number | null>(null);
  const [testAnswers, setTestAnswers] = useState<Record<number, string>>({});
  const questions = generateMockQuestions(config);

  // Mock correct answers for demonstration
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

  const handleTestSubmit = (answers: Record<number, string>) => {
    // TODO: Save test results to backend/storage
    console.log("Test submitted with answers:", answers);
    setTestAnswers(answers);
  };

  const handleShowResults = (answers: Record<number, string>) => {
    setTestAnswers(answers);
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

  const handleSaveToLibrary = () => {
    // TODO: Save test to library
    console.log("Saving test to library");
    onClose();
  };

  // Show TestResults if test is completed
  if (showResults) {
    return (
      <TestResults
        testTitle={`${config.subject} Test`}
        questions={questions}
        userAnswers={testAnswers}
        correctAnswers={correctAnswers}
        onBack={handleResultsBack}
      />
    );
  }

  // Show TestTaking if test is started
  if (showTest) {
    return (
      <TestTaking
        testTitle={`${config.subject} Test`}
        questions={questions}
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