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
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8" data-testid="section-hero">
        <div className="max-w-4xl mx-auto text-center relative">
          {/* Brain icon */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <Brain className="w-16 h-16 text-primary" data-testid="icon-brain" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary/10 rounded-full animate-pulse"></div>
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-studywise-gray-900 mb-6" data-testid="text-hero-title">
            Turn Your Notes Into Smart Tests
          </h1>

          <div className="max-w-2xl mx-auto mb-8 text-lg text-studywise-gray-600">
            <p data-testid="text-hero-description">
              StudyWise AI transforms your study materials into personalized practice tests using advanced AI.
              Simply upload your notes, and our system creates custom quizzes that help you learn actively instead of just reading passively.
            </p>
          </div>

          <Link href={user ? "/dashboard" : "/auth"}>
            <Button size="lg" className="bg-primary hover:bg-blue-600 px-8 py-4 text-lg font-medium" data-testid="button-start-journey">
              {user ? "Go to Dashboard" : "Get Started Free"}
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

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {/* Step 1 */}
            <Card className="text-center p-8 border-studywise-gray-200 hover:shadow-lg transition-shadow" data-testid="card-step-1">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-studywise-gray-900 mb-4">1. Upload Your Notes</h3>
                <p className="text-studywise-gray-600">
                  Drop PDF, Markdown (.md), or TXT files. Our AI reads and understands your study material instantly.
                </p>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card className="text-center p-8 border-studywise-gray-200 hover:shadow-lg transition-shadow" data-testid="card-step-2">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Wand2 className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-studywise-gray-900 mb-4">2. AI Generates Your Test</h3>
                <p className="text-studywise-gray-600">
                  Choose difficulty, question types, and count. Our AI creates custom quizzes tailored to your needs.
                </p>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card className="text-center p-8 border-studywise-gray-200 hover:shadow-lg transition-shadow" data-testid="card-step-3">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-studywise-gray-900 mb-4">3. Take & Learn</h3>
                <p className="text-studywise-gray-600">
                  Answer questions with instant feedback and explanations. Learn actively, not passively.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Accuracy System */}
          <div className="bg-studywise-gray-50 rounded-xl p-8 mb-8">
            <h3 className="text-2xl font-semibold text-studywise-gray-900 mb-6 text-center">
              Our unique 3-layer accuracy system ensures trust:
            </h3>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary font-bold text-lg">1</span>
                </div>
                <p className="text-studywise-gray-700">
                  <strong>AI follows strict rules</strong>—it only creates questions from your notes.
                </p>
              </div>
              <div>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary font-bold text-lg">2</span>
                </div>
                <p className="text-studywise-gray-700">
                  <strong>Auto double-check</strong>—the AI verifies each answer before you see it.
                </p>
              </div>
              <div>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary font-bold text-lg">3</span>
                </div>
                <p className="text-studywise-gray-700">
                  <strong>Direct link to notes</strong>—we show you the exact sentence that proves each answer.
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

      {/* Pricing Section */}
      <section className="py-20 bg-studywise-bg" data-testid="section-pricing">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-studywise-gray-900 mb-4" data-testid="text-pricing-title">
              Start Your Learning Journey
            </h2>
            <p className="text-xl text-studywise-gray-600">
              Join thousands of students transforming their learning with AI
            </p>
          </div>

          <div className="mb-16">
            {/* Premium Plan */}
            <Card className="p-8 border-primary bg-primary/5 relative" data-testid="card-premium-plan">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">Most Popular</span>
              </div>
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <Unlock className="w-6 h-6 text-primary mr-2" />
                  <h3 className="text-2xl font-bold text-studywise-gray-900">StudyWise AI</h3>
                </div>
                <p className="text-studywise-gray-600 mb-6">Transform your notes into personalized practice tests</p>
                <ul className="space-y-3 mb-8 text-studywise-gray-700">
                  <li>• Unlimited tests from your notes</li>
                  <li>• AI-powered question generation</li>
                  <li>• Instant feedback & explanations</li>
                  <li>• Progress tracking & insights</li>
                  <li>• Multi-format support (PDF, MD, TXT)</li>
                </ul>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-studywise-gray-900">$9</span>
                  <span className="text-studywise-gray-600">/month</span>
                </div>
                <Link href={user ? "/dashboard" : "/auth"}>
                  <Button size="lg" className="w-full bg-primary hover:bg-blue-600" data-testid="button-start-premium">
                    {user ? "Go to Dashboard" : "Start Free Trial"}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* FAQ Section */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-studywise-gray-900 mb-8 text-center">Frequently Asked Questions</h3>
            <div className="space-y-6">
              <Card className="border-studywise-gray-200" data-testid="card-faq-security">
                <CardContent className="p-6">
                  <h4 className="font-semibold text-studywise-gray-900 mb-2">Is my data secure?</h4>
                  <p className="text-studywise-gray-600">
                    Yes, all your notes and personal data are encrypted and kept private. We never share your information.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-studywise-gray-200" data-testid="card-faq-file-types">
                <CardContent className="p-6">
                  <h4 className="font-semibold text-studywise-gray-900 mb-2">What file types can I upload?</h4>
                  <p className="text-studywise-gray-600">
                    We currently support .txt, .md, and .docx files.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-studywise-gray-200" data-testid="card-faq-verification">
                <CardContent className="p-6">
                  <h4 className="font-semibold text-studywise-gray-900 mb-2">How does the AI verify the answers?</h4>
                  <p className="text-studywise-gray-600">
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