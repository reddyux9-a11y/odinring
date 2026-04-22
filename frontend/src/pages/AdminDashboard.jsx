import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../shared/ui/card";
import { Badge } from "../shared/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../shared/ui/tabs";
import {
  Shield,
  Users,
  Zap,
  Link,
  TrendingUp,
  Calendar,
  Settings,
  LogOut,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Ban,
  UserCheck,
  Activity,
  Clock,
  Globe,
  MousePointer,
  Download
} from "lucide-react";
import LogoutConfirmDialog from "../components/LogoutConfirmDialog";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import api from '../lib/api';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { admin, adminLogout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [rings, setRings] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedRing, setSelectedRing] = useState(null);
  const [ringAnalytics, setRingAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (!admin) {
      navigate('/admin/login');
      return;
    }
    // Only load once on mount or when admin changes (not on every admin update)
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadDashboardData();
    }
  }, [admin?.id, navigate]); // Only depend on admin.id, not entire admin object

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load all data in parallel instead of sequentially
      const [statsResponse, ringsResponse, usersResponse] = await Promise.allSettled([
        api.get(`/admin/stats`),
        api.get(`/admin/rings`),
        api.get(`/admin/users?limit=10`)
      ]);

      if (statsResponse.status === 'fulfilled') {
        setStats(statsResponse.value.data);
      }
      if (ringsResponse.status === 'fulfilled') {
        setRings(ringsResponse.value.data);
      }
      if (usersResponse.status === 'fulfilled') {
        setUsers(usersResponse.value.data.users);
      }

      // Check for errors
      const errors = [statsResponse, ringsResponse, usersResponse].filter(r => r.status === 'rejected');
      if (errors.length > 0) {
        const firstError = errors[0].reason;
        if (firstError?.response?.status === 401) {
          forceLogout();
        } else {
          toast.error("Failed to load some dashboard data");
        }
      }

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error("Failed to load dashboard data");
      if (error.response?.status === 401) {
        forceLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const loadRingAnalytics = async (ringId) => {
    try {
      const response = await api.get(`/admin/rings/${ringId}/analytics`);
      setRingAnalytics(response.data);
      setSelectedRing(ringId);
    } catch (error) {
      console.error('Failed to load ring analytics:', error);
      toast.error("Failed to load ring analytics");
    }
  };

  const forceLogout = () => {
    adminLogout();
    toast.success("Logged out successfully");
    navigate('/admin/login');
  };

  const handleLogout = () => {
    setLogoutDialogOpen(true);
  };

  const handleLogoutConfirmed = () => {
    forceLogout();
  };

  const handleUserAction = async (action, userId, additionalData = {}) => {
    try {
      let endpoint, method, data;
      
      switch (action) {
        case 'deactivate':
          endpoint = `${API}/admin/users/${userId}/deactivate`;
          method = 'POST';
          break;
        case 'activate':
          endpoint = `${API}/admin/users/${userId}/activate`;
          method = 'POST';
          break;
        case 'reset-ring':
          endpoint = `${API}/admin/users/${userId}/reset-ring`;
          method = 'POST';
          break;
        case 'assign-ring':
          endpoint = `${API}/admin/users/${userId}/assign-ring`;
          method = 'POST';
          data = additionalData;
          break;
        default:
          throw new Error('Unknown action');
      }
      
      const response = await api({ method: method.toLowerCase(), url: endpoint, data });
      
      toast.success(response.data.message);
      
      // Reload users data
      const usersResponse = await api.get(`/admin/users?limit=10`);
      setUsers(usersResponse.data.users);
      
    } catch (error) {
      console.error(`Failed to ${action} user:`, error);
      toast.error(error.response?.data?.detail || `Failed to ${action} user`);
    }
  };

  const exportData = async (type) => {
    try {
      const response = await api.get(`/admin/export/${type}`);
      
      // Convert to CSV and download
      const csvContent = convertToCSV(response.data[type]);
      downloadCSV(csvContent, `odinring_${type}_export_${new Date().toISOString().split('T')[0]}.csv`);
      
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} data exported successfully`);
      
    } catch (error) {
      console.error(`Failed to export ${type}:`, error);
      toast.error(`Failed to export ${type} data`);
    }
  };

  const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');
    
    return csvContent;
  };

  const downloadCSV = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-black border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const chartColors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="min-h-screen bg-background">
      <LogoutConfirmDialog
        open={logoutDialogOpen}
        onOpenChange={setLogoutDialogOpen}
        onConfirm={handleLogoutConfirmed}
      />
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-8 h-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-foreground">OdinRing Admin</h1>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {admin?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
              </Badge>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-muted-foreground">Welcome, {admin?.username}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-border hover:bg-muted"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="rings">Rings</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <Users className="w-8 h-8 text-blue-600" />
                      <div>
                        <p className="text-2xl font-bold text-foreground">{stats?.total_users || 0}</p>
                        <p className="text-sm text-muted-foreground">Total Users</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center text-sm">
                      <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                      <span className="text-green-600">+{stats?.new_users_today || 0} today</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <Zap className="w-8 h-8 text-purple-600" />
                      <div>
                        <p className="text-2xl font-bold text-foreground">{stats?.total_rings || 0}</p>
                        <p className="text-sm text-muted-foreground">Active Rings</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center text-sm">
                      <Activity className="w-4 h-4 text-blue-600 mr-1" />
                      <span className="text-blue-600">{stats?.active_users_today || 0} active today</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <Link className="w-8 h-8 text-green-600" />
                      <div>
                        <p className="text-2xl font-bold text-foreground">{stats?.total_links || 0}</p>
                        <p className="text-sm text-muted-foreground">Total Links</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center text-sm">
                      <Globe className="w-4 h-4 text-muted-foreground mr-1" />
                      <span className="text-muted-foreground">Across all profiles</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <MousePointer className="w-8 h-8 text-orange-600" />
                      <div>
                        <p className="text-2xl font-bold text-foreground">{stats?.total_taps || 0}</p>
                        <p className="text-sm text-muted-foreground">Total Taps</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center text-sm">
                      <TrendingUp className="w-4 h-4 text-orange-600 mr-1" />
                      <span className="text-orange-600">Ring interactions</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Top Performing Rings */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Rings</CardTitle>
                <CardDescription>Most active rings by tap count</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.top_rings?.slice(0, 5).map((ring, index) => (
                    <div key={ring.ring_id} className="flex items-center space-x-4 p-3 rounded-lg bg-muted">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{ring.user_name}</div>
                        <div className="text-sm text-muted-foreground">@{ring.username} • {ring.ring_id}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">{ring.tap_count}</div>
                        <div className="text-sm text-muted-foreground">taps</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest ring interactions and events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.recent_activity?.slice(0, 10).map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-3 p-2 hover:bg-muted rounded">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.event_type === 'tap' ? 'bg-blue-500' :
                        activity.event_type === 'view' ? 'bg-green-500' :
                        'bg-gray-500'
                      }`}></div>
                      <div className="flex-1">
                        <span className="font-medium">{activity.user_name}</span>
                        <span className="text-muted-foreground"> • {activity.event_type} • {activity.ring_id}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rings Tab */}
          <TabsContent value="rings" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Ring Management</h2>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => exportData('rings')}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Rings
                </Button>
                <Button variant="outline" size="sm">
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>

            <div className="grid gap-6">
              {rings.map((ring) => (
                <Card key={ring.ring_id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {ring.user_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-lg">{ring.user_name}</div>
                          <div className="text-muted-foreground">@{ring.username} • {ring.email}</div>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                            <span>Ring: {ring.ring_id}</span>
                            <span>•</span>
                            <span>{ring.tap_count} taps</span>
                            <span>•</span>
                            <span>{ring.link_count} links</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={ring.is_active ? "default" : "secondary"}>
                          {ring.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadRingAnalytics(ring.ring_id)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Analytics
                        </Button>
                      </div>
                    </div>
                    {ring.last_tap && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="text-sm text-muted-foreground">
                          Last tap: {new Date(ring.last_tap).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">User Management</h2>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => exportData('users')}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Users
                </Button>
                <Button variant="outline" size="sm">
                  <Search className="w-4 h-4 mr-2" />
                  Search Users
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              {users.map((user) => (
                <Card key={user.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">@{user.username} • {user.email}</div>
                          <div className="text-xs text-muted-foreground flex items-center space-x-2 mt-1">
                            <span>Ring: {user.ring_id || 'None'}</span>
                            <span>•</span>
                            <span>{user.link_count || 0} links</span>
                            <span>•</span>
                            <span>{user.tap_count || 0} taps</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={user.is_active ? "default" : "secondary"}>
                          {user.is_active ? "Active" : "Inactive"}
                        </Badge>
                        
                        {/* User Action Buttons */}
                        <div className="flex items-center space-x-1">
                          {user.is_active ? (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleUserAction('deactivate', user.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Ban className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleUserAction('activate', user.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <UserCheck className="w-4 h-4" />
                            </Button>
                          )}
                          
                          {user.ring_id ? (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleUserAction('reset-ring', user.id)}
                              className="text-orange-600 hover:text-orange-700"
                            >
                              <Zap className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                const ringId = prompt('Enter Ring ID to assign:');
                                if (ringId) {
                                  handleUserAction('assign-ring', user.id, { ring_id: ringId });
                                }
                              }}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Link className="w-4 h-4" />
                            </Button>
                          )}
                          
                          <Button variant="outline" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {selectedRing && ringAnalytics ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Ring Analytics: {selectedRing}</h2>
                    <p className="text-muted-foreground">{ringAnalytics.user_info.name} (@{ringAnalytics.user_info.username})</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedRing(null)}
                  >
                    Back to Overview
                  </Button>
                </div>

                {/* Analytics Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-blue-600">{ringAnalytics.summary.total_events}</div>
                      <div className="text-muted-foreground">Total Events</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-green-600">{ringAnalytics.summary.tap_events}</div>
                      <div className="text-muted-foreground">Ring Taps</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-purple-600">{ringAnalytics.summary.view_events}</div>
                      <div className="text-muted-foreground">Profile Views</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Daily Stats Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Daily Activity (Last 30 Days)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={ringAnalytics.daily_stats}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="_id" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="taps" stroke="#3b82f6" strokeWidth={2} />
                          <Line type="monotone" dataKey="views" stroke="#10b981" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Events */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Events</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {ringAnalytics.recent_events.slice(0, 10).map((event) => (
                        <div key={event.id} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div className="flex items-center space-x-3">
                            <div className={`w-2 h-2 rounded-full ${
                              event.event_type === 'tap' ? 'bg-blue-500' : 'bg-green-500'
                            }`}></div>
                            <span className="font-medium">{event.event_type}</span>
                            <span className="text-muted-foreground">from {event.ip_address}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(event.timestamp).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-12">
                <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Ring</h3>
                <p className="text-gray-600">Choose a ring from the Rings tab to view detailed analytics</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;