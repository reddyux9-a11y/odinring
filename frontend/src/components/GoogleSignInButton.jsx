import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Chrome } from 'lucide-react';
import { signInWithGoogle, handleGoogleRedirectResult } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const GoogleSignInButton = ({ mode = 'signin', onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [checkedRedirect, setCheckedRedirect] = useState(false);
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Check for redirect result ONCE on component mount
  // ONLY handles Google OAuth redirect, does NOT auto sign-in
  useEffect(() => {
    // Prevent multiple checks
    if (checkedRedirect) {
      return;
    }
    const checkRedirectResult = async () => {
      try {
        const result = await handleGoogleRedirectResult();
        
        if (result) {
          // User just completed Google sign-in, sync with backend
          setLoading(true);
          const { user, idToken, accessToken } = result;
          // Send to backend
          await loginWithGoogle({
            firebaseToken: idToken,
            email: user.email,
            name: user.displayName,
            photoURL: user.photoURL,
            uid: user.uid,
            accessToken: accessToken  // ✅ NEW: Google API access token
          });
          toast.success(`Welcome ${user.displayName || 'back'}! 🎉`);
          
          if (onSuccess) {
            onSuccess(user);
          }
        }
      } catch (error) {
        toast.error('Sign-in failed. Please try again.');
      } finally {
        setLoading(false);
        setCheckedRedirect(true); // Mark as checked to prevent re-runs
      }
    };
    
    checkRedirectResult();
  }, []); // Empty deps - only check once on mount

  const handleGoogleSignIn = async () => {
    setLoading(true);
    
    
    try {
      // Sign in with Google using Firebase (popup with redirect fallback)
      const result = await signInWithGoogle();
      
      // If redirect flow is used, result will be null and page will reload
      if (result) {
        const { user, idToken, accessToken } = result;
        
        // Send to backend to create/update user profile
        await loginWithGoogle({
          firebaseToken: idToken,
          email: user.email,
          name: user.displayName,
          photoURL: user.photoURL,
          uid: user.uid,
          accessToken: accessToken  // ✅ NEW: Google API access token
        });
        
        toast.success(`Welcome ${user.displayName || 'back'}! 🎉`);
        
        if (onSuccess) {
          onSuccess(user);
        }
        
        setLoading(false);
      }
      // If result is null, redirect flow is in progress, keep loading state
      
    } catch (error) {
      // Filter out technical errors
      if (error.message === 'No refresh token available') {
        setLoading(false);
        return; // Don't show error toast for expected session expiry
      }
      
      let errorMessage = 'Failed to sign in with Google';
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in cancelled';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Pop-up blocked. Redirecting to Google...';
        toast.info(errorMessage);
        return; // Don't set loading to false, redirect will happen
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full relative"
      onClick={handleGoogleSignIn}
      disabled={loading}
    >
      <Chrome className="w-5 h-5 mr-2" />
      {loading ? (
        'Connecting to Google...'
      ) : (
        mode === 'signin' ? 'Sign in with Google' : 'Sign up with Google'
      )}
    </Button>
  );
};

export default GoogleSignInButton;

