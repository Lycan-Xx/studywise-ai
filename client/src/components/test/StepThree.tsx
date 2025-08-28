import { Button } from "@/components/ui/button";
import { TestConfig } from "@/types";
import { Minus, Plus } from "lucide-react";

interface StepThreeProps {
  config: TestConfig;
  updateConfig: (updates: Partial<TestConfig>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepThree({ config, updateConfig, onNext, onBack }: StepThreeProps) {
  const questionCounts = [5, 10, 15, 20, 25, 30];

  const handleCustomCount = (increment: boolean) => {
    const newCount = increment 
      ? Math.min(config.numberOfQuestions + 1, 50)
      : Math.max(config.numberOfQuestions - 1, 1);
    updateConfig({ numberOfQuestions: newCount });
  };

  return (
    <div>
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-studywise-gray-900 mb-4">
          How many questions do you want?
        </h3>
        <p className="text-studywise-gray-600 mb-6">
          Choose the length of your practice test - more questions provide better coverage
        </p>
        
        {/* Quick Select Options */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {questionCounts.map((count) => (
            <button
              key={count}
              onClick={() => updateConfig({ numberOfQuestions: count })}
              className={`p-4 border rounded-lg text-center transition-all ${
                config.numberOfQuestions === count
                  ? 'border-primary bg-blue-50 text-primary font-medium'
                  : 'border-studywise-gray-300 hover:border-studywise-gray-400 text-studywise-gray-700'
              }`}
            >
              {count} Questions
            </button>
          ))}
        </div>

        {/* Custom Counter
        <div className="border-t border-studywise-gray-200 pt-6">
          <p className="text-sm text-studywise-gray-600 mb-3">Or choose a custom number:</p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => handleCustomCount(false)}
              disabled={config.numberOfQuestions <= 1}
              className="w-10 h-10 border border-studywise-gray-300 rounded-full flex items-center justify-center hover:bg-studywise-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Minus className="w-4 h-4" />
            </button>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-studywise-gray-900">
                {config.numberOfQuestions}
              </div>
              <div className="text-sm text-studywise-gray-600">
                Questions
              </div>
            </div>
            
            <button
              onClick={() => handleCustomCount(true)}
              disabled={config.numberOfQuestions >= 50}
              className="w-10 h-10 border border-studywise-gray-300 rounded-full flex items-center justify-center hover:bg-studywise-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-studywise-gray-500 text-center mt-2">
            (1-50 questions)
          </p>
        </div> */}


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
          Generate My Test
        </Button>
      </div>
    </div>
  );
}