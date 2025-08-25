import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TestConfig } from "@/types";
import { ChevronDown, X } from "lucide-react";

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
    <div>
      <div className="mb-6">
        <label className="block text-sm font-medium text-studywise-gray-700 mb-2">
          Subject
        </label>
        <div className="relative">
          <button
            onClick={() => setShowSubjectDropdown(!showSubjectDropdown)}
            className="w-full p-3 border border-studywise-gray-300 rounded-md text-left flex items-center justify-between hover:border-studywise-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <span className={config.subject ? "text-studywise-gray-900" : "text-studywise-gray-500"}>
              {config.subject || "Select a subject"}
            </span>
            <ChevronDown className="w-4 h-4 text-studywise-gray-400" />
          </button>

          {showSubjectDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-studywise-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {subjects.map((subject) => (
                <button
                  key={subject}
                  onClick={() => handleSubjectSelect(subject)}
                  className="w-full px-3 py-2 text-left hover:bg-studywise-gray-50 focus:outline-none focus:bg-studywise-gray-50"
                >
                  {subject}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mb-8">
        <label className="block text-sm font-medium text-studywise-gray-700 mb-2">
          Topics
        </label>
        <div className="flex gap-2 mb-3">
          <Input
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            placeholder="Enter a topic"
            onKeyDown={(e) => e.key === 'Enter' && addTopic()}
            className="flex-1"
          />
          <Button onClick={addTopic} variant="outline">
            Add
          </Button>
        </div>

        {topicsArray.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {topicsArray.map((topic, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-studywise-gray-100 text-studywise-gray-700 rounded-full text-sm"
              >
                {topic}
                <button
                  onClick={() => removeTopic(topic)}
                  className="text-studywise-gray-500 hover:text-studywise-gray-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <Button onClick={onBack} variant="outline">
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!canProceed}
          className="bg-primary hover:bg-blue-600"
        >
          Next
        </Button>
      </div>
    </div>
  );
}