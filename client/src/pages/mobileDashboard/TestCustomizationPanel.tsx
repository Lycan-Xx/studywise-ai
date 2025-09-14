import React from 'react';
import { Plus, X } from 'lucide-react';
import { TestConfig } from '@/types';

// Types
export type QuestionTypeId = 'mcq' | 'true-false';
export type DifficultyId = 'easy' | 'medium' | 'hard';

export type Props = {
  config: TestConfig;
  setConfig: (updater: Partial<TestConfig> | ((prev: TestConfig) => TestConfig)) => void;
  customTopic: string;
  setCustomTopic: (t: string) => void;
  addTopic: () => void;
  removeTopic: (topic: string) => void;
  topicsArray: string[];
  isGenerating?: boolean;
  onGenerate: () => Promise<void> | void;
  onSave?: () => Promise<void> | void;
  compact?: boolean; // For mobile optimization
};

const questionTypes = [
  { id: 'mcq' as QuestionTypeId, initials: 'MCQ', title: 'Multiple Choice', description: 'Choose from multiple options' },
  { id: 'true-false' as QuestionTypeId, initials: 'T/F', title: 'True or False', description: 'Answer true or false only' }
];

const difficultyLevels = [
  { id: 'easy' as DifficultyId, title: 'Easy', description: 'Basic concepts and recall' },
  { id: 'medium' as DifficultyId, title: 'Medium', description: 'Understanding and application' },
  { id: 'hard' as DifficultyId, title: 'Hard', description: 'Analysis and critical thinking' }
];

const questionCounts = [5, 10, 15, 20, 25, 30];

function ToggleButton({ 
  active, 
  onClick, 
  children, 
  ariaLabel, 
  compact = false 
}: { 
  active?: boolean; 
  onClick: () => void; 
  children: React.ReactNode; 
  ariaLabel?: string;
  compact?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={!!active}
      aria-label={ariaLabel}
      className={`${compact ? 'p-3' : 'p-4'} border-2 rounded-lg text-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 ${
        active
          ? 'border-primary bg-blue-50 text-primary font-medium ring-2 ring-blue-200'
          : 'border-studywise-gray-300 bg-white text-studywise-gray-700 hover:border-studywise-gray-400 hover:bg-gray-50'
      }`}
    >
      {children}
    </button>
  );
}

export default function TestCustomizationPanel(props: Props) {
  const { 
    config, 
    setConfig, 
    customTopic, 
    setCustomTopic, 
    addTopic, 
    removeTopic, 
    topicsArray, 
    isGenerating, 
    onGenerate, 
    onSave, 
    compact = false 
  } = props;

  const onChange = (patch: Partial<TestConfig>) => {
    setConfig(prev => ({ ...prev, ...patch }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTopic();
    }
  };

  return (
    <div className={`space-y-4 sm:space-y-6 ${compact ? 'text-sm py-4' : 'text-base'}`}>
      {/* Header */}
      <div className={`flex items-center gap-2 mb-1 ${compact ? 'px-0' : ''}`}>
        <div className={`font-semibold ${compact ? 'text-base' : 'text-lg'}`}>
          Customize Your Test
        </div>
        <div className={`ml-auto text-gray-500 ${compact ? 'text-xs' : 'text-sm'}`}>
          {config.numberOfQuestions} questions • {config.difficulty}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className={`block font-medium text-studywise-gray-700 mb-2 ${compact ? 'text-xs' : 'text-sm'}`}>
          Test Title
        </label>
        <input
          value={config.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Enter a title for your test"
          className={`w-full rounded-lg border border-studywise-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            compact ? 'text-sm' : ''
          }`}
        />
      </div>

      {/* Topics management */}
      <div>
        <label className={`block font-medium text-studywise-gray-700 mb-2 ${compact ? 'text-xs' : 'text-sm'}`}>
          Focus Topics
        </label>
        <div className={`flex gap-2 mb-3 ${compact ? 'flex-col sm:flex-row' : ''}`}>
          <input
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            placeholder="Add a specific topic..."
            onKeyDown={handleKeyDown}
            className={`flex-1 rounded-lg border border-studywise-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              compact ? 'text-sm mb-2 sm:mb-0' : ''
            }`}
          />
          <button
            onClick={addTopic}
            disabled={!customTopic.trim()}
            className={`px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 ${
              compact ? 'w-full sm:w-auto justify-center' : ''
            }`}
          >
            <Plus className="w-4 h-4" />
            <span className={compact ? 'text-sm' : ''}>Add</span>
          </button>
        </div>

        {topicsArray.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {topicsArray.map((topic) => (
              <div key={topic} className={`flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full ${compact ? 'text-xs' : 'text-sm'}`}>
                <span>{topic}</span>
                <button
                  onClick={() => removeTopic(topic)}
                  className="ml-1 text-blue-600 hover:text-blue-800 transition-colors"
                  aria-label={`Remove ${topic}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Question Format */}
      <div>
        <label className={`block font-medium text-studywise-gray-700 mb-3 ${compact ? 'text-xs' : 'text-sm'}`}>
          Question Format
        </label>
        <div className={`grid gap-3 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
          {questionTypes.map((type) => (
            <ToggleButton 
              key={type.id} 
              active={config.questionType === type.id} 
              onClick={() => onChange({ questionType: type.id })} 
              ariaLabel={`Select ${type.title}`}
              compact={compact}
            >
              <div className={`font-bold mb-1 ${compact ? 'text-lg' : 'text-2xl'}`}>
                {type.initials}
              </div>
              <div className={`font-semibold mb-1 ${compact ? 'text-sm' : 'text-sm'}`}>
                {type.title}
              </div>
              <div className={`text-gray-500 ${compact ? 'text-xs' : 'text-xs'}`}>
                {type.description}
              </div>
            </ToggleButton>
          ))}
        </div>
      </div>

      {/* Difficulty */}
      <div>
        <label className={`block font-medium text-studywise-gray-700 mb-3 ${compact ? 'text-xs' : 'text-sm'}`}>
          Difficulty Level
        </label>
        <div className={`grid gap-3 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-3'}`}>
          {difficultyLevels.map((level) => (
            <ToggleButton 
              key={level.id} 
              active={config.difficulty === level.id} 
              onClick={() => onChange({ difficulty: level.id })} 
              ariaLabel={`Select difficulty ${level.title}`}
              compact={compact}
            >
              <div className={`font-bold mb-1 ${compact ? 'text-base' : 'text-lg'}`}>
                {level.title}
              </div>
              <div className={`text-gray-500 ${compact ? 'text-xs' : 'text-xs'}`}>
                {level.description}
              </div>
            </ToggleButton>
          ))}
        </div>
      </div>

      {/* Question Count */}
      <div>
        <label className={`block font-medium text-studywise-gray-700 mb-3 ${compact ? 'text-xs' : 'text-sm'}`}>
          Number of Questions
        </label>
        <div className={`grid grid-cols-3 gap-3 ${compact ? 'gap-2' : ''}`}>
          {questionCounts.map((count) => (
            <button
              key={count}
              onClick={() => onChange({ numberOfQuestions: count })}
              className={`${compact ? 'p-2' : 'p-3'} border rounded-lg text-center transition-all font-medium ${
                config.numberOfQuestions === count
                  ? 'border-primary bg-blue-50 text-primary'
                  : 'border-studywise-gray-300 hover:border-studywise-gray-400 text-studywise-gray-700'
              } ${compact ? 'text-sm' : ''}`}
            >
              {count}
            </button>
          ))}
        </div>
      </div>

      {/* Footer actions */}
      <div className={`flex ${compact ? 'flex-col pt-4 gap-3' : 'justify-end pt-4 gap-3'} border-t border-studywise-gray-200`}>
        {onSave && (
          <button 
            onClick={onSave} 
            className={`px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors ${
              compact ? 'w-full' : ''
            }`}
          >
            Save
          </button>
        )}
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            isGenerating
              ? 'bg-gray-300 text-gray-700 cursor-not-allowed'
              : 'bg-slate-900 hover:bg-slate-800 text-white'
          } ${compact ? 'w-full' : ''}`}
        >
          {isGenerating ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating...
            </div>
          ) : (
            'Generate Test'
          )}
        </button>
      </div>
    </div>
  );
}
