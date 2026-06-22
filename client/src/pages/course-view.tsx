import { useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { AlertTriangle, BookOpen, RefreshCw } from 'lucide-react';
import { useCourseStore } from '../stores/useCourseStore';
import { ModuleSidebar } from '../components/course/ModuleSidebar';
import { ModuleContent } from '../components/course/ModuleContent';
import { Button } from '../components/ui/button';

export default function CourseView() {
  const { courseId } = useParams<{ courseId: string }>();
  const [, setLocation] = useLocation();
  const { 
    currentCourse, 
    currentModule, 
    modules, 
    isLoadingCourse,
    loadCourse,
    retryCourse 
  } = useCourseStore();

  useEffect(() => {
    if (courseId) {
      loadCourse(courseId).catch(() => {
        setLocation('/dashboard');
      });
    }
  }, [courseId]);

  if (isLoadingCourse) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-studywise-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!currentCourse || !currentModule) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-studywise-gray-600">Course not found</p>
          <Button onClick={() => setLocation('/dashboard')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-studywise-gray-50">
      {/* Left Sidebar - Module Navigation */}
      <ModuleSidebar
        course={currentCourse}
        modules={modules}
        currentModule={currentModule}
      />

      {/* Right Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Fallback Warning */}
        {currentCourse.used_fallback && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-4">
            <div className="flex items-start gap-3 max-w-4xl mx-auto">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900">
                  Could not auto-generate chapters
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  AI parsing encountered an issue. Showing full content as a single module.
                </p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="mt-3 text-xs gap-2 border-amber-200 text-amber-700 hover:bg-amber-50"
                  onClick={() => retryCourse(currentCourse.id)}
                >
                  <RefreshCw className="w-3 h-3" />
                  Try Regenerating Chapters
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Module Content */}
        <ModuleContent
          course={currentCourse}
          module={currentModule}
          moduleIndex={modules.findIndex(m => m.id === currentModule.id)}
          totalModules={modules.length}
        />
      </div>
    </div>
  );
}
