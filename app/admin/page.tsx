'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import {
  Users,
  UserPlus,
  Settings,
  TrendingUp,
  AlertCircle,
  LoaderCircle,
  UserCheck,
  Calendar,
  DollarSign,
  Monitor,
  Building2,
  Clock,
  Briefcase,
  Target,
  ClipboardList,
  BarChart3,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

interface AdminStats {
  totalEmployees: number;
  activeJobs: number;
  pendingApprovals: number;
  newHires: number;
  attendanceToday: number;
  activeDevices: number;
  pendingLeaves: number;
  payrollPending: number;
  ongoingTrainings: number;
  turnoverRate: number;
}

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentHires, setRecentHires] = useState<any[]>([]);
  const [departmentStats, setDepartmentStats] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/dashboard');
      if (response.ok) {
        const result = await response.json();
        setStats(result.data.overview);
        setRecentHires(result.data.recentActivity?.recentHires || []);
        setDepartmentStats(result.data.stats?.departmentStats || []);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppShell title="Admin Dashboard">
        <div className="flex items-center justify-center h-screen">
          <LoaderCircle className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Admin Dashboard">
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-br from-keka-primary to-keka-primary-dark rounded-2xl p-8 text-white shadow-float">
          <h2 className="text-2xl font-bold mb-2">
            Admin Dashboard 👋
          </h2>
          <p className="text-white/90">
            Overview of your organization's HR metrics
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Employees"
            value={stats?.totalEmployees || 0}
            icon={<Users className="h-6 w-6" />}
            color="keka"
            trend={{ value: stats?.newHires || 0, label: 'new this month', isPositive: true }}
          />
          <StatsCard
            title="Attendance Today"
            value={`${stats?.attendanceToday || 0}%`}
            icon={<UserCheck className="h-6 w-6" />}
            color="success"
          />
          <StatsCard
            title="Pending Approvals"
            value={stats?.pendingApprovals || 0}
            icon={<AlertCircle className="h-6 w-6" />}
            color="warning"
          />
          <StatsCard
            title="Active Devices"
            value={stats?.activeDevices || 0}
            icon={<Monitor className="h-6 w-6" />}
            color="info"
          />
        </div>

        {/* Additional Stats */}
        <div className="grid gap-5 md:grid-cols-3">
          <StatsCard
            title="Pending Leaves"
            value={stats?.pendingLeaves || 0}
            icon={<Calendar className="h-6 w-6" />}
            color="warning"
          />
          <StatsCard
            title="Active Jobs"
            value={stats?.activeJobs || 0}
            icon={<Briefcase className="h-6 w-6" />}
            color="info"
          />
          <StatsCard
            title="Ongoing Trainings"
            value={stats?.ongoingTrainings || 0}
            icon={<Target className="h-6 w-6" />}
            color="success"
          />
        </div>

        {/* HR Modules Grid */}
        <div>
          <h3 className="text-lg font-bold text-text-primary mb-4">HR Modules</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <ModuleCard
              title="Employees"
              desc="Manage records"
              icon={<Users className="h-6 w-6" />}
              href="/admin/employees"
            />
            <ModuleCard
              title="Departments"
              desc="Organization"
              icon={<Building2 className="h-6 w-6" />}
              href="/departments"
            />
            <ModuleCard
              title="Attendance"
              desc="Track time"
              icon={<Clock className="h-6 w-6" />}
              href="/attendance"
            />
            <ModuleCard
              title="Leave"
              desc="Manage leave"
              icon={<Calendar className="h-6 w-6" />}
              href="/leave"
            />
            <ModuleCard
              title="Payroll"
              desc="Salary & payslips"
              icon={<DollarSign className="h-6 w-6" />}
              href="/payroll"
            />
            <ModuleCard
              title="Recruitment"
              desc="Hiring pipeline"
              icon={<UserPlus className="h-6 w-6" />}
              href="/recruitment"
            />
          </div>
        </div>

        {/* Department Distribution */}
        <div className="bg-white rounded-xl border border-border-light shadow-card">
          <div className="p-5 border-b border-border-light">
            <h3 className="text-base font-bold text-text-primary">Department Distribution</h3>
          </div>
          <div className="p-5">
            {departmentStats.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {departmentStats.map((dept, i) => (
                  <div key={i} className="p-4 rounded-lg border border-border-light text-center">
                    <p className="text-2xl font-bold text-text-primary">{dept.count}</p>
                    <p className="text-sm font-semibold text-text-primary mt-1">{dept.name}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-text-secondary py-8">No department data available</p>
            )}
          </div>
        </div>

        {/* Recent Hires */}
        <div className="bg-white rounded-xl border border-border-light shadow-card">
          <div className="p-5 border-b border-border-light flex items-center justify-between">
            <h3 className="text-base font-bold text-text-primary">Recent Hires</h3>
            <Link href="/admin/employees" className="text-sm font-semibold text-keka-primary hover:underline flex items-center gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="p-5 space-y-3">
            {recentHires.length > 0 ? (
              recentHires.slice(0, 5).map((hire, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-bg-body">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-keka-primary to-keka-primary-dark flex items-center justify-center text-white text-sm font-bold">
                      {hire.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{hire.name}</p>
                      <p className="text-sm text-gray-600">{hire.designation} • {hire.department}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{new Date(hire.joiningDate).toLocaleDateString()}</p>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      New
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-text-secondary py-8">No recent hires</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-lg font-bold text-text-primary mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickAction
              title="Add Employee"
              icon={<UserPlus className="h-7 w-7" />}
              href="/admin/employees/add"
            />
            <QuickAction
              title="Create Department"
              icon={<Building2 className="h-7 w-7" />}
              href="/admin/departments/add"
            />
            <QuickAction
              title="Generate Payroll"
              icon={<DollarSign className="h-7 w-7" />}
              href="/payroll"
            />
            <QuickAction
              title="View Reports"
              icon={<BarChart3 className="h-7 w-7" />}
              href="/admin/analytics"
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function StatsCard({
  title,
  value,
  icon,
  trend,
  color = 'keka'
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; label: string; isPositive: boolean };
  color?: 'keka' | 'success' | 'warning' | 'danger' | 'info';
}) {
  const colorClasses = {
    keka: 'bg-keka-primary-light text-keka-primary',
    success: 'bg-green-100 text-green-600',
    warning: 'bg-yellow-100 text-yellow-600',
    danger: 'bg-red-100 text-red-600',
    info: 'bg-blue-100 text-blue-600',
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-bold text-text-muted uppercase tracking-wide">
            {title}
          </p>
          <p className="text-3xl font-bold text-text-primary mt-2">
            {value}
          </p>
          {trend && (
            <div className="flex items-center gap-1.5 mt-2">
              <span className={`text-xs font-bold ${trend.isPositive ? 'text-success' : 'text-danger'}`}>
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </span>
              <span className="text-xs text-text-secondary">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

function ModuleCard({
  title,
  desc,
  icon,
  href
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
  href?: string;
}) {
  const content = (
    <>
      <div className="p-2.5 rounded-lg bg-gradient-to-br from-keka-primary to-keka-primary-dark text-white shadow-lg shadow-keka-primary/30 mb-3 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <span className="text-sm font-bold text-text-primary text-center">
        {title}
      </span>
      <span className="text-xs text-text-secondary text-center mt-1">
        {desc}
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="group flex flex-col items-center p-4 rounded-xl border border-border-light bg-white shadow-card hover:shadow-elevated hover:-translate-y-1 hover:border-keka-primary transition-all duration-200">
        {content}
      </Link>
    );
  }

  return (
    <div className="group flex flex-col items-center p-4 rounded-xl border border-border-light bg-white shadow-card">
      {content}
    </div>
  );
}

function QuickAction({
  title,
  icon,
  href
}: {
  title: string;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col items-center gap-3 p-5 rounded-2xl border border-border-light bg-white shadow-card hover:shadow-elevated hover:-translate-y-1 hover:border-keka-primary/30 transition-all duration-200"
    >
      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-keka-primary to-keka-primary-dark flex items-center justify-center text-white shadow-lg shadow-keka-primary/30 group-hover:scale-105 transition-transform">
        {icon}
      </div>
      <span className="text-sm font-semibold text-text-primary text-center">
        {title}
      </span>
    </Link>
  );
}
