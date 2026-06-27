'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { UserProfile } from '@/components/ui/user-profile';
import { useEffect, useState, useCallback } from 'react';
import { getRoleAwareHref } from '@/lib/role-routes';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Calendar,
  DollarSign,
  TrendingUp,
  Briefcase,
  FileText,
  Settings,
  GraduationCap,
  ClipboardList,
  Heart,
  Monitor,
  Building2,
  UserPlus,
  BarChart3,
  Menu,
  X,
  Search,
  Bell,
  LogOut,
  ChevronDown,
  HelpCircle,
  Star,
  FileCheck,
  CheckCircle
} from 'lucide-react';
import { NotificationBell } from '@/components/notifications/notification-bell';

// Keka HR Navigation - Exact Structure with role-based paths
const kekaNav = {
  EMPLOYEE: {
    'My Workspace': [
      { label: 'Dashboard', href: '/employee', icon: LayoutDashboard },
      { label: 'My Profile', href: '/profile', icon: Users },
    ],
    'Time & Attendance': [
      { label: 'Attendance', href: '/attendance', icon: UserCheck },
      { label: 'Leave', href: '/leave', icon: Calendar },
    ],
    'Payroll': [
      { label: 'Payslips', href: '/payroll/payslips', icon: FileText },
    ],
    'Performance': [
      { label: 'Performance', href: '/performance', icon: TrendingUp },
    ],
    'Team': [
      { label: 'Team', href: '/my-team', icon: Users },
      { label: 'Team Calendar', href: '/team-calendar', icon: Calendar },
    ],
    'Organization': [
      { label: 'Organization', href: '/employees', icon: Building2 },
    ],
    'More': [
      { label: 'Documents', href: '/documents', icon: FileText },
      { label: 'Training', href: '/training', icon: GraduationCap },
      { label: 'My Devices', href: '/devices', icon: Monitor },
      { label: 'Engagement', href: '/engagement', icon: Heart },
      { label: 'My Lifecycle', href: '/employee/lifecycle', icon: ClipboardList },
    ],
  },
  MANAGER: {
    'Dashboard': [
      { label: 'Dashboard', href: '/manager', icon: LayoutDashboard },
    ],
    'Team': [
      { label: 'Team Overview', href: '/manager', icon: Users },
      { label: 'Team Lifecycle', href: '/manager/lifecycle', icon: ClipboardList },
      { label: 'Approvals', href: '/manager/approvals', icon: UserCheck },
      { label: 'Leave Approvals', href: '/leave/approvals', icon: CheckCircle },
    ],
    'Time & Attendance': [
      { label: 'Attendance', href: '/attendance', icon: UserCheck },
      { label: 'Leave Policies', href: '/leave/policies', icon: FileCheck },
    ],
    'Payroll': [
      { label: 'Payroll', href: '/payroll', icon: DollarSign },
      { label: 'Salary Structures', href: '/payroll/salary-structures', icon: DollarSign },
      { label: 'Salary Revisions', href: '/payroll/salary-revisions', icon: TrendingUp },
    ],
    'Settings': [
      { label: 'Organization', href: '/settings/organization', icon: Building2 },
    ],
  },
  HR_MANAGER: {
    'Dashboard': [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    ],
    'Core HR': [
      { label: 'Employees', href: '/admin/employees', icon: Users },
      { label: 'Departments', href: '/departments', icon: Building2 },
      { label: 'Lifecycle', href: '/hr/lifecycle', icon: ClipboardList },
      { label: 'Resignations', href: '/resignations', icon: LogOut },
    ],
    'Recruitment': [
      { label: 'Recruitment', href: '/recruitment', icon: UserPlus },
      { label: 'Candidates', href: '/recruitment/candidates', icon: Users },
    ],
    'Leave Management': [
      { label: 'Leave Policies', href: '/leave/policies', icon: FileCheck },
      { label: 'Holidays', href: '/leave/holidays', icon: Star },
    ],
    'Time & Attendance': [
      { label: 'Attendance', href: '/attendance', icon: UserCheck },
    ],
    'Payroll': [
      { label: 'Payroll', href: '/payroll', icon: DollarSign },
      { label: 'Salary Structures', href: '/payroll/salary-structures', icon: DollarSign },
      { label: 'Salary Revisions', href: '/payroll/salary-revisions', icon: TrendingUp },
    ],
    'Performance': [
      { label: 'Performance', href: '/performance', icon: TrendingUp },
      { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    ],
    'Assets': [
      { label: 'Company Devices', href: '/admin/devices', icon: Monitor },
    ],
    'Settings': [
      { label: 'Organization', href: '/settings/organization', icon: Building2 },
      { label: 'Subscription', href: '/settings/subscription', icon: TrendingUp },
    ],
  },
  ADMIN: {
    'Dashboard': [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    ],
    'Core HR': [
      { label: 'Employees', href: '/admin/employees', icon: Users },
      { label: 'Departments', href: '/departments', icon: Building2 },
      { label: 'Team Management', href: '/admin/team-management', icon: Users },
      { label: 'Lifecycle', href: '/admin/employee-lifecycle', icon: ClipboardList },
      { label: 'Resignations', href: '/resignations', icon: LogOut },
    ],
    'Recruitment': [
      { label: 'Recruitment', href: '/recruitment', icon: UserPlus },
      { label: 'Candidates', href: '/recruitment/candidates', icon: Users },
    ],
    'Leave Management': [
      { label: 'Leave Policies', href: '/leave/policies', icon: FileCheck },
      { label: 'Holidays', href: '/leave/holidays', icon: Star },
      { label: 'Leave Approvals', href: '/leave/approvals', icon: CheckCircle },
    ],
    'Time & Attendance': [
      { label: 'Attendance', href: '/attendance', icon: UserCheck },
    ],
    'Payroll': [
      { label: 'Payroll', href: '/payroll', icon: DollarSign },
      { label: 'Salary Structures', href: '/payroll/salary-structures', icon: DollarSign },
      { label: 'Salary Revisions', href: '/payroll/salary-revisions', icon: TrendingUp },
    ],
    'Performance': [
      { label: 'Performance', href: '/performance', icon: TrendingUp },
      { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    ],
    'Assets': [
      { label: 'Company Devices', href: '/admin/devices', icon: Monitor },
    ],
    'Settings': [
      { label: 'Organization', href: '/settings/organization', icon: Building2 },
      { label: 'Subscription', href: '/settings/subscription', icon: TrendingUp },
    ],
  },
  PAYROLL_ADMIN: {
    'Dashboard': [
      { label: 'Dashboard', href: '/payroll', icon: LayoutDashboard },
    ],
    'Payroll': [
      { label: 'Payroll', href: '/payroll', icon: DollarSign },
      { label: 'Payroll Lifecycle', href: '/payroll/lifecycle', icon: ClipboardList },
      { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    ],
    'Data': [
      { label: 'Employees', href: '/admin/employees', icon: Users },
      { label: 'Attendance', href: '/attendance', icon: UserCheck },
      { label: 'Leave', href: '/leave', icon: Calendar },
    ],
    'Settings': [
      { label: 'Organization', href: '/settings/organization', icon: Building2 },
    ],
  },
  SUPER_ADMIN: {
    'Dashboard': [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    ],
    'Core HR': [
      { label: 'Employees', href: '/admin/employees', icon: Users },
      { label: 'Departments', href: '/departments', icon: Building2 },
      { label: 'Lifecycle', href: '/admin/employee-lifecycle', icon: ClipboardList },
      { label: 'Resignations', href: '/resignations', icon: LogOut },
    ],
    'Recruitment': [
      { label: 'Recruitment', href: '/recruitment', icon: UserPlus },
    ],
    'Payroll': [
      { label: 'Payroll', href: '/payroll', icon: DollarSign },
      { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    ],
    'Assets': [
      { label: 'Company Devices', href: '/admin/devices', icon: Monitor },
    ],
    'Settings': [
      { label: 'Organization', href: '/settings/organization', icon: Building2 },
      { label: 'Subscription', href: '/settings/subscription', icon: TrendingUp },
    ],
  },
};

export function AppShell({ title, children }: { title: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [userRole, setUserRole] = useState<string>('EMPLOYEE');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Set mounted state
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (session?.user?.role) {
      setUserRole(session.user.role);
    }
  }, [session]);

  // Dispatch navigation event for pages to listen to
  useEffect(() => {
    if (isMounted) {
      const timer = setTimeout(() => {
        window.dispatchEvent(new CustomEvent('navigation-complete', { detail: { pathname } }));
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [pathname, isMounted]);

  // Prevent hydration mismatch by rendering nothing until mounted
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-bg-body flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-keka-primary to-keka-primary-dark animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  const getCurrentNavItems = () => {
    return (
      kekaNav[userRole as keyof typeof kekaNav] ||
      kekaNav.EMPLOYEE
    );
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const renderNavSection = (
    sectionTitle: string,
    items: readonly { label: string; href: string; icon: any }[]
  ) => {
    const isExpanded = expandedSections[sectionTitle] !== false;

    return (
      <div className="mb-5">
        <button
          onClick={() => toggleSection(sectionTitle)}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-text-muted uppercase tracking-wider hover:text-text-secondary transition-colors"
        >
          {sectionTitle}
          <ChevronDown
            className={cn(
              'h-4 w-4 transition-transform duration-200',
              isExpanded ? 'rotate-180' : ''
            )}
          />
        </button>
        {isExpanded && (
          <div className="space-y-1 mt-2">
            {items.map(({ label, href, icon: Icon }, index) => {
              // Skip items with undefined href
              if (!href) return null;

              // Get role-aware href
              const roleAwareHref = getRoleAwareHref(userRole, href);

              return (
                <Link
                  key={`${roleAwareHref}-${label}-${index}`}
                  href={roleAwareHref}
                  className={cn(
                    'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200',
                    pathname === roleAwareHref || pathname.startsWith(roleAwareHref + '/')
                      ? 'bg-keka-primary text-white shadow-md shadow-keka-primary/30'
                      : 'text-text-secondary hover:bg-keka-primary-light hover:text-keka-primary'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4 flex-shrink-0',
                      pathname === roleAwareHref ? 'text-white' : 'text-text-muted group-hover:text-keka-primary'
                    )}
                  />
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const currentNav = getCurrentNavItems();

  return (
    <div className="flex min-h-screen bg-bg-body">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Keka HR Sidebar - 250px fixed width */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-border-light transition-transform duration-300 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Keka HR Logo - 64px height */}
          <div className="h-16 flex items-center justify-between px-5 border-b border-border-light">
            <Link href={getRoleAwareHref(userRole, '/dashboard')} className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-keka-primary to-keka-primary-dark flex items-center justify-center shadow-lg shadow-keka-primary/30">
                <span className="text-white font-bold text-lg">K</span>
              </div>
              <span className="text-lg font-bold text-text-primary" suppressHydrationWarning>
                HRMS Pro
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-md hover:bg-gray-100"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-5">
            {Object.entries(currentNav).map(([sectionTitle, items]) => (
              <div key={sectionTitle}>
                {renderNavSection(
                  sectionTitle,
                  items as readonly { label: string; href: string; icon: any }[]
                )}
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border-light">
            {/* SaaS Features - Subscription & Org (Admin only) */}
            {['ADMIN', 'HR_MANAGER', 'SUPER_ADMIN', 'PAYROLL_ADMIN'].includes(userRole) && (
              <>
                {['ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'].includes(userRole) && (
                  <Link
                    href={getRoleAwareHref(userRole, '/settings/subscription')}
                    className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-text-secondary hover:bg-keka-primary-light hover:text-keka-primary transition-all duration-200 mb-2"
                  >
                    <TrendingUp className="h-4 w-4 flex-shrink-0" />
                    <span>Subscription</span>
                  </Link>
                )}
                <Link
                  href={getRoleAwareHref(userRole, '/settings/organization')}
                  className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-text-secondary hover:bg-keka-primary-light hover:text-keka-primary transition-all duration-200"
                >
                  <Building2 className="h-4 w-4 flex-shrink-0" />
                  <span>Organization</span>
                </Link>
                <div className="my-3 border-t border-border-light" />
              </>
            )}

            <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-text-secondary hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
            <p className="text-xs text-center text-text-muted mt-3">
              © 2025 HRMS Pro
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 lg:ml-64 min-h-screen flex flex-col">
        {/* Keka HR Header - 64px height */}
        <header className="sticky top-0 z-40 h-16 bg-white border-b border-border-light shadow-subtle flex items-center justify-between px-6">
          <div className="flex items-center gap-4 flex-1">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu className="h-5 w-5 text-text-secondary" />
            </button>

            {/* Search Box */}
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search employees, departments..."
                className="w-full pl-11 pr-4 h-10 text-sm border border-border-light rounded-lg bg-bg-body text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-keka-primary/20 focus:border-keka-primary transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Help Link */}
            <Link
              href={getRoleAwareHref(userRole, '/help')}
              className="hidden md:flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-keka-purple transition-colors"
            >
              <HelpCircle className="h-4 w-4" />
              Help
            </Link>

            {/* Plan Badge */}
            <div className="hidden md:flex items-center gap-2 bg-gradient-to-r from-keka-primary/10 to-keka-primary-dark/10 px-3 py-1.5 rounded-full border border-keka-primary/20">
              <TrendingUp className="h-3.5 w-3.5 text-keka-primary" />
              <span className="text-xs font-semibold text-keka-primary">PRO Plan</span>
            </div>

            {/* Notifications */}
            <NotificationBell />
            <UserProfile />
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6"  suppressHydrationWarning>
          {children}
        </main>
      </div>
    </div>
  );
}
