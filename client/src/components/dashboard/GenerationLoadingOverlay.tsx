import { Brain } from 'lucide-react';

interface GenerationLoadingOverlayProps {
  isOpen: boolean;
}

export function GenerationLoadingOverlay({ isOpen }: GenerationLoadingOverlayProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-4">
            <Brain className="w-10 h-10 text-primary animate-pulse" />
          </div>
          
          <h3 className="text-2xl font-semibold text-studywise-gray-900 mb-2">
            Generating your course...
          </h3>
          
          <p className="text-studywise-gray-600 mb-1">
            Analyzing your content and creating modules
          </p>
          
          <p className="text-sm text-studywise-gray-500">
            This usually takes 30-60 seconds
          </p>
        </div>

        <div className="space-y-3">
          <div className="w-full bg-studywise-gray-200 rounded-full h-2 overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '70%' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
