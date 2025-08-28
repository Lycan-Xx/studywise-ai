import { Button } from "@/components/ui/button";
import { TestConfig } from "@/types";

interface StepTwoProps {
  config: TestConfig;
  updateConfig: (updates: Partial<TestConfig>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepTwo({ config, updateConfig, onNext, onBack }: StepTwoProps) {
  const questionTypes = [
    {
      id: 'mcq' as const,
      title: 'Multiple Choice Questions (MCQ)',
      description: 'Questions with multiple answer options where one is correct'
    },
    {
      id: 'true-false' as const,
      title: 'True or False',
      description: 'Questions that can be answered with either true or false'
    }
  ];

  return (
    <div>
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-studywise-gray-900 mb-4">
          How should students be tested?
        </h3>
        <p className="text-studywise-gray-600 mb-6">
          Select the question format that best suits your study goals
        </p>
        
        <div className="space-y-4">
          {questionTypes.map((type) => (
            <div
              key={type.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                config.questionType === type.id
                  ? 'border-primary bg-blue-50'
                  : 'border-studywise-gray-300 hover:border-studywise-gray-400'
              }`}
              onClick={() => updateConfig({ questionType: type.id })}
            >
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    type="radio"
                    checked={config.questionType === type.id}
                    onChange={() => updateConfig({ questionType: type.id })}
                    className="w-4 h-4 text-primary border-studywise-gray-300 focus:ring-primary"
                  />
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-studywise-gray-900">
                    {type.title}
                  </h4>
                  <p className="text-sm text-studywise-gray-600 mt-1">
                    {type.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <Button onClick={onBack} variant="outline">
          Back
        </Button>
        <Button 
          onClick={onNext}
          size="lg"
          className="bg-primary hover:bg-primary/90 px-8"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}