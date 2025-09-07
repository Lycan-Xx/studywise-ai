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
import PrivacyPolicy from "@/pages/privacy-policy";
import TermsOfService from "@/pages/terms-of-service";
import NotFound from "@/pages/not-found";;
import AuthRoot from "@/auth/AuthRoot";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useEffect } from "react";
import { useLocation } from "wouter";

function RedirectToDashboard() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation('/dashboard');
  }, [setLocation]);
  return null;
}

function Router() {
  return (
    <Switch>
      {/* Temporarily redirect root to dashboard */}
      <Route path="/" component={RedirectToDashboard} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/auth" component={AuthRoot} />
      <Route path="/dashboard">
        <Layout><Dashboard /></Layout>
      </Route>
      <Route path="/library">
        <ProtectedRoute><Layout><Library /></Layout></ProtectedRoute>
      </Route>
      <Route path="/results">
        <ProtectedRoute><Layout><Results /></Layout></ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>
      </Route>
      {/* Fallback: redirect any unknown route to dashboard */}
      <Route>
        <RedirectToDashboard />
      </Route>
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
