import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Settings() {
  const [profileInfo, setProfileInfo] = useState({
    username: "sarah_johnson",
    email: "sarah.johnson@example.com",
    fullName: "Sarah Johnson",
  });

  const [accountSettings, setAccountSettings] = useState({
    emailNotifications: true,
  });

  const [studyPreferences, setStudyPreferences] = useState({
    defaultSubject: "mathematics",
    questionTypePreference: "multiple-choice",
    difficultyLevel: "medium",
    questionsPerSession: "15",
  });

  const [privacySettings, setPrivacySettings] = useState({
    dataCollection: true,
    analyticsTracking: false,
  });

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [feedback, setFeedback] = useState("");

  const handleSaveProfile = () => {
    console.log("Saving profile:", profileInfo);
  };

  const handleSaveAccount = () => {
    console.log("Saving account settings:", accountSettings);
  };

  const handleSaveStudyPreferences = () => {
    console.log("Saving study preferences:", studyPreferences);
  };

  const handleSavePrivacy = () => {
    console.log("Saving privacy settings:", privacySettings);
  };

  const handleChangePassword = () => {
    setShowPasswordDialog(true);
  };

  const handleSubmitFeedback = () => {
    console.log("Submitting feedback:", feedback);
    setFeedback("");
  };

  const handleDeleteAccount = () => {
    console.log("Account deletion initiated");
    setShowDeleteDialog(false);
  };

  const handleChangeAvatar = () => {
    console.log("Changing avatar");
  };

  const handleHelpCenter = () => {
    console.log("Opening help center");
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-studywise-gray-900 mb-2">
          Settings
        </h1>
        <p className="text-studywise-gray-600">
          Manage your account preferences and application settings
        </p>
      </div>

      {/* Profile Information */}
      <Card className="shadow-sm border-studywise-gray-200 mb-6">
        <div className="px-6 py-4 border-b border-studywise-gray-200">
          <h2 className="text-lg font-semibold text-studywise-gray-900">Profile Information</h2>
        </div>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center space-x-4">
            <img 
              src="https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80&q=80" 
              alt="Profile Picture" 
              className="w-20 h-20 rounded-full border-2 border-studywise-gray-200"
            />
            <div>
              <h3 className="text-lg font-medium text-studywise-gray-900">
                {profileInfo.fullName}
              </h3>
              <p className="text-studywise-gray-500">@{profileInfo.username}</p>
              {/* <button 
                onClick={handleChangeAvatar}
                className="text-primary hover:text-blue-600 text-sm font-medium mt-1 transition-colors"
              >
                Change Picture
              </button> */}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="username" className="text-sm font-medium text-studywise-gray-700">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={profileInfo.username}
                onChange={(e) => setProfileInfo({ ...profileInfo, username: e.target.value })}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-studywise-gray-700">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={profileInfo.email}
                onChange={(e) => setProfileInfo({ ...profileInfo, email: e.target.value })}
                className="mt-2"
              />
            </div>
          </div>
          
          {/* <div className="flex justify-end">
            <Button 
              onClick={handleSaveProfile}
              size="sm"
              className="bg-primary hover:bg-blue-600"
            >
              Save Profile
            </Button>
          </div> */}
        </CardContent>
      </Card>

      {/* Account Settings */}
      <Card className="shadow-sm border-studywise-gray-200 mb-6">
        <div className="px-6 py-4 border-b border-studywise-gray-200">
          <h2 className="text-lg font-semibold text-studywise-gray-900">Account Settings</h2>
        </div>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-studywise-gray-900">Change Password</h4>
              <p className="text-sm text-studywise-gray-500">Update your account password</p>
            </div>
            <Button 
              onClick={handleChangePassword}
              variant="outline"
              size="sm"
            >
              Change Password
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-studywise-gray-900">Email Notifications</h4>
              <p className="text-sm text-studywise-gray-500">Receive updates about new features and tips</p>
            </div>
            <Switch
              checked={accountSettings.emailNotifications}
              onCheckedChange={(checked) => setAccountSettings({ ...accountSettings, emailNotifications: checked })}
            />
          </div>

          {/* <div className="flex justify-end">
            <Button 
              onClick={handleSaveAccount}
              size="sm"
              className="bg-primary hover:bg-blue-600"
            >
              Save Settings
            </Button>
          </div> */}
        </CardContent>
      </Card>

      {/* Study Preferences */}
      {/* <Card className="shadow-sm border-studywise-gray-200 mb-6">
        <div className="px-6 py-4 border-b border-studywise-gray-200">
          <h2 className="text-lg font-semibold text-studywise-gray-900">Study Preferences</h2>
        </div>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-studywise-gray-900">Default Subject</h4>
              <p className="text-sm text-studywise-gray-500">Your preferred subject for quiz generation</p>
            </div>
            <Select
              value={studyPreferences.defaultSubject}
              onValueChange={(value) => setStudyPreferences({ ...studyPreferences, defaultSubject: value })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mathematics">Mathematics</SelectItem>
                <SelectItem value="science">Science</SelectItem>
                <SelectItem value="history">History</SelectItem>
                <SelectItem value="literature">Literature</SelectItem>
                <SelectItem value="languages">Languages</SelectItem>
                <SelectItem value="general">General Knowledge</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-studywise-gray-900">Question Type Preferences</h4>
              <p className="text-sm text-studywise-gray-500">Preferred format for generated questions</p>
            </div>
            <Select
              value={studyPreferences.questionTypePreference}
              onValueChange={(value) => setStudyPreferences({ ...studyPreferences, questionTypePreference: value })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                <SelectItem value="true-false">True/False</SelectItem>
                <SelectItem value="short-answer">Short Answer</SelectItem>
                <SelectItem value="mixed">Mixed Types</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-studywise-gray-900">Default Difficulty</h4>
              <p className="text-sm text-studywise-gray-500">Preferred difficulty level for questions</p>
            </div>
            <Select
              value={studyPreferences.difficultyLevel}
              onValueChange={(value) => setStudyPreferences({ ...studyPreferences, difficultyLevel: value })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
                <SelectItem value="adaptive">Adaptive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={handleSaveStudyPreferences}
              size="sm"
              className="bg-primary hover:bg-blue-600"
            >
              Save Preferences
            </Button>
          </div>
        </CardContent>
      </Card> */}

      {/* Privacy Settings */}
      <Card className="shadow-sm border-studywise-gray-200 mb-6">
        <div className="px-6 py-4 border-b border-studywise-gray-200">
          <h2 className="text-lg font-semibold text-studywise-gray-900">Privacy Settings</h2>
        </div>
        <CardContent className="p-6 space-y-6">
          {/* <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-studywise-gray-900">Data Collection</h4>
              <p className="text-sm text-studywise-gray-500">Allow anonymous usage data collection for service improvement</p>
            </div>
            <Switch
              checked={privacySettings.dataCollection}
              onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, dataCollection: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-studywise-gray-900">Analytics Tracking</h4>
              <p className="text-sm text-studywise-gray-500">Enable analytics to help us understand how you use the app</p>
            </div>
            <Switch
              checked={privacySettings.analyticsTracking}
              onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, analyticsTracking: checked })}
            />
          </div> */}

          <div className="border-studywise-gray-200 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-red-600">Delete Account</h4>
                <p className="text-sm text-studywise-gray-500">Permanently delete your account and all associated data</p>
              </div>
              <Button 
                onClick={() => setShowDeleteDialog(true)}
                variant="outline"
                size="sm"
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                Delete Account
              </Button>
            </div>
          </div>

          {/* <div className="flex justify-end">
            <Button 
              onClick={handleSavePrivacy}
              size="sm"
              className="bg-primary hover:bg-blue-600"
            >
              Save Privacy Settings
            </Button>
          </div> */}
        </CardContent>
      </Card>

      {/* Support & Feedback */}
      <Card className="shadow-sm border-studywise-gray-200 mb-6">
        <div className="px-6 py-4 border-b border-studywise-gray-200">
          <h2 className="text-lg font-semibold text-studywise-gray-900">Support & Feedback</h2>
        </div>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between">


            {/* <div>
              <h4 className="text-sm font-medium text-studywise-gray-900">Help Center</h4>
              <p className="text-sm text-studywise-gray-500">Access guides, tutorials, and frequently asked questions</p>
            </div> */}


            {/* <Button 
              onClick={handleHelpCenter}
              variant="outline"
              size="sm"
            >
              Visit Help Center
            </Button> */}
          </div>

          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-studywise-gray-900">Feedback Submission</h4>
              <p className="text-sm text-studywise-gray-500 mb-3">Share your thoughts to help us improve StudyWise AI</p>
            </div>
            <Textarea
              placeholder="Tell us what you think about StudyWise AI or suggest improvements..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-[100px] resize-none"
            />
            <div className="flex justify-end">
              <Button 
                onClick={handleSubmitFeedback}
                disabled={!feedback.trim()}
                size="sm"
                className="bg-primary hover:bg-blue-600"
              >
                Submit Feedback
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Dialog */}
      <AlertDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Password</AlertDialogTitle>
            <AlertDialogDescription>
              Enter your current password and choose a new one.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="currentPassword" className="text-sm font-medium text-studywise-gray-700">
                Current Password
              </Label>
              <Input
                id="currentPassword"
                type="password"
                className="mt-2"
                placeholder="Enter current password"
              />
            </div>
            <div>
              <Label htmlFor="newPassword" className="text-sm font-medium text-studywise-gray-700">
                New Password
              </Label>
              <Input
                id="newPassword"
                type="password"
                className="mt-2"
                placeholder="Enter new password"
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-studywise-gray-700">
                Confirm New Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                className="mt-2"
                placeholder="Confirm new password"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-primary hover:bg-blue-600">
              Change Password
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAccount}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}