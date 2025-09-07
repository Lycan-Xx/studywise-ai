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

  const difficultyLevels = [
    {
      id: 'easy' as const,
      title: 'Easy',
      description: 'Basic concepts and recall',
      color: 'bg-green-50 border-green-200 text-green-700'
    },
    {
      id: 'medium' as const,
      title: 'Medium',
      description: 'Understanding and application',
      color: 'bg-yellow-50 border-yellow-200 text-yellow-700'
    },
    {
      id: 'hard' as const,
      title: 'Hard',
      description: 'Analysis and critical thinking',
      color: 'bg-red-50 border-red-200 text-red-700'
    }
  ];

  const canProceed = config.questionType !== undefined && config.difficulty !== undefined;

  return (
    <div>
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-studywise-gray-900 mb-4 text-center">
          Configure Your Test
        </h3>
        <p className="text-studywise-gray-600 mb-8 text-center">
          Choose the question format and difficulty level
        </p>
        {/* Question Type Selection */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-studywise-gray-900 mb-4">
            Question Format
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {questionTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => updateConfig({ questionType: type.id })}
                className={`
                  w-full  // Full width on mobile
                  sm:aspect-square  // Square aspect only on desktop
                  h-[200px]  // Fixed height on mobile
                  sm:h-auto  // Revert to original height on desktop
                  p-4 
                  sm:p-6 
                  border 
                  rounded-lg 
                  text-center 
                  transition-all 
                  flex 
                  flex-col 
                  justify-center 
                  items-center
                  ${
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

        {/* Difficulty Selection */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-studywise-gray-900 mb-4">
            Difficulty Level
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {difficultyLevels.map((level) => (
              <button
                key={level.id}
                onClick={() => updateConfig({ difficulty: level.id })}
                className={`
                  p-4 
                  border-2 
                  rounded-lg 
                  text-center 
                  transition-all 
                  ${
                    config.difficulty === level.id
                      ? `border-primary bg-blue-50 text-primary font-medium`
                      : `border-studywise-gray-300 hover:border-studywise-gray-400 ${level.color}`
                  }`}
              >
                <div className="text-lg font-bold mb-2">
                  {level.title}
                </div>
                <p className="text-sm">
                  {level.description}
                </p>
              </button>
            ))}
          </div>
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