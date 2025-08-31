import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TestConfig } from "@/types";
import { ChevronDown, X, BookOpen, Plus } from "lucide-react";

interface StepOneProps {
  config: TestConfig;
  updateConfig: (updates: Partial<TestConfig>) => void;
  onNext: () => void;
  onBack: () => void;
}

const subjects = [
  "Mathematics", "Science", "History", "English", "Geography",
  "Physics", "Chemistry", "Biology", "Computer Science", "Economics"
];

export function StepOne({ config, updateConfig, onNext, onBack }: StepOneProps) {
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [customTopic, setCustomTopic] = useState("");

  const handleSubjectSelect = (subject: string) => {
    updateConfig({ subject });
    setShowSubjectDropdown(false);
  };

  const addTopic = () => {
    if (customTopic.trim()) {
      const currentTopics = config.topics ? config.topics.split(',').map(t => t.trim()).filter(t => t) : [];
      if (!currentTopics.includes(customTopic.trim())) {
        const newTopics = [...currentTopics, customTopic.trim()].join(', ');
        updateConfig({ topics: newTopics });
        setCustomTopic("");
      }
    }
  };

  const removeTopic = (topicToRemove: string) => {
    const currentTopics = config.topics ? config.topics.split(',').map(t => t.trim()).filter(t => t) : [];
    const newTopics = currentTopics.filter(topic => topic !== topicToRemove).join(', ');
    updateConfig({ topics: newTopics });
  };

  const canProceed = config.subject && config.topics && config.topics.trim().length > 0;
  const topicsArray = config.topics ? config.topics.split(',').map(t => t.trim()).filter(t => t) : [];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <BookOpen className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-2xl font-bold text-studywise-gray-900 mb-2">
          Customize Your Test
        </h3>
        <p className="text-studywise-gray-600">
          Choose your subject and topics for personalized questions
        </p>
      </div>

      {/* Subject Selection Card */}
      <div className="bg-white border border-studywise-gray-200 rounded-xl p-6 mb-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
         
          <h4 className="text-lg font-semibold text-studywise-gray-900">
            Select Subject
          </h4>
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowSubjectDropdown(!showSubjectDropdown)}
            className={`w-full p-4 border-2 rounded-lg text-left flex items-center justify-between transition-all ${
              config.subject 
                ? "border-primary bg-blue-50 text-primary" 
                : "border-studywise-gray-300 hover:border-studywise-gray-400 text-studywise-gray-500"
            }`}
          >
            <span className="font-medium">
              {config.subject || "Choose your subject area"}
            </span>
            <ChevronDown className={`w-5 h-5 transition-transform ${showSubjectDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showSubjectDropdown && (
            <div className="absolute z-20 w-full mt-2 bg-white border border-studywise-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {subjects.map((subject) => (
                <button
                  key={subject}
                  onClick={() => handleSubjectSelect(subject)}
                  className="w-full px-4 py-3 text-left hover:bg-blue-50 focus:outline-none focus:bg-blue-50 transition-colors first:rounded-t-lg last:rounded-b-lg"
                >
                  {subject}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Topics Selection Card */}
      <div className="bg-white border border-studywise-gray-200 rounded-xl p-6 mb-8 shadow-sm">
        <div className="flex items-center gap-3 mb-4">

          <h4 className="text-lg font-semibold text-studywise-gray-900">
            Add Topics
          </h4>
        </div>
        
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Input
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="Type a specific topic..."
                onKeyDown={(e) => e.key === 'Enter' && addTopic()}
                className="pr-10 py-3 border-2 border-studywise-gray-300 focus:border-primary rounded-lg"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-studywise-gray-400">
                <Plus className="w-4 h-4" />
              </div>
            </div>
            <Button 
              onClick={addTopic} 
              className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-medium sm:w-auto w-full"
              disabled={!customTopic.trim()}
            >
              Add Topic
            </Button>
          </div>

          {topicsArray.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-studywise-gray-700">
                Selected Topics ({topicsArray.length})
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {topicsArray.map((topic, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg px-3 py-2"
                  >
                    <span className="text-sm font-medium text-studywise-gray-800 truncate">
                      {topic}
                    </span>
                    <button
                      onClick={() => removeTopic(topic)}
                      className="ml-2 p-1 text-studywise-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors flex-shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {topicsArray.length === 0 && (
            <div className="text-center py-8 text-studywise-gray-500">
              <div className="w-12 h-12 mx-auto mb-3 bg-studywise-gray-100 rounded-full flex items-center justify-center">
                <Plus className="w-6 h-6" />
              </div>
              <p className="text-sm">
                No topics added yet. Add specific topics you'd like to focus on.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <Button
          onClick={onBack}
          variant="outline"
          size="lg"
          className="border-2 px-6 py-3 border-black text-slate-700 hover:border-slate-300 hover:bg-slate-50 order-2 sm:order-1"
        >
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!canProceed}
          size="lg"
          className={`px-8 py-3 transition-colors order-1 sm:order-2 ${!canProceed
              ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed text-gray-200'
              : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}