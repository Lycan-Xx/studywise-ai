import { useLocation } from 'wouter';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight, PlayCircle } from 'lucide-react';
import { useCourseStore, type Course, type Module } from '../../stores/useCourseStore';

interface ModuleContentProps {
  course: Course;
  module: Module;
  moduleIndex: number;
  totalModules: number;
}

export function ModuleContent({ course, module, moduleIndex, totalModules }: ModuleContentProps) {
  const [, setLocation] = useLocation();
  const { modules, selectModule } = useCourseStore();

  const handleTakeTest = async () => {
    try {
      // This will trigger test generation via the API before navigation
      // Navigate to test page - the test generation will happen server-side
      setLocation(`/courses/${course.id}/modules/${module.id}/test`);
    } catch (error) {
      console.error('Error initiating test:', error);
    }
  };

  const handlePrevious = () => {
    if (moduleIndex > 0) {
      selectModule(modules[moduleIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (moduleIndex < totalModules - 1) {
      selectModule(modules[moduleIndex + 1].id);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Progress Indicator */}
      <div className="mb-6">
        <p className="text-sm text-studywise-gray-500">
          Module {moduleIndex + 1} of {totalModules}
        </p>
        <div className="w-full bg-studywise-gray-200 rounded-full h-1.5 mt-2">
          <div 
            className="bg-primary h-1.5 rounded-full transition-all"
            style={{ width: `${((moduleIndex + 1) / totalModules) * 100}%` }}
          />
        </div>
      </div>

      {/* Module Title */}
      <h1 className="text-3xl font-bold text-studywise-gray-900 mb-6">
        {module.title}
      </h1>

      {/* Module Content */}
      <div className="prose prose-studywise max-w-none mb-12">
        <div className="text-studywise-gray-700 leading-relaxed whitespace-pre-wrap">
          {module.content}
        </div>
      </div>

      {/* Take Test Button */}
      <div className="border-t border-studywise-gray-200 pt-8 mb-8">
        <div className="bg-primary/5 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-studywise-gray-900 mb-2">
            Ready to test your knowledge?
          </h3>
          <p className="text-studywise-gray-600 mb-4">
            Take a test on this module to reinforce what you've learned
          </p>
          <Button 
            onClick={handleTakeTest}
            size="lg"
            className="gap-2"
          >
            <PlayCircle className="w-5 h-5" />
            Take Test: {module.title}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6 border-t border-studywise-gray-200">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={moduleIndex === 0}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous Module
        </Button>

        <Button
          variant="outline"
          onClick={handleNext}
          disabled={moduleIndex === totalModules - 1}
          className="gap-2"
        >
          Next Module
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
