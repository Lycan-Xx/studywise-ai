import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Mail, User, Target, ArrowLeft, Check, Eye, EyeOff } from "lucide-react";
import { Link } from "wouter";

export default function SignUp() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    password: "",
    learningGoal: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Password validation
  const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasNumber = /\d/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    return { minLength, hasNumber, hasUppercase };
  };

  const passwordValidation = validatePassword(formData.password);
  const isPasswordValid = passwordValidation.minLength && passwordValidation.hasNumber && passwordValidation.hasUppercase;

  // Handle step 1 - Email
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    // Simulate API call to check if email exists
    try {
      // Add your email validation API call here
      // const response = await checkEmailExists(formData.email);
      
      // For demo, we'll simulate the check
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // If email exists, show error
      if (formData.email === "existing@example.com") {
        setErrors({ email: "This email is already registered. Would you like to sign in instead?" });
        setIsLoading(false);
        return;
      }
      
      setCurrentStep(2);
    } catch (error) {
      setErrors({ email: "Something went wrong. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle step 2 - Name & Password
  const handleProfileSubmit = (e) => {
    e.preventDefault();
    if (!isPasswordValid) return;
    setCurrentStep(3);
  };

  // Handle step 3 - Learning Goal
  const handleGoalSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Add your account creation API call here
      // const response = await createAccount(formData);
      
      // Simulate account creation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect to dashboard or show success
      console.log("Account created:", formData);
      // window.location.href = "/dashboard";
    } catch (error) {
      setErrors({ general: "Failed to create account. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const learningGoals = [
    { value: "student", label: "I'm a Student" },
    { value: "teacher", label: "I'm a Teacher" },
    { value: "certification", label: "I'm preparing for a Certification or Career Exam" },
    { value: "other", label: "Other" }
  ];

  return (
    <div 
      className="min-h-screen w-full bg-cover bg-center bg-no-repeat relative flex"
      style={{
        backgroundImage: 'url("https://picsum.photos/1920/1080?random=1")',
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
              
              {/* Progress indicator */}
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
            </div>

            {/* Step 1 - Email */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-studywise-gray-900 mb-2">
                    Create your StudyWise AI account
                  </h1>
                  <p className="text-studywise-gray-600">
                    Start by entering your email address.
                  </p>
                </div>

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
                      className="w-full pl-10 pr-4 py-4 border border-studywise-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-base"
                      required
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <Button
                  onClick={handleEmailSubmit}
                  disabled={!formData.email || isLoading}
                  className="w-full bg-primary hover:bg-blue-600 py-4 rounded-xl font-medium text-base"
                >
                  {isLoading ? "Checking..." : "Continue"}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-studywise-gray-600">
                    Already have an account?{" "}
                    <Link href="/signin" className="text-primary hover:underline font-medium">
                      Sign in
                    </Link>
                  </p>
                </div>
              </div>
            )}

            {/* Step 2 - Profile */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center mb-6">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="mr-4 p-2 hover:bg-gray-100 rounded-full"
                  >
                    <ArrowLeft className="w-5 h-5 text-studywise-gray-600" />
                  </button>
                  <div>
                    <h1 className="text-2xl font-bold text-studywise-gray-900">
                      Set up your profile
                    </h1>
                    <p className="text-studywise-gray-600">
                      We'll use this to personalize your experience.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-studywise-gray-700 mb-2">
                    Full Name
                  </label>
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
                  <label className="block text-sm font-medium text-studywise-gray-700 mb-2">
                    Password
                  </label>
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
                      {showPassword ? (
                        <EyeOff className="w-5 h-5 text-studywise-gray-400" />
                      ) : (
                        <Eye className="w-5 h-5 text-studywise-gray-400" />
                      )}
                    </button>
                  </div>
                  
                  {/* Password validation */}
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
                  onClick={handleProfileSubmit}
                  disabled={!formData.fullName || !isPasswordValid}
                  className="w-full bg-primary hover:bg-blue-600 py-4 rounded-xl font-medium text-base"
                >
                  Continue
                </Button>
              </div>
            )}

            {/* Step 3 - Learning Goal */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex items-center mb-6">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="mr-4 p-2 hover:bg-gray-100 rounded-full"
                  >
                    <ArrowLeft className="w-5 h-5 text-studywise-gray-600" />
                  </button>
                  <div>
                    <h1 className="text-2xl font-bold text-studywise-gray-900">
                      Tell us what you want to achieve
                    </h1>
                    <p className="text-studywise-gray-600">
                      Choose a goal so we can personalize your tests.
                    </p>
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
                        formData.learningGoal === goal.value
                          ? 'border-primary bg-primary'
                          : 'border-studywise-gray-300'
                      }`}>
                        {formData.learningGoal === goal.value && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                      <span className="text-studywise-gray-900">{goal.label}</span>
                    </label>
                  ))}
                </div>

                <Button
                  onClick={handleGoalSubmit}
                  disabled={!formData.learningGoal || isLoading}
                  className="w-full bg-primary hover:bg-blue-600 py-4 rounded-xl font-medium text-base"
                >
                  {isLoading ? "Creating Account..." : "Finish & Create Account"}
                </Button>
              </div>
            )}

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

      {/* Right side - Background text */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative z-10">
        <div className="text-center text-white px-8">
          <h2 className="text-5xl xl:text-6xl font-light leading-tight mb-4">
            Transform your
            <br />
            study habits
          </h2>
          <p className="text-xl opacity-90 max-w-md">
            Join thousands of students who've already discovered the power of active learning
          </p>
        </div>
      </div>
    </div>
  );
}