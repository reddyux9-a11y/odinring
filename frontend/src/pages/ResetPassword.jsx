import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../shared/ui/card";
import { Button } from "../shared/ui/button";
import { Input } from "../shared/ui/input";
import { Label } from "../shared/ui/label";
import { motion } from "framer-motion";
import { ThemeToggle } from "../components/ThemeToggle";
import { verifyResetCode, confirmResetPassword } from "../lib/firebase";
import { toast } from "sonner";
import { Loader2, Lock, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useDebounce } from "../hooks/useDebounce";

// Compile regex patterns once outside component for better performance
const PASSWORD_UPPERCASE_REGEX = /[A-Z]/;
const PASSWORD_LOWERCASE_REGEX = /[a-z]/;
const PASSWORD_DIGIT_REGEX = /[0-9]/;

// Move animation variants outside component to prevent recreation on every render
const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" }
  }
};

const cardVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { delay: 0.2, duration: 0.4 }
  }
};

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);
  const [actionCode, setActionCode] = useState("");
  const [email, setEmail] = useState("");
  const redirectTimeoutRef = useRef(null);

  useEffect(() => {
    // Firebase Auth password reset links use 'oobCode' parameter
    const code = searchParams.get('oobCode') || searchParams.get('token');
    
    if (!code) {
      toast.error("Invalid reset link. Please request a new password reset.");
      redirectTimeoutRef.current = setTimeout(() => navigate('/forgot-password'), 2000);
      return;
    }
    
    setActionCode(code);
    
    // Verify the code and get the email
    const verifyCode = async () => {
      try {
        setVerifying(true);
        const userEmail = await verifyResetCode(code);
        setEmail(userEmail);
        setVerifying(false);
      } catch (error) {
        setVerifying(false);
        
        let errorMessage = "Invalid or expired reset link.";
        if (error.code === 'auth/expired-action-code') {
          errorMessage = "The password reset link has expired. Please request a new one.";
        } else if (error.code === 'auth/invalid-action-code') {
          errorMessage = "Invalid reset link. Please request a new password reset.";
        } else if (error.code === 'auth/user-disabled') {
          errorMessage = "This account has been disabled.";
        }
        
        toast.error(errorMessage);
        redirectTimeoutRef.current = setTimeout(() => navigate('/forgot-password'), 3000);
      }
    };
    
    verifyCode();
    
    // Cleanup timeout on unmount
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, [searchParams, navigate]);

  // Debounce password for real-time validation feedback
  const debouncedPassword = useDebounce(password, 300);
  
  // Memoize password validation with pre-compiled regex for better performance
  const validatePassword = useCallback((pwd) => {
    if (!pwd) return null; // Don't validate empty password
    
    if (pwd.length < 8) {
      return "Password must be at least 8 characters";
    }
    if (!PASSWORD_UPPERCASE_REGEX.test(pwd)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!PASSWORD_LOWERCASE_REGEX.test(pwd)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!PASSWORD_DIGIT_REGEX.test(pwd)) {
      return "Password must contain at least one digit";
    }
    return null;
  }, []);
  
  // Real-time password validation (debounced)
  const passwordError = useMemo(() => {
    return validatePassword(debouncedPassword);
  }, [debouncedPassword, validatePassword]);
  
  // Check if passwords match (only when both are filled)
  const passwordsMatch = useMemo(() => {
    if (!password || !confirmPassword) return true; // Don't show error for empty fields
    return password === confirmPassword;
  }, [password, confirmPassword]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();
    
    if (!trimmedPassword || !trimmedConfirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    // Validate passwords match
    if (trimmedPassword !== trimmedConfirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    // Validate password requirements (use pre-validated error if available)
    const validationError = passwordError || validatePassword(trimmedPassword);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    
    if (!actionCode) {
      toast.error("Invalid reset code. Please request a new password reset.");
      navigate('/forgot-password');
      return;
    }
    
    setLoading(true);

    try {
      // Use Firebase Auth to confirm password reset
      await confirmResetPassword(actionCode, trimmedPassword);
      
      setPasswordReset(true);
      toast.success("Password has been reset successfully! 🎉");
      
      // Redirect to login after a short delay
      redirectTimeoutRef.current = setTimeout(() => {
        navigate('/auth');
      }, 2000);
    } catch (error) {
      let errorMessage = 'Failed to reset password';
      
      if (error.code === 'auth/expired-action-code') {
        errorMessage = "The password reset link has expired. Please request a new one.";
      } else if (error.code === 'auth/invalid-action-code') {
        errorMessage = "Invalid reset link. Please request a new password reset.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Password is too weak. Please choose a stronger password.";
      } else {
        errorMessage = error.message || 'Failed to reset password';
      }
      
      toast.error(errorMessage);
      
      // If code is invalid or expired, redirect to forgot password
      if (error.code === 'auth/expired-action-code' || error.code === 'auth/invalid-action-code') {
        redirectTimeoutRef.current = setTimeout(() => {
          navigate('/forgot-password');
        }, 3000);
      }
    } finally {
      setLoading(false);
    }
  }, [password, confirmPassword, actionCode, navigate, validatePassword, passwordError]);

  const handleBackToSignIn = useCallback(() => {
    navigate('/auth');
  }, [navigate]);

  const toggleShowPassword = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const toggleShowConfirmPassword = useCallback(() => {
    setShowConfirmPassword(prev => !prev);
  }, []);
  
  // Memoize form validation state
  const isFormValid = useMemo(() => {
    return password && 
           confirmPassword && 
           !passwordError && 
           passwordsMatch && 
           actionCode;
  }, [password, confirmPassword, passwordError, passwordsMatch, actionCode]);

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
        <Card className="backdrop-blur-xl bg-card/80 border-border/50 shadow-2xl max-w-md w-full">
          <CardContent className="pt-6 pb-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Verifying reset link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!actionCode) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-primary/5 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <motion.div
        className="w-full max-w-md z-10 relative"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Logo/Branding */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4 ring-4 ring-primary/5">
            <svg
              className="w-10 h-10 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-2">
            OdinRing
          </h1>
          <p className="text-muted-foreground text-lg">
            Your Digital Identity, Simplified
          </p>
        </motion.div>

        <motion.div variants={cardVariants}>
          <Card className="backdrop-blur-xl bg-card/80 border-border/50 shadow-2xl">
            <CardHeader className="space-y-3 text-center pb-6">
              <CardTitle className="text-2xl font-bold">
                {passwordReset ? "Password Reset Successful!" : "Reset Your Password"}
              </CardTitle>
              <CardDescription className="text-base">
                {passwordReset 
                  ? "Your password has been reset. Redirecting to sign in..."
                  : email 
                    ? `Enter your new password for ${email}`
                    : "Enter your new password below."
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6 pb-8">
              {!passwordReset ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-9 pr-9"
                        required
                        minLength={8}
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={toggleShowPassword}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Must be 8+ characters with uppercase, lowercase, and digit
                    </p>
                    {passwordError && password && (
                      <p className="text-xs text-destructive mt-1">
                        {passwordError}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`pl-9 pr-9 ${!passwordsMatch && confirmPassword ? 'border-destructive' : ''}`}
                        required
                        minLength={8}
                        disabled={loading}
                        aria-invalid={!passwordsMatch && confirmPassword ? true : false}
                      />
                      <button
                        type="button"
                        onClick={toggleShowConfirmPassword}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {!passwordsMatch && confirmPassword && (
                      <p className="text-xs text-destructive mt-1">
                        Passwords don't match
                      </p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading || !isFormValid}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resetting Password...
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </Button>
                </form>
              ) : (
                <div className="text-center py-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
                    <svg
                      className="w-8 h-8 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Redirecting to sign in page...
                  </p>
                </div>
              )}

              <div className="pt-4 border-t">
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={handleBackToSignIn}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Sign In
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
