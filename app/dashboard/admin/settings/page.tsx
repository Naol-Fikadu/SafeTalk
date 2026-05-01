'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function SettingsPage() {
  const [site, setSite] = useState({
    site_name: '',
    site_description: '',
    maintenance_mode: 'false',
    max_upload_size: '32',
    default_user_role: 'user',
  });
  const [personal, setPersonal] = useState({
    email_notifications: true,
    push_notifications: true,
    weekly_digest: true,
    theme: 'system',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data.siteSettings) setSite(prev => ({ ...prev, ...data.siteSettings }));
      if (data.personal) setPersonal(prev => ({ ...prev, ...data.personal }));
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast.error('Could not load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSite = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'site', data: site }),
      });
      if (res.ok) toast.success('Site settings saved');
      else throw new Error();
    } catch {
      toast.error('Failed to save site settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePersonal = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'personal', data: personal }),
      });
      if (res.ok) toast.success('Personal settings saved');
      else throw new Error();
    } catch {
      toast.error('Failed to save personal settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordData;
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success('Password updated');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(result.error || 'Failed to update password');
      }
    } catch {
      toast.error('Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <Tabs defaultValue="site">
        <TabsList className="mb-6">
          <TabsTrigger value="site">Site Settings</TabsTrigger>
          <TabsTrigger value="personal">Personal Settings</TabsTrigger>
        </TabsList>

        {/* Site Settings */}
        <TabsContent value="site">
          <Card>
            <CardHeader>
              <CardTitle>General Site Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="site_name">Site Name</Label>
                  <Input
                    id="site_name"
                    value={site.site_name}
                    onChange={(e) => setSite({ ...site, site_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="site_description">Site Description</Label>
                  <Input
                    id="site_description"
                    value={site.site_description}
                    onChange={(e) => setSite({ ...site, site_description: e.target.value })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="maintenance_mode">Maintenance Mode</Label>
                  <Switch
                    id="maintenance_mode"
                    checked={site.maintenance_mode === 'true'}
                    onCheckedChange={(checked) =>
                      setSite({ ...site, maintenance_mode: checked ? 'true' : 'false' })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="max_upload_size">Max Upload Size (MB)</Label>
                  <Input
                    id="max_upload_size"
                    type="number"
                    value={site.max_upload_size}
                    onChange={(e) => setSite({ ...site, max_upload_size: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="default_user_role">Default User Role</Label>
                  <Input
                    id="default_user_role"
                    value={site.default_user_role}
                    onChange={(e) => setSite({ ...site, default_user_role: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={handleSaveSite} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Site Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Personal Settings */}
        <TabsContent value="personal">
          <div className="space-y-6">
            {/* Notification Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email_notifications">Email Notifications</Label>
                  <Switch
                    id="email_notifications"
                    checked={personal.email_notifications}
                    onCheckedChange={(checked) =>
                      setPersonal({ ...personal, email_notifications: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="push_notifications">Push Notifications</Label>
                  <Switch
                    id="push_notifications"
                    checked={personal.push_notifications}
                    onCheckedChange={(checked) =>
                      setPersonal({ ...personal, push_notifications: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="weekly_digest">Weekly Digest</Label>
                  <Switch
                    id="weekly_digest"
                    checked={personal.weekly_digest}
                    onCheckedChange={(checked) =>
                      setPersonal({ ...personal, weekly_digest: checked })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="theme">Interface Theme</Label>
                  <select
                    id="theme"
                    value={personal.theme}
                    onChange={(e) => setPersonal({ ...personal, theme: e.target.value })}
                    className="w-full mt-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
                  >
                    <option value="system">System</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>
                <Button onClick={handleSavePersonal} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Preferences
                </Button>
              </CardContent>
            </Card>

            {/* Password Change */}
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  />
                </div>
                <Button onClick={handleChangePassword} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Update Password
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
