import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { ApiService } from '../services/apiService';

export interface Module {
  id: string;
  course_id: string;
  title: string;
  content: string;
  module_order: number;
  word_count?: number;
  estimated_read_time?: number;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  source_filename: string;
  source_file_type: 'pdf' | 'docx' | 'txt' | 'md';
  source_content: string;
  user_context?: string;
  parsing_status: 'pending' | 'processing' | 'completed' | 'failed';
  parsing_error?: string;
  used_fallback: boolean;
  total_modules: number;
  created_at: string;
  updated_at: string;
  last_studied_at?: string;
}

interface CourseState {
  // Current course being viewed
  currentCourse: Course | null;
  currentModule: Module | null;
  modules: Module[];
  
  // Loading states
  isGenerating: boolean;
  isLoadingCourse: boolean;
  generationError: string | null;
  
  // Actions
  setCurrentCourse: (course: Course | null) => void;
  setCurrentModule: (module: Module | null) => void;
  setModules: (modules: Module[]) => void;
  setGenerating: (isGenerating: boolean) => void;
  setGenerationError: (error: string | null) => void;
  
  // API actions
  generateCourse: (file: File, context?: string) => Promise<Course>;
  loadCourse: (courseId: string) => Promise<void>;
  retryCourse: (courseId: string) => Promise<Course>;
  selectModule: (moduleId: string) => void;
  
  // Computed
  getModuleByOrder: (order: number) => Module | undefined;
  getCurrentModuleIndex: () => number;
  hasNextModule: () => boolean;
  hasPreviousModule: () => boolean;
  
  // Reset
  reset: () => void;
}

export const useCourseStore = create<CourseState>()(
  devtools(
    (set, get) => ({
      currentCourse: null,
      currentModule: null,
      modules: [],
      isGenerating: false,
      isLoadingCourse: false,
      generationError: null,

      setCurrentCourse: (course) => set({ currentCourse: course }),
      
      setCurrentModule: (module) => set({ currentModule: module }),
      
      setModules: (modules) => set({ modules }),
      
      setGenerating: (isGenerating) => set({ isGenerating }),
      
      setGenerationError: (error) => set({ generationError: error }),

      generateCourse: async (file: File, context?: string) => {
        set({ isGenerating: true, generationError: null });
        
        try {
          // Extract file content + structural headings detected client-side
          const processed = await extractFileContent(file);
          
          console.log(
            `📤 Sending course generation request: ` +
            `${processed.text.length} chars, ` +
            `${processed.headings.length} headings (${processed.detectionMethod})`
          );

          // Call backend API via ApiService
          const course = await ApiService.generateCourse({
            filename: file.name,
            content: processed.text,
            userContext: context || '',
            fileType: getFileType(file.name),
            detectedHeadings: processed.headings,        // NEW: structural hints
            headingDetectionMethod: processed.detectionMethod, // NEW: confidence signal
          });

          set({ currentCourse: course, isGenerating: false });
          return course;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          set({ generationError: errorMessage, isGenerating: false });
          throw error;
        }
      },

      loadCourse: async (courseId: string) => {
        set({ isLoadingCourse: true });
        
        try {
          // Load course and modules via ApiService
          const course = await ApiService.fetchCourse(courseId);
          // Wait, ApiService.fetchCourse needs to return modules or we fetch them separately?
          // Let's check how ApiService is implemented, actually ApiService.fetchCourse doesn't fetch modules.
          
          // ApiService doesn't have a specific getCourseModules, so we'll add a fetch call via ApiService.get
          const modulesResponse = await ApiService.get(`/api/courses/${courseId}/modules`);
          if (!modulesResponse.ok) throw new Error('Failed to load modules');
          const modules: Module[] = await modulesResponse.json();
          
          set({
            currentCourse: course,
            modules,
            currentModule: modules[0] || null,
            isLoadingCourse: false,
          });
        } catch (error) {
          set({ isLoadingCourse: false });
          throw error;
        }
      },

      retryCourse: async (courseId: string) => {
        set({ isGenerating: true, generationError: null });
        
        try {
          const course = await ApiService.retryCourseGeneration(courseId);
          
          // After retry, we also need to fetch the newly generated modules
          const modulesResponse = await ApiService.get(`/api/courses/${courseId}/modules`);
          if (!modulesResponse.ok) throw new Error('Failed to load modules after retry');
          const modules: Module[] = await modulesResponse.json();
          
          set({ 
            currentCourse: course, 
            modules,
            currentModule: modules[0] || null,
            isGenerating: false 
          });
          return course;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          set({ generationError: errorMessage, isGenerating: false });
          throw error;
        }
      },

      selectModule: (moduleId: string) => {
        const { modules } = get();
        const module = modules.find(m => m.id === moduleId);
        if (module) {
          set({ currentModule: module });
        }
      },

      getModuleByOrder: (order: number) => {
        const { modules } = get();
        return modules.find(m => m.module_order === order);
      },

      getCurrentModuleIndex: () => {
        const { currentModule, modules } = get();
        if (!currentModule) return -1;
        return modules.findIndex(m => m.id === currentModule.id);
      },

      hasNextModule: () => {
        const { getCurrentModuleIndex, modules } = get();
        const index = getCurrentModuleIndex();
        return index >= 0 && index < modules.length - 1;
      },

      hasPreviousModule: () => {
        const { getCurrentModuleIndex } = get();
        return getCurrentModuleIndex() > 0;
      },

      reset: () => set({
        currentCourse: null,
        currentModule: null,
        modules: [],
        isGenerating: false,
        isLoadingCourse: false,
        generationError: null,
      }),
    }),
    { name: 'CourseStore' }
  )
);

// Helper functions

// Use DocumentProcessor for all extraction — it returns text + detected headings
import { DocumentProcessor, ProcessedDocument } from '../utils/documentProcessor';

async function extractFileContent(file: File): Promise<ProcessedDocument> {
  const result = await DocumentProcessor.processFile(file);
  if (!result) throw new Error('Failed to extract file content');
  return result;
}

function getFileType(filename: string): 'pdf' | 'docx' | 'txt' | 'md' {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'docx' || ext === 'doc') return 'docx';
  if (ext === 'md' || ext === 'markdown') return 'md';
  return 'txt';
}
