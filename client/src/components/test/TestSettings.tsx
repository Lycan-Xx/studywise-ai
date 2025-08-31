import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, ArrowLeft } from "lucide-react";

interface TestSettingsProps {
  testTitle: string;
  questionCount: number;
  onStartTest: (timeLimit: number | null) => void;
  onBack: () => void;
}

export function TestSettings({ testTitle, questionCount, onStartTest, onBack }: TestSettingsProps) {
  const [selectedTimeLimit, setSelectedTimeLimit] = useState<number | null | undefined>(undefined);

  const timeLimitOptions = [
    { value: null, label: "No time limit", description: "Take as much time as you need" },
    { value: 5, label: "5 minutes", description: "Quick review" },
    { value: 10, label: "10 minutes", description: "Standard practice" },
    { value: 15, label: "15 minutes", description: "Thorough assessment" },
    { value: 20, label: "20 minutes", description: "Extended practice" },
    { value: 30, label: "30 minutes", description: "Comprehensive test" },
  ];

  const handleStartTest = () => {
    if (selectedTimeLimit !== undefined) {
      onStartTest(selectedTimeLimit);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            onClick={onBack}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <h1 className="text-2xl font-semibold text-studywise-gray-900">
            Test Settings
          </h1>
        </div>
      </div>

      {/* Test Info */}
      <div className="bg-studywise-gray-50 rounded-lg p-4 mb-8">
        <h2 className="text-lg font-medium text-studywise-gray-900 mb-2">{testTitle}</h2>
        <p className="text-studywise-gray-600">{questionCount} questions</p>
      </div>

      {/* Time Limit Selection */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="w-5 h-5 text-studywise-gray-600" />
          <h3 className="text-lg font-medium text-studywise-gray-900">Time Limit</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {timeLimitOptions.map((option) => (
            <Card
              key={option.value || 'no-limit'}
              className={`cursor-pointer transition-all border-2 ${selectedTimeLimit === option.value
                ? 'border-primary bg-blue-50'
                : 'border-studywise-gray-200 hover:border-studywise-gray-300'
                }`}
              onClick={() => setSelectedTimeLimit(option.value)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-studywise-gray-900 mb-1">
                      {option.label}
                    </h4>
                    <p className="text-sm text-studywise-gray-600">
                      {option.description}
                    </p>
                  </div>
                  <div className="ml-4">
                    <div className={`w-4 h-4 rounded-full border-2 ${selectedTimeLimit === option.value
                      ? 'border-primary bg-primary'
                      : 'border-studywise-gray-300'
                      }`}>
                      {selectedTimeLimit === option.value && (
                        <div className="w-full h-full rounded-full bg-white scale-50"></div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex justify-between mt-12">
        <Button
          onClick={onBack}
          variant="outline"
          size="lg"
          className="border-2 px-6 py-3 border-black text-slate-700 hover:border-slate-300 hover:bg-slate-50"
        >
          Back
        </Button>
        <Button
          onClick={() => onStartTest(selectedTimeLimit)}
          size="lg"
          className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white"
        >
          Start Test
        </Button>
      </div>
    </div>
  );
}