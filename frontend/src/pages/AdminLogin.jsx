import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../shared/ui/button";
import { Input } from "../shared/ui/input";
import { Label } from "../shared/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../shared/ui/card";
import { Alert, AlertDescription } from "../shared/ui/alert";
import { Shield, User, Lock, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminLogin = () => {
  const { adminLogin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await adminLogin(formData);

      toast.success('Welcome to OdinRing Admin! 🛡️');
      navigate('/admin/dashboard');

    } catch (error) {
      console.error('Admin login error:', error);
      const message = error.response?.data?.detail || 'Invalid admin credentials';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="border-gray-700 bg-gray-800/50 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center pb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4"
            >
              <Shield className="w-8 h-8 text-white" />
            </motion.div>
            <CardTitle className="text-2xl font-bold text-white">OdinRing Admin</CardTitle>
            <CardDescription className="text-gray-400">
              Secure administrative access to the platform
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-300">Admin Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="username"
                    name="username"
                    placeholder="Enter admin username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    className="pl-10 bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter admin password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="pl-10 pr-10 bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Alert className="bg-yellow-900/20 border-yellow-600/50">
                <Shield className="h-4 w-4 text-yellow-500" />
                <AlertDescription className="text-yellow-200">
                  This is a secure admin area. Only authorized personnel should access this system.
                </AlertDescription>
              </Alert>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3"
                disabled={loading}
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                  />
                ) : (
                  <Shield className="w-5 h-5 mr-2" />
                )}
                {loading ? "Authenticating..." : "Access Admin Panel"}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-700">
              <div className="text-center space-y-2">
                <p className="text-xs text-gray-400">Default Credentials for Testing:</p>
                <p className="text-xs text-gray-500 font-mono bg-gray-900/50 px-2 py-1 rounded">
                  Username: admin | Password: admin123
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back to Main Site */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center mt-6"
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white"
          >
            ← Back to OdinRing
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;