import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { BookOpen, Clock, FileText, AlertTriangle, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { ApiService } from '../services/apiService';
import { useCourseStore } from '../stores/useCourseStore';

interface Course {
  id: string;
  title: string;
  description?: string;
  source_filename: string;
  total_modules: number;
  used_fallback: boolean;
  created_at: string;
  last_studied_at?: string;
  modules_tested?: number;
  overall_average_score?: number;
  parsing_status?: string;
}

export default function Library() {
  const [, setLocation] = useLocation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { retryCourse } = useCourseStore();

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const [coursesData, perfData] = await Promise.all([
        ApiService.getUserCourses(),
        ApiService.getCoursePerformance().catch(() => [])
      ]);
      
      const merged = Array.isArray(coursesData) ? coursesData.map((course: any) => {
        const perf = Array.isArray(perfData) ? perfData.find((p: any) => p.course_id === course.id) : null;
        return {
          ...course,
          modules_tested: perf?.modules_tested || 0,
          overall_average_score: perf?.overall_average_score || 0,
          last_studied_at: perf?.last_studied_at || course.created_at
        };
      }) : [];
      
      setCourses(merged);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load courses:', error);
      setCourses([]);
      setLoading(false);
    }
  };

  const handleDelete = async (courseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }

    setDeletingId(courseId);
    try {
      await ApiService.deleteCourse(courseId);
      setCourses(courses.filter(c => c.id !== courseId));
    } catch (error) {
      console.error('Failed to delete course:', error);
    }
    setDeletingId(null);
  };

  const handleRetry = async (courseId: string) => {
    try {
      await retryCourse(courseId);
      // Reload courses to update statuses
      loadCourses();
    } catch (error) {
      console.error('Failed to retry course generation:', error);
      alert('Failed to regenerate course. Please try again later.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-studywise-gray-600">Loading courses...</p>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-studywise-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-studywise-gray-900 mb-2">
            No courses yet
          </h2>
          <p className="text-studywise-gray-600 mb-6">
            Create your first course to get started
          </p>
          <Button onClick={() => setLocation('/dashboard')}>
            Create Course
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-studywise-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-studywise-gray-900">
            My Courses
          </h1>
          <Button onClick={() => setLocation('/dashboard')}>
            Create New Course
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <div
              key={course.id}
              onClick={() => setLocation(`/courses/${course.id}`)}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden group"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <button
                    onClick={(e) => handleDelete(course.id, e)}
                    disabled={deletingId === course.id}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>

                <h3 className="text-lg font-semibold text-studywise-gray-900 mb-2 line-clamp-2">
                  {course.title}
                </h3>

                <div className="space-y-2 text-sm text-studywise-gray-600">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>{course.total_modules} {course.total_modules === 1 ? 'module' : 'modules'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>
                      {course.last_studied_at
                        ? `Last studied ${new Date(course.last_studied_at).toLocaleDateString()}`
                        : `Created ${new Date(course.created_at).toLocaleDateString()}`
                      }
                    </span>
                  </div>
                </div>

                {course.total_modules > 0 && course.parsing_status === 'completed' && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-studywise-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{course.modules_tested || 0} / {course.total_modules}</span>
                    </div>
                    <div className="w-full bg-studywise-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-primary h-1.5 rounded-full transition-all"
                        style={{ width: `${Math.min(100, Math.max(0, ((course.modules_tested || 0) / course.total_modules) * 100))}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {course.parsing_status === 'processing' && (
                  <div className="mt-4 flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Processing course...</span>
                  </div>
                )}

                {course.used_fallback && (
                  <div className="mt-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Fallback mode</span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full text-xs gap-2 border-amber-200 text-amber-700 hover:bg-amber-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRetry(course.id);
                      }}
                    >
                      <RefreshCw className="w-3 h-3" />
                      Regenerate
                    </Button>
                  </div>
                )}
              </div>

              <div className="px-6 py-3 bg-studywise-gray-50 border-t border-studywise-gray-100">
                <p className="text-xs text-studywise-gray-500 truncate">
                  {course.source_filename}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
