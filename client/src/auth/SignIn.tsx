import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Link } from "wouter";

export default function SignIn() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Handle email/password login
  const handleEmailLogin = async () => {
    setIsLoading(true);
    setErrors({});

    try {
      // Add your authentication API call here
      // const response = await signInWithEmail(formData.email, formData.password);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo, simulate invalid credentials
      if (formData.email === "wrong@example.com") {
        setErrors({ general: "Incorrect email or password" });
        setIsLoading(false);
        return;
      }
      
      // Success - redirect to dashboard
      console.log("Login successful:", formData);
      // window.location.href = "/dashboard";
    } catch (error) {
      setErrors({ general: "Something went wrong. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google login
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    
    try {
      // Add your Google OAuth implementation here
      // const response = await signInWithGoogle();
      
      // Simulate Google OAuth
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log("Google login successful");
      // window.location.href = "/dashboard";
    } catch (error) {
      setErrors({ general: "Google sign-in failed. Please try again." });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Left side - Authentication Card */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <Card className="w-full max-w-md bg-white rounded-3xl shadow-xl border-0">
          <CardContent className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <Link href="/" className="inline-flex items-center justify-center mb-6">
                <Brain className="w-8 h-8 text-primary mr-2" />
                <span className="text-xl font-semibold text-studywise-gray-900">StudyWise AI</span>
              </Link>
              
              <h1 className="text-2xl font-bold text-studywise-gray-900 mb-2">
                Welcome back to StudyWise AI
              </h1>
              <p className="text-studywise-gray-600">
                Sign in to continue your learning journey.
              </p>
            </div>

            {/* Error message */}
            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600">{errors.general}</p>
              </div>
            )}

            {/* Email/Password Login */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-studywise-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-studywise-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 border border-studywise-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    disabled={isLoading || isGoogleLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-studywise-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-studywise-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-12 py-3 border border-studywise-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    disabled={isLoading || isGoogleLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    disabled={isLoading || isGoogleLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5 text-studywise-gray-400" />
                    ) : (
                      <Eye className="w-5 h-5 text-studywise-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                onClick={handleEmailLogin}
                disabled={!formData.email || !formData.password || isLoading || isGoogleLoading}
                className="w-full bg-primary hover:bg-blue-600 py-3 rounded-xl font-medium"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </div>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-studywise-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-studywise-gray-500">or</span>
              </div>
            </div>

            {/* Google Sign In */}
            <Button
              onClick={handleGoogleLogin}
              disabled={isLoading || isGoogleLoading}
              variant="outline"
              className="w-full py-3 rounded-xl font-medium border-studywise-gray-300 hover:bg-gray-50"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {isGoogleLoading ? "Connecting..." : "Continue with Google"}
            </Button>

            {/* Footer Links */}
            <div className="mt-8 space-y-4 text-center">
              <div>
                <Link href="/reset-password" className="text-sm text-primary hover:underline">
                  Forgot your password?
                </Link>
              </div>
              <div>
                <p className="text-sm text-studywise-gray-600">
                  Don't have an account?{" "}
                  <Link href="/signup" className="text-primary hover:underline font-medium">
                    Sign up
                  </Link>
                </p>
              </div>
            </div>

            {/* Footer Links */}
            <div className="mt-8 pt-6 border-t border-studywise-gray-200">
              <div className="flex justify-center space-x-6 text-sm text-studywise-gray-500">
                <Link href="/privacy-policy" className="hover:text-studywise-gray-700">
                  Privacy Policy
                </Link>
                <Link href="/terms-of-service" className="hover:text-studywise-gray-700">
                  Terms of Service
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right side - Background with message */}
      <div className="hidden lg:flex flex-1 relative">
        <div
          className="w-full h-full bg-cover bg-center relative"
          style={{
            backgroundImage: 'url("https://picsum.photos/800/1200?random=2")',
          }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-40" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white px-8">
              <h2 className="text-5xl md:text-6xl font-light leading-tight mb-4">
                Ready to ace
                <br />
                your next test?
              </h2>
              <p className="text-xl opacity-90 max-w-md">
                Pick up right where you left off and continue mastering your material
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}