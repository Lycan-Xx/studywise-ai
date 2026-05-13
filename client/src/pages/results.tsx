import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { ChevronDown, ChevronRight, BookOpen, TrendingUp, Clock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { ApiService } from '../services/apiService';

interface CourseResult {
  course_id: string;
  course_title: string;
  total_modules: number;
  modules_tested: number;
  overall_average_score: number;
  best_module_score: number;
  total_tests_taken: number;
  last_studied_at: string;
}

interface ModuleResult {
  module_id: string;
  module_title: string;
  total_attempts: number;
  average_score: number;
  best_score: number;
  last_attempt_at: string;
}

export default function Results() {
  const [, setLocation] = useLocation();
  const [courses, setCourses] = useState<CourseResult[]>([]);
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
  const [moduleResults, setModuleResults] = useState<Record<string, ModuleResult[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourseResults();
  }, []);

  const loadCourseResults = async () => {
    try {
      const data = await ApiService.getCoursePerformance();
      setCourses(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load course results:', error);
      setCourses([]);
      setLoading(false);
    }
  };

  const loadModuleResults = async (courseId: string) => {
    if (moduleResults[courseId]) return; // Already loaded

    try {
      const data = await ApiService.getModulePerformance(courseId);
      setModuleResults(prev => ({ ...prev, [courseId]: Array.isArray(data) ? data : [] }));
    } catch (error) {
      console.error('Failed to load module results:', error);
    }
  };

  const toggleCourse = (courseId: string) => {
    const newExpanded = new Set(expandedCourses);
    if (newExpanded.has(courseId)) {
      newExpanded.delete(courseId);
    } else {
      newExpanded.add(courseId);
      loadModuleResults(courseId);
    }
    setExpandedCourses(newExpanded);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-studywise-gray-600">Loading results...</p>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-studywise-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-studywise-gray-900 mb-2">
            No test results yet
          </h2>
          <p className="text-studywise-gray-600 mb-6">
            Take your first test to see your progress here
          </p>
          <Button onClick={() => setLocation('/dashboard')}>
            Create a Course
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-studywise-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-studywise-gray-900 mb-8">
          Your Progress
        </h1>

        <div className="space-y-4">
          {courses.map(course => {
            const isExpanded = expandedCourses.has(course.course_id);
            const modules = moduleResults[course.course_id] || [];
            const progressPercentage = (course.modules_tested / course.total_modules) * 100;

            return (
              <div key={course.course_id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Course Header */}
                <button
                  onClick={() => toggleCourse(course.course_id)}
                  className="w-full px-6 py-5 flex items-center gap-4 hover:bg-studywise-gray-50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-studywise-gray-600" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-studywise-gray-600" />
                    )}
                  </div>

                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-semibold text-studywise-gray-900 mb-2">
                      {course.course_title}
                    </h3>

                    <div className="flex flex-wrap gap-6 text-sm text-studywise-gray-600">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        <span>
                          {course.modules_tested}/{course.total_modules} modules tested
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        <span>Average: {Math.round(course.overall_average_score)}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>
                          Last studied: {course.last_studied_at ? new Date(course.last_studied_at).toLocaleDateString() : 'Never'}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="w-full bg-studywise-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-3xl font-bold text-primary">
                      {Math.round(course.overall_average_score)}%
                    </div>
                    <div className="text-sm text-studywise-gray-600">
                      {course.total_tests_taken} tests
                    </div>
                  </div>
                </button>

                {/* Module Results */}
                {isExpanded && (
                  <div className="border-t border-studywise-gray-200 bg-studywise-gray-50">
                    {modules.length === 0 ? (
                      <div className="px-6 py-8 text-center text-studywise-gray-600">
                        Loading module results...
                      </div>
                    ) : (
                      <div className="divide-y divide-studywise-gray-200">
                        {modules.map(module => (
                          <div key={module.module_id} className="px-6 py-4 hover:bg-white transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-studywise-gray-900 mb-2">
                                  {module.module_title}
                                </h4>
                                <div className="flex gap-6 text-sm text-studywise-gray-600">
                                  <span>{module.total_attempts} attempts</span>
                                  <span>Best: {Math.round(module.best_score)}%</span>
                                  <span>Average: {Math.round(module.average_score)}%</span>
                                  <span>
                                    Last: {new Date(module.last_attempt_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-studywise-gray-900">
                                  {Math.round(module.average_score)}%
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
