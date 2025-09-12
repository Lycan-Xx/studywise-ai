import { useEffect, useRef, useMemo } from "react";
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
  question?: { // Added question object to access sourceText, sourceOffset, sourceLength
    sourceText?: string;
    sourceOffset?: number;
    sourceLength?: number;
  };
}

export function SourcePreviewModal({
  isOpen,
  onClose,
  notes,
  sourceText,
  sourceOffset,
  sourceLength,
  questionText,
  question // Destructure question
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

  // Find the source text and highlight it
  const highlightedText = useMemo(() => {
    if (!sourceText || !question?.sourceText) {
      return sourceText;
    }

    // Use sourceOffset and sourceLength if available
    if (question.sourceOffset !== undefined && question.sourceLength !== undefined &&
        question.sourceOffset >= 0 && question.sourceLength > 0) {
      const before = sourceText.substring(0, question.sourceOffset);
      const highlighted = sourceText.substring(question.sourceOffset, question.sourceOffset + question.sourceLength);
      const after = sourceText.substring(question.sourceOffset + question.sourceLength);

      return (
        <>
          {before}
          <mark className="bg-yellow-200 px-1 rounded font-medium">
            {highlighted}
          </mark>
          {after}
        </>
      );
    }

    // Fallback to text search
    const searchText = question.sourceText.toLowerCase().trim();
    const originalText = sourceText.toLowerCase();

    // Try exact match first
    let index = originalText.indexOf(searchText);

    // If no exact match, try partial matching with keywords
    if (index === -1) {
      const keywords = searchText.split(/\s+/).filter(word => word.length > 3);
      for (const keyword of keywords) {
        index = originalText.indexOf(keyword);
        if (index !== -1) {
          // Expand to include surrounding context
          const start = Math.max(0, index - 20);
          const end = Math.min(sourceText.length, index + keyword.length + 20);

          const before = sourceText.substring(0, start);
          const highlighted = sourceText.substring(start, end);
          const after = sourceText.substring(end);

          return (
            <>
              {before}
              <mark className="bg-yellow-200 px-1 rounded font-medium">
                {highlighted}
              </mark>
              {after}
            </>
          );
        }
      }

      // If still no match, highlight the entire source text from question
      return (
        <>
          {sourceText}
          <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-400">
            <p className="text-sm text-blue-700 font-medium">Related content:</p>
            <mark className="bg-yellow-200 px-1 rounded font-medium">
              {question.sourceText}
            </mark>
          </div>
        </>
      );
    }

    const before = sourceText.substring(0, index);
    const highlighted = sourceText.substring(index, index + searchText.length);
    const after = sourceText.substring(index + searchText.length);

    return (
      <>
        {before}
        <mark className="bg-yellow-200 px-1 rounded font-medium">
          {highlighted}
        </mark>
        {after}
      </>
    );
  }, [sourceText, question?.sourceText, question?.sourceOffset, question?.sourceLength]);


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