/**
 * Business Settings Component
 * Manage business account settings and information
 */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Building2, Mail, Phone, Globe, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import useIdentityContext from '../hooks/useIdentityContext';
import SubscriptionBadge from './SubscriptionBadge';
import DataExportButton from './DataExportButton';

const BusinessSettings = () => {
  const { user } = useAuth();
  const { identityContext, loading: contextLoading } = useIdentityContext();
  const [loading, setLoading] = useState(false);
  const [businessData, setBusinessData] = useState({
    name: '',
    description: '',
    email: '',
    phone: '',
    website: ''
  });

  useEffect(() => {
    const fetchBusinessData = async () => {
      if (!identityContext?.business_id) return;

      try {
        const response = await api.get(`/businesses/${identityContext.business_id}`);
        setBusinessData(response.data);
      } catch (error) {
      }
    };

    fetchBusinessData();
  }, [identityContext]);

  const handleInputChange = (e) => {
    setBusinessData({
      ...businessData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    if (!identityContext?.business_id) {
      toast.error('Business ID not found');
      return;
    }

    setLoading(true);

    try {
      await api.put(`/businesses/${identityContext.business_id}`, businessData);
      toast.success('Business settings updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update business settings');
    } finally {
      setLoading(false);
    }
  };

  if (contextLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Business Settings</h1>
          <p className="text-gray-600 mt-1">Manage your business information and preferences</p>
        </div>
        <SubscriptionBadge subscription={identityContext?.subscription} size="large" />
      </div>

      {/* Business Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Business Information
          </CardTitle>
          <CardDescription>
            Update your business details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Business Name *</Label>
            <Input
              id="name"
              name="name"
              value={businessData.name}
              onChange={handleInputChange}
              placeholder="Acme Inc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={businessData.description || ''}
              onChange={handleInputChange}
              placeholder="Brief description of your business..."
              rows={3}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">
                <Mail className="inline w-4 h-4 mr-1" />
                Business Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={businessData.email || ''}
                onChange={handleInputChange}
                placeholder="contact@business.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                <Phone className="inline w-4 h-4 mr-1" />
                Phone Number
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={businessData.phone || ''}
                onChange={handleInputChange}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">
              <Globe className="inline w-4 h-4 mr-1" />
              Website
            </Label>
            <Input
              id="website"
              name="website"
              type="url"
              value={businessData.website || ''}
              onChange={handleInputChange}
              placeholder="https://www.business.com"
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Export */}
      <Card>
        <CardHeader>
          <CardTitle>Data Export</CardTitle>
          <CardDescription>
            Download all your business data in JSON format (GDPR compliant)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataExportButton variant="outline" className="w-full md:w-auto" />
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessSettings;








