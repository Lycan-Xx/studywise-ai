import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "./ui/button";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-studywise-gray-50 p-4">
          <div className="bg-white rounded-lg shadow-sm border border-red-100 p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-studywise-gray-900 mb-2">Something went wrong</h2>
            <p className="text-sm text-studywise-gray-600 mb-6 line-clamp-3">
              {this.state.error?.message || "An unexpected error occurred in the application."}
            </p>
            <div className="flex gap-3 justify-center">
              <Button 
                onClick={() => window.location.href = '/'} 
                variant="outline"
              >
                Go Home
              </Button>
              <Button 
                onClick={() => window.location.reload()}
                className="gap-2"
              >
                <RefreshCcw className="w-4 h-4" />
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
