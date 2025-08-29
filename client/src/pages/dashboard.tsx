import { useEffect, useRef, useState } from "react";
import { ArrowUp, Paperclip, Plus } from "lucide-react";
import { TestWizard } from "@/components/test";
import { DocumentProcessor } from "@/utils/documentProcessor";
import { GlobalWorkerOptions } from "pdfjs-dist";

export default function Dashboard() {
  // Configure pdfjs-dist to use a local worker file
  GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

  const [notes, setNotes] = useState("");
  const [showWizard, setShowWizard] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const maxLength = 50000;

  // Trigger the quiz wizard
  const handleGenerateQuiz = () => {
    if (!notes.trim()) return;
    setShowWizard(true);
  };

  // Programmatically open file input
  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  // Handle manual file selection
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) await processFile(file);
    // Reset input so same file can be uploaded again
    event.target.value = "";
  };

  // Process a single file
  const processFile = async (file: File) => {
    const fileName = file.name;
    try {
      const documentContent = await DocumentProcessor.processFile(file);
      if (documentContent) {
        const separator = `\n\n--- Document Content (${fileName}) ---\n\n`;
        setNotes(prev => prev.trim() ? `${prev}${separator}${documentContent}` : documentContent);
      }
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : `Failed to process ${fileName}`);
    }
  };

  // Drag-and-drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
      setIsDragOver(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const supportedFiles = files.filter(file => DocumentProcessor.isSupported(file));

    if (!supportedFiles.length) {
      console.warn("No supported files found. Please upload .txt, .md, .docx, or .pdf files.");
      return;
    }

    await processFile(supportedFiles[0]);
  };

  // Adjust textarea height dynamically
  const adjustTextareaHeight = () => {
    const ta = textareaRef.current;
    if (!ta) return;

    ta.style.height = "auto";
    const vw = window.innerWidth || 1024;
    const vh = window.innerHeight || 800;
    const minPx = vw < 768 ? 48 : 140;
    const maxPx = vw < 768 ? Math.round(vh * 0.25) : Math.round(vh * 0.6);
    const newHeight = Math.max(minPx, Math.min(ta.scrollHeight, maxPx));
    ta.style.height = `${newHeight}px`;
  };

  useEffect(() => {
    adjustTextareaHeight();
    const onResize = () => adjustTextareaHeight();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, [notes]);

  const handleFocus = () => {
    if ((window.innerWidth || 1024) < 768) {
      setTimeout(() => {
        textareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  };

  return (
    <div className="h-full md:h-auto flex flex-col">
      {!showWizard ? (
        <>
          {/* MOBILE */}
          <div className="md:hidden flex flex-col h-[100dvh] overflow-hidden">
            <div className="flex-1 flex items-start justify-start pt-12 px-6 pb-32">
              <h1 className="mx-auto text-[3.6rem] leading-tight font-light text-center">
                Turn your notes into smart tests
              </h1>
            </div>

            <div className="fixed left-4 right-4 bottom-6 z-50">
              <div className={`bg-white rounded-full border shadow-lg flex items-center gap-3 px-4 py-3 ${isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-400'}`}>
                <button onClick={handleFileUpload} className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center border border-gray-400">
                  <Plus className="w-6 h-6 text-gray-700" />
                </button>

                <div className="flex-1 relative">
  <textarea
    ref={textareaRef}
    value={notes}
    onChange={(e) => setNotes(e.target.value)}
    onInput={adjustTextareaHeight}
    onFocus={handleFocus}
    onDragOver={handleDragOver}
    onDragLeave={handleDragLeave}
    onDrop={handleDrop}
    placeholder={isDragOver ? "Drop your file here..." : "Paste or upload your notes here to get started..."}
    maxLength={maxLength}
    className={`w-full min-h-[48px] max-h-[40vh] resize-none bg-transparent outline-none placeholder:text-gray-400 text-base text-gray-900 pr-16 transition-colors
      ${isDragOver ? 'bg-blue-50 border border-blue-400' : 'border border-gray-200'}`}
  />
  {/* Optional overlay message */}
  {isDragOver && (
    <div className="absolute inset-0 flex items-center justify-center bg-blue-100 bg-opacity-50 pointer-events-none rounded-full text-blue-600 text-center">
      Drop your file
    </div>
  )}
  {notes.length > 0 && (
    <div className="absolute bottom-1 right-1 text-xs text-gray-400 bg-white px-1 rounded">
      {notes.length}/{maxLength}
    </div>
  )}
</div>


                <button onClick={handleGenerateQuiz} disabled={!notes.trim()} className={`w-10 h-10 rounded-full border flex items-center justify-center ${notes.trim() ? "bg-blue-600 text-white border-transparent" : "bg-white text-gray-400 border-gray-200 cursor-not-allowed"}`}>
                  <ArrowUp className="w-4 h-4" />
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept=".txt,.md,.doc,.docx,.pdf" onChange={handleFileChange} className="hidden" />
            </div>
          </div>

          {/* DESKTOP */}
          <div className="hidden md:flex flex-col">
            <div className="flex-shrink-0 p-8 text-center">
              <h1 className="text-3xl md:text-4xl font-semibold">
                Transform your study materials into intelligent practice tests that adapt to how you learn
              </h1>
            </div>
            <div className="flex-1 flex justify-center items-center">
              <div className="w-full max-w-3xl px-8">
                <div className={`bg-white rounded-2xl border border-black shadow-sm p-6 relative ${isDragOver ? 'bg-blue-50 border-blue-400' : ''}`}>
                  <div className="flex items-start gap-4">
                    <button onClick={handleFileUpload} className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                      <Paperclip className="w-6 h-6 text-gray-600" />
                    </button>


                    <div className="flex-1 relative">
  <textarea
    ref={textareaRef}
    value={notes}
    onChange={(e) => setNotes(e.target.value)}
    onInput={adjustTextareaHeight}
    onDragOver={handleDragOver}
    onDragLeave={handleDragLeave}
    onDrop={handleDrop}
    placeholder={isDragOver ? "Drop your document here..." : "Paste or upload your study notes, textbook content, or lecture materials here..."}
    maxLength={maxLength}
    className={`w-full min-h-[140px] md:min-h-[180px] max-h-[60vh] resize-none
      bg-transparent placeholder:text-gray-400 text-gray-900 px-2 py-1 pr-20
      outline-none focus:outline-none focus:ring-0
      
      ${isDragOver ? 'bg-blue-50 border border-blue-400 rounded-xl' : ''}`}
  />
  {/* Overlay for drag feedback */}
  {isDragOver && (
    <div className="absolute inset-0 flex items-center justify-center bg-blue-100 bg-opacity-50 pointer-events-none rounded-2xl text-blue-600 text-center">
      Drop your document here
    </div>
  )}
  <div className="absolute bottom-2 right-2 text-sm text-gray-500 bg-white px-2 py-1 rounded">
    {notes.length}/{maxLength}
  </div>
</div>



                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <button onClick={handleGenerateQuiz} disabled={!notes.trim()} className={`h-12 px-4 rounded-xl flex items-center gap-2 ${notes.trim() ? "bg-blue-600 text-white border-transparent" : "bg-white text-gray-400 border border-gray-200 cursor-not-allowed"}`}>
                    <ArrowUp className="w-4 h-4" />
                    <span className="hidden lg:inline">Generate</span>
                  </button>
                </div>
                <input ref={fileInputRef} type="file" accept=".txt,.md,.doc,.docx,.pdf" onChange={handleFileChange} className="hidden" />
              </div>
            </div>
          </div>
        </>
      ) : (
        <TestWizard notes={notes} onClose={() => setShowWizard(false)} />
      )}
    </div>
  );
}
