import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { Layout } from "@/components/layout/layout";
import Landing from "@/pages/landing";
import DashboardNew from "@/pages/dashboard-new";
import LibraryNew from "@/pages/library-new";
import ResultsNew from "@/pages/results-new";
import SettingsNew from "@/pages/settings-new";
import CourseView from "@/pages/course-view";
import TestSummary from "@/pages/test-summary";
import PrivacyPolicy from "@/pages/privacy-policy";
import TermsOfService from "@/pages/terms-of-service";
import NotFound from "@/pages/not-found";
import AuthRoot from "@/auth/AuthRoot";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

function Router() {
  return (
    <Switch>
      {/* Landing page */}
      <Route path="/" component={Landing} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/auth" component={AuthRoot} />
      
      {/* Dashboard - New minimalistic upload interface */}
      <Route path="/dashboard">
        <ProtectedRoute><Layout><DashboardNew /></Layout></ProtectedRoute>
      </Route>
      
      {/* Course View - Documentation-style layout */}
      <Route path="/courses/:courseId">
        <ProtectedRoute><CourseView /></ProtectedRoute>
      </Route>
      
      {/* Test Summary - Results with on-demand insights */}
      <Route path="/tests/:testId/summary">
        <ProtectedRoute><Layout><TestSummary /></Layout></ProtectedRoute>
      </Route>
      
      {/* Library - Course cards display */}
      <Route path="/library">
        <ProtectedRoute><Layout><LibraryNew /></Layout></ProtectedRoute>
      </Route>
      
      {/* Results - Course hierarchy organization */}
      <Route path="/results">
        <ProtectedRoute><Layout><ResultsNew /></Layout></ProtectedRoute>
      </Route>
      
      {/* Settings - Global question preferences */}
      <Route path="/settings">
        <ProtectedRoute><Layout><SettingsNew /></Layout></ProtectedRoute>
      </Route>
      
      {/* 404 page */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
