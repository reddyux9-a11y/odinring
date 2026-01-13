import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { motion } from "framer-motion";
import { ThemeToggle } from "../components/ThemeToggle";
import { sendPasswordReset } from "../lib/firebase";
import { toast } from "sonner";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import { useDebounce } from "../hooks/useDebounce";

// Compile regex patterns once outside component for better performance
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState("");
  
  // Debounce email validation to avoid excessive checks
  const debouncedEmail = useDebounce(email, 500);
  
  // Memoize email validation
  const isValidEmail = useMemo(() => {
    if (!debouncedEmail) return true; // Don't show error for empty field
    return EMAIL_REGEX.test(debouncedEmail);
  }, [debouncedEmail]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    const trimmedEmail = email.trim();
    
    if (!trimmedEmail) {
      toast.error("Please enter your email address");
      return;
    }
    
    // Use pre-compiled regex for better performance
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setLoading(true);

    try {
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 ForgotPassword: Requesting password reset for:', trimmedEmail);
      }
      
      // Use Firebase Auth to send password reset email
      await sendPasswordReset(trimmedEmail);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ ForgotPassword: Password reset email sent successfully');
      }
      
      setEmailSent(true);
      
      // Firebase will send the email automatically
      toast.success("Password reset email sent!", {
        description: "Check your email (and spam folder) for the reset link. The link expires in 1 hour."
      });
    } catch (error) {
      // Only log errors in development
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ ForgotPassword: Password reset request failed', error);
      }
      
      // Handle Firebase Auth errors
      let errorMessage = 'Failed to send password reset email';
      let showSuccess = false;
      
      if (error.code === 'auth/user-not-found') {
        // Don't reveal that user doesn't exist (security best practice)
        errorMessage = "If an account exists with this email, a password reset link has been sent.";
        showSuccess = true;
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many requests. Please try again later.";
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (error.message?.includes('Firebase')) {
        errorMessage = "Firebase configuration error. Please contact support.";
      } else {
        errorMessage = error.message || 'Failed to send password reset email';
      }
      
      if (showSuccess) {
        setEmailSent(true);
        toast.success(errorMessage);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [email]);

  const handleBackToSignIn = useCallback(() => {
    navigate('/auth');
  }, [navigate]);

  const handleSendAnother = useCallback(() => {
    setEmailSent(false);
    setEmail("");
    setEmailError("");
  }, []);

  // Validate email in real-time (debounced) - use useEffect to avoid render issues
  useEffect(() => {
    if (debouncedEmail && !isValidEmail) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  }, [debouncedEmail, isValidEmail]);

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
                {emailSent ? "Check Your Email" : "Forgot Password?"}
              </CardTitle>
              <CardDescription className="text-base">
                {emailSent 
                  ? "We've sent a password reset link to your email address. Click the link in the email to reset your password."
                  : "Enter your email address and we'll send you a link to reset your password."
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6 pb-8">
              {!emailSent ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          // Clear error immediately when user types
                          if (emailError) setEmailError("");
                        }}
                        className={`pl-9 ${emailError ? 'border-destructive' : ''}`}
                        required
                        disabled={loading}
                        aria-invalid={!!emailError}
                        aria-describedby={emailError ? "email-error" : undefined}
                      />
                    </div>
                    {emailError && (
                      <p id="email-error" className="text-xs text-destructive mt-1">
                        {emailError}
                      </p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Reset Link'
                    )}
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                      <Mail className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      If an account exists with <strong>{email}</strong>, you'll receive a password reset link shortly.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      The link will expire in 1 hour. Check your spam folder if you don't see it.
                    </p>
                  </div>
                  
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={handleSendAnother}
                  >
                    Send Another Email
                  </Button>
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

export default ForgotPassword;

