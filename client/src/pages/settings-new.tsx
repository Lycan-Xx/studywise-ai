import { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Settings as SettingsIcon, Save } from 'lucide-react';

interface UserProfile {
  default_question_type: 'mcq' | 'true_false' | 'mixed';
  default_difficulty: 'easy' | 'medium' | 'hard';
  default_questions_per_module: number;
}

export default function Settings() {
  const [profile, setProfile] = useState<UserProfile>({
    default_question_type: 'mixed',
    default_difficulty: 'medium',
    default_questions_per_module: 10,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      const data = await response.json();
      setProfile(data);
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    
    try {
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
    
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-studywise-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <SettingsIcon className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-studywise-gray-900">
            Settings
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-8">
          {/* Question Generation Section */}
          <section>
            <h2 className="text-xl font-semibold text-studywise-gray-900 mb-4">
              Question Generation
            </h2>
            <p className="text-sm text-studywise-gray-600 mb-6">
              These settings apply to all future tests. Changes won't affect existing tests.
            </p>

            <div className="space-y-6">
              {/* Question Type */}
              <div>
                <label className="block text-sm font-medium text-studywise-gray-900 mb-3">
                  Question Type
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'mcq', label: 'Multiple Choice', desc: 'Questions with 4 options' },
                    { value: 'true_false', label: 'True/False', desc: 'Simple true or false questions' },
                    { value: 'mixed', label: 'Mixed', desc: 'Combination of both types' },
                  ].map(option => (
                    <label
                      key={option.value}
                      className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        profile.default_question_type === option.value
                          ? 'border-primary bg-primary/5'
                          : 'border-studywise-gray-200 hover:border-studywise-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="questionType"
                        value={option.value}
                        checked={profile.default_question_type === option.value}
                        onChange={(e) => setProfile({ ...profile, default_question_type: e.target.value as any })}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium text-studywise-gray-900">{option.label}</div>
                        <div className="text-sm text-studywise-gray-600">{option.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Difficulty Level */}
              <div>
                <label className="block text-sm font-medium text-studywise-gray-900 mb-3">
                  Difficulty Level
                </label>
                <select
                  value={profile.default_difficulty}
                  onChange={(e) => setProfile({ ...profile, default_difficulty: e.target.value as any })}
                  className="w-full px-4 py-3 border border-studywise-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="easy">Easy - Basic concepts and definitions</option>
                  <option value="medium">Medium - Moderate understanding required</option>
                  <option value="hard">Hard - Advanced analysis and application</option>
                </select>
              </div>

              {/* Questions Per Module */}
              <div>
                <label className="block text-sm font-medium text-studywise-gray-900 mb-3">
                  Questions Per Module
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={5}
                    max={50}
                    step={5}
                    value={profile.default_questions_per_module}
                    onChange={(e) => setProfile({ ...profile, default_questions_per_module: parseInt(e.target.value) })}
                    className="flex-1"
                  />
                  <div className="w-16 text-center">
                    <span className="text-2xl font-bold text-primary">
                      {profile.default_questions_per_module}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-studywise-gray-600 mt-2">
                  Recommended: 10-15 questions for optimal learning
                </p>
              </div>
            </div>
          </section>

          {/* Save Button */}
          <div className="flex items-center gap-3 pt-6 border-t">
            <Button
              onClick={handleSave}
              disabled={saving}
              size="lg"
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
            {saved && (
              <span className="text-green-600 text-sm font-medium">
                ✓ Settings saved successfully
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
