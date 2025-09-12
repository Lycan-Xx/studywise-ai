import { useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface SourcePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: string;
  sourceText?: string;
  sourceOffset?: number;
  sourceLength?: number;
  questionText: string;
}

export function SourcePreviewModal({
  isOpen,
  onClose,
  notes,
  sourceText,
  sourceOffset,
  sourceLength,
  questionText
}: SourcePreviewModalProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle text highlighting when modal opens or sourceText changes
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      const textarea = textareaRef.current;
      
      // Small delay to ensure textarea is rendered
      setTimeout(() => {
        // First try using sourceOffset and sourceLength if available
        if (sourceOffset !== undefined && sourceLength !== undefined && sourceOffset >= 0) {
          textarea.focus();
          textarea.setSelectionRange(sourceOffset, sourceOffset + sourceLength);
          
          // Scroll to make the selection visible
          textarea.scrollTop = Math.max(0, 
            (sourceOffset / notes.length) * textarea.scrollHeight - textarea.clientHeight / 2
          );
        } else if (sourceText && sourceText !== 'Generated from your content' && sourceText !== 'Mock source text from your document') {
          // Try to find the source text in the notes
          const index = notes.toLowerCase().indexOf(sourceText.toLowerCase());
          
          if (index !== -1) {
            // Focus the textarea and select the found text
            textarea.focus();
            textarea.setSelectionRange(index, index + sourceText.length);
            
            // Scroll to make the selection visible
            textarea.scrollTop = Math.max(0, 
              (index / notes.length) * textarea.scrollHeight - textarea.clientHeight / 2
            );
          }
        } else {
          // If no specific source text, just focus the textarea
          textarea.focus();
        }
      }, 100);
    }
  }, [isOpen, sourceText, sourceOffset, sourceLength, notes]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-studywise-gray-900">
              Source Reference
            </DialogTitle>

          </div>
          <div className="text-sm text-studywise-gray-600 mt-2">
            <span className="font-medium">Question:</span> {questionText}
          </div>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col min-h-0">
          <div className="text-sm text-studywise-gray-600 mb-3">
            The highlighted text below is the source material for this question:
          </div>
          
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={notes}
              readOnly
              className="w-full h-full resize-none border-2 border-studywise-gray-300 rounded-2xl p-6 text-base leading-relaxed focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="No source notes available..."
            />
            
            {/* Character Counter */}
            <div className="absolute bottom-4 right-4 text-sm text-studywise-gray-500 bg-white px-2 py-1 rounded">
              {notes.length.toLocaleString()} characters
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}