import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Mail, Lock, Eye, EyeOff, User, ArrowLeft, Check, CheckCircle } from "lucide-react";
import { Link } from "wouter";

export default function AuthRoot() {
  const [authMode, setAuthMode] = useState("signin"); // signin, signup, reset
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    learningGoal: "",
    verificationCode: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Reset form when switching modes
  const switchAuthMode = (mode) => {
    setAuthMode(mode);
    setCurrentStep(1);
    setFormData({
      email: "",
      password: "",
      fullName: "",
      learningGoal: "",
      verificationCode: "",
      newPassword: "",
      confirmPassword: ""
    });
    setErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  // Password validation
  const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasNumber = /\d/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    return { minLength, hasNumber, hasUppercase };
  };

  const passwordValidation = validatePassword(authMode === "reset" ? formData.newPassword : formData.password);
  const isPasswordValid = passwordValidation.minLength && passwordValidation.hasNumber && passwordValidation.hasUppercase;
  const passwordsMatch = formData.newPassword === formData.confirmPassword && formData.confirmPassword.length > 0;

  // Learning goals for signup
  const learningGoals = [
    { value: "student", label: "I'm a Student" },
    { value: "teacher", label: "I'm a Teacher" },
    { value: "certification", label: "I'm preparing for a Certification or Career Exam" },
    { value: "other", label: "Other" }
  ];

  // Background content based on auth mode
  const getBackgroundContent = () => {
    switch (authMode) {
      case "signin":
        return {
          image: "https://picsum.photos/1920/1080?random=2",
          title: "Ready to ace\nyour next test?",
          subtitle: "Pick up right where you left off and continue mastering your material"
        };
      case "signup":
        return {
          image: "https://picsum.photos/1920/1080?random=1",
          title: "Transform your\nstudy habits",
          subtitle: "Join thousands of students who've already discovered the power of active learning"
        };
      case "reset":
        return {
          image: "https://picsum.photos/1920/1080?random=3",
          title: "Every setback\nis a comeback",
          subtitle: "Reset your password and get back to mastering your studies"
        };
      default:
        return {
          image: "https://picsum.photos/1920/1080?random=2",
          title: "Welcome to\nStudyWise AI",
          subtitle: "Your journey to smarter learning starts here"
        };
    }
  };

  // Auth handlers
  const handleSignIn = async () => {
    setIsLoading(true);
    setErrors({});
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (formData.email === "wrong@example.com") {
        setErrors({ general: "Incorrect email or password" });
        return;
      }
      console.log("Login successful:", formData);
    } catch (error) {
      setErrors({ general: "Something went wrong. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log("Google login successful");
    } catch (error) {
      setErrors({ general: "Google sign-in failed. Please try again." });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSignUpEmail = async () => {
    setIsLoading(true);
    setErrors({});
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      if (formData.email === "existing@example.com") {
        setErrors({ email: "This email is already registered. Would you like to sign in instead?" });
        return;
      }
      setCurrentStep(2);
    } catch (error) {
      setErrors({ email: "Something went wrong. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpProfile = () => {
    if (!isPasswordValid) return;
    setCurrentStep(3);
  };

  const handleSignUpComplete = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Account created:", formData);
    } catch (error) {
      setErrors({ general: "Failed to create account. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetEmail = async () => {
    setIsLoading(true);
    setErrors({});
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (formData.email === "notfound@example.com") {
        setErrors({ email: "No account found with this email address." });
        return;
      }
      setCurrentStep(2);
    } catch (error) {
      setErrors({ email: "Failed to send reset email. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetVerify = async () => {
    setIsLoading(true);
    setErrors({});
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      if (formData.verificationCode !== "123456") {
        setErrors({ code: "Invalid verification code. Please check your email and try again." });
        return;
      }
      setCurrentStep(3);
    } catch (error) {
      setErrors({ code: "Verification failed. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!isPasswordValid || !passwordsMatch) return;
    setIsLoading(true);
    setErrors({});
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCurrentStep(4);
    } catch (error) {
      setErrors({ password: "Failed to update password. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const backgroundContent = getBackgroundContent();

  return (
    <div 
      className="min-h-screen w-full bg-cover bg-center bg-no-repeat relative flex"
      style={{
        backgroundImage: `url("${backgroundContent.image}")`,
      }}
    >
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-40" />

      {/* Left side - Authentication Card */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8 relative z-10">
        <Card className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border-0">
          <CardContent className="p-10">
            {/* Header */}
            <div className="text-center mb-8">
              <Link href="/" className="inline-flex items-center justify-center mb-6">
                <Brain className="w-8 h-8 text-primary mr-2" />
                <span className="text-xl font-semibold text-studywise-gray-900">StudyWise AI</span>
              </Link>
              
              {/* Progress indicator for signup */}
              {authMode === "signup" && (
                <div className="flex items-center justify-center mb-6">
                  <span className="text-sm text-studywise-gray-500">Step {currentStep} / 3</span>
                  <div className="flex ml-4 space-x-1">
                    {[1, 2, 3].map((step) => (
                      <div
                        key={step}
                        className={`w-2 h-2 rounded-full ${
                          step <= currentStep ? 'bg-primary' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* SIGN IN CONTENT */}
            {authMode === "signin" && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-studywise-gray-900 mb-2">
                    Welcome back to StudyWise AI
                  </h1>
                  <p className="text-studywise-gray-600">
                    Sign in to continue your learning journey.
                  </p>
                </div>

                {errors.general && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-600">{errors.general}</p>
                  </div>
                )}

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-studywise-gray-700 mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-studywise-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-4 py-4 border border-studywise-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-base"
                        disabled={isLoading || isGoogleLoading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-studywise-gray-700 mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-studywise-gray-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Enter your password"
                        className="w-full pl-10 pr-12 py-4 border border-studywise-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-base"
                        disabled={isLoading || isGoogleLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        disabled={isLoading || isGoogleLoading}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5 text-studywise-gray-400" /> : <Eye className="w-5 h-5 text-studywise-gray-400" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    onClick={handleSignIn}
                    disabled={!formData.email || !formData.password || isLoading || isGoogleLoading}
                    className="w-full bg-primary hover:bg-blue-600 py-4 rounded-xl font-medium text-base"
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </div>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-studywise-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-studywise-gray-500">or</span>
                  </div>
                </div>

                <Button
                  onClick={handleGoogleLogin}
                  disabled={isLoading || isGoogleLoading}
                  variant="outline"
                  className="w-full py-4 rounded-xl font-medium border-studywise-gray-300 hover:bg-gray-50 text-base"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {isGoogleLoading ? "Connecting..." : "Continue with Google"}
                </Button>

                <div className="mt-8 space-y-4 text-center">
                  <button onClick={() => switchAuthMode("reset")} className="text-sm text-primary hover:underline">
                    Forgot your password?
                  </button>
                  <p className="text-sm text-studywise-gray-600">
                    Don't have an account?{" "}
                    <button onClick={() => switchAuthMode("signup")} className="text-primary hover:underline font-medium">
                      Sign up
                    </button>
                  </p>
                </div>
              </div>
            )}

            {/* SIGN UP CONTENT */}
            {authMode === "signup" && (
              <div className="space-y-6">
                {/* Step 1 - Email */}
                {currentStep === 1 && (
                  <>
                    <div className="text-center mb-6">
                      <h1 className="text-2xl font-bold text-studywise-gray-900 mb-2">
                        Create your StudyWise AI account
                      </h1>
                      <p className="text-studywise-gray-600">
                        Start by entering your email address.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-studywise-gray-700 mb-2">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-studywise-gray-400" />
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="you@example.com"
                          className="w-full pl-10 pr-4 py-4 border border-studywise-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-base"
                          required
                        />
                      </div>
                      {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
                    </div>

                    <Button
                      onClick={handleSignUpEmail}
                      disabled={!formData.email || isLoading}
                      className="w-full bg-primary hover:bg-blue-600 py-4 rounded-xl font-medium text-base"
                    >
                      {isLoading ? "Checking..." : "Continue"}
                    </Button>

                    <div className="text-center">
                      <p className="text-sm text-studywise-gray-600">
                        Already have an account?{" "}
                        <button onClick={() => switchAuthMode("signin")} className="text-primary hover:underline font-medium">
                          Sign in
                        </button>
                      </p>
                    </div>
                  </>
                )}

                {/* Step 2 - Profile */}
                {currentStep === 2 && (
                  <>
                    <div className="flex items-center mb-6">
                      <button onClick={() => setCurrentStep(1)} className="mr-4 p-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeft className="w-5 h-5 text-studywise-gray-600" />
                      </button>
                      <div>
                        <h1 className="text-2xl font-bold text-studywise-gray-900">Set up your profile</h1>
                        <p className="text-studywise-gray-600">We'll use this to personalize your experience.</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-studywise-gray-700 mb-2">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-studywise-gray-400" />
                        <input
                          type="text"
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          placeholder="Sarah Johnson"
                          className="w-full pl-10 pr-4 py-4 border border-studywise-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-base"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-studywise-gray-700 mb-2">Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="Create a secure password"
                          className="w-full pl-4 pr-12 py-4 border border-studywise-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-base"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5 text-studywise-gray-400" /> : <Eye className="w-5 h-5 text-studywise-gray-400" />}
                        </button>
                      </div>
                      
                      <div className="mt-3 space-y-2">
                        <div className={`flex items-center text-sm ${passwordValidation.minLength ? 'text-green-600' : 'text-studywise-gray-500'}`}>
                          <Check className={`w-4 h-4 mr-2 ${passwordValidation.minLength ? 'text-green-600' : 'text-gray-300'}`} />
                          At least 8 characters
                        </div>
                        <div className={`flex items-center text-sm ${passwordValidation.hasNumber ? 'text-green-600' : 'text-studywise-gray-500'}`}>
                          <Check className={`w-4 h-4 mr-2 ${passwordValidation.hasNumber ? 'text-green-600' : 'text-gray-300'}`} />
                          1 number
                        </div>
                        <div className={`flex items-center text-sm ${passwordValidation.hasUppercase ? 'text-green-600' : 'text-studywise-gray-500'}`}>
                          <Check className={`w-4 h-4 mr-2 ${passwordValidation.hasUppercase ? 'text-green-600' : 'text-gray-300'}`} />
                          1 uppercase letter
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleSignUpProfile}
                      disabled={!formData.fullName || !isPasswordValid}
                      className="w-full bg-primary hover:bg-blue-600 py-4 rounded-xl font-medium text-base"
                    >
                      Continue
                    </Button>
                  </>
                )}

                {/* Step 3 - Learning Goal */}
                {currentStep === 3 && (
                  <>
                    <div className="flex items-center mb-6">
                      <button onClick={() => setCurrentStep(2)} className="mr-4 p-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeft className="w-5 h-5 text-studywise-gray-600" />
                      </button>
                      <div>
                        <h1 className="text-2xl font-bold text-studywise-gray-900">Tell us what you want to achieve</h1>
                        <p className="text-studywise-gray-600">Choose a goal so we can personalize your tests.</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {learningGoals.map((goal) => (
                        <label
                          key={goal.value}
                          className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${
                            formData.learningGoal === goal.value
                              ? 'border-primary bg-blue-50'
                              : 'border-studywise-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="learningGoal"
                            value={goal.value}
                            checked={formData.learningGoal === goal.value}
                            onChange={(e) => setFormData({ ...formData, learningGoal: e.target.value })}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                            formData.learningGoal === goal.value ? 'border-primary bg-primary' : 'border-studywise-gray-300'
                          }`}>
                            {formData.learningGoal === goal.value && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                          <span className="text-studywise-gray-900">{goal.label}</span>
                        </label>
                      ))}
                    </div>

                    <Button
                      onClick={handleSignUpComplete}
                      disabled={!formData.learningGoal || isLoading}
                      className="w-full bg-primary hover:bg-blue-600 py-4 rounded-xl font-medium text-base"
                    >
                      {isLoading ? "Creating Account..." : "Finish & Create Account"}
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* RESET PASSWORD CONTENT */}
            {authMode === "reset" && (
              <div className="space-y-6">
                {/* Step 1 - Email */}
                {currentStep === 1 && (
                  <>
                    <div className="text-center mb-6">
                      <h1 className="text-2xl font-bold text-studywise-gray-900 mb-2">Reset Password</h1>
                      <p className="text-studywise-gray-600">Enter the email associated with your account.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-studywise-gray-700 mb-2">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-studywise-gray-400" />
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="you@example.com"
                          className="w-full pl-10 pr-4 py-4 border border-studywise-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-base"
                          disabled={isLoading}
                        />
                      </div>
                      {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
                    </div>

                    <Button
                      onClick={handleResetEmail}
                      disabled={!formData.email || isLoading}
                      className="w-full bg-primary hover:bg-blue-600 py-4 rounded-xl font-medium text-base"
                    >
                      {isLoading ? "Sending..." : "Send Reset Link"}
                    </Button>

                    <div className="text-center">
                      <button onClick={() => switchAuthMode("signin")} className="text-sm text-studywise-gray-600 hover:text-studywise-gray-800">
                        Back to sign in
                      </button>
                    </div>
                  </>
                )}

                {/* Step 2 - Verify Code */}
                {currentStep === 2 && (
                  <>
                    <div className="flex items-center mb-6">
                      <button onClick={() => setCurrentStep(1)} className="mr-4 p-2 hover:bg-gray-100 rounded-full" disabled={isLoading}>
                        <ArrowLeft className="w-5 h-5 text-studywise-gray-600" />
                      </button>
                      <div>
                        <h1 className="text-2xl font-bold text-studywise-gray-900">Check your email</h1>
                        <p className="text-studywise-gray-600">We sent a verification code to {formData.email}</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-studywise-gray-700 mb-2">Verification Code</label>
                      <input
                        type="text"
                        value={formData.verificationCode}
                        onChange={(e) => setFormData({ ...formData, verificationCode: e.target.value })}
                        placeholder="Enter 6-digit code"
                        className="w-full px-4 py-4 border border-studywise-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-center text-lg tracking-widest"
                        maxLength={6}
                        disabled={isLoading}
                      />
                      {errors.code && <p className="mt-2 text-sm text-red-600">{errors.code}</p>}
                    </div>

                    <Button
                      onClick={handleResetVerify}
                      disabled={formData.verificationCode.length !== 6 || isLoading}
                      className="w-full bg-primary hover:bg-blue-600 py-4 rounded-xl font-medium text-base"
                    >
                      {isLoading ? "Verifying..." : "Verify Code"}
                    </Button>

                    <div className="text-center">
                      <p className="text-sm text-studywise-gray-600">
                        Didn't receive the code?{" "}
                        <button disabled={isLoading} className="text-primary hover:underline font-medium">
                          Resend
                        </button>
                      </p>
                    </div>
                  </>
                )}

                {/* Step 3 - New Password */}
                {currentStep === 3 && (
                  <>
                    <div className="flex items-center mb-6">
                      <button onClick={() => setCurrentStep(2)} className="mr-4 p-2 hover:bg-gray-100 rounded-full" disabled={isLoading}>
                        <ArrowLeft className="w-5 h-5 text-studywise-gray-600" />
                      </button>
                      <div>
                        <h1 className="text-2xl font-bold text-studywise-gray-900">Create new password</h1>
                        <p className="text-studywise-gray-600">Choose a strong password for your account.</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-studywise-gray-700 mb-2">New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-studywise-gray-400" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={formData.newPassword}
                          onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                          placeholder="Create a secure password"
                          className="w-full pl-10 pr-12 py-4 border border-studywise-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-base"
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                          disabled={isLoading}
                        >
                          {showPassword ? <EyeOff className="w-5 h-5 text-studywise-gray-400" /> : <Eye className="w-5 h-5 text-studywise-gray-400" />}
                        </button>
                      </div>
                      
                      {formData.newPassword && (
                        <div className="mt-3 space-y-2">
                          <div className={`flex items-center text-sm ${passwordValidation.minLength ? 'text-green-600' : 'text-studywise-gray-500'}`}>
                            <Check className={`w-4 h-4 mr-2 ${passwordValidation.minLength ? 'text-green-600' : 'text-gray-300'}`} />
                            At least 8 characters
                          </div>
                          <div className={`flex items-center text-sm ${passwordValidation.hasNumber ? 'text-green-600' : 'text-studywise-gray-500'}`}>
                            <Check className={`w-4 h-4 mr-2 ${passwordValidation.hasNumber ? 'text-green-600' : 'text-gray-300'}`} />
                            1 number
                          </div>
                          <div className={`flex items-center text-sm ${passwordValidation.hasUppercase ? 'text-green-600' : 'text-studywise-gray-500'}`}>
                            <Check className={`w-4 h-4 mr-2 ${passwordValidation.hasUppercase ? 'text-green-600' : 'text-gray-300'}`} />
                            1 uppercase letter
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-studywise-gray-700 mb-2">Confirm Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-studywise-gray-400" />
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          placeholder="Confirm your password"
                          className="w-full pl-10 pr-12 py-4 border border-studywise-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-base"
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                          disabled={isLoading}
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5 text-studywise-gray-400" /> : <Eye className="w-5 h-5 text-studywise-gray-400" />}
                        </button>
                      </div>
                      {formData.confirmPassword && !passwordsMatch && (
                        <p className="mt-2 text-sm text-red-600">Passwords don't match</p>
                      )}
                      {passwordsMatch && (
                        <p className="mt-2 text-sm text-green-600 flex items-center">
                          <Check className="w-4 h-4 mr-1" />
                          Passwords match
                        </p>
                      )}
                    </div>

                    {errors.password && (
                      <p className="text-sm text-red-600">{errors.password}</p>
                    )}

                    <Button
                      onClick={handleResetPassword}
                      disabled={!isPasswordValid || !passwordsMatch || isLoading}
                      className="w-full bg-primary hover:bg-blue-600 py-4 rounded-xl font-medium text-base"
                    >
                      {isLoading ? "Updating..." : "Update Password"}
                    </Button>
                  </>
                )}

                {/* Step 4 - Success */}
                {currentStep === 4 && (
                  <div className="space-y-6 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    
                    <div>
                      <h1 className="text-2xl font-bold text-studywise-gray-900 mb-2">Password updated!</h1>
                      <p className="text-studywise-gray-600">
                        Your password has been successfully updated. You can now sign in with your new password.
                      </p>
                    </div>

                    <Button 
                      onClick={() => switchAuthMode("signin")}
                      className="w-full bg-primary hover:bg-blue-600 py-4 rounded-xl font-medium text-base"
                    >
                      Sign In
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Footer Links */}
            {!(authMode === "reset" && currentStep === 4) && (
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
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right side - Background text */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative z-10">
        <div className="text-center text-white px-8">
          <h2 className="text-5xl xl:text-6xl font-light leading-tight mb-4">
            {backgroundContent.title.split('\n').map((line, i) => (
              <span key={i}>
                {line}
                {i < backgroundContent.title.split('\n').length - 1 && <br />}
              </span>
            ))}
          </h2>
          <p className="text-xl opacity-90 max-w-md">
            {backgroundContent.subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}