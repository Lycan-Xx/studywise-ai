import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Settings() {
  const [userSettings, setUserSettings] = useState({
    fullName: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    defaultQuizLength: "15",
    autoSaveToLibrary: true,
    questionDifficulty: "medium",
    studyReminders: true,
    emailNotifications: false,
  });

  const handleSaveChanges = () => {
    // TODO: Save settings to backend
    console.log("Saving settings:", userSettings);
  };

  const handleUpgradeToPro = () => {
    // TODO: Navigate to upgrade flow
    console.log("Upgrading to Pro");
  };

  const handleChangeAvatar = () => {
    // TODO: Open avatar upload dialog
    console.log("Changing avatar");
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-studywise-gray-900 mb-2" data-testid="text-settings-title">
          Settings
        </h1>
        <p className="text-studywise-gray-600" data-testid="text-settings-subtitle">
          Manage your account preferences and application settings
        </p>
      </div>
      
      {/* Account Settings */}
      <Card className="shadow-sm border-studywise-gray-200 mb-6" data-testid="card-account-settings">
        <div className="px-6 py-4 border-b border-studywise-gray-200">
          <h2 className="text-lg font-semibold text-studywise-gray-900">Account Settings</h2>
        </div>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center space-x-4">
            <img 
              src="https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80&q=80" 
              alt="Profile Picture" 
              className="w-20 h-20 rounded-full"
              data-testid="img-profile-picture"
            />
            <div>
              <h3 className="text-lg font-medium text-studywise-gray-900" data-testid="text-user-name">
                {userSettings.fullName}
              </h3>
              <p className="text-studywise-gray-500" data-testid="text-user-email">
                {userSettings.email}
              </p>
              <button 
                onClick={handleChangeAvatar}
                className="text-primary hover:text-blue-600 text-sm font-medium mt-1"
                data-testid="button-change-avatar"
              >
                Change Avatar
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="fullName" className="block text-sm font-medium text-studywise-gray-700 mb-2">
                Full Name
              </Label>
              <Input
                id="fullName"
                type="text"
                value={userSettings.fullName}
                onChange={(e) => setUserSettings({ ...userSettings, fullName: e.target.value })}
                className="w-full"
                data-testid="input-full-name"
              />
            </div>
            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-studywise-gray-700 mb-2">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={userSettings.email}
                onChange={(e) => setUserSettings({ ...userSettings, email: e.target.value })}
                className="w-full"
                data-testid="input-email"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Quiz Preferences */}
      <Card className="shadow-sm border-studywise-gray-200 mb-6" data-testid="card-quiz-preferences">
        <div className="px-6 py-4 border-b border-studywise-gray-200">
          <h2 className="text-lg font-semibold text-studywise-gray-900">Quiz Preferences</h2>
        </div>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-studywise-gray-900">Default Quiz Length</h4>
              <p className="text-sm text-studywise-gray-500">Set your preferred number of questions for new quizzes</p>
            </div>
            <Select
              value={userSettings.defaultQuizLength}
              onValueChange={(value) => setUserSettings({ ...userSettings, defaultQuizLength: value })}
            >
              <SelectTrigger className="w-[180px]" data-testid="select-quiz-length">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 questions</SelectItem>
                <SelectItem value="15">15 questions</SelectItem>
                <SelectItem value="20">20 questions</SelectItem>
                <SelectItem value="25">25 questions</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-studywise-gray-900">Auto-save to Library</h4>
              <p className="text-sm text-studywise-gray-500">Automatically save generated quizzes to your library</p>
            </div>
            <Switch
              checked={userSettings.autoSaveToLibrary}
              onCheckedChange={(checked) => setUserSettings({ ...userSettings, autoSaveToLibrary: checked })}
              data-testid="switch-auto-save"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-studywise-gray-900">Question Difficulty</h4>
              <p className="text-sm text-studywise-gray-500">Default difficulty level for generated questions</p>
            </div>
            <Select
              value={userSettings.questionDifficulty}
              onValueChange={(value) => setUserSettings({ ...userSettings, questionDifficulty: value })}
            >
              <SelectTrigger className="w-[180px]" data-testid="select-difficulty">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
                <SelectItem value="mixed">Mixed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {/* Notifications */}
      <Card className="shadow-sm border-studywise-gray-200 mb-6" data-testid="card-notifications">
        <div className="px-6 py-4 border-b border-studywise-gray-200">
          <h2 className="text-lg font-semibold text-studywise-gray-900">Notifications</h2>
        </div>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-studywise-gray-900">Study Reminders</h4>
              <p className="text-sm text-studywise-gray-500">Get reminded to review your quizzes</p>
            </div>
            <Switch
              checked={userSettings.studyReminders}
              onCheckedChange={(checked) => setUserSettings({ ...userSettings, studyReminders: checked })}
              data-testid="switch-study-reminders"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-studywise-gray-900">Email Notifications</h4>
              <p className="text-sm text-studywise-gray-500">Receive updates about new features and tips</p>
            </div>
            <Switch
              checked={userSettings.emailNotifications}
              onCheckedChange={(checked) => setUserSettings({ ...userSettings, emailNotifications: checked })}
              data-testid="switch-email-notifications"
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Subscription */}
      <Card className="shadow-sm border-studywise-gray-200 mb-6" data-testid="card-subscription">
        <div className="px-6 py-4 border-b border-studywise-gray-200">
          <h2 className="text-lg font-semibold text-studywise-gray-900">Subscription</h2>
        </div>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-studywise-gray-900">Current Plan</h4>
              <p className="text-sm text-studywise-gray-500">Free Plan - Limited to 3 saved quizzes</p>
            </div>
            <Button 
              onClick={handleUpgradeToPro}
              className="bg-primary hover:bg-blue-600 px-4 py-2 font-medium"
              data-testid="button-upgrade-pro"
            >
              Upgrade to Pro
            </Button>
          </div>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h5 className="font-medium text-blue-900 mb-2">Upgrade to Pro</h5>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Unlimited saved quizzes</li>
              <li>• PDF and Word document support</li>
              <li>• Advanced difficulty settings</li>
              <li>• Export and share features</li>
            </ul>
          </div>
        </CardContent>
      </Card>
      
      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSaveChanges}
          className="bg-primary hover:bg-blue-600 px-6 py-2 font-medium"
          data-testid="button-save-changes"
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
}
