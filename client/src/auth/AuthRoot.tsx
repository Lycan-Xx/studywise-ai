import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, User, ArrowLeft, CheckCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

export default function AuthRoot() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: "",
    learningGoal: ""
  });
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{general?: string; learningGoal?: string}>({});

  const { signInWithGoogle, user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Handle user redirect and OAuth completion
  useEffect(() => {
    const handleAuthRedirect = async () => {
      if (!user) return;

      const params = new URLSearchParams(window.location.search);
      const step = params.get('step');
      const isOAuth = params.get('oauth') === 'true';

      // Special handling for OAuth users who need to complete profile
      if (step === '2' && isOAuth) {
        try {
          // Check if profile has learning_goal
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('learning_goal')
            .eq('id', user.id)
            .single();

          if (!error && !profile?.learning_goal) {
            // User needs to complete profile, don't redirect
            setCurrentStep(2);
            // Pre-fill data from OAuth
            if (user?.user_metadata?.full_name) {
              setFormData(prev => ({
                ...prev,
                fullName: user.user_metadata.full_name
              }));
            }
            return; // Don't redirect to dashboard
          }
        } catch (err) {
          console.error('Error checking profile:', err);
        }
      }

      // For authenticated users with complete profiles, redirect to dashboard
      setLocation('/dashboard');
    };

    handleAuthRedirect();
  }, [user, setLocation]);

  // Check for OAuth completion in URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const step = params.get('step');
    const oauth = params.get('oauth');

    if (step === '2' && oauth === 'true' && !user) {
      // Set the step for OAuth but don't process if no user yet
      setCurrentStep(2);
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
    }
  };

  // Learning goals options
  const learningGoals = [
    { value: "student", label: "I'm a Student" },
    { value: "teacher", label: "I'm a Teacher" },
    { value: "certification", label: "I'm preparing for a Certification or Career Exam" },
    { value: "other", label: "Other" }
  ];

  // Background content
  const backgroundContent = {
    image: "https://picsum.photos/1920/1080?random=1",
    title: "Transform your\nstudy habits",
    subtitle: "Join thousands of students who've already discovered the power of active learning"
  };

  // Auth handlers
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

  const handleCompleteProfile = async () => {
    if (!formData.learningGoal) {
      setErrors({ learningGoal: "Please select a learning goal" });
      return;
    }

    setIsGoogleLoading(true);
    setErrors({});

    try {
      if (user) {
        // Update user profile with learning goal and name
        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            full_name: formData.fullName || user.user_metadata?.full_name,
            learning_goal: formData.learningGoal
          });

        if (error) {
          setErrors({ general: "Failed to update profile. Please try again." });
          return;
        }

        toast({
          title: "Welcome to StudyWise AI!",
          description: "Your profile has been completed. Let's start learning!",
        });

        setCurrentStep(3); // Show success step briefly
        setTimeout(() => setLocation('/dashboard'), 1500);
      }
    } catch (error) {
      setErrors({ general: "Failed to complete profile. Please try again." });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex overflow-hidden">
      {/* Animated Background */}
      <motion.div
        variants={backgroundVariants}
        initial="initial"
        animate="animate"
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url("${backgroundContent.image}")`,
        }}
      />

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

                {/* Progress indicator for profile completion */}
                {currentStep === 2 && (
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
                        animate={{ width: "66%" }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                      />
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-medium text-gray-500">
                        Step 2 of 3
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Animated Content Container */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`step-${currentStep}`}
                    custom={1}
                    variants={cardVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="space-y-6"
                  >
                    {/* Step 1 - Google Sign In */}
                    {currentStep === 1 && (
                      <div className="space-y-8">
                        <div className="text-center mb-8">
                          <h1 className="text-3xl font-bold text-studywise-gray-900 mb-4">
                            Welcome to StudyWise AI
                          </h1>
                          <p className="text-lg text-studywise-gray-600">
                            Sign in with Google to start your learning journey
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

                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="space-y-6"
                        >
                          <Button
                            onClick={handleGoogleLogin}
                            disabled={isGoogleLoading}
                            size="lg"
                            className="w-full border-2 px-8 py-4 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 rounded-xl font-medium transition-all duration-200 bg-white"
                          >
                            <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                              <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                              <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                              <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                              <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            <span className="text-lg">
                              {isGoogleLoading ? "Connecting..." : "Continue with Google"}
                            </span>
                          </Button>

                          <div className="text-center">
                            <p className="text-sm text-studywise-gray-500 max-w-md mx-auto leading-relaxed">
                              By continuing, you agree to our{" "}
                              <Link href="/terms-of-service" className="text-primary hover:underline">
                                Terms of Service
                              </Link>{" "}
                              and{" "}
                              <Link href="/privacy-policy" className="text-primary hover:underline">
                                Privacy Policy
                              </Link>
                            </p>
                          </div>
                        </motion.div>
                      </div>
                    )}

                    {/* Step 2 - Complete Profile */}
                    {currentStep === 2 && (
                      <div className="space-y-6">
                        <div className="flex items-start mb-6">
                          <div>
                            <h1 className="text-2xl font-bold text-studywise-gray-900 mb-2">
                              Complete your profile
                            </h1>
                            <p className="text-studywise-gray-600">
                              Help us personalize your learning experience
                            </p>
                          </div>
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

                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          <div className="relative">
                            <label className="absolute -top-2 left-3 bg-white px-1 text-xs font-medium text-studywise-gray-700 z-10">
                              Full Name (Optional)
                            </label>
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-studywise-gray-400" />
                            <input
                              type="text"
                              value={formData.fullName}
                              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                              placeholder={user?.user_metadata?.full_name || "Enter your name"}
                              className="w-full pl-10 pr-4 py-4 border border-studywise-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-base transition-all duration-200"
                            />
                          </div>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <div className="space-y-3">
                            <label className="block text-sm font-medium text-studywise-gray-700 mb-3">
                              What's your learning goal?
                            </label>
                            {learningGoals.map((goal, index) => (
                              <motion.label
                                key={goal.value}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + index * 0.1 }}
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
                                    formData.learningGoal === goal.value 
                                      ? 'border-primary bg-primary' 
                                      : 'border-studywise-gray-300'
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
                                <span className="text-studywise-gray-900 font-medium">{goal.label}</span>
                              </motion.label>
                            ))}
                          </div>
                          {errors.learningGoal && (
                            <motion.p
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mt-2 text-sm text-red-600"
                            >
                              {errors.learningGoal}
                            </motion.p>
                          )}
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.7 }}
                        >
                          <Button
                            onClick={handleCompleteProfile}
                            disabled={!formData.learningGoal || isGoogleLoading}
                            size="lg"
                            className="w-full px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-all duration-200"
                          >
                            {isGoogleLoading ? "Completing..." : "Complete Profile & Start Learning"}
                          </Button>
                        </motion.div>
                      </div>
                    )}

                    {/* Step 3 - Success */}
                    {currentStep === 3 && (
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
                          <h1 className="text-2xl font-bold text-studywise-gray-900 mb-2">
                            Welcome to StudyWise AI!
                          </h1>
                          <p className="text-studywise-gray-600">
                            Your profile is complete. Redirecting you to your dashboard...
                          </p>
                        </motion.div>
                      </motion.div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right side - Animated Background text */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative z-20">
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
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
      </div>
    </div>
  );
}