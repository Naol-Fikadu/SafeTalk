'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Bell, Lock, Moon, Languages, Download, LogOut,
  Shield, MessageSquare, Ban, Palette, CreditCard, Activity,
  HelpCircle, Camera, Save, AlertTriangle, CheckCircle,
  Eye, EyeOff, Smartphone, Mail, Globe, Trash2,
  Users, UserPlus, AtSign, FileText, Video, Volume2,
  Zap, BarChart, Database, Phone, MapPin, Clock, Loader2,
  ChevronRight, Edit2, X, Plus, Settings as SettingsIcon,
  Wifi, WifiOff, MoonStar, Sun, Laptop, Tablet, Smartphone as MobileIcon
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';
import { toast, Toaster } from 'react-hot-toast';
import axios from 'axios';
import { useRouter } from 'next/navigation';

// Types
type TabType = 'account' | 'security' | 'privacy' | 'notifications' | 'messaging' | 'restrictions' | 'appearance' | 'general' | 'subscription' | 'activity' | 'support';

interface UserSettings {
  account: {
    fullName: string;
    username: string;
    email: string;
    phone: string;
    bio: string;
    dob: string;
    website: string;
    location: string;
    avatarUrl: string | null;
    coverUrl: string | null;
    isVerified: boolean;
    isPrivate: boolean;
    twoFactorEnabled: boolean;
    language: string;
    theme: string;
    lastLogin: string;
    createdAt: string;
  };
  privacy: {
    profileVisibility: 'public' | 'friends' | 'private';
    postVisibility: 'public' | 'friends' | 'private';
    messagePermission: 'everyone' | 'friends' | 'nobody';
    tagPermission: 'everyone' | 'friends' | 'nobody';
    showOnlineStatus: boolean;
    showFollowers: boolean;
    searchEngineIndexing: boolean;
  };
  notifications: {
    push: { likes: boolean; comments: boolean; follows: boolean; messages: boolean; mentions: boolean };
    email: { marketing: boolean; security: boolean; digest: boolean; mentions: boolean };
  };
  appearance: {
    theme: string;
    language: string;
  };
  sessions: Array<{
    id: string;
    device_info: any;
    ip_address: string;
    last_activity: string;
    created_at: string;
    expires_at: string;
  }>;
  blockedUsers: Array<{
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
    created_at: string;
  }>;
  verificationStatus: string | null;
}

// UI Components
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white dark:bg-gray-800/50 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 ${className}`}>{children}</div>;
}

function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className="p-6 pb-2">{children}</div>;
}

function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`text-xl font-semibold ${className}`}>{children}</h2>;
}

function CardDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-500 dark:text-gray-400">{children}</p>;
}

function CardContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-6 pt-2 ${className}`}>{children}</div>;
}

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'destructive';
  size?: 'default' | 'sm' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

function Button({ children, onClick, variant = 'default', size = 'default', disabled = false, loading = false, className = '' }: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    outline: "border border-gray-300 dark:border-gray-700 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800",
    ghost: "hover:bg-gray-100 dark:hover:bg-gray-800",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600",
    destructive: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  };
  const sizes = {
    default: "px-4 py-2 text-sm",
    sm: "px-3 py-1.5 text-xs",
    lg: "px-6 py-3 text-base",
  };
  return (
    <button 
      onClick={onClick} 
      disabled={disabled || loading} 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
}

function Input({ type = 'text', placeholder, value, onChange, className = '', disabled = false }: any) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${className}`}
    />
  );
}

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return <label htmlFor={htmlFor} className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">{children}</label>;
}

function Switch({ checked, onCheckedChange, disabled = false }: { checked: boolean; onCheckedChange: (checked: boolean) => void; disabled?: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onCheckedChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('account');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<{ [key: string]: boolean }>({});
  const [settings, setSettings] = useState<UserSettings | null>(null);
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    bio: '',
    website: '',
    location: '',
    dob: ''
  });
  
  const [privacyForm, setPrivacyForm] = useState({
    profileVisibility: 'public' as 'public' | 'friends' | 'private',
    postVisibility: 'public' as 'public' | 'friends' | 'private',
    messagePermission: 'everyone' as 'everyone' | 'friends' | 'nobody',
    tagPermission: 'everyone' as 'everyone' | 'friends' | 'nobody',
    showOnlineStatus: true,
    showFollowers: true,
    searchEngineIndexing: true
  });
  
  const [notificationForm, setNotificationForm] = useState({
    pushEnabled: true,
    emailEnabled: true,
    digestEnabled: true
  });
  
  // Security states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [twoFactorQRCode, setTwoFactorQRCode] = useState('');
  
  // Appearance states
  const [appearanceForm, setAppearanceForm] = useState({
    theme: 'system',
    language: 'en'
  });

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/user/settings');
      const data = response.data;
      setSettings(data);
      
      // Initialize forms
      setProfileForm({
        fullName: data.account.fullName || '',
        username: data.account.username || '',
        email: data.account.email || '',
        phone: data.account.phone || '',
        bio: data.account.bio || '',
        website: data.account.website || '',
        location: data.account.location || '',
        dob: data.account.dob ? new Date(data.account.dob).toISOString().split('T')[0] : ''
      });
      
      setPrivacyForm({
        profileVisibility: data.privacy.profileVisibility,
        postVisibility: data.privacy.postVisibility,
        messagePermission: data.privacy.messagePermission,
        tagPermission: data.privacy.tagPermission,
        showOnlineStatus: data.privacy.showOnlineStatus,
        showFollowers: data.privacy.showFollowers,
        searchEngineIndexing: data.privacy.searchEngineIndexing
      });
      
      setNotificationForm({
        pushEnabled: data.notifications.push.likes,
        emailEnabled: data.notifications.email.security,
        digestEnabled: data.notifications.email.digest
      });
      
      setAppearanceForm({
        theme: data.appearance.theme,
        language: data.appearance.language
      });
      
      // Apply theme
      if (data.appearance.theme !== 'system') {
        setTheme(data.appearance.theme);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(prev => ({ ...prev, profile: true }));
    try {
      await axios.put('/api/user/settings', {
        section: 'profile',
        data: profileForm
      });
      toast.success('Profile updated successfully');
      await fetchSettings();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(prev => ({ ...prev, profile: false }));
    }
  };

  const handleSavePrivacy = async () => {
    setSaving(prev => ({ ...prev, privacy: true }));
    try {
      await axios.put('/api/user/settings', {
        section: 'privacy',
        data: privacyForm
      });
      toast.success('Privacy settings updated');
      await fetchSettings();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update privacy');
    } finally {
      setSaving(prev => ({ ...prev, privacy: false }));
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(prev => ({ ...prev, notifications: true }));
    try {
      await axios.put('/api/user/settings', {
        section: 'notifications',
        data: notificationForm
      });
      toast.success('Notification settings updated');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update notifications');
    } finally {
      setSaving(prev => ({ ...prev, notifications: false }));
    }
  };

  const handleSaveAppearance = async () => {
    setSaving(prev => ({ ...prev, appearance: true }));
    try {
      await axios.put('/api/user/settings', {
        section: 'appearance',
        data: appearanceForm
      });
      
      if (appearanceForm.theme !== 'system') {
        setTheme(appearanceForm.theme);
      } else {
        setTheme('system');
      }
      
      toast.success('Appearance settings updated');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update appearance');
    } finally {
      setSaving(prev => ({ ...prev, appearance: false }));
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setSaving(prev => ({ ...prev, password: true }));
    try {
      await axios.post('/api/user/change-password', {
        currentPassword,
        newPassword
      });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordFields(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to change password');
    } finally {
      setSaving(prev => ({ ...prev, password: false }));
    }
  };

  const handleEnable2FA = async () => {
    if (!twoFactorCode) {
      toast.error('Please enter verification code');
      return;
    }
    
    setSaving(prev => ({ ...prev, twoFactor: true }));
    try {
      await axios.post('/api/user/2fa', {
        enable: true,
        token: twoFactorCode
      });
      toast.success('Two-factor authentication enabled');
      setShow2FASetup(false);
      setTwoFactorCode('');
      await fetchSettings();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Invalid verification code');
    } finally {
      setSaving(prev => ({ ...prev, twoFactor: false }));
    }
  };

  const handleDisable2FA = async () => {
    setSaving(prev => ({ ...prev, twoFactor: true }));
    try {
      await axios.post('/api/user/2fa', {
        enable: false
      });
      toast.success('Two-factor authentication disabled');
      await fetchSettings();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to disable 2FA');
    } finally {
      setSaving(prev => ({ ...prev, twoFactor: false }));
    }
  };

  const handleSetup2FA = async () => {
    setSaving(prev => ({ ...prev, setup2FA: true }));
    try {
      const response = await axios.get('/api/user/2fa');
      setTwoFactorSecret(response.data.secret);
      setTwoFactorQRCode(response.data.qrCode);
      setShow2FASetup(true);
    } catch (error) {
      toast.error('Failed to setup 2FA');
    } finally {
      setSaving(prev => ({ ...prev, setup2FA: false }));
    }
  };

  const handleBlockUser = async (userId: string, action: 'block' | 'unblock') => {
    try {
      await axios.post('/api/user/block', { userId, action });
      toast.success(action === 'block' ? 'User blocked' : 'User unblocked');
      await fetchSettings();
    } catch (error) {
      toast.error('Failed to update block status');
    }
  };

  const handleLogoutAllDevices = async () => {
    if (!confirm('Are you sure you want to log out from all devices?')) return;
    
    setSaving(prev => ({ ...prev, logoutAll: true }));
    try {
      await axios.delete('/api/user/sessions', { data: { allDevices: true } });
      toast.success('Logged out from all devices');
      await signOut({ callbackUrl: '/login' });
    } catch (error) {
      toast.error('Failed to logout from all devices');
    } finally {
      setSaving(prev => ({ ...prev, logoutAll: false }));
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;
    // Implement account deletion API call
    toast.error('Account deletion not implemented yet');
  };

  const tabs: { id: TabType; label: string; icon: any; color: string }[] = [
    { id: 'account', label: 'Account', icon: User, color: 'text-blue-500' },
    { id: 'security', label: 'Security', icon: Lock, color: 'text-red-500' },
    { id: 'privacy', label: 'Privacy', icon: Shield, color: 'text-purple-500' },
    { id: 'notifications', label: 'Notifications', icon: Bell, color: 'text-yellow-500' },
    { id: 'restrictions', label: 'Restrictions', icon: Ban, color: 'text-orange-500' },
    { id: 'appearance', label: 'Appearance', icon: Palette, color: 'text-pink-500' },
    { id: 'activity', label: 'Activity', icon: Activity, color: 'text-indigo-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-500 animate-spin" />
          <p className="text-gray-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <Toaster position="top-right" />
      
      <div className="container px-4 py-8 mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text">
            Settings
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Manage your account preferences and security settings
          </p>
        </motion.div>
        
        {/* Tab Navigation */}
        <div className="sticky top-0 z-10 flex flex-wrap gap-2 py-4 mb-8 -mt-4 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-sm">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-white dark:bg-gray-800 shadow-md text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white'
                  }
                `}
              >
                <Icon className={`w-4 h-4 ${isActive ? tab.color : ''}`} />
                <span className="hidden sm:inline">{tab.label}</span>
              </motion.button>
            );
          })}
        </div>
        
        {/* Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Account Settings */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-500" />
                      Profile Information
                    </CardTitle>
                    <CardDescription>Update your public profile information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input 
                          value={profileForm.fullName} 
                          onChange={(e: any) => setProfileForm({...profileForm, fullName: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Username</Label>
                        <Input 
                          value={profileForm.username} 
                          onChange={(e: any) => setProfileForm({...profileForm, username: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email Address</Label>
                        <Input 
                          type="email" 
                          value={profileForm.email} 
                          disabled
                          className="bg-gray-50 dark:bg-gray-900"
                        />
                        {settings?.account.isVerified && (
                          <p className="flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle className="w-3 h-3" /> Verified
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Phone Number</Label>
                        <Input 
                          value={profileForm.phone} 
                          onChange={(e: any) => setProfileForm({...profileForm, phone: e.target.value})}
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Bio</Label>
                        <textarea
                          rows={3}
                          value={profileForm.bio}
                          onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-700"
                          placeholder="Tell us about yourself..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Website</Label>
                        <Input 
                          value={profileForm.website} 
                          onChange={(e: any) => setProfileForm({...profileForm, website: e.target.value})}
                          placeholder="https://"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Location</Label>
                        <Input 
                          value={profileForm.location} 
                          onChange={(e: any) => setProfileForm({...profileForm, location: e.target.value})}
                          placeholder="City, Country"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Date of Birth</Label>
                        <Input 
                          type="date" 
                          value={profileForm.dob} 
                          onChange={(e: any) => setProfileForm({...profileForm, dob: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-3 pt-4 border-t dark:border-gray-800">
                      <Button 
                        onClick={handleSaveProfile} 
                        loading={saving.profile}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button variant="destructive" onClick={handleDeleteAccount}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Account
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="w-5 h-5 text-red-500" />
                      Security
                    </CardTitle>
                    <CardDescription>Protect your account with advanced security features</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Change Password */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Change Password</h3>
                        <Button variant="ghost" size="sm" onClick={() => setShowPasswordFields(!showPasswordFields)}>
                          {showPasswordFields ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          {showPasswordFields ? 'Hide' : 'Change'}
                        </Button>
                      </div>
                      {showPasswordFields && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3">
                          <Input 
                            type="password" 
                            placeholder="Current Password" 
                            value={currentPassword} 
                            onChange={(e: any) => setCurrentPassword(e.target.value)} 
                          />
                          <Input 
                            type="password" 
                            placeholder="New Password" 
                            value={newPassword} 
                            onChange={(e: any) => setNewPassword(e.target.value)} 
                          />
                          <Input 
                            type="password" 
                            placeholder="Confirm New Password" 
                            value={confirmPassword} 
                            onChange={(e: any) => setConfirmPassword(e.target.value)} 
                          />
                          <Button onClick={handleChangePassword} loading={saving.password} className="w-full">
                            Update Password
                          </Button>
                        </motion.div>
                      )}
                    </div>
                    
                    {/* 2FA */}
                    <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <div>
                        <h3 className="font-semibold">Two-Factor Authentication</h3>
                        <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                      </div>
                      {settings?.account.twoFactorEnabled ? (
                        <Button variant="outline" onClick={handleDisable2FA} loading={saving.twoFactor}>
                          Disable 2FA
                        </Button>
                      ) : (
                        <Button onClick={handleSetup2FA} loading={saving.setup2FA}>
                          Enable 2FA
                        </Button>
                      )}
                    </div>
                    
                    {/* 2FA Setup Modal */}
                    {show2FASetup && twoFactorQRCode && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="w-full max-w-md p-6 mx-4 bg-white dark:bg-gray-800 rounded-xl">
                          <h3 className="mb-4 text-xl font-semibold">Set Up Two-Factor Authentication</h3>
                          <p className="mb-4 text-sm text-gray-500">
                            Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                          </p>
                          <div className="flex justify-center mb-4">
                            <img src={twoFactorQRCode} alt="2FA QR Code" className="w-48 h-48" />
                          </div>
                          <p className="mb-2 text-xs text-gray-500">Or enter this code manually:</p>
                          <code className="block p-2 mb-4 font-mono text-sm text-center bg-gray-100 rounded dark:bg-gray-900">
                            {twoFactorSecret}
                          </code>
                          <Input
                            placeholder="Enter verification code"
                            value={twoFactorCode}
                            onChange={(e: any) => setTwoFactorCode(e.target.value)}
                            className="mb-4"
                          />
                          <div className="flex gap-2">
                            <Button onClick={handleEnable2FA} loading={saving.twoFactor} className="flex-1">
                              Verify & Enable
                            </Button>
                            <Button variant="outline" onClick={() => setShow2FASetup(false)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Active Sessions */}
                    <div>
                      <h3 className="mb-3 font-semibold">Active Sessions</h3>
                      <div className="space-y-3">
                        {settings?.sessions.map((session) => (
                          <div key={session.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                            <div className="flex items-center gap-3">
                              <Smartphone className="w-5 h-5 text-gray-500" />
                              <div>
                                <p className="font-medium">{session.device_info?.userAgent?.split(' ')[0] || 'Unknown Device'}</p>
                                <p className="text-xs text-gray-500">{session.ip_address || 'Unknown IP'}</p>
                                <p className="text-xs text-gray-400">Last active: {new Date(session.last_activity).toLocaleString()}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button variant="outline" onClick={handleLogoutAllDevices} loading={saving.logoutAll} className="w-full mt-3">
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout from all devices
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Privacy Settings */}
            {activeTab === 'privacy' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-purple-500" />
                    Privacy Controls
                  </CardTitle>
                  <CardDescription>Control who can see and interact with you</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <span>Profile Visibility</span>
                      <select
                        value={privacyForm.profileVisibility}
                        onChange={(e) => setPrivacyForm({...privacyForm, profileVisibility: e.target.value as any})}
                        className="p-1 bg-transparent border rounded-md"
                      >
                        <option value="public">Public</option>
                        <option value="friends">Friends Only</option>
                        <option value="private">Private</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <span>Post Visibility</span>
                      <select
                        value={privacyForm.postVisibility}
                        onChange={(e) => setPrivacyForm({...privacyForm, postVisibility: e.target.value as any})}
                        className="p-1 bg-transparent border rounded-md"
                      >
                        <option value="public">Public</option>
                        <option value="friends">Friends Only</option>
                        <option value="private">Private</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <span>Who can message you</span>
                      <select
                        value={privacyForm.messagePermission}
                        onChange={(e) => setPrivacyForm({...privacyForm, messagePermission: e.target.value as any})}
                        className="p-1 bg-transparent border rounded-md"
                      >
                        <option value="everyone">Everyone</option>
                        <option value="friends">Friends Only</option>
                        <option value="nobody">Nobody</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <span>Who can tag you</span>
                      <select
                        value={privacyForm.tagPermission}
                        onChange={(e) => setPrivacyForm({...privacyForm, tagPermission: e.target.value as any})}
                        className="p-1 bg-transparent border rounded-md"
                      >
                        <option value="everyone">Everyone</option>
                        <option value="friends">Friends Only</option>
                        <option value="nobody">Nobody</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <span>Show online status</span>
                      <Switch checked={privacyForm.showOnlineStatus} onCheckedChange={(val) => setPrivacyForm({...privacyForm, showOnlineStatus: val})} />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <span>Show followers count</span>
                      <Switch checked={privacyForm.showFollowers} onCheckedChange={(val) => setPrivacyForm({...privacyForm, showFollowers: val})} />
                    </div>
                  </div>
                  <Button onClick={handleSavePrivacy} loading={saving.privacy} className="w-full">
                    Save Privacy Settings
                  </Button>
                </CardContent>
              </Card>
            )}
            
            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-yellow-500" />
                    Notifications
                  </CardTitle>
                  <CardDescription>Customize how you receive alerts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <span>Push Notifications</span>
                    <Switch checked={notificationForm.pushEnabled} onCheckedChange={(val) => setNotificationForm({...notificationForm, pushEnabled: val})} />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <span>Email Notifications</span>
                    <Switch checked={notificationForm.emailEnabled} onCheckedChange={(val) => setNotificationForm({...notificationForm, emailEnabled: val})} />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <span>Weekly Digest</span>
                    <Switch checked={notificationForm.digestEnabled} onCheckedChange={(val) => setNotificationForm({...notificationForm, digestEnabled: val})} />
                  </div>
                  <Button onClick={handleSaveNotifications} loading={saving.notifications} className="w-full">
                    Save Notification Settings
                  </Button>
                </CardContent>
              </Card>
            )}
            
            {/* Restrictions Settings */}
            {activeTab === 'restrictions' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Ban className="w-5 h-5 text-orange-500" />
                      Blocked Users
                    </CardTitle>
                    <CardDescription>Users you've blocked cannot interact with you</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!settings?.blockedUsers.length ? (
                      <p className="py-8 text-center text-gray-500">No blocked users</p>
                    ) : (
                      <div className="space-y-3">
                        {settings.blockedUsers.map(user => (
                          <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-10 h-10 bg-gray-300 rounded-full dark:bg-gray-600">
                                {user.avatar_url ? (
                                  <Image src={user.avatar_url} alt={user.username} width={40} height={40} className="rounded-full" />
                                ) : (
                                  <span className="text-lg font-semibold">{user.username.charAt(0).toUpperCase()}</span>
                                )}
                              </div>
                              <div>
                                <p className="font-medium">@{user.username}</p>
                                <p className="text-xs text-gray-500">{user.full_name}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleBlockUser(user.id, 'unblock')}>
                              Unblock
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Appearance Settings */}
            {activeTab === 'appearance' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5 text-pink-500" />
                    Appearance & Preferences
                  </CardTitle>
                  <CardDescription>Customize your interface experience</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label>Theme</Label>
                    <div className="grid grid-cols-3 gap-3 mt-2">
                      {(['light', 'dark', 'system'] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setAppearanceForm({...appearanceForm, theme: t})}
                          className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                            appearanceForm.theme === t ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : 'border-gray-200 dark:border-gray-800'
                          }`}
                        >
                          {t === 'light' && <Sun className="w-5 h-5" />}
                          {t === 'dark' && <MoonStar className="w-5 h-5" />}
                          {t === 'system' && <Laptop className="w-5 h-5" />}
                          <span className="text-sm capitalize">{t}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label>Language</Label>
                    <select
                      value={appearanceForm.language}
                      onChange={(e) => setAppearanceForm({...appearanceForm, language: e.target.value})}
                      className="w-full p-2 mt-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    >
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                      <option value="ja">日本語</option>
                    </select>
                  </div>
                  
                  <Button onClick={handleSaveAppearance} loading={saving.appearance} className="w-full">
                    Save Appearance
                  </Button>
                </CardContent>
              </Card>
            )}
            
            {/* Activity & Data */}
            {activeTab === 'activity' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-indigo-500" />
                      Account Activity
                    </CardTitle>
                    <CardDescription>Recent activity on your account</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        <span>Member since</span>
                        <span className="font-medium">
                          {settings?.account.createdAt ? new Date(settings.account.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        <span>Last login</span>
                        <span className="font-medium">
                          {settings?.account.lastLogin ? new Date(settings.account.lastLogin).toLocaleString() : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        <span>Account status</span>
                        <span className="px-2 py-1 text-xs text-green-700 bg-green-100 rounded-full">Active</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Data & Privacy</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex items-center gap-3">
                        <Database className="w-5 h-5" />
                        <span>Download your data</span>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Request
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}