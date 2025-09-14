import { Sparkles } from "lucide-react";

interface LoadingModalProps {
  message?: string;
  subMessage?: string;
}

export function LoadingModal({ message = "Generating Your Test", subMessage = "AI is analyzing your notes and creating personalized questions..." }: LoadingModalProps) {
  return (
    <div className="w-full text-center py-12">
      <div className="mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Sparkles className="w-8 h-8 text-primary animate-pulse" />
        </div>
        <h3 className="text-xl font-semibold text-studywise-gray-900 mb-2">
          {message}
        </h3>
        <p className="text-studywise-gray-600">
          {subMessage}
        </p>
      </div>

      <div className="max-w-md mx-auto space-y-3">
        <div className="w-full bg-studywise-gray-200 rounded-full h-2">
          <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '70%' }} />
        </div>
        <p className="text-sm text-studywise-gray-500">
          This may take a few seconds
        </p>
      </div>
    </div>
  );
}
