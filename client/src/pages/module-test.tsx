import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ApiService } from '@/services/apiService';
import { useCourseStore } from '@/stores/useCourseStore';
import { TestPreviewModal } from '@/components/test/TestPreviewModal';
import { TestTakingOverlay } from '@/components/test/TestTakingOverlay';

interface Question {
  id: string;
  question: string;
  type: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

interface ModuleTestProps {
  isExam?: boolean;
}

export default function ModuleTest({ isExam }: ModuleTestProps) {
  const { courseId, moduleId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { currentCourse, modules } = useCourseStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [test, setTest] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showTestTaking, setShowTestTaking] = useState(false);

  useEffect(() => {
    if (!courseId || (!moduleId && !isExam)) {
      setError('Invalid course or module ID');
      setLoading(false);
      return;
    }

    generateTest();
  }, [courseId, moduleId, isExam]);

  const generateTest = async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      if (isExam) {
        response = await ApiService.generateCourseExam(courseId!);
      } else {
        response = await ApiService.generateModuleTest({
          courseId: courseId!,
          moduleId: moduleId!,
        });
      }

      if (response.test && response.questions) {
        setTest(response.test);
        setQuestions(response.questions);
        setShowTestTaking(true);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate test';
      setError(message);
      console.error('Test generation error:', err);
      toast({
        title: 'Error generating test',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = () => {
    setShowPreviewModal(false);
    setShowTestTaking(true);
  };

  const handleBackFromPreview = () => {
    setShowPreviewModal(false);
    setLocation(`/courses/${courseId}`);
  };

  const handleBackFromTest = () => {
    setShowTestTaking(false);
    setLocation(`/courses/${courseId}`);
  };

  const handleTestSubmit = async (answers: Record<string, string>, timeSpent: number) => {
    try {
      await ApiService.submitTest({
        testId: test.id,
        answers,
        timeSpent
      });

      // Navigate to test summary
      setLocation(`/tests/${test.id}/summary`);
    } catch (err) {
      console.error('Failed to submit test:', err);
      toast({
        title: 'Submission failed',
        description: 'Failed to save your test results. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-studywise-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-lg font-medium text-studywise-gray-900">Generating test...</p>
          <p className="text-sm text-studywise-gray-600">Preparing your questions</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-studywise-gray-50 p-6">
        <div className="max-w-md text-center space-y-6">
          <AlertTriangle className="w-16 h-16 mx-auto text-red-500" />
          <div>
            <h2 className="text-2xl font-bold text-studywise-gray-900 mb-2">
              Failed to Generate Test
            </h2>
            <p className="text-studywise-gray-600 mb-4">{error}</p>
          </div>
          <div className="space-y-2">
            <Button
              onClick={generateTest}
              className="w-full"
            >
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation(`/courses/${courseId}`)}
              className="w-full"
            >
              Back to Course
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show test-taking interface
  if (showTestTaking && questions.length > 0) {
    return (
      <TestTakingOverlay
        testTitle={test?.title || 'Module Test'}
        questions={questions}
        timeLimit={undefined}
        onSubmit={handleTestSubmit}
        onBack={handleBackFromTest}
      />
    );
  }

  // Fallback
  return (
    <div className="h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-studywise-gray-600">No test data available</p>
        <Button
          onClick={() => setLocation(`/courses/${courseId}`)}
          className="mt-4"
        >
          Back to Course
        </Button>
      </div>
    </div>
  );
}
