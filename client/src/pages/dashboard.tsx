import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList, TrendingUp, Clock, Plus, Sparkles } from "lucide-react";

export default function Dashboard() {
  const [notes, setNotes] = useState("");

  const handleGenerateQuiz = () => {
    if (!notes.trim()) {
      // TODO: Show validation error
      return;
    }
    // TODO: Navigate to quiz creation wizard
    console.log("Generating quiz with notes:", notes);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-studywise-gray-900 mb-2" data-testid="text-dashboard-title">
          Welcome to StudyWise AI
        </h1>
        <p className="text-studywise-gray-600" data-testid="text-dashboard-subtitle">
          Transform your study notes into intelligent quizzes and track your learning progress.
        </p>
      </div>
      
      {/* Note Upload Area */}
      <Card className="shadow-sm border-studywise-gray-200 p-8 mb-8" data-testid="card-note-upload">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
          {/* Text Input Area */}
          <div className="flex-1 w-full">
            <label htmlFor="notes-input" className="block text-sm font-medium text-studywise-gray-700 mb-3">
              Upload or paste your study notes
            </label>
            <div className="relative">
              <Textarea 
                id="notes-input"
                placeholder="paste your notes here or click the '+' icon to upload" 
                className="w-full h-48 resize-none focus:ring-2 focus:ring-primary focus:border-transparent text-studywise-gray-700"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                data-testid="textarea-notes-input"
              />
              <button 
                className="absolute bottom-4 left-4 w-8 h-8 bg-studywise-gray-100 hover:bg-studywise-gray-200 rounded-full flex items-center justify-center transition-colors"
                data-testid="button-upload-file"
              >
                <Plus className="text-studywise-gray-600 text-sm" />
              </button>
            </div>
            <p className="mt-2 text-sm text-studywise-gray-500">
              Supports text, markdown, PDF, and Word documents
            </p>
          </div>
          
          {/* Generate Button */}
          <div className="lg:pl-6">
            <Button 
              onClick={handleGenerateQuiz}
              className="bg-primary hover:bg-blue-600 px-8 py-3 font-medium flex items-center gap-2 shadow-sm"
              data-testid="button-generate-quiz"
            >
              <Sparkles className="w-4 h-4" />
              Generate Quiz
            </Button>
          </div>
        </div>
      </Card>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" data-testid="grid-stats">
        <Card className="shadow-sm border-studywise-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <ClipboardList className="text-primary text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-studywise-gray-900" data-testid="text-total-quizzes">12</p>
                <p className="text-studywise-gray-600">Total Quizzes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-studywise-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="text-green-600 text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-studywise-gray-900" data-testid="text-average-score">78%</p>
                <p className="text-studywise-gray-600">Average Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-studywise-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Clock className="text-purple-600 text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-studywise-gray-900" data-testid="text-study-time">5.2h</p>
                <p className="text-studywise-gray-600">Study Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
