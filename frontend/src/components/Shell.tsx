import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  GitBranch,
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  CreditCard,
  TrendingDown,
  Calendar,
  FileBarChart2,
  Shield,
  Search,
  LogOut,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

export const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, activeBranchId, switchBranch, hasPermission } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch branches for branch switcher (only if Super Admin)
  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN') {
      api.get('/branches')
        .then(res => setBranches(res.data.data))
        .catch(() => { });
    }
  }, [user]);

  // Fetch notifications (Commented out - not implemented)
  const fetchNotifications = () => {
    /*
    api.get('/notifications')
      .then(res => setNotifications(res.data.data))
      .catch(() => { });
    */
  };

  useEffect(() => {
    if (user) {
      /*
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // 30s poll
      return () => clearInterval(interval);
      */
    }
  }, [user]);

  // Enforce Light Mode
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('rda_theme');
  }, []);

  const markNotificationRead = async (id: string) => {
    /*
    try {
      await api.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch { }
    */
  };

  const markAllNotificationsRead = async () => {
    /*
    try {
      await api.put('/notifications/read-all');
      fetchNotifications();
    } catch { }
    */
  };

  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    switchBranch(val || null);
    window.location.reload(); // Refresh to trigger TanStack cache resets
  };

  // Nav menu links based on RBAC permissions
  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', permission: 'read:dashboard' },
    { label: 'Branches', icon: GitBranch, path: '/branches', permission: 'read:branch', superAdminOnly: true },
    { label: 'Staff Directory', icon: Users, path: '/staff', permission: 'manage:staff' },
    { label: 'Student Admissions', icon: GraduationCap, path: '/students', permission: 'manage:students' },
    { label: 'Courses & Catalog', icon: BookOpen, path: '/courses', permission: 'manage:courses' },
    { label: 'Batches & Attendance', icon: CalendarCheck, path: '/batches', permission: 'manage:attendance' },
    { label: 'Fees & Billing', icon: CreditCard, path: '/fees', permission: 'manage:fees' },
    { label: 'Income & Expenses', icon: TrendingDown, path: '/expenses', permission: 'manage:expenses' },
    { label: 'Events & Shows', icon: Calendar, path: '/events', permission: 'manage:events' },
    // { label: 'Reports & P&L', icon: FileBarChart2, path: '/reports', permission: 'read:reports' },
    { label: 'Audit Security Logs', icon: Shield, path: '/logs', permission: 'read:dashboard', superAdminOnly: true },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (item.superAdminOnly && user?.role !== 'SUPER_ADMIN') return false;
    return hasPermission(item.permission);
  });

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  return (
    <div className="h-screen overflow-hidden flex bg-background text-foreground transition-colors duration-200">

      {/* 1. SIDEBAR - DESKTOP */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card">
        {/* Brand */}
        <div className="h-16 shrink-0 flex items-center px-6 border-b border-border gap-2">
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight text-center">Rudreshwar Dance Academy</h1>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === '/students'
              ? (location.pathname === '/students' || location.pathname.startsWith('/student/') || location.pathname.startsWith('/students/'))
              : location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${isActive
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Card */}
        <div className="p-4 shrink-0 border-t border-border bg-secondary/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 bg-primary/10 flex items-center justify-center text-primary font-bold rounded-xl">
              {user?.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-sm truncate">{user?.name}</h4>
              <p className="text-xs text-muted-foreground truncate uppercase font-bold tracking-wider">{user?.role.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={() => setIsLogoutConfirmOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-destructive border border-destructive/20 hover:bg-destructive/10 rounded-xl transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">

        {/* TOP NAVIGATION BAR */}
        <header className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-border bg-card sticky top-0 z-30">
          {/* Left: Search & Mobile Menu Trigger */}
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-secondary rounded-lg"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          {/* Right: Actions, Switcher, Theme & Profile */}
          <div className="flex items-center gap-4">

            {/* Branch Selector */}
            {user?.role === 'SUPER_ADMIN' ? (
              <div className="relative flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-semibold uppercase hidden sm:inline">Active Branch:</span>
                <select
                  value={activeBranchId || ''}
                  onChange={handleBranchChange}
                  className="bg-secondary text-sm font-semibold border border-border px-3 py-1.5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">All Branches (HQ)</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name.replace('Dance School ', '')}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-secondary border border-border rounded-xl text-xs font-semibold">
                <GitBranch className="h-3.5 w-3.5 text-primary" />
                <span>{user?.branchName || 'No Branch'}</span>
              </div>
            )}



            {/* Notifications Drawer Switch (Commented out - not implemented) */}
            {/*
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 hover:bg-secondary rounded-xl transition-all"
              >
                <Bell className="h-5 w-5 text-muted-foreground" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-destructive rounded-full border border-card animate-pulse" />
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden">
                  <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/35">
                    <h3 className="font-bold text-sm">Notifications</h3>
                    {unreadNotificationsCount > 0 && (
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-border">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-xs text-muted-foreground">
                        No new notifications.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3.5 text-xs transition-all ${!n.read ? 'bg-primary/5 font-medium' : ''}`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-foreground">{n.title}</span>
                            {!n.read && (
                              <button
                                onClick={() => markNotificationRead(n.id)}
                                className="text-[10px] text-primary hover:underline font-bold"
                              >
                                Mark Read
                              </button>
                            )}
                          </div>
                          <p className="text-muted-foreground leading-relaxed mb-1">{n.message}</p>
                          <span className="text-[9px] text-muted-foreground/80">
                            {new Date(n.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            */}
          </div>
        </header>

        {/* WORKSPACE SCROLL BODY */}
        <main className="flex-1 p-6 md:p-8">
          {children}
        </main>
      </div>

      {/* 3. MOBILE MENU BACKDROP & DRAWER */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-background/80 backdrop-blur-sm">
          <div className="w-64 bg-card border-r border-border p-6 flex flex-col relative animate-slide-in">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-2 hover:bg-secondary rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="h-10 flex items-center gap-2 mb-8 mt-2">
              <div className="h-8 w-8 bg-primary rounded-lg text-primary-foreground font-black flex items-center justify-center">R</div>
              <span className="font-bold text-md">Rudreshwar Dance</span>
            </div>

            <nav className="flex-1 space-y-1.5">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.path === '/students'
                  ? (location.pathname === '/students' || location.pathname.startsWith('/student/') || location.pathname.startsWith('/students/'))
                  : location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'
                      }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

             <div className="pt-4 border-t border-border">
              <button
                onClick={() => { setIsMobileMenuOpen(false); setIsLogoutConfirmOpen(true); }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold text-destructive border border-destructive/20 hover:bg-destructive/10 rounded-xl"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-6 animate-scale-in text-center">
            <div className="mx-auto h-12 w-12 bg-destructive/10 text-destructive flex items-center justify-center rounded-full">
              <LogOut className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold text-foreground animate-pulse">Confirm Sign Out</h3>
              <p className="text-xs text-muted-foreground">Are you sure you want to sign out of your dance school workspace?</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="flex-1 bg-secondary hover:bg-secondary/80 border border-border py-2 px-3 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsLogoutConfirmOpen(false);
                  logout();
                  navigate('/login');
                }}
                className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground py-2 px-3 rounded-xl font-semibold text-xs shadow-lg transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
