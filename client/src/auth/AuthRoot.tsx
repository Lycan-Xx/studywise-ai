import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Mail, Lock, Eye, EyeOff, User, ArrowLeft, Check, CheckCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function AuthRoot() {
  const [authMode, setAuthMode] = useState("signin");
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
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signIn, signUp, signOut, resetPassword, updatePassword, signInWithGoogle, user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      setLocation('/dashboard');
    }
  }, [user, setLocation]);

  // Check for auth mode from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    if (mode === 'reset') {
      setAuthMode('reset');
      setCurrentStep(3); // Go to new password step
    }
  }, []);

  // Animation variants
  const cardVariants = {
    initial: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95
    }),
    animate: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        duration: 0.5
      }
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
      scale: 0.95,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        duration: 0.4
      }
    })
  };

  const backgroundVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { duration: 0.8, ease: "easeOut" }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.4 }
    }
  };

  // Reset form when switching modes
  const switchAuthMode = (mode: string) => {
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
  const validatePassword = (password: string) => {
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
      const { error } = await signIn(formData.email, formData.password);

      if (error) {
        setErrors({ general: error.message });
        return;
      }

      toast({
        title: "Welcome back!",
        description: "You've been successfully signed in.",
      });

      setLocation('/dashboard');
    } catch (error) {
      setErrors({ general: "An unexpected error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setErrors({});

    try {
      const { error } = await signInWithGoogle();

      if (error) {
        setErrors({ general: error.message });
      }
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
      // Just validate email format and move to next step
      if (!formData.email.includes('@')) {
        setErrors({ email: "Please enter a valid email address" });
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
    setErrors({});

    try {
      const { error } = await signUp(formData.email, formData.password, {
        full_name: formData.fullName,
        learning_goal: formData.learningGoal
      });

      if (error) {
        setErrors({ general: error.message });
        return;
      }

      toast({
        title: "Account created!",
        description: "Please check your email to verify your account.",
      });

      setAuthMode('signin');
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
      const { error } = await resetPassword(formData.email);

      if (error) {
        setErrors({ email: error.message });
        return;
      }

      toast({
        title: "Reset email sent!",
        description: "Check your email for password reset instructions.",
      });

      setCurrentStep(2);
    } catch (error) {
      setErrors({ email: "Failed to send reset email. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!isPasswordValid || !passwordsMatch) return;
    setIsLoading(true);
    setErrors({});

    try {
      const { error } = await updatePassword(formData.newPassword);

      if (error) {
        setErrors({ password: error.message });
        return;
      }

      setCurrentStep(4);
    } catch (error) {
      setErrors({ password: "Failed to update password. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const backgroundContent = getBackgroundContent();

  return (
    <div className="min-h-screen w-full relative flex overflow-hidden">
      {/* Animated Background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`bg-${authMode}`}
          variants={backgroundVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url("${backgroundContent.image}")`,
          }}
        />
      </AnimatePresence>

      {/* Background overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-40 z-10" />

      {/* Left side - Authentication Card */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8 relative z-20">
        <div className="w-full max-w-lg">
          <Card className="bg-white rounded-xl shadow-2xl border-0 overflow-hidden">
            <CardContent className="p-10 relative">
              {/* Header */}
              <div className="text-center mb-8">
                <Link href="/" className="inline-flex items-center justify-center mb-6">
                  <Brain className="w-8 h-8 text-primary mr-2" />
                  <span className="text-xl font-semibold text-studywise-gray-900">StudyWise AI</span>
                </Link>

                {/* Progress indicator for signup */}
                {authMode === "signup" && (
                  <motion.div 
                    className="mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                  >
                    <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                      <motion.div 
                        className="bg-gradient-to-r from-slate-800 to-slate-900 h-2 rounded-full shadow-sm" 
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentStep - 1) / 2) * 100}%` }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                      />
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-medium text-gray-500">
                        Step {currentStep} of 3
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Animated Content Container */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${authMode}-${currentStep}`}
                    custom={1}
                    variants={cardVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="space-y-6"
                  >
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
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl"
                          >
                            <p className="text-sm text-red-600">{errors.general}</p>
                          </motion.div>
                        )}

                        <div className="space-y-5">
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                          >
                            <label className="block text-sm font-medium text-studywise-gray-700 mb-2">Email</label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-studywise-gray-400" />
                              <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="you@example.com"
                                className="w-full pl-10 pr-4 py-4 border border-studywise-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-base transition-all duration-200"
                                disabled={isLoading || isGoogleLoading}
                              />
                            </div>
                          </motion.div>

                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                          >
                            <label className="block text-sm font-medium text-studywise-gray-700 mb-2">Password</label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-studywise-gray-400" />
                              <input
                                type={showPassword ? "text" : "password"}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="Enter your password"
                                className="w-full pl-10 pr-12 py-4 border border-studywise-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-base transition-all duration-200"
                                disabled={isLoading || isGoogleLoading}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors duration-200 hover:text-studywise-gray-600"
                                disabled={isLoading || isGoogleLoading}
                              >
                                {showPassword ? <EyeOff className="w-5 h-5 text-studywise-gray-400" /> : <Eye className="w-5 h-5 text-studywise-gray-400" />}
                              </button>
                            </div>
                          </motion.div>

                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                          >
                            <Button
                              onClick={handleSignIn}
                              disabled={!formData.email || !formData.password || isLoading || isGoogleLoading}
                              size="lg"
                              className="w-full px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-all duration-200"
                            >
                              {isLoading ? "Signing in..." : "Sign In"}
                            </Button>
                          </motion.div>
                        </div>

                        <motion.div 
                          className="relative my-6"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4 }}
                        >
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-studywise-gray-300" />
                          </div>
                          <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-studywise-gray-500">or</span>
                          </div>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                        >
                          <Button
                            onClick={handleGoogleLogin}
                            disabled={isLoading || isGoogleLoading}
                            variant="outline"
                            size="lg"
                            className="w-full border-2 px-8 py-3 border-black text-slate-700 hover:border-slate-300 hover:bg-slate-50 rounded-xl font-medium transition-all duration-200"
                          >
                            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                              <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                              <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            {isGoogleLoading ? "Connecting..." : "Continue with Google"}
                          </Button>
                        </motion.div>

                        <motion.div 
                          className="mt-8 space-y-4 text-center"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.6 }}
                        >
                          <button onClick={() => switchAuthMode("reset")} className="text-sm text-primary hover:underline transition-colors duration-200">
                            Forgot your password?
                          </button>
                          <p className="text-sm text-studywise-gray-600">
                            Don't have an account?{" "}
                            <button onClick={() => switchAuthMode("signup")} className="text-primary hover:underline font-medium transition-colors duration-200">
                              Sign up
                            </button>
                          </p>
                        </motion.div>
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

                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 }}
                            >
                              <label className="block text-sm font-medium text-studywise-gray-700 mb-2">Email</label>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-studywise-gray-400" />
                                <input
                                  type="email"
                                  value={formData.email}
                                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                  placeholder="you@example.com"
                                  className="w-full pl-10 pr-4 py-4 border border-studywise-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-base transition-all duration-200"
                                  required
                                />
                              </div>
                              {errors.email && (
                                <motion.p 
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="mt-2 text-sm text-red-600"
                                >
                                  {errors.email}
                                </motion.p>
                              )}
                            </motion.div>

                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.2 }}
                            >
                              <Button
                                onClick={handleSignUpEmail}
                                disabled={!formData.email || isLoading}
                                size="lg"
                                className="w-full px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-all duration-200"
                              >
                                {isLoading ? "Checking..." : "Continue"}
                              </Button>
                            </motion.div>

                            <motion.div 
                              className="text-center"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.3 }}
                            >
                              <p className="text-sm text-studywise-gray-600">
                                Already have an account?{" "}
                                <button onClick={() => switchAuthMode("signin")} className="text-primary hover:underline font-medium transition-colors duration-200">
                                  Sign in
                                </button>
                              </p>
                            </motion.div>
                          </>
                        )}

                        {/* Step 2 - Profile */}
                        {currentStep === 2 && (
                          <>
                            <div className="flex items-center mb-6">
                              <motion.button 
                                onClick={() => setCurrentStep(1)} 
                                className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <ArrowLeft className="w-5 h-5 text-studywise-gray-600" />
                              </motion.button>
                              <div>
                                <h1 className="text-2xl font-bold text-studywise-gray-900">Set up your profile</h1>
                                <p className="text-studywise-gray-600">We'll use this to personalize your experience.</p>
                              </div>
                            </div>

                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 }}
                            >
                              <label className="block text-sm font-medium text-studywise-gray-700 mb-2">Full Name</label>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-studywise-gray-400" />
                                <input
                                  type="text"
                                  value={formData.fullName}
                                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                  placeholder="Sarah Johnson"
                                  className="w-full pl-10 pr-4 py-4 border border-studywise-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-base transition-all duration-200"
                                  required
                                />
                              </div>
                            </motion.div>

                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.2 }}
                            >
                              <label className="block text-sm font-medium text-studywise-gray-700 mb-2">Password</label>
                              <div className="relative">
                                <input
                                  type={showPassword ? "text" : "password"}
                                  value={formData.password}
                                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                  placeholder="Create a secure password"
                                  className="w-full pl-4 pr-12 py-4 border border-studywise-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-base transition-all duration-200"
                                  required
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors duration-200 hover:text-studywise-gray-600"
                                >
                                  {showPassword ? <EyeOff className="w-5 h-5 text-studywise-gray-400" /> : <Eye className="w-5 h-5 text-studywise-gray-400" />}
                                </button>
                              </div>

                              {formData.password && (
                                <motion.div 
                                  className="mt-3 space-y-2"
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <motion.div 
                                    className={`flex items-center text-sm ${passwordValidation.minLength ? 'text-green-600' : 'text-studywise-gray-500'}`}
                                    animate={{ color: passwordValidation.minLength ? '#16a34a' : '#6b7280' }}
                                  >
                                    <Check className={`w-4 h-4 mr-2 ${passwordValidation.minLength ? 'text-green-600' : 'text-gray-300'}`} />
                                    At least 8 characters
                                  </motion.div>
                                  <motion.div 
                                    className={`flex items-center text-sm ${passwordValidation.hasNumber ? 'text-green-600' : 'text-studywise-gray-500'}`}
                                    animate={{ color: passwordValidation.hasNumber ? '#16a34a' : '#6b7280' }}
                                  >
                                    <Check className={`w-4 h-4 mr-2 ${passwordValidation.hasNumber ? 'text-green-600' : 'text-gray-300'}`} />
                                    1 number
                                  </motion.div>
                                  <motion.div 
                                    className={`flex items-center text-sm ${passwordValidation.hasUppercase ? 'text-green-600' : 'text-studywise-gray-500'}`}
                                    animate={{ color: passwordValidation.hasUppercase ? '#16a34a' : '#6b7280' }}
                                  >
                                    <Check className={`w-4 h-4 mr-2 ${passwordValidation.hasUppercase ? 'text-green-600' : 'text-gray-300'}`} />
                                    1 uppercase letter
                                  </motion.div>
                                </motion.div>
                              )}
                            </motion.div>

                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.4 }}
                            >
                              <Button
                                onClick={handleSignUpProfile}
                                disabled={!formData.fullName || !isPasswordValid}
                                size="lg"
                                className="w-full px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-all duration-200"
                              >
                                Continue
                              </Button>
                            </motion.div>
                          </>
                        )}

                        {/* Step 3 - Learning Goal */}
                        {currentStep === 3 && (
                          <>
                            <div className="flex items-center mb-6">
                              <motion.button 
                                onClick={() => setCurrentStep(2)} 
                                className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <ArrowLeft className="w-5 h-5 text-studywise-gray-600" />
                              </motion.button>
                              <div>
                                <h1 className="text-2xl font-bold text-studywise-gray-900">Tell us what you want to achieve</h1>
                                <p className="text-studywise-gray-600">Choose a goal so we can personalize your tests.</p>
                              </div>
                            </div>

                            <motion.div 
                              className="space-y-3"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.1 }}
                            >
                              {learningGoals.map((goal, index) => (
                                <motion.label
                                  key={goal.value}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.1 + index * 0.1 }}
                                  className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all duration-200 ${
                                    formData.learningGoal === goal.value
                                      ? 'border-primary bg-blue-50 scale-[1.02]'
                                      : 'border-studywise-gray-300 hover:bg-gray-50 hover:scale-[1.01]'
                                  }`}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <input
                                    type="radio"
                                    name="learningGoal"
                                    value={goal.value}
                                    checked={formData.learningGoal === goal.value}
                                    onChange={(e) => setFormData({ ...formData, learningGoal: e.target.value })}
                                    className="sr-only"
                                  />
                                  <motion.div 
                                    className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                                      formData.learningGoal === goal.value ? 'border-primary bg-primary' : 'border-studywise-gray-300'
                                    }`}
                                    animate={{
                                      borderColor: formData.learningGoal === goal.value ? '#3b82f6' : '#d1d5db',
                                      backgroundColor: formData.learningGoal === goal.value ? '#3b82f6' : 'transparent'
                                    }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    {formData.learningGoal === goal.value && (
                                      <motion.div 
                                        className="w-2 h-2 bg-white rounded-full"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ duration: 0.2 }}
                                      />
                                    )}
                                  </motion.div>
                                  <span className="text-studywise-gray-900">{goal.label}</span>
                                </motion.label>
                              ))}
                            </motion.div>

                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.5 }}
                            >
                              <Button
                                onClick={handleSignUpComplete}
                                disabled={!formData.learningGoal || isLoading}
                                size="lg"
                                className="w-full px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-all duration-200"
                              >
                                {isLoading ? "Creating Account..." : "Finish & Create Account"}
                              </Button>
                            </motion.div>
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

                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 }}
                            >
                              <label className="block text-sm font-medium text-studywise-gray-700 mb-2">Email</label>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-studywise-gray-400" />
                                <input
                                  type="email"
                                  value={formData.email}
                                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                  placeholder="you@example.com"
                                  className="w-full pl-10 pr-4 py-4 border border-studywise-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-base transition-all duration-200"
                                  disabled={isLoading}
                                />
                              </div>
                              {errors.email && (
                                <motion.p 
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="mt-2 text-sm text-red-600"
                                >
                                  {errors.email}
                                </motion.p>
                              )}
                            </motion.div>

                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.2 }}
                            >
                              <Button
                                onClick={handleResetEmail}
                                disabled={!formData.email || isLoading}
                                size="lg"
                                className="w-full px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-all duration-200"
                              >
                                {isLoading ? "Sending..." : "Send Reset Link"}
                              </Button>
                            </motion.div>

                            <motion.div 
                              className="text-center"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.3 }}
                            >
                              <button onClick={() => switchAuthMode("signin")} className="text-sm text-studywise-gray-600 hover:text-studywise-gray-800 transition-colors duration-200">
                                Back to sign in
                              </button>
                            </motion.div>
                          </>
                        )}

                        {/* Step 2 - Email Sent */}
                        {currentStep === 2 && (
                          <motion.div 
                            className="space-y-6 text-center"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                          >
                            <motion.div 
                              className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6"
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ delay: 0.2, duration: 0.6, type: "spring", stiffness: 200 }}
                            >
                              <Mail className="w-8 h-8 text-blue-600" />
                            </motion.div>

                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.4 }}
                            >
                              <h1 className="text-2xl font-bold text-studywise-gray-900 mb-2">Check your email</h1>
                              <p className="text-studywise-gray-600">
                                We've sent a password reset link to {formData.email}. Click the link in the email to reset your password.
                              </p>
                            </motion.div>

                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.6 }}
                            >
                              <Button 
                                onClick={() => switchAuthMode("signin")}
                                size="lg"
                                className="w-full px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-all duration-200"
                              >
                                Back to Sign In
                              </Button>
                            </motion.div>
                          </motion.div>
                        )}

                        {/* Step 3 - New Password (accessed via email link) */}
                        {currentStep === 3 && (
                          <>
                            <div className="text-center mb-6">
                              <h1 className="text-2xl font-bold text-studywise-gray-900">Create new password</h1>
                              <p className="text-studywise-gray-600">Choose a strong password for your account.</p>
                            </div>

                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 }}
                            >
                              <label className="block text-sm font-medium text-studywise-gray-700 mb-2">New Password</label>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-studywise-gray-400" />
                                <input
                                  type={showPassword ? "text" : "password"}
                                  value={formData.newPassword}
                                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                  placeholder="Create a secure password"
                                  className="w-full pl-10 pr-12 py-4 border border-studywise-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-base transition-all duration-200"
                                  disabled={isLoading}
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors duration-200 hover:text-studywise-gray-600"
                                  disabled={isLoading}
                                >
                                  {showPassword ? <EyeOff className="w-5 h-5 text-studywise-gray-400" /> : <Eye className="w-5 h-5 text-studywise-gray-400" />}
                                </button>
                              </div>

                              {formData.newPassword && (
                                <motion.div 
                                  className="mt-3 space-y-2"
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <motion.div 
                                    className={`flex items-center text-sm ${passwordValidation.minLength ? 'text-green-600' : 'text-studywise-gray-500'}`}
                                    animate={{ color: passwordValidation.minLength ? '#16a34a' : '#6b7280' }}
                                  >
                                    <Check className={`w-4 h-4 mr-2 ${passwordValidation.minLength ? 'text-green-600' : 'text-gray-300'}`} />
                                    At least 8 characters
                                  </motion.div>
                                  <motion.div 
                                    className={`flex items-center text-sm ${passwordValidation.hasNumber ? 'text-green-600' : 'text-studywise-gray-500'}`}
                                    animate={{ color: passwordValidation.hasNumber ? '#16a34a' : '#6b7280' }}
                                  >
                                    <Check className={`w-4 h-4 mr-2 ${passwordValidation.hasNumber ? 'text-green-600' : 'text-gray-300'}`} />
                                    1 number
                                  </motion.div>
                                  <motion.div 
                                    className={`flex items-center text-sm ${passwordValidation.hasUppercase ? 'text-green-600' : 'text-studywise-gray-500'}`}
                                    animate={{ color: passwordValidation.hasUppercase ? '#16a34a' : '#6b7280' }}
                                  >
                                    <Check className={`w-4 h-4 mr-2 ${passwordValidation.hasUppercase ? 'text-green-600' : 'text-gray-300'}`} />
                                    1 uppercase letter
                                  </motion.div>
                                </motion.div>
                              )}
                            </motion.div>

                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.2 }}
                            >
                              <label className="block text-sm font-medium text-studywise-gray-700 mb-2">Confirm Password</label>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-studywise-gray-400" />
                                <input
                                  type={showConfirmPassword ? "text" : "password"}
                                  value={formData.confirmPassword}
                                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                  placeholder="Confirm your password"
                                  className="w-full pl-10 pr-12 py-4 border border-studywise-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-base transition-all duration-200"
                                  disabled={isLoading}
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors duration-200 hover:text-studywise-gray-600"
                                  disabled={isLoading}
                                >
                                  {showConfirmPassword ? <EyeOff className="w-5 h-5 text-studywise-gray-400" /> : <Eye className="w-5 h-5 text-studywise-gray-400" />}
                                </button>
                              </div>
                              {formData.confirmPassword && !passwordsMatch && (
                                <motion.p 
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="mt-2 text-sm text-red-600"
                                >
                                  Passwords don't match
                                </motion.p>
                              )}
                              {passwordsMatch && (
                                <motion.p 
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="mt-2 text-sm text-green-600 flex items-center"
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  Passwords match
                                </motion.p>
                              )}
                            </motion.div>

                            {errors.password && (
                              <motion.p 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-sm text-red-600"
                              >
                                {errors.password}
                              </motion.p>
                            )}

                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3 }}
                            >
                              <Button
                                onClick={handleResetPassword}
                                disabled={!isPasswordValid || !passwordsMatch || isLoading}
                                size="lg"
                                className="w-full px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-all duration-200"
                              >
                                {isLoading ? "Updating..." : "Update Password"}
                              </Button>
                            </motion.div>
                          </>
                        )}

                        {/* Step 4 - Success */}
                        {currentStep === 4 && (
                          <motion.div 
                            className="space-y-6 text-center"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                          >
                            <motion.div 
                              className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ delay: 0.2, duration: 0.6, type: "spring", stiffness: 200 }}
                            >
                              <CheckCircle className="w-8 h-8 text-green-600" />
                            </motion.div>

                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.4 }}
                            >
                              <h1 className="text-2xl font-bold text-studywise-gray-900 mb-2">Password updated!</h1>
                              <p className="text-studywise-gray-600">
                                Your password has been successfully updated. You can now sign in with your new password.
                              </p>
                            </motion.div>

                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.6 }}
                            >
                              <Button 
                                onClick={() => switchAuthMode("signin")}
                                size="lg"
                                className="w-full px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-all duration-200"
                              >
                                Sign In
                              </Button>
                            </motion.div>
                          </motion.div>
                        )}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Footer Links */}
                {!(authMode === "reset" && (currentStep === 2 || currentStep === 4)) && (
                  <motion.div 
                    className="mt-8 pt-6 border-t border-studywise-gray-200"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                  >
                    <div className="flex justify-center space-x-6 text-sm text-studywise-gray-500">
                      <Link href="/privacy-policy" className="hover:text-studywise-gray-700 transition-colors duration-200">
                        Privacy Policy
                      </Link>
                      <Link href="/terms-of-service" className="hover:text-studywise-gray-700 transition-colors duration-200">
                        Terms of Service
                      </Link>
                    </div>
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right side - Animated Background text */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative z-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={`text-${authMode}`}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center text-white px-8"
          >
            <motion.h2 
              className="text-5xl xl:text-6xl font-light leading-tight mb-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              {backgroundContent.title.split('\n').map((line, i) => (
                <span key={i}>
                  {line}
                  {i < backgroundContent.title.split('\n').length - 1 && <br />}
                </span>
              ))}
            </motion.h2>
            <motion.p 
              className="text-xl opacity-90 max-w-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 0.9, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              {backgroundContent.subtitle}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}