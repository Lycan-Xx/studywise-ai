import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout/layout";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Library from "@/pages/library";
import Results from "@/pages/results";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/dashboard">
        <Layout><Dashboard /></Layout>
      </Route>
      <Route path="/library">
        <Layout><Library /></Layout>
      </Route>
      <Route path="/results">
        <Layout><Results /></Layout>
      </Route>
      <Route path="/settings">
        <Layout><Settings /></Layout>
      </Route>
      <Route>
        <Layout><NotFound /></Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
