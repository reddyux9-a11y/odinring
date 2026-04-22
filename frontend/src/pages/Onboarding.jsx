import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { Button } from '../shared/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../shared/ui/card';
import { Input } from '../shared/ui/input';
import { Label } from '../shared/ui/label';
import { toast } from 'sonner';
import { Building2, Users, User } from 'lucide-react';

const Onboarding = () => {
  const [accountType, setAccountType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    organizationName: '',
  });
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleAccountTypeSelect = (type) => {
    setAccountType(type);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!accountType) {
      toast.error('Please select an account type');
      return;
    }

    // Validation for business and organization
    if (accountType === 'business_solo' && !formData.businessName.trim()) {
      toast.error('Business name is required');
      return;
    }

    if (accountType === 'organization' && !formData.organizationName.trim()) {
      toast.error('Organization name is required');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        account_type: accountType
      };

      if (accountType === 'business_solo') {
        payload.business_name = formData.businessName;
      } else if (accountType === 'organization') {
        payload.organization_name = formData.organizationName;
      }

      const response = await api.post('/onboarding/account-type', payload);
      toast.success(`${accountType === 'personal' ? 'Personal' : accountType === 'business_solo' ? 'Business' : 'Organization'} account created successfully!`);

      // Navigate to the suggested route
      const nextRoute = response.data.next_route || '/dashboard';
      
      setTimeout(() => {
        navigate(nextRoute);
      }, 1000);
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          'Failed to create account';
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to continue</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome to OdinRing! 🎉</h1>
          <p className="text-lg text-gray-600">Let's set up your account to get started</p>
        </div>

        {!accountType ? (
          // Account Type Selection
          <div className="grid md:grid-cols-3 gap-6">
            {/* Personal Account */}
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-500"
              onClick={() => handleAccountTypeSelect('personal')}
            >
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <User className="w-16 h-16 text-blue-500" />
                </div>
                <CardTitle>Personal</CardTitle>
                <CardDescription>For individual use</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>✓ Personal bio link</li>
                  <li>✓ Unlimited links</li>
                  <li>✓ Analytics dashboard</li>
                  <li>✓ QR code generation</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant="outline">
                  Choose Personal
                </Button>
              </CardFooter>
            </Card>

            {/* Business Account */}
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-green-500"
              onClick={() => handleAccountTypeSelect('business_solo')}
            >
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <Building2 className="w-16 h-16 text-green-500" />
                </div>
                <CardTitle>Business</CardTitle>
                <CardDescription>For solo entrepreneurs</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>✓ Everything in Personal</li>
                  <li>✓ Business branding</li>
                  <li>✓ Advanced analytics</li>
                  <li>✓ Custom domains</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant="outline">
                  Choose Business
                </Button>
              </CardFooter>
            </Card>

            {/* Organization Account */}
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-purple-500"
              onClick={() => handleAccountTypeSelect('organization')}
            >
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <Users className="w-16 h-16 text-purple-500" />
                </div>
                <CardTitle>Organization</CardTitle>
                <CardDescription>For teams & companies</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>✓ Everything in Business</li>
                  <li>✓ Team management</li>
                  <li>✓ Departments</li>
                  <li>✓ Centralized billing</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant="outline">
                  Choose Organization
                </Button>
              </CardFooter>
            </Card>
          </div>
        ) : (
          // Account Details Form
          <Card className="max-w-md mx-auto">
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>
                  {accountType === 'personal' && 'Complete Your Profile'}
                  {accountType === 'business_solo' && 'Business Details'}
                  {accountType === 'organization' && 'Organization Details'}
                </CardTitle>
                <CardDescription>
                  {accountType === 'personal' && 'Your personal account is almost ready!'}
                  {accountType === 'business_solo' && 'Tell us about your business'}
                  {accountType === 'organization' && 'Tell us about your organization'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {accountType === 'business_solo' && (
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name *</Label>
                    <Input
                      id="businessName"
                      name="businessName"
                      placeholder="Acme Inc."
                      value={formData.businessName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                )}

                {accountType === 'organization' && (
                  <div className="space-y-2">
                    <Label htmlFor="organizationName">Organization Name *</Label>
                    <Input
                      id="organizationName"
                      name="organizationName"
                      placeholder="Tech Corp"
                      value={formData.organizationName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                )}

                {accountType === 'personal' && (
                  <div className="text-center py-4">
                    <p className="text-gray-600">
                      You're all set! Click continue to access your dashboard.
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAccountType(null)}
                  disabled={loading}
                >
                  Back
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Continue'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Onboarding;

