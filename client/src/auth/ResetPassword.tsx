import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Mail, Lock, ArrowLeft, Check, Eye, EyeOff, CheckCircle } from "lucide-react";
import { Link } from "wouter";

export default function ResetPassword() {
  const [currentStep, setCurrentStep] = useState(1); // 1: email, 2: verify, 3: new password, 4: success
  const [formData, setFormData] = useState({
    email: "",
    verificationCode: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Password validation
  const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasNumber = /\d/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    return { minLength, hasNumber, hasUppercase };
  };

  const passwordValidation = validatePassword(formData.newPassword);
  const isPasswordValid = passwordValidation.minLength && passwordValidation.hasNumber && passwordValidation.hasUppercase;
  const passwordsMatch = formData.newPassword === formData.confirmPassword && formData.confirmPassword.length > 0;

  // Handle step 1 - Email submission
  const handleEmailSubmit = async () => {
    setIsLoading(true);
    setErrors({});

    try {
      // Add your password reset email API call here
      // const response = await sendPasswordResetEmail(formData.email);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo, simulate email not found
      if (formData.email === "notfound@example.com") {
        setErrors({ email: "No account found with this email address." });
        setIsLoading(false);
        return;
      }
      
      setCurrentStep(2);
    } catch (error) {
      setErrors({ email: "Failed to send reset email. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle step 2 - Verification code
  const handleVerificationSubmit = async () => {
    setIsLoading(true);
    setErrors({});

    try {
      // Add your verification code API call here
      // const response = await verifyResetCode(formData.email, formData.verificationCode);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // For demo, simulate invalid code
      if (formData.verificationCode !== "123456") {
        setErrors({ code: "Invalid verification code. Please check your email and try again." });
        setIsLoading(false);
        return;
      }
      
      setCurrentStep(3);
    } catch (error) {
      setErrors({ code: "Verification failed. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle step 3 - New password
  const handlePasswordSubmit = async () => {
    if (!isPasswordValid || !passwordsMatch) return;
    
    setIsLoading(true);
    setErrors({});

    try {
      // Add your password update API call here
      // const response = await updatePassword(formData.email, formData.verificationCode, formData.newPassword);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCurrentStep(4);
    } catch (error) {
      setErrors({ password: "Failed to update password. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  // Resend verification code
  const handleResendCode = async () => {
    setIsLoading(true);
    try {
      // Add your resend code API call here
      await new Promise(resolve => setTimeout(resolve, 500));
      // Show success message or update UI
    } catch (error) {
      setErrors({ code: "Failed to resend code. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen w-full bg-cover bg-center bg-no-repeat relative flex"
      style={{
        backgroundImage: 'url("https://picsum.photos/1920/1080?random=3")',
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
            </div>

            {/* Step 1 - Enter Email */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-studywise-gray-900 mb-2">
                    Reset Password
                  </h1>
                  <p className="text-studywise-gray-600">
                    Enter the email associated with your account.
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
                      disabled={isLoading}
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
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>

                <div className="text-center">
                  <Link href="/signin" className="text-sm text-studywise-gray-600 hover:text-studywise-gray-800">
                    Back to sign in
                  </Link>
                </div>
              </div>
            )}

            {/* Step 2 - Verify Code */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center mb-6">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="mr-4 p-2 hover:bg-gray-100 rounded-full"
                    disabled={isLoading}
                  >
                    <ArrowLeft className="w-5 h-5 text-studywise-gray-600" />
                  </button>
                  <div>
                    <h1 className="text-2xl font-bold text-studywise-gray-900">
                      Check your email
                    </h1>
                    <p className="text-studywise-gray-600">
                      We sent a verification code to {formData.email}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-studywise-gray-700 mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={formData.verificationCode}
                    onChange={(e) => setFormData({ ...formData, verificationCode: e.target.value })}
                    placeholder="Enter 6-digit code"
                    className="w-full px-4 py-4 border border-studywise-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-center text-lg tracking-widest"
                    maxLength={6}
                    disabled={isLoading}
                  />
                  {errors.code && (
                    <p className="mt-2 text-sm text-red-600">{errors.code}</p>
                  )}
                </div>

                <Button
                  onClick={handleVerificationSubmit}
                  disabled={formData.verificationCode.length !== 6 || isLoading}
                  className="w-full bg-primary hover:bg-blue-600 py-4 rounded-xl font-medium text-base"
                >
                  {isLoading ? "Verifying..." : "Verify Code"}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-studywise-gray-600">
                    Didn't receive the code?{" "}
                    <button
                      onClick={handleResendCode}
                      disabled={isLoading}
                      className="text-primary hover:underline font-medium"
                    >
                      Resend
                    </button>
                  </p>
                </div>
              </div>
            )}

            {/* Step 3 - New Password */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex items-center mb-6">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="mr-4 p-2 hover:bg-gray-100 rounded-full"
                    disabled={isLoading}
                  >
                    <ArrowLeft className="w-5 h-5 text-studywise-gray-600" />
                  </button>
                  <div>
                    <h1 className="text-2xl font-bold text-studywise-gray-900">
                      Create new password
                    </h1>
                    <p className="text-studywise-gray-600">
                      Choose a strong password for your account.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-studywise-gray-700 mb-2">
                    New Password
                  </label>
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
                      {showPassword ? (
                        <EyeOff className="w-5 h-5 text-studywise-gray-400" />
                      ) : (
                        <Eye className="w-5 h-5 text-studywise-gray-400" />
                      )}
                    </button>
                  </div>
                  
                  {/* Password validation */}
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
                  <label className="block text-sm font-medium text-studywise-gray-700 mb-2">
                    Confirm Password
                  </label>
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
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5 text-studywise-gray-400" />
                      ) : (
                        <Eye className="w-5 h-5 text-studywise-gray-400" />
                      )}
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
                  onClick={handlePasswordSubmit}
                  disabled={!isPasswordValid || !passwordsMatch || isLoading}
                  className="w-full bg-primary hover:bg-blue-600 py-4 rounded-xl font-medium text-base"
                >
                  {isLoading ? "Updating..." : "Update Password"}
                </Button>
              </div>
            )}

            {/* Step 4 - Success */}
            {currentStep === 4 && (
              <div className="space-y-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                
                <div>
                  <h1 className="text-2xl font-bold text-studywise-gray-900 mb-2">
                    Password updated!
                  </h1>
                  <p className="text-studywise-gray-600">
                    Your password has been successfully updated. You can now sign in with your new password.
                  </p>
                </div>

                <Link href="/signin">
                  <Button className="w-full bg-primary hover:bg-blue-600 py-4 rounded-xl font-medium text-base">
                    Sign In
                  </Button>
                </Link>
              </div>
            )}

            {/* Footer Links */}
            {currentStep !== 4 && (
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
            Every setback
            <br />
            is a comeback
          </h2>
          <p className="text-xl opacity-90 max-w-md">
            Reset your password and get back to mastering your studies
          </p>
        </div>
      </div>
    </div>
  );
}