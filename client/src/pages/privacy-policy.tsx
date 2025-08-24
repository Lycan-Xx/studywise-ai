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
            <Link href="/" className="flex items-center">
              <Brain className="w-6 h-6 text-primary mr-2" />
              <span className="text-lg font-semibold text-studywise-gray-900">StudyWise AI</span>
            </Link>
            <Link href="/">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-studywise-gray-200 p-8">
          <h1 className="text-3xl font-bold text-studywise-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-studywise-gray-600 mb-8">Last updated: January 2024</p>

          <div className="prose prose-studywise max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-studywise-gray-900 mb-4">1. Information We Collect</h2>
              <p className="text-studywise-gray-700 mb-4">
                At StudyWise AI, we collect information you provide directly to us, such as when you create an account, 
                upload study materials, or contact us for support.
              </p>
              <ul className="list-disc pl-6 text-studywise-gray-700 space-y-2">
                <li><strong>Account Information:</strong> Username, email address, and password</li>
                <li><strong>Study Materials:</strong> Notes, documents, and files you upload to generate tests</li>
                <li><strong>Usage Data:</strong> Test results, study progress, and app interaction data</li>
                <li><strong>Device Information:</strong> Browser type, operating system, and IP address</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-studywise-gray-900 mb-4">2. How We Use Your Information</h2>
              <p className="text-studywise-gray-700 mb-4">We use the information we collect to:</p>
              <ul className="list-disc pl-6 text-studywise-gray-700 space-y-2">
                <li>Provide, maintain, and improve our AI-powered study tools</li>
                <li>Generate personalized tests and quizzes from your study materials</li>
                <li>Track your learning progress and provide insights</li>
                <li>Send you important updates about your account and our services</li>
                <li>Respond to your comments, questions, and customer service requests</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-studywise-gray-900 mb-4">3. Information Sharing and Disclosure</h2>
              <p className="text-studywise-gray-700 mb-4">
                We do not sell, trade, or otherwise transfer your personal information to third parties. 
                Your study materials and personal data remain private and are only used to provide our services to you.
              </p>
              <p className="text-studywise-gray-700">
                We may disclose your information only in the following limited circumstances:
              </p>
              <ul className="list-disc pl-6 text-studywise-gray-700 space-y-2 mt-4">
                <li>With your explicit consent</li>
                <li>To comply with legal obligations or court orders</li>
                <li>To protect our rights, property, or safety, or that of our users</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-studywise-gray-900 mb-4">4. Data Security</h2>
              <p className="text-studywise-gray-700 mb-4">
                We implement appropriate technical and organizational security measures to protect your personal 
                information against unauthorized access, alteration, disclosure, or destruction.
              </p>
              <ul className="list-disc pl-6 text-studywise-gray-700 space-y-2">
                <li>All data is encrypted in transit and at rest</li>
                <li>Regular security audits and updates</li>
                <li>Limited access to personal data on a need-to-know basis</li>
                <li>Secure cloud infrastructure with industry-standard protections</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-studywise-gray-900 mb-4">5. Your Rights and Choices</h2>
              <p className="text-studywise-gray-700 mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 text-studywise-gray-700 space-y-2">
                <li>Access, update, or delete your personal information</li>
                <li>Export your data in a portable format</li>
                <li>Opt out of non-essential communications</li>
                <li>Request that we stop processing your data</li>
              </ul>
              <p className="text-studywise-gray-700 mt-4">
                To exercise these rights, please contact us at privacy@studywise.ai
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-studywise-gray-900 mb-4">6. Data Retention</h2>
              <p className="text-studywise-gray-700">
                We retain your personal information for as long as necessary to provide our services and fulfill 
                the purposes outlined in this privacy policy. You may delete your account at any time, which will 
                remove your personal data from our systems within 30 days.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-studywise-gray-900 mb-4">7. Changes to This Policy</h2>
              <p className="text-studywise-gray-700">
                We may update this privacy policy from time to time. We will notify you of any changes by posting 
                the new privacy policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-studywise-gray-900 mb-4">8. Contact Us</h2>
              <p className="text-studywise-gray-700">
                If you have any questions about this privacy policy, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-studywise-gray-50 rounded-lg">
                <p className="text-studywise-gray-700">
                  <strong>Email:</strong> privacy@studywise.ai<br />
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