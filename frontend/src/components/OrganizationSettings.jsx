/**
 * Organization Settings Component
 * Manage organization account settings, members, and departments
 */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Users, Building, UserPlus, Mail, Shield, Save, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import useIdentityContext from '../hooks/useIdentityContext';
import SubscriptionBadge from './SubscriptionBadge';
import DataExportButton from './DataExportButton';

const OrganizationSettings = () => {
  const { user } = useAuth();
  const { identityContext, loading: contextLoading } = useIdentityContext();
  const [loading, setLoading] = useState(false);
  const [organizationData, setOrganizationData] = useState({
    name: '',
    description: ''
  });
  const [members, setMembers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newDepartmentName, setNewDepartmentName] = useState('');

  useEffect(() => {
    const fetchOrganizationData = async () => {
      if (!identityContext?.organization_id) return;

      try {
        // Fetch organization details
        const orgResponse = await api.get(`/organizations/${identityContext.organization_id}`);
        setOrganizationData(orgResponse.data);

        // Fetch members
        const membersResponse = await api.get(`/organizations/${identityContext.organization_id}/members`);
        setMembers(membersResponse.data);

        // Fetch departments
        const deptsResponse = await api.get(`/organizations/${identityContext.organization_id}/departments`);
        setDepartments(deptsResponse.data);
      } catch (error) {
        console.error('Failed to load organization data:', error);
      }
    };

    fetchOrganizationData();
  }, [identityContext]);

  const handleInputChange = (e) => {
    setOrganizationData({
      ...organizationData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    if (!identityContext?.organization_id) {
      toast.error('Organization ID not found');
      return;
    }

    setLoading(true);

    try {
      await api.put(`/organizations/${identityContext.organization_id}`, organizationData);
      toast.success('Organization settings updated successfully!');
    } catch (error) {
      console.error('Failed to update organization:', error);
      toast.error(error.response?.data?.detail || 'Failed to update organization settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!newMemberEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      await api.post(`/organizations/${identityContext.organization_id}/members/invite`, {
        email: newMemberEmail
      });
      toast.success(`Invitation sent to ${newMemberEmail}`);
      setNewMemberEmail('');
    } catch (error) {
      console.error('Failed to invite member:', error);
      toast.error(error.response?.data?.detail || 'Failed to send invitation');
    }
  };

  const handleAddDepartment = async () => {
    if (!newDepartmentName.trim()) {
      toast.error('Please enter a department name');
      return;
    }

    try {
      const response = await api.post(`/organizations/${identityContext.organization_id}/departments`, {
        name: newDepartmentName
      });
      setDepartments([...departments, response.data]);
      setNewDepartmentName('');
      toast.success('Department created successfully!');
    } catch (error) {
      console.error('Failed to create department:', error);
      toast.error(error.response?.data?.detail || 'Failed to create department');
    }
  };

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'owner':
        return 'default';
      case 'admin':
        return 'secondary';
      case 'member':
        return 'outline';
      default:
        return 'outline';
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
          <h1 className="text-3xl font-bold text-gray-900">Organization Settings</h1>
          <p className="text-gray-600 mt-1">Manage your organization, members, and departments</p>
        </div>
        <SubscriptionBadge subscription={identityContext?.subscription} size="large" />
      </div>

      {/* Organization Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Organization Information
          </CardTitle>
          <CardDescription>
            Update your organization details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Organization Name *</Label>
            <Input
              id="name"
              name="name"
              value={organizationData.name}
              onChange={handleInputChange}
              placeholder="Tech Corp"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={organizationData.description || ''}
              onChange={handleInputChange}
              placeholder="Brief description of your organization..."
              rows={3}
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

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members
          </CardTitle>
          <CardDescription>
            Invite and manage your team members
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Invite Member */}
          <div className="flex gap-2">
            <Input
              placeholder="email@example.com"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              type="email"
              className="flex-1"
            />
            <Button onClick={handleInviteMember}>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite
            </Button>
          </div>

          {/* Members List */}
          <div className="space-y-2 pt-4">
            {members.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No members yet. Invite your team!</p>
            ) : (
              members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-semibold">
                      {member.name?.charAt(0) || member.email.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{member.name || member.email}</p>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                  </div>
                  <Badge variant={getRoleBadgeVariant(member.role)}>
                    {member.role}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Departments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Departments
          </CardTitle>
          <CardDescription>
            Organize your team into departments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Department */}
          <div className="flex gap-2">
            <Input
              placeholder="Department name"
              value={newDepartmentName}
              onChange={(e) => setNewDepartmentName(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleAddDepartment}>
              Add Department
            </Button>
          </div>

          {/* Departments List */}
          <div className="grid md:grid-cols-2 gap-3 pt-4">
            {departments.length === 0 ? (
              <p className="text-gray-500 text-center py-4 col-span-2">No departments yet. Create your first one!</p>
            ) : (
              departments.map((dept) => (
                <div key={dept.id} className="p-3 border rounded-lg flex items-center justify-between">
                  <span className="font-medium">{dept.name}</span>
                  <Badge variant="outline">{dept.member_count || 0} members</Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Export */}
      <Card>
        <CardHeader>
          <CardTitle>Data Export</CardTitle>
          <CardDescription>
            Download all your organization data in JSON format (GDPR compliant)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataExportButton variant="outline" className="w-full md:w-auto" />
        </CardContent>
      </Card>
    </div>
  );
};

export default OrganizationSettings;








