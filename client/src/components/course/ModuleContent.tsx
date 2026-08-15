import ReactMarkdown from 'react-markdown';
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

  const handleTakeExam = () => {
    setLocation(`/courses/${course.id}/exam`);
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
      <div className="mb-12">
        <ReactMarkdown
          components={{
            h1: ({ children }) => (
              <h2 className="text-2xl font-bold text-studywise-gray-900 mt-8 mb-3 leading-tight">{children}</h2>
            ),
            h2: ({ children }) => (
              <h3 className="text-xl font-semibold text-studywise-gray-900 mt-7 mb-3 leading-snug">{children}</h3>
            ),
            h3: ({ children }) => (
              <h4 className="text-lg font-semibold text-studywise-gray-800 mt-6 mb-2">{children}</h4>
            ),
            h4: ({ children }) => (
              <h5 className="text-base font-semibold text-studywise-gray-800 mt-5 mb-2">{children}</h5>
            ),
            p: ({ children }) => (
              <p className="text-studywise-gray-700 leading-relaxed mb-4">{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="list-disc list-outside ml-5 mb-4 space-y-1.5 text-studywise-gray-700">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-outside ml-5 mb-4 space-y-1.5 text-studywise-gray-700">{children}</ol>
            ),
            li: ({ children }) => (
              <li className="leading-relaxed">{children}</li>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-studywise-gray-900">{children}</strong>
            ),
            em: ({ children }) => (
              <em className="italic text-studywise-gray-700">{children}</em>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-primary/40 pl-4 py-1 my-4 bg-primary/5 rounded-r-md text-studywise-gray-700 italic">
                {children}
              </blockquote>
            ),
            code: ({ inline, children }: any) =>
              inline ? (
                <code className="bg-studywise-gray-100 text-studywise-gray-800 px-1.5 py-0.5 rounded text-sm font-mono">
                  {children}
                </code>
              ) : (
                <pre className="bg-studywise-gray-900 text-studywise-gray-100 rounded-lg p-4 overflow-x-auto my-4 text-sm font-mono leading-relaxed">
                  <code>{children}</code>
                </pre>
              ),
            hr: () => (
              <hr className="my-6 border-studywise-gray-200" />
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
              >
                {children}
              </a>
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full divide-y divide-studywise-gray-200 text-sm">{children}</table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="bg-studywise-gray-50">{children}</thead>
            ),
            th: ({ children }) => (
              <th className="px-4 py-2 text-left font-semibold text-studywise-gray-900">{children}</th>
            ),
            td: ({ children }) => (
              <td className="px-4 py-2 text-studywise-gray-700 border-t border-studywise-gray-100">{children}</td>
            ),
          }}
        >
          {module.content || ''}
        </ReactMarkdown>
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

      {/* Take Exam Section (Last Module Only) */}
      {moduleIndex === totalModules - 1 && (
        <div className="mt-12 bg-indigo-50 border border-indigo-100 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-indigo-900 mb-3">Course Completed!</h2>
          <p className="text-indigo-700 mb-6 max-w-lg mx-auto">
            You've reached the end of the course. Take a comprehensive exam covering all modules to test your overall understanding.
          </p>
          <Button 
            onClick={handleTakeExam}
            size="lg"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-6 rounded-xl shadow-md transition-all hover:shadow-lg gap-2 text-lg"
          >
            <PlayCircle className="w-6 h-6" />
            Take Final Exam
          </Button>
        </div>
      )}
    </div>
  );
}
