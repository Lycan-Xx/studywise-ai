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
      title: 'Multiple Choice Questions',
      initials: 'MCQ',
      description: 'Choose from multiple options',
      example: 'What is 2+2? A) 3 B) 4 C) 5'
    },
    {
      id: 'true-false' as const,
      title: 'True or False',
      initials: 'T/F',
      description: 'Answer true or false only',
      example: 'The sun rises in the east. True/False'
    }
  ];

  const canProceed = config.questionType !== undefined;

  return (
    <div>
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-studywise-gray-900 mb-4 text-center">
          How should students be tested?
        </h3>
        <p className="text-studywise-gray-600 mb-8 text-center">
          Select the question format that best suits your study goals
        </p>
       
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {questionTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => updateConfig({ questionType: type.id })}
              className={`aspect-square p-6 border rounded-lg text-center transition-all flex flex-col justify-center items-center ${
                config.questionType === type.id
                  ? 'border-primary bg-blue-50 text-primary font-medium'
                  : 'border-studywise-gray-300 hover:border-studywise-gray-400 text-studywise-gray-700'
              }`}
            >
              <div className="text-4xl font-bold mb-3">
                {type.initials}
              </div>
              <h4 className="text-sm font-semibold mb-2 leading-tight">
                {type.title}
              </h4>
              <p className="text-xs text-studywise-gray-600 mb-3 leading-relaxed">
                {type.description}
              </p>
              <div className="text-xs text-studywise-gray-500 italic px-2 leading-tight">
                Example: {type.example}
              </div>
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex justify-between mt-8">
        <Button
          onClick={onBack}
          variant="outline"
          size="lg"
          className="border-2 px-6 py-3 border-black text-slate-700 hover:border-slate-300 hover:bg-slate-50"
        >
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!canProceed}
          size="lg"
          className={`px-8 py-3 transition-colors ${!canProceed
              ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed text-gray-200'
              : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}