import { useCallback, useState } from 'react';
import { Upload, FileText, FileType, File as FileIcon } from 'lucide-react';

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export function FileUploadZone({ onFileSelect, disabled }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;
    
    const file = e.dataTransfer.files[0];
    if (file && isValidFile(file)) {
      onFileSelect(file);
    }
  }, [onFileSelect, disabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isValidFile(file)) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

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
            Supports PDF, DOCX, TXT, and Markdown files
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
