import { useCallback, useState } from 'react';
import { Upload, FileText, FileType, File as FileIcon } from 'lucide-react';

// Keep in sync with DocumentProcessor.MAX_FILE_SIZE — duplicated here so the
// upload zone can reject oversized files before any parsing library is even
// loaded, not just after arrayBuffer() has already read the whole file into memory.
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  onFileReject?: (reason: string) => void;
  disabled?: boolean;
}

export function FileUploadZone({ onFileSelect, onFileReject, disabled }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const tryAccept = useCallback((file: File | undefined) => {
    if (!file) return;

    if (!isValidFile(file)) {
      onFileReject?.(`"${file.name}" isn't a supported file type. Please use PDF, DOCX, TXT, or Markdown.`);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      const sizeMb = (file.size / 1024 / 1024).toFixed(1);
      onFileReject?.(
        `"${file.name}" is ${sizeMb}MB — please upload files under ${MAX_FILE_SIZE / 1024 / 1024}MB. ` +
        `Try splitting large documents into chapters, or compress scanned PDFs.`
      );
      return;
    }

    onFileSelect(file);
  }, [onFileSelect, onFileReject]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    tryAccept(e.dataTransfer.files[0]);
  }, [tryAccept, disabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    tryAccept(e.target.files?.[0]);
  }, [tryAccept]);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`
        relative border-2 border-dashed rounded-lg p-12 text-center transition-all
        ${isDragging ? 'border-primary bg-primary/5' : 'border-studywise-gray-300'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary hover:bg-studywise-gray-50'}
      `}
    >
      <input
        type="file"
        accept=".pdf,.docx,.doc,.txt,.md"
        onChange={handleFileInput}
        disabled={disabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        id="file-upload"
      />
      
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Upload className="w-8 h-8 text-primary" />
        </div>
        
        <div>
          <p className="text-lg font-semibold text-studywise-gray-900 mb-1">
            Drop your file here or click to browse
          </p>
          <p className="text-sm text-studywise-gray-600">
            Supports PDF, DOCX, TXT, and Markdown files — up to 15MB
          </p>
        </div>
        
        <div className="flex gap-4 text-studywise-gray-500">
          <FileIcon className="w-5 h-5" />
          <FileText className="w-5 h-5" />
          <FileType className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

function isValidFile(file: File): boolean {
  const validTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'text/markdown',
  ];
  
  const validExtensions = ['.pdf', '.docx', '.doc', '.txt', '.md'];
  const hasValidExtension = validExtensions.some(ext => 
    file.name.toLowerCase().endsWith(ext)
  );
  
  return validTypes.includes(file.type) || hasValidExtension;
}
