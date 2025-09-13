import { useEffect, useRef, useState } from "react";
import { Paperclip, Plus, X, BookOpen, Wand2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { TestPreviewOverlay, TestTakingOverlay, TestResultsOverlay } from "@/components/test";
import { DocumentProcessor } from "@/utils/documentProcessor";
import { useAuth } from "@/contexts/AuthContext";
import { useTestStore, useLibraryStore, useTestSessionStore, useTestWorkflow } from "@/stores";
import { TestConfig } from "@/types";
import { useToast } from "@/hooks/use-toast";
import TestCustomizationPanel from './mobileDashboard/TestCustomizationPanel';
import { MobileBottomSheet } from './mobileDashboard/MobileBottomSheet';

export default function Dashboard() {
  const [showMobileCustomization, setShowMobileCustomization] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDragOver, setIsDragOver] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const [customTopic, setCustomTopic] = useState("");
  
  // Navigation state - replaces modal open/close states
  const [currentView, setCurrentView] = useState<'dashboard' | 'preview' | 'test' | 'results'>('dashboard');
  const [testTimeLimit, setTestTimeLimit] = useState<number | null>(null);
  
  // Test configuration state
  const [testConfig, setTestConfig] = useState<TestConfig>({
    title: "",
    topics: "",
    questionType: 'mcq',
    numberOfQuestions: 10,
    difficulty: 'medium'
  });

  const { notes, setNotes, updateConfig, generateQuestions, isGenerating, generatedQuestions, setQuestions } = useTestStore();
  const [isUsingCache, setIsUsingCache] = useState(false);
  const { saveTest } = useLibraryStore();
  const { startTest, submitTest, currentSession } = useTestSessionStore();
  const { completeTest } = useTestWorkflow();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const customizationRef = useRef<HTMLDivElement | null>(null);

  const maxLength = 50000;

  // Auto-generate title and topics when notes change
  useEffect(() => {
    if (notes.trim()) {
      // Auto-generate title from first meaningful sentence
      const sentences = notes.split(/[.!?]+/).filter(s => s.trim().length > 10);
      const autoTitle = sentences[0]?.trim().substring(0, 50) + (sentences[0]?.length > 50 ? "..." : "") || "Study Test";
      
      // Extract potential topics (simple keyword extraction)
      const words = notes.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
      const wordFreq = words.reduce((acc, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const topTopics = Object.entries(wordFreq)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(', ');

      setTestConfig(prev => ({
        ...prev,
        title: prev.title || autoTitle,
        topics: prev.topics || topTopics
      }));
    }
  }, [notes]);

  // Navigation functions
  const showPreview = () => setCurrentView('preview');
  const showTest = () => setCurrentView('test');
  const showResults = () => setCurrentView('results');
  const backToDashboard = () => setCurrentView('dashboard');

  // Generate with defaults
  const handleGenerateWithDefaults = async () => {
    if (!notes.trim()) return;

    const defaultConfig: TestConfig = {
      title: testConfig.title || "Quick Study Test",
      topics: testConfig.topics || "General",
      questionType: 'mcq',
      numberOfQuestions: 10,
      difficulty: 'medium'
    };

    updateConfig(defaultConfig);
    const result = await generateQuestions(defaultConfig, notes);
    setIsUsingCache(result.usedCache);
    showPreview();
  };

  const handleStartTest = async (timeLimit: number | null) => {
    if (!generatedQuestions.length) return;
    
    // Start the test session
    const testId = Date.now().toString();
    const testTitle = testConfig.title || "Generated Test";
    
    startTest(testId, testTitle, generatedQuestions, timeLimit);
    setTestTimeLimit(timeLimit);
    showTest();
  };

  // Generate with custom settings
  const handleGenerateCustom = async () => {
    if (!notes.trim() || !testConfig.title.trim()) return;

    updateConfig(testConfig);
    const result = await generateQuestions(testConfig, notes);
    setIsUsingCache(result.usedCache);
    showPreview();
  };

  const handleSaveToLibrary = async () => {
    if (!generatedQuestions.length) return;

    try {
      const savedTest = {
        title: testConfig.title || "Generated Test",
        questionCount: generatedQuestions.length,
        config: testConfig,
        questions: generatedQuestions,
        notes,
        gradient: getRandomGradient()
      };

      await saveTest(savedTest);
      toast({
        title: "Test saved to library",
        description: "Your test has been successfully saved and is now available in your library.",
      });

      // Clear the dashboard state for a cleaner feel
      setNotes("");
      updateConfig({});
      setQuestions([]);
      setCurrentView('dashboard');
    } catch (error) {
      console.error("Failed to save test:", error);
      toast({
        title: "Error",
        description: "Failed to save test to library. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTestSubmit = async (answers: Record<number, string>) => {
    try {
      // Complete the test and save results
      console.log('Submitting test with answers:', Object.keys(answers).length);
      const result = await completeTest(answers);
      console.log('Test result saved:', result);
      showResults();
    } catch (error) {
      console.error("Failed to submit test:", error);
    }
  };

  const handleTestExit = () => {
    // When exiting test, go back to preview instead of dashboard
    showPreview();
  };

  // Calculate score and time spent for results display
  const calculateScoreAndTime = () => {
    if (!currentSession || !generatedQuestions.length) {
      return { score: 0, timeSpent: undefined };
    }

    const correctCount = generatedQuestions.filter(
      q => currentSession.userAnswers[q.id] === q.correctAnswer
    ).length;

    const score = Math.round((correctCount / generatedQuestions.length) * 100);

    const timeSpent = currentSession.timeLimit && currentSession.timeRemaining
      ? (currentSession.timeLimit * 60) - currentSession.timeRemaining
      : undefined;

    return { score, timeSpent };
  };

  // Helper function for random gradients
  const getRandomGradient = () => {
    const gradients = [
      "from-blue-600 to-blue-700",
      "from-green-600 to-green-700", 
      "from-purple-600 to-purple-700",
      "from-orange-600 to-orange-700",
      "from-red-600 to-red-700"
    ];
    return gradients[Math.floor(Math.random() * gradients.length)];
  };

  // Topic management
  const addTopic = () => {
    if (customTopic.trim()) {
      const currentTopics = testConfig.topics ? testConfig.topics.split(',').map(t => t.trim()).filter(t => t) : [];
      if (!currentTopics.includes(customTopic.trim())) {
        const newTopics = [...currentTopics, customTopic.trim()].join(', ');
        setTestConfig(prev => ({ ...prev, topics: newTopics }));
        setCustomTopic("");
      }
    }
  };

  const removeTopic = (topicToRemove: string) => {
    const currentTopics = testConfig.topics ? testConfig.topics.split(',').map(t => t.trim()).filter(t => t) : [];
    const newTopics = currentTopics.filter(topic => topic !== topicToRemove).join(', ');
    setTestConfig(prev => ({ ...prev, topics: newTopics }));
  };

  // File handling
  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) await processFile(file);
    event.target.value = "";
  };

  const processFile = async (file: File) => {
    const fileName = file.name;
    try {
      const documentContent = await DocumentProcessor.processFile(file);
      if (documentContent) {
        const separator = `\n\n--- Document Content (${fileName}) ---\n\n`;
        setNotes(notes.trim() ? `${notes}${separator}${documentContent}` : documentContent);
      }
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : `Failed to process ${fileName}`);
    }
  };

  // Drag and drop
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

  // Textarea auto-resize
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

  const [profileInfo, setProfileInfo] = useState({
    fullName: "",
  });

  useEffect(() => {
    if (user) {
      setProfileInfo({
        fullName: user.user_metadata?.full_name || user.user_metadata?.name || '',
      });
    }
  }, [user]);

  const topicsArray = testConfig.topics ? testConfig.topics.split(',').map(t => t.trim()).filter(t => t) : [];

  const questionTypes = [
    {
      id: 'mcq' as const,
      title: 'Multiple Choice',
      initials: 'MCQ',
      description: 'Choose from multiple options',
      example: 'What is 2+2? A) 3 B) 4 C) 5'
    },
    {
      id: 'true-false' as const,
      title: 'True or False',
      initials: 'T/F',
      description: 'Answer true or false only',
      example: 'The sun rises in the east. True/False'
    }
  ];

  const difficultyLevels = [
    {
      id: 'easy' as const,
      title: 'Easy',
      description: 'Basic concepts and recall',
      color: 'bg-green-50 border-green-200 text-green-700'
    },
    {
      id: 'medium' as const,
      title: 'Medium',
      description: 'Understanding and application',
      color: 'bg-yellow-50 border-yellow-200 text-yellow-700'
    },
    {
      id: 'hard' as const,
      title: 'Hard',
      description: 'Analysis and critical thinking',
      color: 'bg-red-50 border-red-200 text-red-700'
    }
  ];

  const questionCounts = [5, 10, 15, 20, 25, 30];

  // Render overlays based on current view
  if (currentView === 'preview') {
    return (
      <TestPreviewOverlay
        config={testConfig}
        questions={generatedQuestions}
        notes={notes}
        onStartTest={handleStartTest}
        onRegenerateAll={handleGenerateCustom}
        onSaveToLibrary={handleSaveToLibrary}
        onBack={backToDashboard}
        isUsingCache={isUsingCache}
      />
    );
  }

  if (currentView === 'test' && generatedQuestions.length > 0) {
    return (
      <TestTakingOverlay
        testTitle={testConfig.title || "Generated Test"}
        questions={generatedQuestions}
        timeLimit={testTimeLimit}
        onSubmit={handleTestSubmit}
        onBack={handleTestExit}
      />
    );
  }

  if (currentView === 'results') {
    const { score, timeSpent } = calculateScoreAndTime();
    return (
      <TestResultsOverlay
        testTitle={testConfig.title || "Generated Test"}
        testId={currentSession?.testId || ""}
        questions={generatedQuestions}
        userAnswers={currentSession?.userAnswers || {}}
        correctAnswers={generatedQuestions.reduce((acc, q) => ({ ...acc, [q.id]: q.correctAnswer }), {})}
        score={score}
        totalQuestions={generatedQuestions.length}
        timeSpent={timeSpent}
        notes={notes}
        onRetake={() => handleStartTest(testTimeLimit)}
        onRetakeWrong={() => {
          const wrongQuestions = generatedQuestions.filter(q =>
            currentSession?.userAnswers[q.id] !== q.correctAnswer
          );
          if (wrongQuestions.length > 0) {
            // Handle wrong questions retry logic here
          }
        }}
        onViewNotes={backToDashboard}
        onBack={backToDashboard}
        onReturnToLibrary={() => {
          // Navigate to library page instead of back to dashboard
          window.location.href = '/library';
        }}
      />
    );
  }

  // Dashboard view (same as before)
  return (
    <div className="h-full md:h-auto flex flex-col">


{/* MOBILE */}
<div className="md:hidden flex flex-col min-h-[calc(100vh-8rem)] overflow-hidden">
  {/* Welcome text in center */}
  <div className="flex-1 flex items-center justify-center px-6">
    <h1 className="text-[3.6rem] leading-tight font-light text-center">
      Turn your notes into smart tests
    </h1>
  </div>

  {/* Fixed bottom textarea */}
  <div className="fixed left-4 right-4 bottom-6 z-50">
    <div className={`bg-white rounded-full border flex items-center gap-3 px-2 py-3 ${isDragOver ? 'border-blue-400 bg-blue-50' : 'border-black'}`}>
      <button onClick={handleFileUpload} className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center border border-gray-400">
        <Paperclip className="w-6 h-6 text-gray-700" />
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
          className={ `resize-none bg-white
            placeholder:text-gray-400 text-base text-gray-900
            border-none
            focus:outline-none
            focus:ring-0
            focus:border-transparent
            outline-0
            ring-0
            text-center
            ${isDragOver ? 'bg-blue-50' : ''}`}
          style={{ textAlign: "left", alignItems: "center", justifyContent: "center" }}
        />

        {isDragOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-blue-100 bg-opacity-50 pointer-events-none rounded-full text-blue-600 text-center">
            Drop your file
          </div>
        )}
      </div>

      <button
        onClick={handleGenerateWithDefaults}
        disabled={!notes.trim() || isGenerating}
        className={`w-12 h-12 rounded-full border flex items-center justify-center ${notes.trim() && !isGenerating ? "bg-primary text-white border-transparent" : "bg-white text-gray-400 border-gray-200 cursor-not-allowed"}`}
      >
        {isGenerating ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Wand2 className="w-6 h-6" />
        )}
      </button>
    </div>

    {/* Mobile Action Buttons */}
    {notes.trim() && (
      <div className="flex justify-end mt-4">
        <Button
          onClick={() => setShowMobileCustomization(true)}
          variant="outline"
          size="sm"
          className="px-4 py-2 border border-gray-500 text-gray-700 hover:bg-gray-50 flex items-center gap-2 text-sm"
        >
          <Settings className="w-3 h-3" />
          Customize
        </Button>
      </div>
    )}

    <input ref={fileInputRef} type="file" accept=".txt,.md,.doc,.docx,.pdf" onChange={handleFileChange} className="hidden" />
  </div>

  {/* Mobile Bottom Sheet */}
  <MobileBottomSheet
    isOpen={showMobileCustomization}
    onClose={() => setShowMobileCustomization(false)}
    title="Customize Your Test"
  >
    <TestCustomizationPanel
      config={testConfig}
      setConfig={(updater) => {
        if (typeof updater === 'function') {
          setTestConfig(updater);
        } else {
          setTestConfig(prev => ({ ...prev, ...updater }));
        }
      }}
      customTopic={customTopic}
      setCustomTopic={setCustomTopic}
      addTopic={addTopic}
      removeTopic={removeTopic}
      topicsArray={topicsArray}
      isGenerating={isGenerating}
      onGenerate={() => {
        handleGenerateCustom();
        setShowMobileCustomization(false); // Close bottom sheet after generation
      }}
      compact={true} // Enable compact styling for mobile
    />
  </MobileBottomSheet>
</div>


      {/* DESKTOP */}
      <div className="hidden md:flex flex-col">
        <div className="flex-shrink-0 p-8 text-center">
          <h1 className="text-3xl md:text-4xl font-semibold mb-2">
            Welcome {profileInfo.fullName || 'User'}
          </h1>
          <h2 className="text-xl md:text-2xl font-normal text-studywise-gray-600">
            Transform your study materials into intelligent practice tests
          </h2>
        </div>

        <div className="flex-1 flex justify-center items-start pt-8">
          <div className="w-full max-w-4xl px-8 space-y-6">
            {/* Main Notes Input */}
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
                  {isDragOver && (
                    <div className="absolute inset-0 flex items-center justify-center bg-blue-100 bg-opacity-50 pointer-events-none rounded-2xl text-blue-600 text-center">
                      Drop your document here
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 text-sm text-gray-500 bg-white px-2 py-1 rounded">
                    {notes.length.toLocaleString()}/{maxLength.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Auto-extracted topics (if any) */}
            {notes.trim() && topicsArray.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Wand2 className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Auto-detected topics:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {topicsArray.map((topic, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {notes.trim() && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => {
                    setShowCustomization(!showCustomization);
                    // Smooth scroll to customization section after state update
                    setTimeout(() => {
                      customizationRef.current?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                      });
                    }, 100);
                  }}
                  variant="outline"
                  size="lg"
                  className="px-8 py-3 border-2 border-black text-slate-700 hover:border-slate-300 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Customize
                </Button>

                <Button
                  onClick={handleGenerateWithDefaults}
                  disabled={isGenerating}
                  size="lg"
                  className="px-8 py-3 bg-primary hover:bg-blue-600 text-white flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      Generate with Defaults
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Customization Section */}
            {showCustomization && notes.trim() && (
              <Card ref={customizationRef} className="border-2 border-studywise-gray-300 shadow-lg">
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold text-studywise-gray-900">Customize Your Test</h3>
                  </div>

                  {/* Test Title */}
                  <div>
                    <label className="block text-sm font-medium text-studywise-gray-700 mb-2">
                      Test Title
                    </label>
                    <Input
                      value={testConfig.title}
                      onChange={(e) => setTestConfig(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter a title for your test"
                      className="w-full"
                    />
                  </div>

                  {/* Topics Management */}
                  <div>
                    <label className="block text-sm font-medium text-studywise-gray-700 mb-2">
                      Focus Topics
                    </label>
                    <div className="flex gap-2 mb-3">
                      <Input
                        value={customTopic}
                        onChange={(e) => setCustomTopic(e.target.value)}
                        placeholder="Add a specific topic..."
                        onKeyDown={(e) => e.key === 'Enter' && addTopic()}
                        className="flex-1"
                      />
                      <Button onClick={addTopic} disabled={!customTopic.trim()} size="sm">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {topicsArray.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {topicsArray.map((topic, index) => (
                          <div key={index} className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            <span>{topic}</span>
                            <button
                              onClick={() => removeTopic(topic)}
                              className="ml-1 text-blue-600 hover:text-blue-800"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Question Type */}
                  <div>
                    <label className="block text-sm font-medium text-studywise-gray-700 mb-3">
                      Question Format
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {questionTypes.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setTestConfig(prev => ({ ...prev, questionType: type.id }))}
                          className={`p-4 border rounded-lg text-center transition-all ${
                            testConfig.questionType === type.id
                              ? 'border-primary bg-blue-50 text-primary font-medium'
                              : 'border-studywise-gray-300 hover:border-studywise-gray-400 text-studywise-gray-700'
                          }`}
                        >
                          <div className="text-2xl font-bold mb-2">{type.initials}</div>
                          <h4 className="text-sm font-semibold mb-1">{type.title}</h4>
                          <p className="text-xs text-studywise-gray-600">{type.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Difficulty */}
                  <div>
                    <label className="block text-sm font-medium text-studywise-gray-700 mb-3">
                      Difficulty Level
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {difficultyLevels.map((level) => (
                        <button
                          key={level.id}
                          onClick={() => setTestConfig(prev => ({ ...prev, difficulty: level.id }))}
                          className={`p-4 border-2 rounded-lg text-center transition-all ${
                            testConfig.difficulty === level.id
                              ? 'border-primary bg-blue-50 text-primary font-medium'
                              : `border-studywise-gray-300 hover:border-studywise-gray-400 ${level.color}`
                          }`}
                        >
                          <div className="text-lg font-bold mb-1">{level.title}</div>
                          <p className="text-sm">{level.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Question Count */}
                  <div>
                    <label className="block text-sm font-medium text-studywise-gray-700 mb-3">
                      Number of Questions
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {questionCounts.map((count) => (
                        <button
                          key={count}
                          onClick={() => setTestConfig(prev => ({ ...prev, numberOfQuestions: count }))}
                          className={`p-3 border rounded-lg text-center transition-all ${
                            testConfig.numberOfQuestions === count
                              ? 'border-primary bg-blue-50 text-primary font-medium'
                              : 'border-studywise-gray-300 hover:border-studywise-gray-400 text-studywise-gray-700'
                          }`}
                        >
                          {count}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Generate Button */}
                  <div className="flex justify-end pt-4 border-t border-studywise-gray-200">
                    <Button
                      onClick={handleGenerateCustom}
                      disabled={!testConfig.title.trim() || isGenerating}
                      size="lg"
                      className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white"
                    >
                      {isGenerating ? "Generating..." : "Generate Test"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <input ref={fileInputRef} type="file" accept=".txt,.md,.doc,.docx,.pdf" onChange={handleFileChange} className="hidden" />
          </div>
        </div>
      </div>
    </div>
  );
}
