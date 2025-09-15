import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Upload, Wand2, CheckCircle, Lock, Unlock, Twitter, Globe } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-studywise-bg">
      {/* Floating Pill Navbar */}
      <nav className="fixed top-3 left-4 right-4 z-50">
        <div className="max-w-6xl mx-auto floating-navbar border border-studywise-gray-200 rounded-2xl px-4 sm:px-8 py-3 shadow-lg">
          <div className="flex items-center justify-between">
            {/* Left spacer for balance - hidden on mobile */}
            <div className="hidden sm:flex flex-1"></div>

            {/* Logo - Center on desktop, left on mobile */}
            <div className="flex-1 sm:flex-1 flex sm:justify-center justify-start">
              <Link href="/" className="flex items-center">
                <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-primary mr-2" />
                <span className="text-base sm:text-lg font-semibold text-studywise-gray-900">StudyWise AI</span>
              </Link>
            </div>

            {/* Login/Dashboard Button - Right */}
            <div className="flex-1 sm:flex-1 flex justify-end">
              {user ? (
                <Link href="/dashboard">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-2xl border-studywise-gray-400 hover:bg-studywise-gray-50 px-4 sm:px-6 text-sm"
                  >
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <Link href="/auth">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-2xl border-studywise-gray-400 hover:bg-studywise-gray-50 px-4 sm:px-6 text-sm"
                  >
                    Log In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-36 pb-24 px-4 sm:px-6 lg:px-8" data-testid="section-hero">
        <div className="max-w-5xl mx-auto text-center relative">
          {/* Brain icon with improved positioning */}
          <div className="mb-10 flex justify-center">
            <div className="relative">
              <Brain className="w-20 h-20 text-primary drop-shadow-sm" data-testid="icon-brain" />
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary/15 rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* Improved typography hierarchy */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-studywise-gray-900 mb-8 tracking-tight leading-none" data-testid="text-hero-title">
            Your Notes.<br/>
            <span className="text-primary">Your Tests.</span><br/>
            Your A's.
          </h1>

          <div className="max-w-3xl mx-auto mb-12 space-y-6">
            <p className="text-xl md:text-2xl text-studywise-gray-600 font-light leading-relaxed" data-testid="text-hero-description">
              <span className="text-nowrap">You've spent hours reading your notes. Highlighting every line. </span> Re-reading pages until your eyes blur.
              But when it's time for the test, you still feel lost.
            </p>
            <p className="text-lg md:text-xl font-medium text-studywise-gray-800 bg-studywise-gray-50 rounded-2xl px-8 py-4 inline-block">
              You're not alone.
            </p>
            <p className="text-lg md:text-xl text-studywise-gray-600 leading-relaxed">
              Most of us study passively and it's a huge waste of time. StudyWise AI takes a different approach.
              It turns your notes into personalized practice tests, so you can stop just reading and start truly learning.
            </p>
          </div>

          <Link href={user ? "/dashboard" : "/auth"}>
            <Button size="lg" className="bg-primary hover:bg-blue-600 px-10 py-5 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105" data-testid="button-start-journey">
              Start Your Journey Now
            </Button>
          </Link>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white" data-testid="section-how-it-works">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-studywise-gray-900 mb-4" data-testid="text-journey-title">
              3 Simple Steps to Get Started
            </h2>
            <p className="text-xl text-studywise-gray-600 max-w-2xl mx-auto">
              Transform your notes into personalized practice tests with AI
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10 mb-20">
            {/* Step 1 - Enhanced card design */}
            <Card className="text-center p-10 border-2 border-studywise-gray-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 rounded-3xl" data-testid="card-step-1">
              <CardContent className="pt-8">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                  <Upload className="w-10 h-10 text-primary" />
                </div>
                <div className="w-8 h-1 bg-primary rounded-full mx-auto mb-6"></div>
                <h3 className="text-2xl font-bold text-studywise-gray-900 mb-6 tracking-tight">Upload Your Notes</h3>
                <p className="text-studywise-gray-600 text-lg leading-relaxed">
                  Got notes in a PDF, markdown, or text file? Just drop them in. Our AI reads and understands your study material instantly.
                </p>
              </CardContent>
            </Card>

            {/* Step 2 - Enhanced card design */}
            <Card className="text-center p-10 border-2 border-studywise-gray-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 rounded-3xl" data-testid="card-step-2">
              <CardContent className="pt-8">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-50 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                  <Wand2 className="w-10 h-10 text-purple-600" />
                </div>
                <div className="w-8 h-1 bg-purple-600 rounded-full mx-auto mb-6"></div>
                <h3 className="text-2xl font-bold text-studywise-gray-900 mb-6 tracking-tight">We Craft Your Perfect Test</h3>
                <p className="text-studywise-gray-600 text-lg leading-relaxed">
                  With our AI wizard you can customize the questions to your liking, just focus on: topics, specific question types. We'll handle the rest.
                </p>
              </CardContent>
            </Card>

            {/* Step 3 - Enhanced card design */}
            <Card className="text-center p-10 border-2 border-studywise-gray-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 rounded-3xl" data-testid="card-step-3">
              <CardContent className="pt-8">
                <div className="w-20 h-20 bg-gradient-to-br from-green-50 to-green-100 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <div className="w-8 h-1 bg-green-600 rounded-full mx-auto mb-6"></div>
                <h3 className="text-2xl font-bold text-studywise-gray-900 mb-6 tracking-tight">Take Your Test & Learn</h3>
                <p className="text-studywise-gray-600 text-lg leading-relaxed">
                  Get instant results and see where every answer comes from, with a direct reference link back to the source sentence in your original notes.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Improved Accuracy System */}
          <div className="bg-gradient-to-r from-studywise-gray-50 to-blue-50/30 rounded-3xl p-12 mb-12 border border-studywise-gray-100">
            <h3 className="text-3xl font-bold text-studywise-gray-900 mb-10 text-center tracking-tight">
              Our unique 3-layer accuracy system ensures trust:
            </h3>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="group">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:shadow-md transition-shadow">
                  <span className="text-primary font-bold text-2xl">1</span>
                </div>
                <div className="w-12 h-1 bg-primary rounded-full mx-auto mb-4"></div>
                <p className="text-studywise-gray-700 text-lg leading-relaxed">
                  <strong className="text-studywise-gray-900">AI follows strict rules</strong>it only creates questions from your notes.
                </p>
              </div>
              <div className="group">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:shadow-md transition-shadow">
                  <span className="text-primary font-bold text-2xl">2</span>
                </div>
                <div className="w-12 h-1 bg-primary rounded-full mx-auto mb-4"></div>
                <p className="text-studywise-gray-700 text-lg leading-relaxed">
                  <strong className="text-studywise-gray-900">Auto double-check</strong>the AI verifies each answer before you see it.
                </p>
              </div>
              <div className="group">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:shadow-md transition-shadow">
                  <span className="text-primary font-bold text-2xl">3</span>
                </div>
                <div className="w-12 h-1 bg-primary rounded-full mx-auto mb-4"></div>
                <p className="text-studywise-gray-700 text-lg leading-relaxed">
                  <strong className="text-studywise-gray-900">Direct link to notes</strong>—we show you the exact sentence that proves each answer.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link href={user ? "/dashboard" : "/auth"}>
              <Button size="lg" className="bg-primary hover:bg-blue-600 px-8 py-4 text-lg font-medium" data-testid="button-start-journey-2">
                {user ? "Go to Dashboard" : "Get Started Free"}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* YouTube Tutorial Video Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50/30 to-white" data-testid="section-video-tutorial">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-studywise-gray-900 mb-4" data-testid="text-video-title">
              See StudyWise in Action
            </h2>
            <p className="text-xl text-studywise-gray-600 max-w-2xl mx-auto">
              Watch how StudyWise AI transforms your study notes into personalized practice tests in just minutes
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="border-2 border-studywise-gray-200 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300" data-testid="card-video-container">
              <CardContent className="p-0">
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    className="absolute top-0 left-0 w-full h-full rounded-2xl"
                    src="https://www.youtube.com/embed/YOUR_VIDEO_ID_HERE"
                    title="StudyWise AI Tutorial - Transform Your Notes Into Tests"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    data-testid="youtube-video"
                  ></iframe>
                </div>
              </CardContent>
            </Card>

            <div className="text-center mt-8">
              <p className="text-studywise-gray-600 text-lg mb-6">
                Ready to try it yourself? Upload your notes and see the magic happen.
              </p>
              <Link href={user ? "/dashboard" : "/auth"}>
                <Button size="lg" className="bg-primary hover:bg-blue-600 px-8 py-4 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105" data-testid="button-try-after-video">
                  Try StudyWise Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Get Started Section - Freemium Approach */}
      <section className="py-20 bg-studywise-bg" data-testid="section-get-started">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-studywise-gray-900 mb-4" data-testid="text-get-started-title">
              Start Learning Smarter Today
            </h2>
            <p className="text-xl text-studywise-gray-600 max-w-3xl mx-auto">
              Join thousands of students who are already transforming their study habits with AI-powered learning
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {/* Current Free Access */}
            <Card className="text-center p-8 border-2 border-studywise-gray-200 bg-white rounded-3xl hover:shadow-lg transition-all duration-300" data-testid="card-free-access">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-50 to-green-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-studywise-gray-900 mb-4 tracking-tight">Free Access</h3>
                <p className="text-studywise-gray-600 text-lg mb-6 leading-relaxed">
                  Full access to all features while we're in beta. Transform your notes into tests completely free.
                </p>
                <div className="space-y-3 text-sm text-studywise-gray-600">
                  <div className="flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Unlimited test generation
                  </div>
                  <div className="flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    All question types
                  </div>
                  <div className="flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Progress tracking
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Future Premium Features */}
            <Card className="text-center p-8 border-2 border-primary bg-gradient-to-b from-primary/5 to-white rounded-3xl relative hover:shadow-xl transition-all duration-300 hover:-translate-y-1" data-testid="card-future-premium">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-white px-4 py-1 rounded-xl text-xs font-semibold shadow-lg">Coming Soon</span>
              </div>
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <Unlock className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-studywise-gray-900 mb-4 tracking-tight">Premium Features</h3>
                <p className="text-studywise-gray-600 text-lg mb-6 leading-relaxed">
                  Advanced features for serious learners who want to maximize their study efficiency.
                </p>
                <div className="space-y-3 text-sm text-studywise-gray-600">
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 bg-primary/20 rounded-full mr-2"></div>
                    Advanced analytics
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 bg-primary/20 rounded-full mr-2"></div>
                    Study groups & collaboration
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 bg-primary/20 rounded-full mr-2"></div>
                    Priority support
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Community & Updates */}
            <Card className="text-center p-8 border-2 border-studywise-gray-200 bg-white rounded-3xl hover:shadow-lg transition-all duration-300" data-testid="card-community">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-50 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <Twitter className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-studywise-gray-900 mb-4 tracking-tight">Join the Community</h3>
                <p className="text-studywise-gray-600 text-lg mb-6 leading-relaxed">
                  Be the first to know about new features and help shape the future of AI-powered learning.
                </p>
                <div className="space-y-3 text-sm text-studywise-gray-600">
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 bg-purple-500/20 rounded-full mr-2"></div>
                    Early access to new features
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 bg-purple-500/20 rounded-full mr-2"></div>
                    Community discussions
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 bg-purple-500/20 rounded-full mr-2"></div>
                    Feature voting
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-studywise-gray-50 to-blue-50/30 rounded-3xl p-12 mb-8 border border-studywise-gray-100">
              <h3 className="text-3xl font-bold text-studywise-gray-900 mb-4 tracking-tight">
                Ready to Transform Your Learning?
              </h3>
              <p className="text-xl text-studywise-gray-600 mb-8 max-w-2xl mx-auto">
                Start using StudyWise AI today while it's completely free. Join the growing community of students learning smarter, not harder.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href={user ? "/dashboard" : "/auth"}>
                  <Button size="lg" className="bg-primary hover:bg-blue-600 px-10 py-4 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105" data-testid="button-get-started-main">
                    {user ? "Go to Dashboard" : "Get Started Free"}
                  </Button>
                </Link>
                <p className="text-studywise-gray-500 text-sm">
                  No credit card required • Full access during beta
                </p>
              </div>
            </div>
          </div>

          {/* Enhanced FAQ Section */}
          <div className="mb-20">
            <h3 className="text-3xl font-bold text-studywise-gray-900 mb-12 text-center tracking-tight">Frequently Asked Questions</h3>
            <div className="space-y-4 max-w-3xl mx-auto">
              <Card className="border-2 border-studywise-gray-200 rounded-2xl hover:shadow-md transition-shadow" data-testid="card-faq-security">
                <CardContent className="p-8">
                  <h4 className="text-xl font-bold text-studywise-gray-900 mb-3 tracking-tight">Is my data secure?</h4>
                  <p className="text-studywise-gray-600 text-lg leading-relaxed">
                    Yes, all your notes and personal data are encrypted and kept private. We never share your information.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-studywise-gray-200 rounded-2xl hover:shadow-md transition-shadow" data-testid="card-faq-file-types">
                <CardContent className="p-8">
                  <h4 className="text-xl font-bold text-studywise-gray-900 mb-3 tracking-tight">What file types can I upload?</h4>
                  <p className="text-studywise-gray-600 text-lg leading-relaxed">
                    We currently support .txt, .md, and .docx files.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-studywise-gray-200 rounded-2xl hover:shadow-md transition-shadow" data-testid="card-faq-verification">
                <CardContent className="p-8">
                  <h4 className="text-xl font-bold text-studywise-gray-900 mb-3 tracking-tight">How does the AI verify the answers?</h4>
                  <p className="text-studywise-gray-600 text-lg leading-relaxed">
                    Our system is built to only generate questions where the answer can be directly found in your uploaded notes.
                    We then run a second check to ensure the generated answer matches the source text.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-studywise-gray-900 text-studywise-gray-400 py-8" data-testid="footer">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center space-x-6">
              <a
                href="https://x.com/LycanXx2"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-studywise-gray-300 transition-colors"
                aria-label="Follow on Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://mohammad-bello.up.railway.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-studywise-gray-300 transition-colors"
                aria-label="Visit personal website"
              >
                <Globe className="w-5 h-5" />
              </a>
            </div>
            <p>
              StudyWise AI |
              <Link href="/privacy-policy" className="hover:text-studywise-gray-300 mx-2">Privacy Policy</Link> |
              <Link href="/terms-of-service" className="hover:text-studywise-gray-300 mx-2">Terms of Service</Link> |
              © 2025 StudyWise Inc.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}