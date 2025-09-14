import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, User, CheckCircle, ArrowRight } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

export default function AuthRoot() {
  const [currentStep, setCurrentStep] = useState(1); // Start with sign in step
  const [formData, setFormData] = useState({
    fullName: "",
    learningGoal: ""
  });
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [errors, setErrors] = useState<{general?: string; learningGoal?: string}>({});

  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Handle user authentication and profile checking
  useEffect(() => {
    const handleAuthRedirect = async () => {
      const params = new URLSearchParams(window.location.search);
      const step = params.get('step');
      const isOAuth = params.get('oauth') === 'true';

      // Show OAuth loading if returning from OAuth and still loading
      if (isOAuth && loading && !user) {
        setIsOAuthLoading(true);
        setCurrentStep(0);
        return;
      }

      if (loading || !user) return;

      // Clear OAuth loading when user is authenticated
      setIsOAuthLoading(false);

      try {
        // Check user profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('learning_goal, full_name')
          .eq('id', user.id)
          .single();

        if (!error && profile?.learning_goal) {
          // Returning user with complete profile
          setIsReturningUser(true);
          setUserProfile(profile);
          setCurrentStep(4); // Welcome back step
          return;
        }

        // New user or incomplete profile
        if (step === '2' && isOAuth) {
          // OAuth user needs to complete profile
          setCurrentStep(2);
          if (user?.user_metadata?.full_name) {
            setFormData(prev => ({
              ...prev,
              fullName: user.user_metadata.full_name
            }));
          }
        } else {
          // Regular authenticated user without OAuth flow - redirect to dashboard
          setLocation('/dashboard');
        }
      } catch (err) {
        console.error('Error checking profile:', err);
        // On error, assume new user and show profile completion
        if (step === '2' && isOAuth) {
          setCurrentStep(2);
          if (user?.user_metadata?.full_name) {
            setFormData(prev => ({
              ...prev,
              fullName: user.user_metadata.full_name
            }));
          }
        }
      }
    };

    handleAuthRedirect();
  }, [user, loading, setLocation]);

  // Initialize step for unauthenticated users
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isOAuth = params.get('oauth') === 'true';

    if (loading && isOAuth) {
      setCurrentStep(0); // OAuth loading step
    } else if (!loading && !user) {
      setCurrentStep(1); // Sign in step for unauthenticated users
    }
  }, [user, loading]);

  // Animation variants
  const cardVariants = {
    initial: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
      scale: 0.9,
      filter: "blur(10px)"
    }),
    animate: {
      x: 0,
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20,
        duration: 0.5
      }
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -100 : 100,
      opacity: 0,
      scale: 0.9,
      filter: "blur(10px)",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
        duration: 0.5
      }
    })
  };

  const backgroundVariants = {
    initial: { opacity: 0, scale: 1.1 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  const floatingParticles = {
    animate: {
      y: [0, -20, 0],
      opacity: [0.3, 0.6, 0.3],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // Learning goals options
  const learningGoals = [
    { value: "student", label: "I'm a Student" },
    { value: "teacher", label: "I'm a Teacher" },
    { value: "other", label: "Other" }
  ];

  // Background content
  const backgroundContent = {
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2560&auto=format&fit=crop",
    title: "Transform your\nstudy habits",
    subtitle: "Join thousands of students who've already discovered the power of active learning"
  };

  // Auth handlers
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setErrors({});

    try {
      const { signInWithGoogle } = await import("@/contexts/AuthContext");
      // This will trigger the useEffect above when user state changes
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


        setCurrentStep(3); // Show success step
      }
    } catch (error) {
      setErrors({ general: "Failed to complete profile. Please try again." });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoToDashboard = () => {
    setLocation('/dashboard');
  };

  const { signInWithGoogle } = useAuth();

  const handleActualGoogleLogin = async () => {
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

      {/* Floating particles */}
      <div className="absolute inset-0 z-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            variants={floatingParticles}
            animate="animate"
            className="absolute w-2 h-2 bg-white/20 rounded-full blur-sm"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 3) * 20}%`,
              animationDelay: `${i * 0.5}s`
            }}
          />
        ))}
      </div>

      {/* Unified background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-black/40 to-black z-10" />

              {/* Background blur behind card */}
        <div className="absolute inset-0 backdrop-blur-lg bg-black/60 z-10" />

        
      {/* Left side - Authentication Card */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8 relative z-20">
        <div className="w-full max-w-lg relative z-20">
          {/* Glassmorphism card effect */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="backdrop-blur-3xl bg-gray-900/20 border border-white/20 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-10 relative">
              {/* Subtle top highlight */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              
              {/* Header */}
              <div className="text-center mb-8 relative z-10">
                <Link href="/" className="inline-flex items-center justify-center mb-6">
                  <Brain className="w-8 h-8 text-white mr-2" />
                  <span className="text-xl font-semibold text-white text-nowrap">StudyWise AI</span>
                </Link>

                {/* Progress indicator for profile completion */}
                {currentStep === 2 && (
                  <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                  >
                    <div className="w-full bg-white/20 rounded-full h-2 mb-2 backdrop-blur-sm">
                      <motion.div
                        className="bg-gradient-to-r from-white/60 to-white/80 h-2 rounded-full shadow-sm"
                        initial={{ width: 0 }}
                        animate={{ width: "66%" }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-medium text-white/70">
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
                    className="space-y-6 relative z-10"
                  >
                    {/* Step 0 - OAuth Loading */}
                    {currentStep === 0 && (
                      <div className="space-y-8 text-center">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                          className="mx-auto w-20 h-20 bg-gradient-to-br from-white/20 to-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30"
                        >
                          <Brain className="w-10 h-10 text-white animate-pulse" />
                        </motion.div>

                        <div>
                          <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-3xl font-bold text-white mb-4"
                          >
                            Signing you in...
                          </motion.h1>
                          <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="text-xl text-white/80 font-medium"
                          >
                            Please wait while we authenticate your account
                          </motion.p>
                        </div>

                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.8 }}
                          className="space-y-4"
                        >
                          <div className="flex justify-center">
                            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          </div>
                          <p className="text-white/60">This will only take a moment...</p>
                        </motion.div>
                      </div>
                    )}

                    {/* Step 1 - Google Sign In */}
                    {currentStep === 1 && (
                      <div className="space-y-8">
                        <div className="text-center mb-8">
                          <h1 className="text-3xl font-bold text-white mb-4">
                            Welcome to StudyWise AI
                          </h1>
                          <p className="text-lg text-white/80">
                            Sign in with Google to start your learning journey
                          </p>
                        </div>

                        {errors.general && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl backdrop-blur-sm"
                          >
                            <p className="text-sm text-white">{errors.general}</p>
                          </motion.div>
                        )}

                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="space-y-6"
                        >
                          <Button
                            onClick={handleActualGoogleLogin}
                            disabled={isGoogleLoading}
                            size="lg"
                            className="w-full border-2 px-8 py-4 border-white/30 text-white hover:border-white/50 hover:bg-white/10 rounded-xl font-medium transition-all duration-300 bg-white/20 backdrop-blur-sm"
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
                            <p className="text-sm text-white/60 max-w-md mx-auto leading-relaxed">
                              By continuing, you agree to our{" "}
                              <Link href="/terms-of-service" className="text-white hover:underline">
                                Terms of Service
                              </Link>{" "}
                              and{" "}
                              <Link href="/privacy-policy" className="text-white hover:underline">
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
                            <h1 className="text-2xl font-bold text-white mb-2">
                              Complete your profile
                            </h1>
                            <p className="text-white/80">
                              Help us personalize your learning experience
                            </p>
                          </div>
                        </div>

                        {errors.general && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl backdrop-blur-sm"
                          >
                            <p className="text-sm text-white">{errors.general}</p>
                          </motion.div>
                        )}

                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          <div className="relative">
                            <label className="absolute -top-2 left-3 bg-gray-900/50 backdrop-blur-sm px-2 text-xs font-medium text-white z-10 rounded">
                              Full Name (Optional)
                            </label>
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                            <input
                              type="text"
                              value={formData.fullName}
                              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                              placeholder={user?.user_metadata?.full_name || "Enter your name"}
                              className="w-full pl-10 pr-4 py-4 border border-white/30 bg-white/10 backdrop-blur-sm rounded-xl focus:ring-2 focus:ring-white/50 focus:border-white/50 outline-none text-base text-white placeholder-white/50 transition-all duration-300"
                            />
                          </div>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <div className="space-y-3">
                            <label className="block text-sm font-medium text-white mb-3">
                              What's your learning goal?
                            </label>
                            {learningGoals.map((goal, index) => (
                              <motion.label
                                key={goal.value}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + index * 0.1 }}
                                className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all duration-300 backdrop-blur-sm ${
                                  formData.learningGoal === goal.value
                                    ? 'border-white/60 bg-white/20 scale-[1.02]'
                                    : 'border-white/30 bg-white/10 hover:bg-white/15 hover:scale-[1.01]'
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
                                      ? 'border-white bg-white' 
                                      : 'border-white/50'
                                  }`}
                                  animate={{
                                    borderColor: formData.learningGoal === goal.value ? '#ffffff' : 'rgba(255,255,255,0.5)',
                                    backgroundColor: formData.learningGoal === goal.value ? '#ffffff' : 'transparent'
                                  }}
                                  transition={{ duration: 0.2 }}
                                >
                                  {formData.learningGoal === goal.value && (
                                    <motion.div
                                      className="w-2 h-2 bg-black rounded-full"
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{ duration: 0.2 }}
                                    />
                                  )}
                                </motion.div>
                                <span className="text-white font-medium">{goal.label}</span>
                              </motion.label>
                            ))}
                          </div>
                          {errors.learningGoal && (
                            <motion.p
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mt-2 text-sm text-red-400"
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
                            className="w-full px-8 py-4 bg-white/90 hover:bg-white text-black rounded-xl font-medium transition-all duration-300 backdrop-blur-sm"
                          >
                            {isGoogleLoading ? "Completing..." : "Complete Profile & Start Learning"}
                          </Button>
                        </motion.div>
                      </div>
                    )}

                    {/* Step 3 - Success (New User) */}
                    {currentStep === 3 && (
                      <motion.div
                        className="space-y-8 text-center"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                      >
                        <motion.div
                          className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 border border-white/30"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: 0.2, duration: 0.6, type: "spring", stiffness: 200 }}
                        >
                          <CheckCircle className="w-10 h-10 text-green-400" />
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                        >
                          <h1 className="text-2xl font-bold text-white mb-4">
                            Welcome to StudyWise AI!
                          </h1>
                          <p className="text-white/80 mb-8">
                            Your profile is complete. Ready to start your learning journey?
                          </p>
                          
                          <Button
                            onClick={handleGoToDashboard}
                            size="lg"
                            className="bg-white/90 hover:bg-white text-black px-8 py-3 rounded-xl font-medium transition-all duration-300 backdrop-blur-sm inline-flex items-center"
                          >
                            Proceed to Dashboard
                            <ArrowRight className="w-5 h-5 ml-2" />
                          </Button>
                        </motion.div>
                      </motion.div>
                    )}

                    {/* Step 4 - Welcome Back (Returning User) */}
                    {currentStep === 4 && isReturningUser && (
                      <motion.div
                        className="space-y-8 text-center"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                      >
                        <motion.div
                          className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 border border-white/30"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                        >
                          <Brain className="w-10 h-10 text-white" />
                        </motion.div>
                        
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                        >
                          <h1 className="text-2xl font-bold text-white mb-2">
                            Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name.split(' ')[0]}` : ''}!
                          </h1>
                          <p className="text-white/80 mb-8">
                            Great to see you again. Ready to continue learning?
                          </p>

                          <Button
                            onClick={handleGoToDashboard}
                            size="lg"
                            className="bg-white/90 hover:bg-white text-black px-8 py-3 rounded-xl font-medium transition-all duration-300 backdrop-blur-sm inline-flex items-center"
                          >
                            Go to Dashboard
                            <ArrowRight className="w-5 h-5 ml-2" />
                          </Button>
                        </motion.div>
                      </motion.div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right side - Animated Background text */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative z-20">
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center text-white px-8"
        >
          <motion.h2
            className="text-5xl xl:text-6xl font-light leading-tight mb-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
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
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            {backgroundContent.subtitle}
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}