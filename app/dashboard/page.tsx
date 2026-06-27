'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { memo, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { AppShell } from '@/components/layout/app-shell';
import { SaaSMetrics } from '@/components/saas/saas-metrics';
import { Card } from '@/components/ui/card';
import { useDataRefresh } from '@/hooks/use-data-refresh';
import {
  Users,
  UserCheck,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Briefcase,
  FileText,
  CheckCircle,
  Clock,
  Target,
  BarChart3,
  ClipboardList,
  Building2,
  UserPlus,
  Heart,
  Monitor,
  GraduationCap,
  ArrowRight,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';

// Lazy load chart
const OverviewChart = dynamic(
  () => import('@/components/charts/overview-chart').then(mod => ({ default: mod.OverviewChart })),
  {
    loading: () => (
      <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
    ),
    ssr: false
  }
);

type UserRole = 'EMPLOYEE' | 'MANAGER' | 'HR_MANAGER' | 'ADMIN' | 'PAYROLL_ADMIN' | 'SUPER_ADMIN';

// Keka HR Employee Dashboard
const EmployeeDashboard = memo(() => {
  const { data: session } = useSession();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetch('/api/dashboard')
        .then(res => res.json())
        .then(data => {
          setDashboardData(data.data);
          setLoading(false);
        })
        .catch(err => {
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
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-keka-primary to-keka-primary-dark animate-spin mx-auto mb-4" />
            <p className="text-text-secondary">Loading dashboard...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const { user, attendance, leave, approvals, team, devices, activity, upcoming } = dashboardData;

  // Handle users without employee records
  const employeeData = user.employee;
  const designation = employeeData?.designation || user.role;
  const department = employeeData?.department?.name || 'N/A';

  return (
  <AppShell title="Dashboard">
    <div className="space-y-6 animate-fade-in" suppressHydrationWarning>
      {/* SaaS Metrics Component */}
      <SaaSMetrics />

      {/* Keka Welcome Banner */}
      <div className="bg-gradient-to-br from-keka-primary to-keka-primary-dark rounded-2xl p-8 text-white shadow-float">
        <h2 className="text-2xl font-bold mb-2">
          Welcome back, {user.name.split(' ')[0]}! 👋
        </h2>
        <p className="text-white/90">
          {designation} • {department}
        </p>
      </div>

      {/* Quick Actions - Keka Style */}
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
                    <div className={`p-2 rounded-lg bg-gray-100 ${item.type === 'leave' ? 'text-success' : 'text-keka-primary'}`}>
                      {item.type === 'leave' ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-text-primary">{item.title}</p>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {item.type === 'leave' ? item.description : `Checked in at ${item.checkIn ? new Date(item.checkIn).toLocaleTimeString() : 'N/A'}`}
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
            <button className="text-sm font-semibold text-keka-primary hover:underline flex items-center gap-1">
              View Calendar <ArrowRight className="h-4 w-4" />
            </button>
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
                      {new Date(holiday.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {holiday.isNational && ' • National'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* My Device Issues */}
        <MyDeviceIssuesWidget />
      </div>
    </div>
  </AppShell>
  );
});

EmployeeDashboard.displayName = 'EmployeeDashboard';

// Keka HR Manager Dashboard
const ManagerDashboard = memo(() => (
  <AppShell title="Dashboard">
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-keka-primary to-keka-primary-dark rounded-2xl p-8 text-white shadow-float">
        <h2 className="text-2xl font-bold mb-2">
          Hello, Manager! 👋
        </h2>
        <p className="text-white/90">
          Here's your team overview and pending actions
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Team Members"
          value="12"
          icon={<Users className="h-6 w-6" />}
          color="keka"
          trend={{ value: 8.2, label: 'vs last month', isPositive: true }}
        />
        <StatsCard
          title="Pending Approvals"
          value="5"
          icon={<ClipboardList className="h-6 w-6" />}
          color="warning"
        />
        <StatsCard
          title="Team Attendance"
          value="92%"
          icon={<TrendingUp className="h-6 w-6" />}
          color="success"
          trend={{ value: 2.1, label: 'vs last week', isPositive: true }}
        />
        <StatsCard
          title="Open Tasks"
          value="8"
          icon={<Briefcase className="h-6 w-6" />}
          color="info"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-bold text-text-primary mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickAction
            title="Approve Leaves"
            icon={<CheckCircle className="h-7 w-7" />}
          />
          <QuickAction
            title="Team Overview"
            icon={<Users className="h-7 w-7" />}
          />
          <QuickAction
            title="Performance Reviews"
            icon={<Target className="h-7 w-7" />}
          />
          <QuickAction
            title="Assign Tasks"
            icon={<ClipboardList className="h-7 w-7" />}
          />
        </div>
      </div>

      {/* Team Performance & Pending Approvals */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-border-light shadow-card">
            <div className="p-5 border-b border-border-light">
              <h3 className="text-base font-bold text-text-primary">Team Performance</h3>
            </div>
            <div className="p-5">
              <OverviewChart />
            </div>
          </div>
        </div>
        
        {/* Pending Approvals */}
        <div className="bg-white rounded-xl border border-border-light shadow-card">
          <div className="p-5 border-b border-border-light">
            <h3 className="text-base font-bold text-text-primary">Pending Approvals</h3>
          </div>
          <div className="p-5 space-y-3">
            {[
              { name: 'John Doe', type: 'Leave Request', date: 'Mar 10-12' },
              { name: 'Jane Smith', type: 'WFH Request', date: 'Mar 15' },
              { name: 'Mike Johnson', type: 'Expense Claim', date: '$250' },
            ].map((item, i) => (
              <div key={i} className="p-3 rounded-lg border border-border-light hover:border-keka-primary transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{item.name}</p>
                    <p className="text-xs text-text-secondary mt-0.5">{item.type} • {item.date}</p>
                  </div>
                  <button className="px-3 py-1.5 text-xs font-bold rounded-lg bg-keka-primary text-white hover:bg-keka-primary-dark transition-colors">
                    Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </AppShell>
));

ManagerDashboard.displayName = 'ManagerDashboard';

// Keka Payroll Dashboard
const PayrollDashboard = memo(() => {
  const { data: session } = useSession();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetch('/api/payroll/dashboard')
        .then(res => res.json())
        .then(data => {
          setDashboardData(data.data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch payroll dashboard data:', err);
          setLoading(false);
        });
    }
  }, [session]);

  if (loading || !dashboardData) {
    return (
      <AppShell title="Payroll Dashboard">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-keka-primary to-keka-primary-dark animate-spin mx-auto mb-4" />
            <p className="text-text-secondary">Loading payroll dashboard...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const { overview, breakdown, departmentStats, recentActivity, config } = dashboardData;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <AppShell title="Payroll Dashboard">
      <div className="space-y-6 animate-fade-in">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-2xl p-8 text-white shadow-float">
          <h2 className="text-2xl font-bold mb-2">
            Payroll Dashboard 💰
          </h2>
          <p className="text-white/90">
            Manage salaries, payslips, and compensation
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Employees"
            value={overview.totalEmployees}
            icon={<Users className="h-6 w-6" />}
            color="info"
          />
          <StatsCard
            title="Gross Salary"
            value={formatCurrency(overview.totalGrossSalary)}
            icon={<TrendingUp className="h-6 w-6" />}
            color="keka"
          />
          <StatsCard
            title="Net Salary"
            value={formatCurrency(overview.totalNetSalary)}
            icon={<DollarSign className="h-6 w-6" />}
            color="success"
          />
          <StatsCard
            title="Pending Approval"
            value={overview.pendingApproval}
            icon={<Clock className="h-6 w-6" />}
            color="warning"
          />
        </div>

        {/* Additional Stats */}
        <div className="grid gap-5 md:grid-cols-3">
          <StatsCard
            title="Approved"
            value={overview.approved}
            icon={<CheckCircle className="h-6 w-6" />}
            color="success"
          />
          <StatsCard
            title="Paid"
            value={overview.paid}
            icon={<CheckCircle className="h-6 w-6" />}
            color="info"
          />
          <StatsCard
            title="MoM Change"
            value={`${overview.monthOverMonthChange > 0 ? '+' : ''}${overview.monthOverMonthChange}%`}
            icon={<BarChart3 className="h-6 w-6" />}
            color={overview.monthOverMonthChange >= 0 ? 'success' : 'danger'}
          />
        </div>

        {/* Deductions & Earnings Breakdown */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="bg-white rounded-xl border border-border-light shadow-card">
            <div className="p-5 border-b border-border-light">
              <h3 className="text-base font-bold text-text-primary">Deductions Breakdown</h3>
            </div>
            <div className="p-5 space-y-3">
              <DeductionRow label="PF Deduction" amount={breakdown.deductions.pf} />
              <DeductionRow label="ESI Deduction" amount={breakdown.deductions.esi} />
              <DeductionRow label="Tax Deduction" amount={breakdown.deductions.tax} />
              <DeductionRow label="Professional Tax" amount={breakdown.deductions.professionalTax} />
              <DeductionRow label="Other Deductions" amount={breakdown.deductions.other} />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border-light shadow-card">
            <div className="p-5 border-b border-border-light">
              <h3 className="text-base font-bold text-text-primary">Earnings Breakdown</h3>
            </div>
            <div className="p-5 space-y-3">
              <DeductionRow label="Bonus" amount={breakdown.earnings.bonus} />
              <DeductionRow label="Incentive" amount={breakdown.earnings.incentive} />
              <DeductionRow label="Arrears" amount={breakdown.earnings.arrears} />
              <DeductionRow label="Overtime Pay" amount={breakdown.earnings.overtime} />
            </div>
          </div>
        </div>

        {/* Department-wise Salary */}
        <div className="bg-white rounded-xl border border-border-light shadow-card">
          <div className="p-5 border-b border-border-light">
            <h3 className="text-base font-bold text-text-primary">Department-wise Salary Distribution</h3>
          </div>
          <div className="p-5">
            {departmentStats && departmentStats.length > 0 ? (
              <div className="space-y-3">
                {departmentStats.map((dept: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-bg-body">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{dept.department}</p>
                      <p className="text-xs text-text-secondary">{dept.employeeCount} employees</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-text-primary">{formatCurrency(dept.totalSalary)}</p>
                      <p className="text-xs text-text-secondary">Avg: {formatCurrency(dept.averageSalary)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-text-secondary py-8">No department data available</p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-border-light shadow-card">
          <div className="p-5 border-b border-border-light">
            <h3 className="text-base font-bold text-text-primary">Recent Payroll Activity</h3>
          </div>
          <div className="p-5 space-y-3">
            {recentActivity?.recentPayrolls?.slice(0, 5).map((payroll: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-bg-body">
                <div>
                  <p className="text-sm font-semibold text-text-primary">{payroll.employeeName}</p>
                  <p className="text-xs text-text-secondary">{payroll.department} • {payroll.employeeCode}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-text-primary">{formatCurrency(payroll.netSalary)}</p>
                  <span className={`text-xs px-2 py-1 rounded ${
                    payroll.status === 'PAID' ? 'bg-green-100 text-green-800' :
                    payroll.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {payroll.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
});

PayrollDashboard.displayName = 'PayrollDashboard';

// Keka HR Manager Dashboard
const HRManagerDashboard = memo(() => {
  const { data: session } = useSession();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetch('/api/hr/dashboard')
        .then(res => res.json())
        .then(data => {
          setDashboardData(data.data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch HR dashboard data:', err);
          setLoading(false);
        });
    }
  }, [session]);

  if (loading || !dashboardData) {
    return (
      <AppShell title="HR Dashboard">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-keka-primary to-keka-primary-dark animate-spin mx-auto mb-4" />
            <p className="text-text-secondary">Loading HR dashboard...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const { overview, recruitment, onboarding, leaveManagement, attendance, departmentStats } = dashboardData;

  return (
    <AppShell title="HR Dashboard">
      <div className="space-y-6 animate-fade-in">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-8 text-white shadow-float">
          <h2 className="text-2xl font-bold mb-2">
            HR Manager Dashboard 📊
          </h2>
          <p className="text-white/90">
            Manage employee lifecycle and HR operations
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Employees"
            value={overview.totalEmployees}
            icon={<Users className="h-6 w-6" />}
            color="keka"
          />
          <StatsCard
            title="New Hires"
            value={overview.newHires}
            icon={<UserPlus className="h-6 w-6" />}
            color="success"
          />
          <StatsCard
            title="Attendance Today"
            value={`${overview.attendanceToday}%`}
            icon={<UserCheck className="h-6 w-6" />}
            color="info"
          />
          <StatsCard
            title="Pending Leaves"
            value={overview.pendingLeaves}
            icon={<Calendar className="h-6 w-6" />}
            color="warning"
          />
        </div>

        {/* Recruitment & Onboarding */}
        <div className="grid gap-5 md:grid-cols-2">
          <div className="bg-white rounded-xl border border-border-light shadow-card">
            <div className="p-5 border-b border-border-light">
              <h3 className="text-base font-bold text-text-primary">Recruitment</h3>
            </div>
            <div className="p-5 space-y-3">
              <RecruitmentStat label="Active Jobs" value={recruitment.activeJobs} color="blue" />
              <RecruitmentStat label="Total Candidates" value={recruitment.totalCandidates} color="purple" />
              <RecruitmentStat label="Interviews Scheduled" value={recruitment.interviewScheduled} color="yellow" />
              <RecruitmentStat label="Offers Released" value={recruitment.offersReleased} color="green" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border-light shadow-card">
            <div className="p-5 border-b border-border-light">
              <h3 className="text-base font-bold text-text-primary">Onboarding</h3>
            </div>
            <div className="p-5">
              <p className="text-3xl font-bold text-text-primary mb-2">{onboarding.ongoing}</p>
              <p className="text-sm text-text-secondary mb-4">Ongoing Onboardings</p>
              {onboarding.newHires?.slice(0, 5).map((hire: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-bg-body mb-2">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{hire.name}</p>
                    <p className="text-xs text-text-secondary">{hire.department}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-keka-primary">{hire.progress}%</p>
                    <p className="text-xs text-text-secondary">Complete</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Leave Management */}
        <div className="bg-white rounded-xl border border-border-light shadow-card">
          <div className="p-5 border-b border-border-light">
            <h3 className="text-base font-bold text-text-primary">Leave Management (This Month)</h3>
          </div>
          <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-blue-50">
              <p className="text-2xl font-bold text-blue-600">{leaveManagement.totalThisMonth}</p>
              <p className="text-xs text-blue-700 mt-1">Total Requests</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-yellow-50">
              <p className="text-2xl font-bold text-yellow-600">{leaveManagement.pending}</p>
              <p className="text-xs text-yellow-700 mt-1">Pending</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-green-50">
              <p className="text-2xl font-bold text-green-600">{leaveManagement.approved}</p>
              <p className="text-xs text-green-700 mt-1">Approved</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-red-50">
              <p className="text-2xl font-bold text-red-600">{leaveManagement.rejected}</p>
              <p className="text-xs text-red-700 mt-1">Rejected</p>
            </div>
          </div>
        </div>

        {/* Department Distribution */}
        <div className="bg-white rounded-xl border border-border-light shadow-card">
          <div className="p-5 border-b border-border-light">
            <h3 className="text-base font-bold text-text-primary">Department Distribution</h3>
          </div>
          <div className="p-5">
            {departmentStats && departmentStats.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {departmentStats.map((dept: any, i: number) => (
                  <div key={i} className="p-4 rounded-lg border border-border-light text-center">
                    <p className="text-2xl font-bold text-text-primary">{dept.employeeCount}</p>
                    <p className="text-sm font-semibold text-text-primary mt-1">{dept.name}</p>
                    <p className="text-xs text-text-secondary mt-1">{dept.managerName}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-text-secondary py-8">No department data available</p>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
});

HRManagerDashboard.displayName = 'HRManagerDashboard';

// Keka Super Admin Dashboard
const SuperAdminDashboard = memo(() => {
  const { data: session } = useSession();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetch('/api/super-admin/dashboard')
        .then(res => res.json())
        .then(data => {
          setDashboardData(data.data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch super admin dashboard data:', err);
          setLoading(false);
        });
    }
  }, [session]);

  if (loading || !dashboardData) {
    return (
      <AppShell title="System Dashboard">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-keka-primary to-keka-primary-dark animate-spin mx-auto mb-4" />
            <p className="text-text-secondary">Loading system dashboard...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const { overview, attendance, payroll, recruitment, departments, devices, systemHealth, organizations } = dashboardData;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <AppShell title="System Dashboard">
      <div className="space-y-6 animate-fade-in">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-8 text-white shadow-float">
          <h2 className="text-2xl font-bold mb-2">
            Super Admin Dashboard 👑
          </h2>
          <p className="text-white/90">
            System-wide overview and organization management
          </p>
        </div>

        {/* High-level Stats */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Organizations"
            value={`${overview.activeOrganizations}/${overview.totalOrganizations}`}
            icon={<Building2 className="h-6 w-6" />}
            color="keka"
          />
          <StatsCard
            title="Total Employees"
            value={overview.totalEmployees}
            icon={<Users className="h-6 w-6" />}
            color="info"
          />
          <StatsCard
            title="Attendance Today"
            value={`${overview.attendanceToday}%`}
            icon={<UserCheck className="h-6 w-6" />}
            color="success"
          />
          <StatsCard
            title="Turnover Rate"
            value={`${overview.turnoverRate}%`}
            icon={<TrendingDown className="h-6 w-6" />}
            color={overview.turnoverRate < 10 ? 'success' : 'warning'}
          />
        </div>

        {/* Payroll Overview */}
        <div className="grid gap-5 md:grid-cols-3">
          <StatsCard
            title="Gross Salary"
            value={formatCurrency(payroll.grossSalary)}
            icon={<TrendingUp className="h-6 w-6" />}
            color="keka"
          />
          <StatsCard
            title="Net Salary"
            value={formatCurrency(payroll.netSalary)}
            icon={<DollarSign className="h-6 w-6" />}
            color="success"
          />
          <StatsCard
            title="Pending Payroll"
            value={payroll.pending}
            icon={<Clock className="h-6 w-6" />}
            color="warning"
          />
        </div>

        {/* Organizations */}
        <div className="bg-white rounded-xl border border-border-light shadow-card">
          <div className="p-5 border-b border-border-light">
            <h3 className="text-base font-bold text-text-primary">Organizations</h3>
          </div>
          <div className="p-5">
            {organizations && organizations.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {organizations.map((org: any, i: number) => (
                  <div key={i} className="p-4 rounded-lg border border-border-light">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-text-primary">{org.name}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${org.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {org.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Employees:</span>
                        <span className="font-semibold text-text-primary">{org.employeeCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Departments:</span>
                        <span className="font-semibold text-text-primary">{org.departmentCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Users:</span>
                        <span className="font-semibold text-text-primary">{org.userCount}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-text-secondary py-8">No organizations found</p>
            )}
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-xl border border-border-light shadow-card">
          <div className="p-5 border-b border-border-light">
            <h3 className="text-base font-bold text-text-primary">System Health</h3>
          </div>
          <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-blue-50">
              <p className="text-2xl font-bold text-blue-600">{systemHealth.totalUsers}</p>
              <p className="text-xs text-blue-700 mt-1">Total Users</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-green-50">
              <p className="text-2xl font-bold text-green-600">{systemHealth.activeUsers}</p>
              <p className="text-xs text-green-700 mt-1">Active Users</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-purple-50">
              <p className="text-2xl font-bold text-purple-600">{systemHealth.usersLoggedInToday}</p>
              <p className="text-xs text-purple-700 mt-1">Logged In Today</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-indigo-50">
              <p className="text-2xl font-bold text-indigo-600">{departments.total}</p>
              <p className="text-xs text-indigo-700 mt-1">Departments</p>
            </div>
          </div>
        </div>

        {/* Devices Overview */}
        <div className="bg-white rounded-xl border border-border-light shadow-card">
          <div className="p-5 border-b border-border-light">
            <h3 className="text-base font-bold text-text-primary">Device Management</h3>
          </div>
          <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-blue-50">
              <p className="text-2xl font-bold text-blue-600">{devices.total}</p>
              <p className="text-xs text-blue-700 mt-1">Total Devices</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-green-50">
              <p className="text-2xl font-bold text-green-600">{devices.assigned}</p>
              <p className="text-xs text-green-700 mt-1">Assigned</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-yellow-50">
              <p className="text-2xl font-bold text-yellow-600">{devices.available}</p>
              <p className="text-xs text-yellow-700 mt-1">Available</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-red-50">
              <p className="text-2xl font-bold text-red-600">{devices.openIssues}</p>
              <p className="text-xs text-red-700 mt-1">Open Issues</p>
            </div>
          </div>
        </div>

        {/* Role Distribution */}
        <div className="bg-white rounded-xl border border-border-light shadow-card">
          <div className="p-5 border-b border-border-light">
            <h3 className="text-base font-bold text-text-primary">User Role Distribution</h3>
          </div>
          <div className="p-5">
            {systemHealth.roleDistribution && systemHealth.roleDistribution.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {systemHealth.roleDistribution.map((role: any, i: number) => (
                  <div key={i} className="p-4 rounded-lg border border-border-light text-center">
                    <p className="text-2xl font-bold text-text-primary">{role.count}</p>
                    <p className="text-sm font-semibold text-text-primary mt-1">{role.role.replace('_', ' ')}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-text-secondary py-8">No role data available</p>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
});

SuperAdminDashboard.displayName = 'SuperAdminDashboard';

// Keka HR Admin Dashboard
const AdminDashboard = memo(() => (
  <AppShell title="Dashboard">
    <div className="space-y-6 animate-fade-in">
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
          value="142"
          icon={<Users className="h-6 w-6" />}
          color="keka"
          trend={{ value: 12, label: 'new this month', isPositive: true }}
        />
        <StatsCard
          title="Attendance Today"
          value="88%"
          icon={<UserCheck className="h-6 w-6" />}
          color="success"
          trend={{ value: 3.2, label: 'vs yesterday', isPositive: true }}
        />
        <StatsCard
          title="Pending Leaves"
          value="08"
          icon={<Calendar className="h-6 w-6" />}
          color="warning"
        />
        <StatsCard
          title="Active Devices"
          value="89"
          icon={<Monitor className="h-6 w-6" />}
          color="info"
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
          />
          <ModuleCard
            title="Departments"
            desc="Organization"
            icon={<Building2 className="h-6 w-6" />}
          />
          <ModuleCard
            title="Attendance"
            desc="Track time"
            icon={<Clock className="h-6 w-6" />}
          />
          <ModuleCard
            title="Leave"
            desc="Manage leave"
            icon={<Calendar className="h-6 w-6" />}
          />
          <ModuleCard
            title="Payroll"
            desc="Salary & payslips"
            icon={<DollarSign className="h-6 w-6" />}
          />
          <ModuleCard
            title="Recruitment"
            desc="Hiring pipeline"
            icon={<UserPlus className="h-6 w-6" />}
          />
        </div>
      </div>

      {/* Analytics & Metrics */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-border-light shadow-card">
            <div className="p-5 border-b border-border-light">
              <h3 className="text-base font-bold text-text-primary">HR Analytics</h3>
              <p className="text-xs text-text-secondary mt-1">Key metrics and trends</p>
            </div>
            <div className="p-5">
              <OverviewChart />
            </div>
          </div>
        </div>

        {/* Device Issues Widget */}
        <DeviceIssuesWidget />
      </div>

      {/* HR Metrics */}
      <div className="bg-white rounded-xl border border-border-light shadow-card">
        <div className="p-5 border-b border-border-light">
          <h3 className="text-base font-bold text-text-primary">HR Metrics</h3>
        </div>
        <div className="p-5 space-y-3">
          {[
            { label: 'Voluntary Turnover', value: '5.2%', trend: 'down' },
            { label: 'Avg Performance Rating', value: '4.2/5', trend: 'up' },
            { label: 'Training Hours/Employee', value: '24 hrs', trend: 'up' },
            { label: 'Employee Satisfaction', value: '87%', trend: 'up' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-bg-body">
              <div>
                <p className="text-sm font-semibold text-text-primary">{item.label}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-text-primary">{item.value}</p>
                <span className={`text-xs font-semibold ${item.trend === 'up' ? 'text-success' : 'text-danger'}`}>
                  {item.trend === 'up' ? '↑' : '↓'} Trending
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-bold text-text-primary mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickAction
            title="Add Employee"
            icon={<UserPlus className="h-7 w-7" />}
          />
          <QuickAction
            title="Create Department"
            icon={<Building2 className="h-7 w-7" />}
          />
          <QuickAction
            title="Generate Payroll"
            icon={<DollarSign className="h-7 w-7" />}
          />
          <QuickAction
            title="View Reports"
            icon={<BarChart3 className="h-7 w-7" />}
          />
        </div>
      </div>
    </div>
  </AppShell>
));

AdminDashboard.displayName = 'AdminDashboard';

// Keka Style Stats Card
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
    <div className="bg-white rounded-xl border border-border-light shadow-card p-5 transition-all duration-200 hover:shadow-elevated hover:-translate-y-1">
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
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-text-secondary">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// Keka Style Quick Action
function QuickAction({
  title,
  icon,
  href
}: {
  title: string;
  icon: React.ReactNode;
  href?: string;
}) {
  const content = (
    <>
      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-keka-primary to-keka-primary-dark flex items-center justify-center text-white shadow-lg shadow-keka-primary/30 group-hover:scale-105 transition-transform">
        {icon}
      </div>
      <span className="text-sm font-semibold text-text-primary text-center">
        {title}
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="w-full">
        <button className="quicktile group flex flex-col items-center gap-3 p-5 rounded-2xl border border-border-light bg-white shadow-card hover:shadow-elevated hover:-translate-y-1 hover:border-keka-primary/30 transition-all duration-200 w-full">
          {content}
        </button>
      </Link>
    );
  }

  return (
    <button className="quicktile group flex flex-col items-center gap-3 p-5 rounded-2xl border border-border-light bg-white shadow-card hover:shadow-elevated hover:-translate-y-1 hover:border-keka-primary/30 transition-all duration-200 w-full">
      {content}
    </button>
  );
}

// Keka Style Module Card
function ModuleCard({
  title,
  desc,
  icon
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
}) {
  return (
    <button className="quicktile group flex flex-col items-center p-4 rounded-xl border border-border-light bg-white shadow-card hover:shadow-elevated hover:-translate-y-1 hover:border-keka-primary transition-all duration-200">
      <div className="p-2.5 rounded-lg bg-gradient-to-br from-keka-primary to-keka-primary-dark text-white shadow-lg shadow-keka-primary/30 mb-3 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <span className="text-sm font-bold text-text-primary text-center">
        {title}
      </span>
      <span className="text-xs text-text-secondary text-center mt-1">
        {desc}
      </span>
    </button>
  );
}

// Device Issues Widget for Admin Dashboard
function DeviceIssuesWidget() {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      const response = await fetch('/api/device-issues?role=ADMIN');
      if (response.ok) {
        const { data } = await response.json();
        setIssues(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch device issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'medium':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-green-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const openIssues = issues.filter(i => i.status !== 'resolved').length;
  const highPriorityIssues = issues.filter(i => i.severity === 'high' && i.status !== 'resolved').length;

  return (
    <div className="bg-white rounded-xl border border-border-light shadow-card">
      <div className="p-5 border-b border-border-light flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-text-primary">Device Issues</h3>
          <p className="text-xs text-text-secondary mt-1">Reported by employees</p>
        </div>
        <a href="/admin/devices" className="text-sm font-semibold text-keka-primary hover:underline flex items-center gap-1">
          View All <ArrowRight className="h-4 w-4" />
        </a>
      </div>
      <div className="p-5">
        {loading ? (
          <div className="h-32 bg-gray-100 rounded-lg animate-pulse" />
        ) : issues.length === 0 ? (
          <div className="text-center py-8">
            <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-text-secondary">No device issues reported</p>
          </div>
        ) : (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-lg bg-red-50">
                <p className="text-2xl font-bold text-red-600">{openIssues}</p>
                <p className="text-xs text-red-700">Open Issues</p>
              </div>
              <div className="p-3 rounded-lg bg-orange-50">
                <p className="text-2xl font-bold text-orange-600">{highPriorityIssues}</p>
                <p className="text-xs text-orange-700">High Priority</p>
              </div>
            </div>

            {/* Recent Issues List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {issues.slice(0, 5).map((issue) => (
                <div key={issue.id} className="p-3 rounded-lg border border-border-light hover:border-keka-primary transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getSeverityIcon(issue.severity)}
                        <p className="text-sm font-semibold text-text-primary">{issue.device.assetName}</p>
                      </div>
                      <p className="text-xs text-text-secondary truncate">{issue.issue}</p>
                      <p className="text-xs text-text-muted mt-1">
                        By: {issue.device.employee?.user.name || 'Unknown'}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(issue.status)}`}>
                      {issue.status === 'in-progress' ? 'In Progress' : issue.status.charAt(0).toUpperCase() + issue.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// My Device Issues Widget for Employee Dashboard
function MyDeviceIssuesWidget() {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      const response = await fetch('/api/device-issues');
      if (response.ok) {
        const { data } = await response.json();
        setIssues(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch device issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-orange-100 text-orange-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const unresolvedCount = issues.filter(i => i.status !== 'resolved').length;

  return (
    <div className="bg-white rounded-xl border border-border-light shadow-card">
      <div className="p-5 border-b border-border-light flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-text-primary">My Device Issues</h3>
          <p className="text-xs text-text-secondary mt-1">Your reported issues</p>
        </div>
        <a href="/devices" className="text-sm font-semibold text-keka-primary hover:underline flex items-center gap-1">
          View All <ArrowRight className="h-4 w-4" />
        </a>
      </div>
      <div className="p-5">
        {loading ? (
          <div className="h-24 bg-gray-100 rounded-lg animate-pulse" />
        ) : issues.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-text-secondary">No issues reported</p>
          </div>
        ) : (
          <>
            {unresolvedCount > 0 && (
              <div className="p-3 rounded-lg bg-orange-50 mb-3">
                <p className="text-sm font-semibold text-orange-800">{unresolvedCount} unresolved issue(s)</p>
              </div>
            )}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {issues.slice(0, 4).map((issue) => (
                <div key={issue.id} className="p-3 rounded-lg border border-border-light">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-text-primary">{issue.device.assetName}</p>
                      <p className="text-xs text-text-secondary truncate mt-0.5">{issue.issue}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(issue.status)}`}>
                      {issue.status === 'in-progress' ? 'In Progress' : issue.status.charAt(0).toUpperCase() + issue.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Helper component for Payroll Dashboard
function DeductionRow({ label, amount }: { label: string; amount: number }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-bg-body">
      <span className="text-sm font-semibold text-text-primary">{label}</span>
      <span className="text-sm font-bold text-text-primary">{formatCurrency(amount)}</span>
    </div>
  );
}

// Helper component for HR Dashboard
function RecruitmentStat({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses: { [key: string]: string } = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    green: 'bg-green-100 text-green-600',
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-bg-body">
      <span className="text-sm font-semibold text-text-primary">{label}</span>
      <span className={`px-3 py-1 rounded-lg font-bold ${colorClasses[color] || 'bg-gray-100 text-gray-600'}`}>
        {value}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const userRole = (session?.user?.role as UserRole) || 'EMPLOYEE';

  if (userRole === 'EMPLOYEE') {
    return <EmployeeDashboard />;
  }

  if (userRole === 'MANAGER') {
    return <ManagerDashboard />;
  }

  if (userRole === 'PAYROLL_ADMIN') {
    return <PayrollDashboard />;
  }

  if (userRole === 'HR_MANAGER') {
    return <HRManagerDashboard />;
  }

  if (userRole === 'SUPER_ADMIN') {
    return <SuperAdminDashboard />;
  }

  return <AdminDashboard />;
}
