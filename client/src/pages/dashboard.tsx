import { useState } from 'react';
import { useLocation } from 'wouter';
import { FileUploadZone } from '../components/dashboard/FileUploadZone';
import { GenerationLoadingOverlay } from '../components/dashboard/GenerationLoadingOverlay';
import { useCourseStore } from '../stores/useCourseStore';
import { Button } from '../components/ui/button';

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { generateCourse, isGenerating, generationError } = useCourseStore();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [context, setContext] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState('');

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setError(null);
  };

  const handlePreviewFile = async () => {
    if (!selectedFile) return;
    
    try {
      const content = await extractFileContent(selectedFile);
      setPreviewContent(content);
      setShowPreview(true);
    } catch (err) {
      setError('Failed to preview file');
    }
  };

  const extractFileContent = async (file: File): Promise<string> => {
    const fileType = getFileType(file.name);
    
    if (fileType === 'txt' || fileType === 'md') {
      return await file.text();
    }
    
    if (fileType === 'pdf') {
      const pdfjsLib = await import('pdfjs-dist');
      // Configure PDF.js worker before calling getDocument()
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(' ') + '\n';
      }
      return text;
    }
    
    if (fileType === 'docx') {
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    }
    
    throw new Error('Unsupported file type');
  };

  const getFileType = (filename: string): 'pdf' | 'docx' | 'txt' | 'md' => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'pdf';
    if (ext === 'docx' || ext === 'doc') return 'docx';
    if (ext === 'md' || ext === 'markdown') return 'md';
    return 'txt';
  };

  const handleGenerateCourse = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    try {
      const course = await generateCourse(selectedFile, context || undefined);
      
      // Navigate to course view
      setLocation(`/courses/${course.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate course');
    }
  };

  const characterCount = context.length;
  const maxCharacters = 500;

  return (
    <div className="min-h-screen bg-studywise-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-studywise-gray-900 mb-2">
            Create a New Course
          </h1>
          <p className="text-studywise-gray-600">
            Upload your study material and let AI organize it into modules
          </p>
        </div>

        <div className="space-y-6">
          {/* File Upload Zone */}
          <FileUploadZone 
            onFileSelect={handleFileSelect}
            disabled={isGenerating}
          />

          {/* Selected File Display */}
          {selectedFile && (
            <div className="bg-white border border-studywise-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-studywise-gray-900">
                    {selectedFile.name}
                  </p>
                  <p className="text-sm text-studywise-gray-500">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviewFile}
                    disabled={isGenerating}
                  >
                    Preview
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                    disabled={isGenerating}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Context Input */}
          <div className="bg-white border border-studywise-gray-200 rounded-lg p-6">
            <label className="block mb-2">
              <span className="text-sm font-medium text-studywise-gray-900">
                Additional Context (Optional)
              </span>
              <p className="text-xs text-studywise-gray-500 mt-1 mb-3">
                Help AI understand your content better by providing context
              </p>
            </label>
            
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="e.g., This is a biology textbook chapter about cell structure..."
              disabled={isGenerating}
              maxLength={maxCharacters}
              className="w-full px-4 py-3 border border-studywise-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
              rows={4}
            />
            
            <div className="flex justify-end mt-2">
              <span className={`text-xs ${characterCount > maxCharacters * 0.9 ? 'text-orange-600' : 'text-studywise-gray-500'}`}>
                {characterCount} / {maxCharacters}
              </span>
            </div>
          </div>

          {/* Error Display */}
          {(error || generationError) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                {error || generationError}
              </p>
            </div>
          )}

          {/* Generate Button */}
          <Button
            onClick={handleGenerateCourse}
            disabled={!selectedFile || isGenerating}
            className="w-full py-6 text-lg"
            size="lg"
          >
            {isGenerating ? 'Generating...' : 'Generate Course'}
          </Button>
        </div>

        {/* Info Section */}
        <div className="mt-12 text-center text-sm text-studywise-gray-500">
          <p>
            AI will analyze your document and organize it into study modules.
            <br />
            You can then take tests on individual modules to reinforce learning.
          </p>
        </div>
      </div>

      {/* Loading Overlay */}
      <GenerationLoadingOverlay isOpen={isGenerating} />

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-semibold text-studywise-gray-900">
                File Preview
              </h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-studywise-gray-500 hover:text-studywise-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <pre className="whitespace-pre-wrap text-sm text-studywise-gray-700 font-mono">
                {previewContent.substring(0, 5000)}
                {previewContent.length > 5000 && '\n\n... (content truncated for preview)'}
              </pre>
            </div>
            <div className="p-6 border-t">
              <Button onClick={() => setShowPreview(false)} className="w-full">
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
