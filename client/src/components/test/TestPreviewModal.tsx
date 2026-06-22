import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Clock, FileQuestion } from 'lucide-react';

interface TestPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: () => void;
  moduleName: string;
  questionCount: number;
  estimatedTime: number;
  sampleQuestion?: {
    question: string;
    options?: string[];
  };
}

export function TestPreviewModal({
  isOpen,
  onClose,
  onStart,
  moduleName,
  questionCount,
  estimatedTime,
  sampleQuestion,
}: TestPreviewModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Ready to test your knowledge?
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Test Info */}
          <div className="bg-studywise-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-studywise-gray-700">
              <FileQuestion className="w-5 h-5 text-primary" />
              <span className="font-medium">Module:</span>
              <span>{moduleName}</span>
            </div>
            
            <div className="flex items-center gap-2 text-studywise-gray-700">
              <FileQuestion className="w-5 h-5 text-primary" />
              <span className="font-medium">Questions:</span>
              <span>{questionCount} questions</span>
            </div>
            
            <div className="flex items-center gap-2 text-studywise-gray-700">
              <Clock className="w-5 h-5 text-primary" />
              <span className="font-medium">Estimated time:</span>
              <span>~{estimatedTime} minutes</span>
            </div>
          </div>

          {/* Sample Question */}
          {sampleQuestion && (
            <div className="border border-studywise-gray-200 rounded-lg p-4">
              <p className="text-sm font-medium text-studywise-gray-500 mb-3">
                Sample Question:
              </p>
              <p className="text-studywise-gray-900 mb-3">
                {sampleQuestion.question}
              </p>
              {sampleQuestion.options && (
                <div className="space-y-2">
                  {sampleQuestion.options.map((option, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 bg-studywise-gray-50 rounded text-sm text-studywise-gray-700"
                    >
                      {option}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Info Note */}
          <p className="text-sm text-studywise-gray-600 text-center">
            This preview will only show before your first test. Subsequent tests will start immediately.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Back
          </Button>
          <Button onClick={onStart} size="lg">
            Start Test
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
