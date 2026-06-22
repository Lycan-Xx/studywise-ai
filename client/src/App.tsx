import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { Layout } from "@/components/layout/layout";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Library from "@/pages/library";
import Results from "@/pages/results";
import Settings from "@/pages/settings";
import CourseView from "@/pages/course-view";
import ModuleTest from "@/pages/module-test";
import TestSummary from "@/pages/test-summary";
import PrivacyPolicy from "@/pages/privacy-policy";
import TermsOfService from "@/pages/terms-of-service";
import NotFound from "@/pages/not-found";
import AuthRoot from "@/auth/AuthRoot";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";

function Router() {
  return (
    <ErrorBoundary>
      <Switch>
        {/* Landing page */}
        <Route path="/" component={Landing} />
        <Route path="/privacy-policy" component={PrivacyPolicy} />
        <Route path="/terms-of-service" component={TermsOfService} />
        <Route path="/auth" component={AuthRoot} />
        
        {/* Dashboard - New minimalistic upload interface */}
        <Route path="/dashboard">
          <ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>
        </Route>
        
        {/* Course View - Documentation-style layout */}
        <Route path="/courses/:courseId">
          <ProtectedRoute><CourseView /></ProtectedRoute>
        </Route>
        
        {/* Module Test - Test-taking page */}
        <Route path="/courses/:courseId/modules/:moduleId/test">
          <ProtectedRoute><ModuleTest /></ProtectedRoute>
        </Route>
        
        {/* Course Exam - Test-taking page */}
        <Route path="/courses/:courseId/exam">
          <ProtectedRoute><ModuleTest isExam={true} /></ProtectedRoute>
        </Route>
        
        {/* Test Summary - Results with on-demand insights */}
        <Route path="/tests/:testId/summary">
          <ProtectedRoute><Layout><TestSummary /></Layout></ProtectedRoute>
        </Route>
        
        {/* Library - Course cards display */}
        <Route path="/library">
          <ProtectedRoute><Layout><Library /></Layout></ProtectedRoute>
        </Route>
        
        {/* Results - Course hierarchy organization */}
        <Route path="/results">
          <ProtectedRoute><Layout><Results /></Layout></ProtectedRoute>
        </Route>
        
        {/* Settings - Global question preferences */}
        <Route path="/settings">
          <ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>
        </Route>
        
        {/* 404 page */}
        <Route component={NotFound} />
      </Switch>
    </ErrorBoundary>
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
