'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import {
  Users,
  CheckCircle,
  Clock,
  Calendar,
  TrendingUp,
  AlertCircle,
  LoaderCircle,
  UserCheck,
  Target,
  ClipboardList,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

interface ManagerStats {
  teamSize: number;
  teamAttendanceRate: number;
  pendingApprovals: number;
  openTasks: number;
  avgRating: number;
}

export default function ManagerDashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<ManagerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [teamOverview, setTeamOverview] = useState<any[]>([]);
  const [upcoming, setUpcoming] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/manager/dashboard');
      if (response.ok) {
        const result = await response.json();
        setStats(result.data.overview);
        setPendingRequests(result.data.pendingRequests || []);
        setTeamOverview(result.data.team?.members || []);
        setUpcoming([
          ...(result.data.upcoming?.birthdays || []),
          ...(result.data.upcoming?.anniversaries || [])
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppShell title="Manager Dashboard">
        <div className="flex items-center justify-center h-screen">
          <LoaderCircle className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Manager Dashboard">
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-8 text-white shadow-lg">
          <h2 className="text-2xl font-bold mb-2">
            Hello, {session?.user?.name || 'Manager'}! 👋
          </h2>
          <p className="text-white/90">
            Here's your team overview and pending actions
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Team Members"
            value={stats?.teamSize || 0}
            icon={<Users className="h-6 w-6" />}
            color="blue"
          />
          <StatsCard
            title="Pending Approvals"
            value={stats?.pendingApprovals || 0}
            icon={<Clock className="h-6 w-6" />}
            color="yellow"
          />
          <StatsCard
            title="Team Attendance"
            value={`${stats?.teamAttendanceRate || 0}%`}
            icon={<TrendingUp className="h-6 w-6" />}
            color="green"
          />
          <StatsCard
            title="Open Tasks"
            value={stats?.openTasks || 0}
            icon={<CheckCircle className="h-6 w-6" />}
            color="purple"
          />
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickAction
              title="Approve Leaves"
              icon={<CheckCircle className="h-7 w-7" />}
              href="/manager/approvals"
            />
            <QuickAction
              title="Team Overview"
              icon={<Users className="h-7 w-7" />}
              href="/manager/team"
            />
            <QuickAction
              title="Performance Reviews"
              icon={<Target className="h-7 w-7" />}
              href="/performance"
            />
            <QuickAction
              title="Assign Tasks"
              icon={<ClipboardList className="h-7 w-7" />}
              href="/tasks"
            />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pending Approvals */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Pending Approvals</h3>
              <Link href="/manager/approvals" className="text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1">
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {pendingRequests.length > 0 ? (
                pendingRequests.slice(0, 5).map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-bold">
                        {request.employeeName.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{request.employeeName}</p>
                        <p className="text-sm text-gray-600">{request.leaveType} • {request.numberOfDays} days</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                        Pending
                      </span>
                      <Link
                        href="/manager/approvals"
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Review
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No pending approvals</p>
              )}
            </div>
          </Card>

          {/* Team Overview */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Team Overview</h3>
              <Link href="/manager/team" className="text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1">
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {teamOverview.length > 0 ? (
                teamOverview.slice(0, 5).map((member, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-sm font-bold">
                        {member.name.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{member.name}</p>
                        <p className="text-sm text-gray-600">{member.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        Present
                      </span>
                      <p className="text-xs text-gray-600 mt-1">{member.attendance}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No team members found</p>
              )}
            </div>
          </Card>
        </div>

        {/* Upcoming Events */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Upcoming Events</h3>
          </div>
          <div className="space-y-3">
            {upcoming.length > 0 ? (
              upcoming.slice(0, 5).map((event, index) => (
                <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                    🎉
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{event.name}</p>
                    <p className="text-sm text-gray-600">{event.type} • {new Date(event.date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">No upcoming events</p>
            )}
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-4 bg-blue-50 border-l-4 border-blue-600">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-900">Manager Tips</p>
              <p className="text-sm text-blue-800 mt-1">
                You have {stats?.pendingApprovals || 0} pending approvals waiting for your attention. Please review them to avoid delays in your team's workflow.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function StatsCard({
  title,
  value,
  icon,
  color = 'blue'
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red';
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </Card>
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
      className="group flex flex-col items-center gap-3 p-5 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-blue-300 transition-all duration-200"
    >
      <div className="p-3 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-lg shadow-blue-600/30 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <span className="text-sm font-bold text-gray-900 text-center">
        {title}
      </span>
    </Link>
  );
}
