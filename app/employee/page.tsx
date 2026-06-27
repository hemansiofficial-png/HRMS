'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import {
  Calendar,
  UserCheck,
  DollarSign,
  Monitor,
  Clock,
  FileText,
  CheckCircle,
  ArrowRight,
  LoaderCircle,
  Bell,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

interface EmployeeDashboard {
  user: any;
  attendance: any;
  leave: any;
  approvals: any;
  team: any;
  devices: any;
  activity: any;
  upcoming: any;
}

export default function EmployeeDashboardPage() {
  const { data: session } = useSession();
  const [dashboardData, setDashboardData] = useState<EmployeeDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetch('/api/dashboard')
        .then((res) => res.json())
        .then((data) => {
          setDashboardData(data.data);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Failed to fetch dashboard data:', err);
          setLoading(false);
        });
    }
  }, [session]);

  if (loading || !dashboardData) {
    return (
      <AppShell title="Dashboard">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <LoaderCircle className="h-12 w-12 animate-spin text-keka-primary mx-auto mb-4" />
            <p className="text-text-secondary">Loading dashboard...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const { user, attendance, leave, team, devices, activity, upcoming } = dashboardData;

  // Handle users without employee records
  const employeeData = user.employee;
  const designation = employeeData?.designation || user.role;
  const department = employeeData?.department?.name || 'N/A';

  return (
    <AppShell title="Dashboard">
      <div className="space-y-6 animate-fade-in">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-br from-keka-primary to-keka-primary-dark rounded-2xl p-8 text-white shadow-float">
          <h2 className="text-2xl font-bold mb-2">Welcome back, {user.name.split(' ')[0]}! 👋</h2>
          <p className="text-white/90">
            {designation} • {department}
          </p>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-lg font-bold text-text-primary mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <QuickAction
              title="Request Leave"
              icon={<Calendar className="h-7 w-7" />}
              href="/leave"
            />
            <QuickAction
              title="My Attendance"
              icon={<UserCheck className="h-7 w-7" />}
              href="/attendance"
            />
            <QuickAction
              title="View Payslip"
              icon={<DollarSign className="h-7 w-7" />}
              href="/payroll/payslips"
            />
            <QuickAction
              title="My Devices"
              icon={<Monitor className="h-7 w-7" />}
              href="/devices"
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Attendance Today"
            value={attendance.today?.status || 'Not marked'}
            icon={<Clock className="h-6 w-6" />}
            color={attendance.today?.checkIn ? 'success' : 'warning'}
          />
          <StatsCard
            title="Leave Balance"
            value={`${leave.approved} approved`}
            icon={<Calendar className="h-6 w-6" />}
            color="keka"
          />
          <StatsCard
            title="Pending Requests"
            value={leave.pending.toString()}
            icon={<FileText className="h-6 w-6" />}
            color="warning"
          />
          <StatsCard
            title="Assigned Devices"
            value={devices.assigned.toString()}
            icon={<Monitor className="h-6 w-6" />}
            color="info"
          />
        </div>

        {/* Recent Activity & Upcoming */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-border-light shadow-card">
            <div className="p-5 border-b border-border-light flex items-center justify-between">
              <h3 className="text-base font-bold text-text-primary">Recent Activity</h3>
              <button className="text-sm font-semibold text-keka-primary hover:underline flex items-center gap-1">
                View All <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {activity.leaves.length === 0 && activity.attendance.length === 0 ? (
                <p className="text-center text-text-secondary py-8">No recent activity</p>
              ) : (
                [...activity.leaves, ...activity.attendance]
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .slice(0, 5)
                  .map((item: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-bg-body transition-colors">
                      <div
                        className={`p-2 rounded-lg ${
                          item.type === 'leave' ? 'bg-green-100 text-success' : 'bg-blue-100 text-keka-primary'
                        }`}
                      >
                        {item.type === 'leave' ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-text-primary">{item.title}</p>
                        <p className="text-xs text-text-secondary mt-0.5">
                          {item.type === 'leave'
                            ? item.description
                            : `Checked in at ${item.checkIn ? new Date(item.checkIn).toLocaleTimeString() : 'N/A'}`}
                        </p>
                      </div>
                      <span className="text-xs text-text-muted">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-xl border border-border-light shadow-card">
            <div className="p-5 border-b border-border-light flex items-center justify-between">
              <h3 className="text-base font-bold text-text-primary">Upcoming Holidays</h3>
              <Link
                href="/leave"
                className="text-sm font-semibold text-keka-primary hover:underline flex items-center gap-1"
              >
                View Calendar <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="p-5 space-y-3">
              {upcoming.holidays.length === 0 ? (
                <p className="text-center text-text-secondary py-8">No upcoming holidays</p>
              ) : (
                upcoming.holidays.map((holiday: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-bg-body">
                    <div className="h-2 w-2 rounded-full bg-keka-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-text-primary">{holiday.name}</p>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {new Date(holiday.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                        {holiday.isNational && ' • National'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl border border-border-light shadow-card p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-blue-100">
              <Bell className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-text-primary">Notifications</h3>
              <p className="text-sm text-text-secondary mt-1">
                You have{' '}
                <span className="font-semibold text-keka-primary">{leave.pending} pending leave request(s)</span> and{' '}
                <span className="font-semibold text-keka-primary">
                  {attendance.today?.status === 'Not marked' ? '1' : '0'} attendance action(s)
                </span>{' '}
                requiring your attention.
              </p>
            </div>
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
  color = 'keka',
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
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
          <p className="text-xs font-bold text-text-muted uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold text-text-primary mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>{icon}</div>
      </div>
    </Card>
  );
}

function QuickAction({
  title,
  icon,
  href,
}: {
  title: string;
  icon: React.ReactNode;
  href?: string;
}) {
  const content = (
    <>
      <div className="p-2.5 rounded-lg bg-gradient-to-br from-keka-primary to-keka-primary-dark text-white shadow-lg shadow-keka-primary/30 mb-3 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <span className="text-sm font-bold text-text-primary text-center">{title}</span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group flex flex-col items-center p-4 rounded-xl border border-border-light bg-white shadow-card hover:shadow-elevated hover:-translate-y-1 hover:border-keka-primary transition-all duration-200"
      >
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
