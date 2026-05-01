'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  FileText,
  MessageCircle,
  Flag,
  BarChart3,
  Shield,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useTheme } from 'next-themes';
import { toast } from 'react-hot-toast';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
  { name: 'Users', href: '/dashboard/admin/users', icon: Users, badge: 0 },
  { name: 'Posts', href: '/dashboard/admin/posts', icon: FileText, badge: 0 },
  { name: 'Comments', href: '/dashboard/admin/comments', icon: MessageCircle, badge: 0 },
  { name: 'Reports', href: '/dashboard/admin/reports', icon: Flag, badge: 0 },
  { name: 'Analytics', href: '/dashboard/admin/analytics', icon: BarChart3 },
  { name: 'Notifications', href: '/dashboard/admin/notifications', icon: Bell },
  { name: 'Settings', href: '/dashboard/admin/settings', icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      router.push('/');
      toast.success('Logged out');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const isActive = (href: string) => {
    if (href === '/dashboard/admin') return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg"
      >
        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Theme Toggle */}
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="fixed top-4 right-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg"
      >
        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {(sidebarCollapsed ? false : true) && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ duration: 0.3 }}
            className={`fixed top-0 left-0 h-full bg-white dark:bg-gray-800 shadow-xl z-40 overflow-y-auto transition-all duration-300 ${
              sidebarCollapsed ? 'w-20' : 'w-72'
            } ${mobileMenuOpen ? 'block' : 'hidden lg:block'}`}
          >
            <div className="p-6">
              {/* Logo */}
              <div className="flex items-center justify-between mb-8">
                <Link href="/dashboard/admin" className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xl">S</span>
                  </div>
                  {!sidebarCollapsed && (
                    <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Admin
                    </span>
                  )}
                </Link>
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="hidden lg:block p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  {sidebarCollapsed ? (
                    <ChevronRight className="h-5 w-5" />
                  ) : (
                    <ChevronLeft className="h-5 w-5" />
                  )}
                </button>
              </div>

              {/* Admin Profile */}
              <div className="mb-8 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Avatar
                    src={session?.user?.avatar_url}
                    alt={session?.user?.username || 'Admin'}
                    size="md"
                  />
                  {!sidebarCollapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{session?.user?.name || 'Admin'}</p>
                      <p className="text-sm text-gray-500 truncate">@{session?.user?.username}</p>
                      <p className="text-xs text-purple-600 font-medium mt-1">Administrator</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation */}
              <nav className="space-y-1">
                {navigation.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
                        active
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <item.icon className={`h-5 w-5 ${active ? 'text-white' : ''}`} />
                        {!sidebarCollapsed && <span className="text-sm font-medium">{item.name}</span>}
                      </div>
                      {item.badge !== undefined && item.badge > 0 && !sidebarCollapsed && (
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          active ? 'bg-white text-purple-600' : 'bg-red-500 text-white'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Logout */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-3 px-4 py-3 w-full rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                >
                  <LogOut className="h-5 w-5" />
                  {!sidebarCollapsed && <span className="text-sm font-medium">Logout</span>}
                </button>
              </div>

              {/* Version */}
              {!sidebarCollapsed && (
                <div className="mt-4 text-center text-xs text-gray-400">
                  <p>Admin Panel v1.0.0</p>
                  <p>© 2024 SocialFlow</p>
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main
        className={`transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'
        } p-6`}
      >
        {children}
      </main>
    </div>
  );
}


