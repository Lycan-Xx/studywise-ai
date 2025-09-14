import { Button } from "@/components/ui/button";
import { Brain, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-studywise-bg">
      {/* Simple Header */}
      <header className="bg-white border-b border-studywise-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Back Button - Left */}
            <Link href="/">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            </Link>
            
            {/* Logo - Center */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <Link href="/" className="flex items-center">
                <Brain className="w-6 h-6 text-primary mr-2" />
                <span className="text-lg font-semibold text-studywise-gray-900">StudyWise AI</span>
              </Link>
            </div>
            
            {/* Spacer for balance */}
            <div className="w-[80px] sm:w-[100px]"></div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="bg-white rounded-lg shadow-sm border border-studywise-gray-200 p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-studywise-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-studywise-gray-600 mb-8 text-sm sm:text-base">Updated January 2025</p>

          <div className="space-y-8 font-mono text-sm sm:text-base leading-relaxed">
            {/* What We Collect */}
            <section>
              <h2 className="text-lg sm:text-xl font-semibold text-studywise-gray-900 mb-3 font-sans">
                What We Collect
              </h2>
              <div className="text-studywise-gray-700 space-y-2">
                <p>• Your email, name and profile picture</p>
                <p>• Notes and files you upload</p>
                <p>• Your test results and progress</p>
                <p>• Basic device info (browser, IP address)</p>
              </div>
            </section>

            {/* How We Use It */}
            <section>
              <h2 className="text-lg sm:text-xl font-semibold text-studywise-gray-900 mb-3 font-sans">
                How We Use It
              </h2>
              <div className="text-studywise-gray-700 space-y-2">
                <p>• Generate practice tests from your notes</p>
                <p>• Track your learning progress</p>
                <p>• Send important account updates</p>
                <p>• Improve our AI and services</p>
              </div>
            </section>

            {/* We Don't Share */}
            <section>
              <h2 className="text-lg sm:text-xl font-semibold text-studywise-gray-900 mb-3 font-sans">
                We Don't Share Your Data
              </h2>
              <div className="text-studywise-gray-700 space-y-2">
                <p>• We never sell your information</p>
                <p>• Your notes stay completely private</p>
                <p>• Only shared if legally required</p>
              </div>
            </section>

            {/* Security */}
            <section>
              <h2 className="text-lg sm:text-xl font-semibold text-studywise-gray-900 mb-3 font-sans">
                Security
              </h2>
              <div className="text-studywise-gray-700 space-y-2">
                <p>• All data encrypted in transit and storage</p>
                <p>• Regular security updates</p>
                <p>• Limited team access</p>
              </div>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-lg sm:text-xl font-semibold text-studywise-gray-900 mb-3 font-sans">
                Your Rights
              </h2>
              <div className="text-studywise-gray-700 space-y-2">
                <p>• View, update, or delete your data anytime</p>
                <p>• Export your information</p>
                <p>• Delete your account (data removed in 30 days)</p>
                <p>• Email us: mossaic_mw@yahoo.com</p>
              </div>
            </section>

            {/* Simple Contact */}
            <section className="pt-4 border-t border-studywise-gray-200">
              <h2 className="text-lg sm:text-xl font-semibold text-studywise-gray-900 mb-3 font-sans">
                Questions?
              </h2>
              <div className="bg-studywise-gray-50 rounded-lg p-4">
                <p className="text-studywise-gray-700">
                  Email: mossaic_mw@yahoo.com
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}