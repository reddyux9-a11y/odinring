import React, { useState } from "react";
import api from "../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Lock, Shield, Power, CheckCircle2, Circle, Eye, EyeOff } from "lucide-react";
import { mobileToast } from "./MobileOptimizedToast";
import { 
  validatePassword,
  PASSWORD_MIN_LENGTH,
  PASSWORD_UPPERCASE_REGEX,
  PASSWORD_LOWERCASE_REGEX,
  PASSWORD_DIGIT_REGEX
} from "../lib/passwordValidation";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SecuritySettings = ({ user }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(user?.is_active !== false);

  const hasMinLength = newPassword.length >= PASSWORD_MIN_LENGTH;
  const hasUppercase = PASSWORD_UPPERCASE_REGEX.test(newPassword);
  const hasLowercase = PASSWORD_LOWERCASE_REGEX.test(newPassword);
  const hasDigit = PASSWORD_DIGIT_REGEX.test(newPassword);

  const changePassword = async () => {
    if (newPassword !== confirmPassword) {
      mobileToast.error("Passwords do not match");
      return;
    }
    
    // Validate password requirements (must match backend validation)
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      mobileToast.error(validation.errors[0]);
      return;
    }
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await api.post(`/me/change-password`, {
        current_password: currentPassword,
        new_password: newPassword
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      mobileToast.success("Password updated");
    } catch (e) {
      mobileToast.error(e?.response?.data?.detail || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (status) {
        await api.post(`/me/deactivate`, {});
        setStatus(false);
        mobileToast.success("Account deactivated");
      } else {
        await api.post(`/me/reactivate`, {});
        setStatus(true);
        mobileToast.success("Account reactivated");
      }
    } catch (e) {
      mobileToast.error("Failed to update account status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Security</h2>
          <p className="text-muted-foreground">Manage your account security settings</p>
        </div>
        <Badge variant="secondary" className="ml-auto">{status ? 'Active' : 'Inactive'}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lock className="w-5 h-5" />
            <span>Change Password</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Current Password</Label>
            <div className="relative mt-1">
              <Input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showCurrentPassword ? "Hide password" : "Show password"}
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>New Password</Label>
              <div className="relative mt-1">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  {hasMinLength ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <Circle className="w-3 h-3" />
                  )}
                  <span>At least {PASSWORD_MIN_LENGTH} characters</span>
                </div>
                <div className="flex items-center gap-2">
                  {hasUppercase ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <Circle className="w-3 h-3" />
                  )}
                  <span>At least one uppercase letter</span>
                </div>
                <div className="flex items-center gap-2">
                  {hasLowercase ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <Circle className="w-3 h-3" />
                  )}
                  <span>At least one lowercase letter</span>
                </div>
                <div className="flex items-center gap-2">
                  {hasDigit ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <Circle className="w-3 h-3" />
                  )}
                  <span>At least one digit</span>
                </div>
              </div>
            </div>
            <div>
              <Label>Confirm Password</Label>
              <div className="relative mt-1">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          <Button onClick={changePassword} disabled={loading} className="bg-gradient-to-r from-red-500 to-pink-500">
            Update Password
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Power className="w-5 h-5" />
            <span>Account Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-gray-600">Temporarily deactivate your account. You can reactivate anytime by logging in and using this toggle.</p>
          <Button variant={status ? 'destructive' : 'default'} onClick={toggleActive} disabled={loading}>
            {status ? 'Deactivate Account' : 'Reactivate Account'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecuritySettings;


