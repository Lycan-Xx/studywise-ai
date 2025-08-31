import { useState } from "react";
import { StepOne } from "./StepOne";
import { StepTwo } from "./StepTwo";
import { StepThree } from "./StepThree";
import { LoadingModal } from "./LoadingModal";
import { TestPreview } from "./TestPreview";
import { TestConfig } from "@/types";
import { useTestStore } from "@/stores";

interface TestWizardProps {
  notes: string;
  onClose: () => void;
}

export function TestWizard({ notes, onClose }: TestWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  
  // Use Zustand store
  const { currentConfig, updateConfig, generateQuestions, isGenerating } = useTestStore();
  
  const testConfig = currentConfig || {
    subject: '',
    topics: '',
    questionType: 'mcq' as const,
    numberOfQuestions: 10
  };

  const handleNext = async () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      // Generate test using store
      await generateQuestions(testConfig, notes);
      setShowPreview(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (showPreview) {
    return <TestPreview config={testConfig} notes={notes} onClose={onClose} />;
  }

  if (isGenerating) {
    return <LoadingModal />;
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-studywise-gray-900 mb-4">Test Configuration</h2>
        <div className="flex items-center mb-6">
          <span className="text-sm text-studywise-gray-600">Step {currentStep} of 3</span>
          <div className="flex-1 mx-4">
            <div className="w-full bg-studywise-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 3) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {currentStep === 1 && (
        <StepOne
          config={testConfig}
          updateConfig={updateConfig}
          onNext={handleNext}
          onBack={onClose}
        />
      )}

      {currentStep === 2 && (
        <StepTwo
          config={testConfig}
          updateConfig={updateConfig}
          onNext={handleNext}
          onBack={handleBack}
        />
      )}

      {currentStep === 3 && (
        <StepThree
          config={testConfig}
          updateConfig={updateConfig}
          onNext={handleNext}
          onBack={handleBack}
          isGenerating={isGenerating}
        />
      )}
    </div>
  );
}