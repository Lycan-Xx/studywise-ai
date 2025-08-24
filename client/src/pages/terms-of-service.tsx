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
                <span className="hidden sm:inline">Back to Home</span>
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
            <div className="w-[100px] sm:w-[120px]"></div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-studywise-gray-200 p-8">
          <h1 className="text-3xl font-bold text-studywise-gray-900 mb-2">Terms of Service</h1>
          <p className="text-studywise-gray-600 mb-8">Last updated: January 2024</p>

          <div className="prose prose-studywise max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-studywise-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-studywise-gray-700 mb-4">
                By accessing and using StudyWise AI ("the Service"), you accept and agree to be bound by the terms 
                and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-studywise-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-studywise-gray-700 mb-4">
                StudyWise AI is an educational technology platform that uses artificial intelligence to generate 
                personalized tests and quizzes from user-uploaded study materials. Our service includes:
              </p>
              <ul className="list-disc pl-6 text-studywise-gray-700 space-y-2">
                <li>AI-powered test generation from uploaded notes and documents</li>
                <li>Customizable question types and difficulty levels</li>
                <li>Progress tracking and performance analytics</li>
                <li>Study material organization and management</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-studywise-gray-900 mb-4">3. User Accounts and Registration</h2>
              <p className="text-studywise-gray-700 mb-4">
                To access certain features of the Service, you must register for an account. You agree to:
              </p>
              <ul className="list-disc pl-6 text-studywise-gray-700 space-y-2">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain and promptly update your account information</li>
                <li>Maintain the security of your password and account</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-studywise-gray-900 mb-4">4. Acceptable Use Policy</h2>
              <p className="text-studywise-gray-700 mb-4">You agree not to use the Service to:</p>
              <ul className="list-disc pl-6 text-studywise-gray-700 space-y-2">
                <li>Upload content that violates copyright, trademark, or other intellectual property rights</li>
                <li>Share or distribute content that is illegal, harmful, or offensive</li>
                <li>Attempt to gain unauthorized access to our systems or other users' accounts</li>
                <li>Use the Service for any commercial purpose without our written consent</li>
                <li>Interfere with or disrupt the Service or servers connected to the Service</li>
                <li>Use automated systems to access the Service without permission</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-studywise-gray-900 mb-4">5. Content and Intellectual Property</h2>
              <p className="text-studywise-gray-700 mb-4">
                <strong>Your Content:</strong> You retain ownership of all content you upload to the Service. 
                By uploading content, you grant us a limited license to process, store, and use your content 
                solely to provide the Service to you.
              </p>
              <p className="text-studywise-gray-700 mb-4">
                <strong>Our Content:</strong> The Service, including its design, functionality, and AI algorithms, 
                is owned by StudyWise AI and protected by intellectual property laws. You may not copy, modify, 
                or distribute our proprietary technology.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-studywise-gray-900 mb-4">6. Subscription and Payment Terms</h2>
              <p className="text-studywise-gray-700 mb-4">
                <strong>Free Trial:</strong> We offer a free trial with limited features. No payment information is required.
              </p>
              <p className="text-studywise-gray-700 mb-4">
                <strong>Premium Subscription:</strong> Premium features require a paid subscription. By subscribing, you agree to:
              </p>
              <ul className="list-disc pl-6 text-studywise-gray-700 space-y-2">
                <li>Pay all applicable fees as described on our pricing page</li>
                <li>Automatic renewal unless cancelled before the renewal date</li>
                <li>No refunds for partial months of service</li>
                <li>Price changes with 30 days advance notice</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-studywise-gray-900 mb-4">7. AI-Generated Content Disclaimer</h2>
              <p className="text-studywise-gray-700 mb-4">
                Our AI generates test questions based on your uploaded materials. While we strive for accuracy:
              </p>
              <ul className="list-disc pl-6 text-studywise-gray-700 space-y-2">
                <li>AI-generated content may contain errors or inaccuracies</li>
                <li>You should verify important information independently</li>
                <li>We are not responsible for academic outcomes based on AI-generated content</li>
                <li>The Service is a study aid, not a replacement for comprehensive learning</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-studywise-gray-900 mb-4">8. Privacy and Data Protection</h2>
              <p className="text-studywise-gray-700">
                Your privacy is important to us. Our collection and use of personal information is governed by our 
                Privacy Policy, which is incorporated into these Terms by reference. By using the Service, you 
                consent to the collection and use of your information as outlined in our Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-studywise-gray-900 mb-4">9. Limitation of Liability</h2>
              <p className="text-studywise-gray-700 mb-4">
                To the maximum extent permitted by law, StudyWise AI shall not be liable for any indirect, 
                incidental, special, consequential, or punitive damages, including but not limited to:
              </p>
              <ul className="list-disc pl-6 text-studywise-gray-700 space-y-2">
                <li>Loss of profits, data, or use</li>
                <li>Academic performance or outcomes</li>
                <li>Interruption of business</li>
                <li>Cost of substitute services</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-studywise-gray-900 mb-4">10. Termination</h2>
              <p className="text-studywise-gray-700 mb-4">
                Either party may terminate this agreement at any time. Upon termination:
              </p>
              <ul className="list-disc pl-6 text-studywise-gray-700 space-y-2">
                <li>Your access to the Service will be immediately suspended</li>
                <li>We may delete your account and data after 30 days</li>
                <li>You remain responsible for any outstanding fees</li>
                <li>Provisions regarding intellectual property and liability survive termination</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-studywise-gray-900 mb-4">11. Changes to Terms</h2>
              <p className="text-studywise-gray-700">
                We reserve the right to modify these Terms at any time. We will notify users of significant 
                changes via email or through the Service. Continued use of the Service after changes constitutes 
                acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-studywise-gray-900 mb-4">12. Contact Information</h2>
              <p className="text-studywise-gray-700">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-studywise-gray-50 rounded-lg">
                <p className="text-studywise-gray-700">
                  <strong>Email:</strong> legal@studywise.ai<br />
                  <strong>Address:</strong> StudyWise AI, 123 Innovation Drive, Tech City, TC 12345
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}