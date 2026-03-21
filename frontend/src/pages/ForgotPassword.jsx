import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "../components/ui/input-otp";
import { Label } from "../components/ui/label";
import { motion } from "framer-motion";
import { ThemeToggle } from "../components/ThemeToggle";
import { toast } from "sonner";
import { Loader2, Mail, ArrowLeft, Lock, Eye, EyeOff } from "lucide-react";
import { useDebounce } from "../hooks/useDebounce";
import { useAuth } from "../contexts/AuthContext";

// Compile regex patterns once outside component for better performance
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { forgotPassword, verifyResetOtp, resetPassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [step, setStep] = useState("email"); // email | otp | password | done
  const [emailError, setEmailError] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Debounce email validation to avoid excessive checks
  const debouncedEmail = useDebounce(email, 500);
  
  // Memoize email validation
  const isValidEmail = useMemo(() => {
    if (!debouncedEmail) return true; // Don't show error for empty field
    return EMAIL_REGEX.test(debouncedEmail);
  }, [debouncedEmail]);

  const validatePassword = useCallback((pwd) => {
    if (!pwd) return null;
    if (pwd.length < 8) return "Password must be at least 8 characters";
    if (!PASSWORD_UPPERCASE_REGEX.test(pwd)) return "Password must contain at least one uppercase letter";
    if (!PASSWORD_LOWERCASE_REGEX.test(pwd)) return "Password must contain at least one lowercase letter";
    if (!PASSWORD_DIGIT_REGEX.test(pwd)) return "Password must contain at least one digit";
    return null;
  }, []);

  const passwordError = useMemo(() => validatePassword(password.trim()), [password, validatePassword]);
  const passwordsMatch = useMemo(() => {
    if (!password || !confirmPassword) return true;
    return password === confirmPassword;
  }, [password, confirmPassword]);

  const handleSendOtp = useCallback(async (e) => {
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
      await forgotPassword(trimmedEmail);
      setStep("otp");
      toast.success("OTP sent", {
        description: "If an account exists for this email, you'll receive a 6-digit code shortly."
      });
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.message || "Failed to send OTP";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [email, forgotPassword]);

  const handleVerifyOtp = useCallback(async (e) => {
    e.preventDefault();

    const trimmedEmail = email.trim();
    const trimmedOtp = otp.trim();

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      toast.error("Please enter a valid email address");
      setStep("email");
      return;
    }

    if (!/^\d{6}$/.test(trimmedOtp)) {
      toast.error("Enter the 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const res = await verifyResetOtp(trimmedEmail, trimmedOtp);
      const token = res?.reset_token;
      if (!token) {
        throw new Error("No reset token returned");
      }
      setResetToken(token);
      setStep("password");
      toast.success("OTP verified");
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.message || "Invalid OTP";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [email, otp, verifyResetOtp]);

  const handleResetPassword = useCallback(async (e) => {
    e.preventDefault();

    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if (!resetToken) {
      toast.error("Missing reset token. Please verify OTP again.");
      setStep("otp");
      return;
    }

    if (!trimmedPassword || !trimmedConfirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    const validationError = validatePassword(trimmedPassword);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setLoading(true);
    try {
      await resetPassword(resetToken, trimmedPassword);
      setStep("done");
      toast.success("Password reset successfully");
      setTimeout(() => navigate("/auth"), 1200);
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.message || "Failed to reset password";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [resetToken, password, confirmPassword, resetPassword, navigate, validatePassword]);

  const handleBackToSignIn = useCallback(() => {
    navigate('/auth');
  }, [navigate]);

  const handleStartOver = useCallback(() => {
    setStep("email");
    setOtp("");
    setResetToken("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
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
                {step === "email" ? "Forgot Password?" : step === "otp" ? "Enter OTP" : step === "password" ? "Set New Password" : "All set"}
              </CardTitle>
              <CardDescription className="text-base">
                {step === "email"
                  ? "Enter your email address and we'll send a 6-digit OTP to reset your password."
                  : step === "otp"
                    ? `Enter the 6-digit code sent to ${email || "your email"}.`
                    : step === "password"
                      ? "OTP verified. Now choose a new password."
                      : "Redirecting you back to sign in..."}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6 pb-8">
              {step === "email" ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
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
                      'Send OTP'
                    )}
                  </Button>
                </form>
              ) : step === "otp" ? (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="space-y-2">
                    <Label>OTP</Label>
                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        value={otp}
                        onChange={setOtp}
                        disabled={loading}
                        inputMode="numeric"
                        autoFocus
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                        </InputOTPGroup>
                        <InputOTPSeparator />
                        <InputOTPGroup>
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Didn’t get a code? You can request a new OTP.
                    </p>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify OTP"
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={loading}
                    onClick={async () => {
                      try {
                        setLoading(true);
                        await forgotPassword(email.trim());
                        toast.success("OTP re-sent", { description: "Check your email for the new code." });
                        setOtp("");
                      } catch (error) {
                        const errorMessage = error.response?.data?.detail || error.message || "Failed to resend OTP";
                        toast.error(errorMessage);
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    Resend OTP
                  </Button>
                </form>
              ) : step === "password" ? (
                <form onSubmit={handleResetPassword} className="space-y-4">
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
                        onClick={() => setShowPassword(v => !v)}
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
                      <p className="text-xs text-destructive mt-1">{passwordError}</p>
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
                        onClick={() => setShowConfirmPassword(v => !v)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {!passwordsMatch && confirmPassword && (
                      <p className="text-xs text-destructive mt-1">Passwords don't match</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={loading || !!passwordError || !passwordsMatch}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      "Reset Password"
                    )}
                  </Button>
                </form>
              ) : (
                <div className="text-center py-2">
                  <p className="text-sm text-muted-foreground">Redirecting to sign in…</p>
                </div>
              )}

              <div className="pt-4 border-t space-y-2">
                {step !== "email" && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleStartOver}
                    disabled={loading}
                  >
                    Start over
                  </Button>
                )}
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={handleBackToSignIn}
                  disabled={loading}
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

