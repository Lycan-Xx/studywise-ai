import { BookOpen, CheckCircle2, ChevronLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { useCourseStore, type Course, type Module } from '../../stores/useCourseStore';

interface ModuleSidebarProps {
  course: Course;
  modules: Module[];
  currentModule: Module;
}

export function ModuleSidebar({ course, modules, currentModule }: ModuleSidebarProps) {
  const { selectModule } = useCourseStore();
  const [, setLocation] = useLocation();

  return (
    <div className="w-80 bg-white border-r border-studywise-gray-200 flex flex-col h-full">
      {/* Navigation Back */}
      <div className="p-4 border-b border-studywise-gray-100">
        <button 
          onClick={() => setLocation('/library')}
          className="flex items-center gap-2 text-sm text-studywise-gray-500 hover:text-primary transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Library
        </button>
      </div>

      {/* Course Header */}
      <div className="p-6 border-b border-studywise-gray-200">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-studywise-gray-900 truncate">
              {course.title}
            </h2>
            <p className="text-sm text-studywise-gray-500 mt-1">
              {modules.length} {modules.length === 1 ? 'module' : 'modules'}
            </p>
          </div>
        </div>
      </div>

      {/* Module List */}
      <div className="flex-1 overflow-y-auto">
        <nav className="p-4 space-y-1">
          {modules.map((module) => {
            const isActive = module.id === currentModule.id;
            
            return (
              <button
                key={module.id}
                onClick={() => selectModule(module.id)}
                className={`
                  w-full text-left px-4 py-3 rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-primary/10 text-primary font-medium' 
                    : 'text-studywise-gray-700 hover:bg-studywise-gray-50'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <span className={`
                    text-xs font-semibold mt-0.5 flex-shrink-0
                    ${isActive ? 'text-primary' : 'text-studywise-gray-400'}
                  `}>
                    {module.module_order}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{module.title}</p>
                    {module.estimated_read_time && (
                      <p className="text-xs text-studywise-gray-500 mt-1">
                        ~{module.estimated_read_time} min read
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-studywise-gray-200 text-xs text-studywise-gray-500">
        <p>Source: {course.source_filename}</p>
      </div>
    </div>
  );
}
