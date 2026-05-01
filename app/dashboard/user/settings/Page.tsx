// app/(dashboard)/user/settings/page.tsx
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import {
  User,
  Bell,
  Lock,
  Shield,
  Moon,
  Languages,
  Download,
  Eye,
  LogOut,
  Save,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { Label } from '@/components/ui/Label';
import { Separator } from '@/components/ui/Separator';
import { useTheme } from 'next-themes';
import { toast } from 'react-hot-toast';

const profileSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  location: z.string().optional(),
  website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  email: z.string().email('Invalid email address'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: session?.user?.full_name || '',
      username: session?.user?.username || '',
      bio: session?.user?.bio || '',
      location: session?.user?.location || '',
      website: session?.user?.website || '',
      email: session?.user?.email || '',
    },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const onProfileSubmit = async (data: ProfileForm) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await update();
        toast.success('Profile updated successfully');
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/users/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success('Password changed successfully');
        passwordForm.reset();
      }
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTwoFactorToggle = async () => {
    try {
      const response = await fetch('/api/users/2fa/toggle', {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('2FA settings updated');
      }
    } catch (error) {
      toast.error('Failed to update 2FA');
    }
  };

  const handleExportData = async () => {
    try {
      const response = await fetch('/api/users/export-data', {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Data export started. You will receive an email when ready.');
      }
    } catch (error) {
      toast.error('Failed to start data export');
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/users/account', {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Account deleted');
        window.location.href = '/';
      }
    } catch (error) {
      toast.error('Failed to delete account');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold mb-8">Settings</h1>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-7 mb-8">
              <TabsTrigger value="profile">
                <User className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="notifications">
                <Bell className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Notifications</span>
              </TabsTrigger>
              <TabsTrigger value="privacy">
                <Lock className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Privacy</span>
              </TabsTrigger>
              <TabsTrigger value="security">
                <Shield className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Security</span>
              </TabsTrigger>
              <TabsTrigger value="appearance">
                <Moon className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Appearance</span>
              </TabsTrigger>
              <TabsTrigger value="language">
                <Languages className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Language</span>
              </TabsTrigger>
              <TabsTrigger value="data">
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Data</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your public profile information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Full Name</Label>
                        <Input
                          id="full_name"
                          {...profileForm.register('full_name')}
                          error={profileForm.formState.errors.full_name?.message}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          {...profileForm.register('username')}
                          error={profileForm.formState.errors.username?.message}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <textarea
                        id="bio"
                        {...profileForm.register('bio')}
                        rows={4}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                      {profileForm.formState.errors.bio && (
                        <p className="text-sm text-red-500">{profileForm.formState.errors.bio.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          {...profileForm.register('location')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          {...profileForm.register('website')}
                          placeholder="https://example.com"
                          error={profileForm.formState.errors.website?.message}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        {...profileForm.register('email')}
                        error={profileForm.formState.errors.email?.message}
                      />
                    </div>

                    <Button type="submit" isLoading={isLoading}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>
                    Choose what notifications you want to receive
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-medium">Push Notifications</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="likes">Likes</Label>
                        <Switch id="likes" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="comments">Comments</Label>
                        <Switch id="comments" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="follows">Follows</Label>
                        <Switch id="follows" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="mentions">Mentions</Label>
                        <Switch id="mentions" defaultChecked />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-medium">Email Notifications</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="email_likes">Likes on your posts</Label>
                        <Switch id="email_likes" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="email_comments">Comments on your posts</Label>
                        <Switch id="email_comments" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="email_follows">New followers</Label>
                        <Switch id="email_follows" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="weekly_digest">Weekly digest</Label>
                        <Switch id="weekly_digest" defaultChecked />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="privacy">
              <Card>
                <CardHeader>
                  <CardTitle>Privacy Settings</CardTitle>
                  <CardDescription>
                    Control who can see your content and interact with you
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="private_account">Private Account</Label>
                        <p className="text-sm text-gray-500">
                          When your account is private, only followers you approve can see your posts
                        </p>
                      </div>
                      <Switch id="private_account" />
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <Label>Who can see your posts</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input type="radio" id="public" name="post_visibility" value="public" defaultChecked />
                          <Label htmlFor="public">Public</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="radio" id="followers" name="post_visibility" value="followers" />
                          <Label htmlFor="followers">Followers only</Label>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <Label>Who can message you</Label>
                      <select className="w-full rounded-md border border-input bg-background px-3 py-2">
                        <option>Everyone</option>
                        <option>Followers only</option>
                        <option>No one</option>
                      </select>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <Label>Show activity status</Label>
                      <p className="text-sm text-gray-500">
                        When turned on, your followers will see when you're active
                      </p>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Manage your account security
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                    <h3 className="font-medium">Change Password</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        {...passwordForm.register('currentPassword')}
                        error={passwordForm.formState.errors.currentPassword?.message}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        {...passwordForm.register('newPassword')}
                        error={passwordForm.formState.errors.newPassword?.message}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        {...passwordForm.register('confirmPassword')}
                        error={passwordForm.formState.errors.confirmPassword?.message}
                      />
                    </div>

                    <Button type="submit" isLoading={isLoading}>
                      Update Password
                    </Button>
                  </form>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Two-Factor Authentication</h3>
                        <p className="text-sm text-gray-500">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <Button variant="outline" onClick={handleTwoFactorToggle}>
                        Enable
                      </Button>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="font-medium mb-2">Active Sessions</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                              <Eye className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <p className="font-medium">Current Session</p>
                              <p className="text-sm text-gray-500">Chrome on Windows</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-green-600">Active</Badge>
                        </div>
                      </div>
                      <Button variant="link" className="mt-2 text-red-500">
                        Log out of all devices
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appearance">
              <Card>
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>
                    Customize how the platform looks
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label>Theme</Label>
                    <div className="grid grid-cols-3 gap-4">
                      <button
                        onClick={() => setTheme('light')}
                        className={`p-4 rounded-lg border-2 text-center transition ${
                          theme === 'light' ? 'border-primary bg-primary/5' : 'border-gray-200'
                        }`}
                      >
                        <Sun className="h-6 w-6 mx-auto mb-2" />
                        <span className="text-sm">Light</span>
                      </button>
                      <button
                        onClick={() => setTheme('dark')}
                        className={`p-4 rounded-lg border-2 text-center transition ${
                          theme === 'dark' ? 'border-primary bg-primary/5' : 'border-gray-200'
                        }`}
                      >
                        <Moon className="h-6 w-6 mx-auto mb-2" />
                        <span className="text-sm">Dark</span>
                      </button>
                      <button
                        onClick={() => setTheme('system')}
                        className={`p-4 rounded-lg border-2 text-center transition ${
                          theme === 'system' ? 'border-primary bg-primary/5' : 'border-gray-200'
                        }`}
                      >
                        <Monitor className="h-6 w-6 mx-auto mb-2" />
                        <span className="text-sm">System</span>
                      </button>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label>Font Size</Label>
                    <select className="w-full rounded-md border border-input bg-background px-3 py-2">
                      <option>Small</option>
                      <option selected>Medium</option>
                      <option>Large</option>
                    </select>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label>Reduce Motion</Label>
                    // app/(dashboard)/user/settings/page.tsx (continued)

                    <p className="text-sm text-gray-500">
                      Minimize animations throughout the platform
                    </p>
                    <Switch />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label>High Contrast Mode</Label>
                    <p className="text-sm text-gray-500">
                      Increase contrast for better visibility
                    </p>
                    <Switch />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="language">
              <Card>
                <CardHeader>
                  <CardTitle>Language & Region</CardTitle>
                  <CardDescription>
                    Set your preferred language and regional settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label>Display Language</Label>
                    <select className="w-full rounded-md border border-input bg-background px-3 py-2">
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                      <option value="it">Italiano</option>
                      <option value="pt">Português</option>
                      <option value="ru">Русский</option>
                      <option value="ja">日本語</option>
                      <option value="ko">한국어</option>
                      <option value="zh">中文</option>
                    </select>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label>Date Format</Label>
                    <select className="w-full rounded-md border border-input bg-background px-3 py-2">
                      <option>MM/DD/YYYY</option>
                      <option>DD/MM/YYYY</option>
                      <option>YYYY-MM-DD</option>
                    </select>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label>Time Format</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input type="radio" id="12h" name="time_format" value="12h" defaultChecked />
                        <Label htmlFor="12h">12-hour (12:00 PM)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="radio" id="24h" name="time_format" value="24h" />
                        <Label htmlFor="24h">24-hour (14:00)</Label>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label>First Day of Week</Label>
                    <select className="w-full rounded-md border border-input bg-background px-3 py-2">
                      <option>Sunday</option>
                      <option>Monday</option>
                      <option>Saturday</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="data">
              <Card>
                <CardHeader>
                  <CardTitle>Data & Privacy</CardTitle>
                  <CardDescription>
                    Manage your data and privacy settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-medium">Download Your Data</h3>
                    <p className="text-sm text-gray-500">
                      Get a copy of all your data including posts, messages, and account information
                    </p>
                    <Button variant="outline" onClick={handleExportData}>
                      <Download className="h-4 w-4 mr-2" />
                      Request Data Export
                    </Button>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-medium">Account Information</h3>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Account created</span>
                        <span className="text-sm font-medium">
                          {new Date(session?.user?.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Email</span>
                        <span className="text-sm font-medium">{session?.user?.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Account status</span>
                        <span className="text-sm font-medium text-green-600">Active</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-medium text-red-600">Danger Zone</h3>
                    <p className="text-sm text-gray-500">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <Button variant="destructive" onClick={handleDeleteAccount}>
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}