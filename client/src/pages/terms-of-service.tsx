import { Button } from "@/components/ui/button";
import { Brain, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function TermsOfService() {
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
          <h1 className="text-2xl sm:text-3xl font-bold text-studywise-gray-900 mb-2">Terms of Service</h1>
          <p className="text-studywise-gray-600 mb-8 text-sm sm:text-base">Updated January 2025</p>

          <div className="space-y-8 font-mono text-sm sm:text-base leading-relaxed">
            {/* The Basics */}
            <section>
              <h2 className="text-lg sm:text-xl font-semibold text-studywise-gray-900 mb-3 font-sans">
                The Basics
              </h2>
              <div className="text-studywise-gray-700 space-y-2">
                <p>• By using StudyWise AI, you agree to these terms</p>
                <p>• We create practice tests from your notes using AI</p>
                <p>• Keep your account secure and accurate</p>
              </div>
            </section>

            {/* What You Can Do */}
            <section>
              <h2 className="text-lg sm:text-xl font-semibold text-studywise-gray-900 mb-3 font-sans">
                What You Can Do
              </h2>
              <div className="text-studywise-gray-700 space-y-2">
                <p>• Upload your personal study materials</p>
                <p>• Generate tests and track your progress</p>
                <p>• Use the service for personal learning</p>
              </div>
            </section>

            {/* What You Can't Do */}
            <section>
              <h2 className="text-lg sm:text-xl font-semibold text-studywise-gray-900 mb-3 font-sans">
                What You Can't Do
              </h2>
              <div className="text-studywise-gray-700 space-y-2">
                <p>• Upload copyrighted content you don't own</p>
                <p>• Share your account with others</p>
                <p>• Use automated tools to access our service</p>
                <p>• Try to hack or break our systems</p>
              </div>
            </section>

            {/* Your Content */}
            <section>
              <h2 className="text-lg sm:text-xl font-semibold text-studywise-gray-900 mb-3 font-sans">
                Your Content
              </h2>
              <div className="text-studywise-gray-700 space-y-2">
                <p>• You own your notes and files</p>
                <p>• We only use them to create your tests</p>
                <p>• Delete your account anytime to remove everything</p>
              </div>
            </section>

            {/* AI Disclaimer */}
            <section>
              <h2 className="text-lg sm:text-xl font-semibold text-studywise-gray-900 mb-3 font-sans">
                About Our AI
              </h2>
              <div className="text-studywise-gray-700 space-y-2">
                <p>• AI-generated questions may have errors</p>
                <p>• Always double-check important information</p>
                <p>• We're a study tool, not your only source of truth</p>
                <p>• Your academic success is ultimately up to you</p>
              </div>
            </section>

            {/* Payment */}
            <section>
              <h2 className="text-lg sm:text-xl font-semibold text-studywise-gray-900 mb-3 font-sans">
                Payment
              </h2>
              <div className="text-studywise-gray-700 space-y-2">
                <p>• Free trial available, no credit card needed</p>
                {/* <p>• Premium subscription auto-renews monthly</p>
                <p>• Cancel anytime before next billing cycle</p>
                <p>• No refunds for partial months</p> */}
              </div>
            </section>

            {/* Liability */}
            <section>
              <h2 className="text-lg sm:text-xl font-semibold text-studywise-gray-900 mb-3 font-sans">
                Liability
              </h2>
              <div className="text-studywise-gray-700 space-y-2">
                <p>• We're not responsible for your grades</p>
                <p>• Use the service at your own risk</p>
                <p>• We'll fix bugs but can't guarantee perfection</p>
              </div>
            </section>

            {/* Ending Things */}
            <section>
              <h2 className="text-lg sm:text-xl font-semibold text-studywise-gray-900 mb-3 font-sans">
                Ending Things
              </h2>
              <div className="text-studywise-gray-700 space-y-2">
                <p>• Either of us can end this agreement anytime</p>
                <p>• Your data gets deleted after 30 days of initial request</p>
                <p>• Outstanding payments still need to be paid if their is any</p>
              </div>
            </section>

            {/* Changes */}
            <section>
              <h2 className="text-lg sm:text-xl font-semibold text-studywise-gray-900 mb-3 font-sans">
                Changes
              </h2>
              <div className="text-studywise-gray-700 space-y-2">
                <p>• We may update these terms occasionally</p>
                <p>• We'll notify you of major changes</p>
                <p>• Continued use means you accept updates</p>
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