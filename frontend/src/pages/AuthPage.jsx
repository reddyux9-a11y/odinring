import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { motion } from "framer-motion";
import { initializeMobileEnvironment, isMobileDevice } from "../utils/mobileUtils";
import { ThemeToggle } from "../components/ThemeToggle";
import GoogleSignInButton from "../components/GoogleSignInButton";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, Mail, Lock, User, Eye, EyeOff } from "lucide-react";

const AuthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || "login");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);

  // Form state for login
  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  });

  // Form state for register
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  useEffect(() => {
    initializeMobileEnvironment();
  }, []);

  // Handle tab parameter from URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'register' || tabParam === 'login') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Clear form data when switching tabs to prevent cross-contamination
  const handleTabChange = (newTab) => {
    // Cancel any pending operations
    if (loading) {
      setLoading(false);
    }
    
    // Clear form data for clean slate
    if (newTab === "login") {
      setLoginData({ email: "", password: "" });
      setShowLoginPassword(false);
    } else {
      setRegisterData({ name: "", email: "", password: "", confirmPassword: "" });
      setShowRegisterPassword(false);
      setShowRegisterConfirmPassword(false);
    }
    
    setActiveTab(newTab);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Validate inputs are not empty or just whitespace
    const email = loginData.email.trim().toLowerCase();
    const password = loginData.password.trim();
    
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setLoading(true);

    try {
      await login({
        email,
        password
      });

      toast.success("Welcome back! 🎉");
      navigate('/dashboard');
    } catch (error) {
      // Extract error message safely - handle both string and array formats
      let rawError = 'Login failed';
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (Array.isArray(detail)) {
          rawError = detail.map(err => {
            if (typeof err === 'string') return err;
            if (err.msg) return err.msg;
            return JSON.stringify(err);
          }).join(', ') || 'Validation error';
        } else if (typeof detail === 'string') {
          rawError = detail;
        } else {
          rawError = String(detail);
        }
      } else if (error.message) {
        rawError = error.message;
      }
      
      // Filter out technical errors that shouldn't be shown to users
      const errorMessage = rawError === 'No refresh token available' 
        ? 'Please sign in to continue' 
        : rawError;
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    // Validate inputs are not empty or just whitespace
    const name = registerData.name.trim();
    const email = registerData.email.trim().toLowerCase();
    const password = registerData.password.trim();
    const confirmPassword = registerData.confirmPassword.trim();
    
    if (!name || !email || !password || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    // Validate password requirements (must match backend validation)
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    
    if (!/[A-Z]/.test(password)) {
      toast.error("Password must contain at least one uppercase letter");
      return;
    }
    
    if (!/[a-z]/.test(password)) {
      toast.error("Password must contain at least one lowercase letter");
      return;
    }
    
    if (!/[0-9]/.test(password)) {
      toast.error("Password must contain at least one digit");
      return;
    }

    // Generate username from email (before @ symbol)
    const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_-]/g, '');

    setLoading(true);

    try {
      await register({
        name,
        username,
        email,
        password
      });

      toast.success("Account created successfully! 🎉");
      // Redirect to subscription selection (optional, can skip)
      navigate('/subscription');
    } catch (error) {
      // Filter out technical errors that shouldn't be shown to users
      const rawError = error.response?.data?.detail || error.message || 'Registration failed';
      const errorMessage = rawError === 'No refresh token available' 
        ? 'Please try again' 
        : rawError;
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
              <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
              <CardDescription className="text-base">
                Sign in to your account or create a new one
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6 pb-8">
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login" disabled={loading}>Sign In</TabsTrigger>
                  <TabsTrigger value="register" disabled={loading}>Sign Up</TabsTrigger>
                </TabsList>

                {/* Login Tab */}
                <TabsContent value="login" className="space-y-4">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="you@example.com"
                          value={loginData.email}
                          onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                          className="pl-9"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">Password</Label>
                        <a
                          href="/forgot-password"
                          className="text-sm text-primary hover:underline"
                          onClick={(e) => {
                            e.preventDefault();
                            navigate('/forgot-password');
                          }}
                        >
                          Forgot password?
                        </a>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="login-password"
                          type={showLoginPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          className="pl-9 pr-9"
                          required
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword((v) => !v)}
                          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                          aria-label={showLoginPassword ? "Hide password" : "Show password"}
                          disabled={loading}
                        >
                          {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        'Sign In'
                      )}
                    </Button>
                  </form>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <Separator />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  <GoogleSignInButton 
                    mode="signin" 
                    onSuccess={() => {
                      // For sign-in, go directly to dashboard
                      navigate('/dashboard');
                    }}
                  />
                </TabsContent>

                {/* Register Tab */}
                <TabsContent value="register" className="space-y-4">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-name">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="register-name"
                          type="text"
                          placeholder="John Doe"
                          value={registerData.name}
                          onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                          className="pl-9"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="register-email"
                          type="email"
                          placeholder="you@example.com"
                          value={registerData.email}
                          onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                          className="pl-9"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="register-password"
                          type={showRegisterPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={registerData.password}
                          onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                          className="pl-9 pr-9"
                          required
                          minLength={8}
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegisterPassword((v) => !v)}
                          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                          aria-label={showRegisterPassword ? "Hide password" : "Show password"}
                          disabled={loading}
                        >
                          {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Must be 8+ characters with uppercase, lowercase, and digit
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-confirm">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="register-confirm"
                          type={showRegisterConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={registerData.confirmPassword}
                          onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                          className="pl-9 pr-9"
                          required
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegisterConfirmPassword((v) => !v)}
                          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                          aria-label={showRegisterConfirmPassword ? "Hide password" : "Show password"}
                          disabled={loading}
                        >
                          {showRegisterConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        'Create Account'
                      )}
                    </Button>
                  </form>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <Separator />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  <GoogleSignInButton 
                    mode="signup" 
                    onSuccess={() => {
                      // For sign-up, redirect to subscription selection (optional)
                      const skipped = localStorage.getItem('subscription_onboarding_skipped');
                      if (!skipped) {
                        navigate('/subscription');
                      } else {
                        navigate('/dashboard');
                      }
                    }}
                  />
                </TabsContent>
              </Tabs>

              {/* Privacy Notice */}
              <motion.p 
                className="text-xs text-center text-muted-foreground px-4 pt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                By continuing, you agree to our{" "}
                <a href="/terms" className="text-primary hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </a>
              </motion.p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer Text */}
        <motion.div 
          className="text-center mt-8 text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p>
            {activeTab === "login" 
              ? "New to OdinRing? Click 'Sign Up' to create an account." 
              : "Already have an account? Click 'Sign In' to continue."}
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
