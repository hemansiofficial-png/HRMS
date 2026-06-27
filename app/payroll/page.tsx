'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDataRefresh } from '@/hooks/use-data-refresh';
import {
  DollarSign,
  Download,
  Plus,
  Users,
  FileText,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  FileSpreadsheet,
  BarChart3,
  Settings,
  History,
  Eye,
  MoreVertical,
  Check,
  X,
  LoaderCircle,
} from 'lucide-react';

interface Payroll {
  id: string;
  employeeId: string;
  month: string;
  year: number;
  basicSalary: number;
  hra: number;
  specialAllowance: number;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  status: string;
  workingDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  overtimeHours: number;
  pfDeduction: number;
  esiDeduction: number;
  taxDeduction: number;
  bonus: number;
  incentive: number;
  isBulkProcessed: boolean;
  isFinalSettlement: boolean;
  approvedBy: string | null;
  approvedAt: string | null;
  paidAt: string | null;
  createdAt: string;
  employee: {
    id: string;
    employeeCode: string;
    designation: string;
    user: { name: string; email: string };
    department: { name: string };
  };
}

interface Employee {
  id: string;
  employeeCode: string;
  designation: string;
  salary: number;
  user: { name: string; email: string };
  department: { name: string };
}

interface PayrollStats {
  totalEmployees: number;
  totalGrossSalary: number;
  totalDeductions: number;
  totalNetSalary: number;
  pendingApproval: number;
  approved: number;
  paid: number;
}

export default function PayrollPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [payroll, setPayroll] = useState<Payroll[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('');
  const [activeTab, setActiveTab] = useState<'list' | 'generate' | 'bulk' | 'reports' | 'revisions'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [rejectionReason, setRejectionReason] = useState('');
  const [employeesLoading, setEmployeesLoading] = useState(false);

  // Generate payroll form state
  const [generateForm, setGenerateForm] = useState({
    employeeId: '',
    month: selectedMonth,
    bonus: 0,
    deductions: 0,
    incentive: 0,
    arrears: 0,
    loanDeduction: 0,
    advanceDeduction: 0,
    overtimeHours: 0,
  });

  // Bulk generate state
  const [bulkForm, setBulkForm] = useState({
    month: selectedMonth,
    autoApprove: false,
    skipDuplicates: true,
  });

  useEffect(() => {
    if (session?.user?.role) {
      setRole(session.user.role);
      fetchPayroll();
      if (['ADMIN', 'PAYROLL_ADMIN', 'HR_MANAGER'].includes(session.user.role)) {
        fetchEmployees();
      }
    }
  }, [session, selectedMonth]);

  // Auto-refresh on visibility change and focus
  useDataRefresh(fetchPayroll, {
    onVisibilityChange: true,
    onFocus: true,
  });

  async function fetchPayroll() {
    try {
      setLoading(true);
      const url = new URL('/api/payroll', window.location.origin);
      if (selectedMonth) url.searchParams.append('month', selectedMonth);
      const response = await fetch(url);
      const { payroll } = await response.json();
      setPayroll(payroll || []);
    } catch (error) {
      console.error('Failed to fetch payroll:', error);
    } finally {
      setLoading(false);
    }
  }

  // Sync payroll table after any action
  async function syncPayroll() {
    console.log('Syncing payroll table...');
    await fetchPayroll();
    console.log('Payroll table synced');
  }

  async function fetchEmployees() {
    try {
      setEmployeesLoading(true);
      const response = await fetch('/api/employees');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      console.log('Fetched employees:', result);
      const employeesData = result.data || [];
      console.log('Employees data length:', employeesData.length);
      setEmployees(employeesData);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      // Show error to user
      alert('Failed to load employees. Please ensure you have employees in the system.');
    } finally {
      setEmployeesLoading(false);
    }
  }

  async function handleGeneratePayroll(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const employee = employees.find((emp) => emp.id === generateForm.employeeId);
      if (!employee) {
        alert('Employee not found');
        return;
      }

      console.log('Generating payroll with data:', {
        employeeId: generateForm.employeeId,
        month: generateForm.month,
        bonus: generateForm.bonus,
        incentive: generateForm.incentive,
        arrears: generateForm.arrears,
        loanDeduction: generateForm.loanDeduction,
        advanceDeduction: generateForm.advanceDeduction,
        overtimeHours: generateForm.overtimeHours,
      });

      const response = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: generateForm.employeeId,
          month: generateForm.month,
          bonus: generateForm.bonus,
          incentive: generateForm.incentive,
          arrears: generateForm.arrears,
          loanDeduction: generateForm.loanDeduction,
          advanceDeduction: generateForm.advanceDeduction,
          overtimeHours: generateForm.overtimeHours,
        }),
      });

      const result = await response.json();
      console.log('Payroll API response:', result);

      if (response.ok) {
        alert('Payroll generated successfully');
        setGenerateForm({
          employeeId: '',
          month: selectedMonth,
          bonus: 0,
          deductions: 0,
          incentive: 0,
          arrears: 0,
          loanDeduction: 0,
          advanceDeduction: 0,
          overtimeHours: 0,
        });
        setActiveTab('list');
        await syncPayroll(); // Sync table after generate
      } else {
        console.error('Payroll generation failed:', result);
        alert(result.error || result.message || 'Failed to generate payroll');
      }
    } catch (error: any) {
      console.error('Error:', error);
      alert('Error generating payroll: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }

  async function handleBulkPayroll() {
    setLoading(true);

    try {
      const response = await fetch('/api/payroll/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: bulkForm.month,
          autoApprove: bulkForm.autoApprove,
          skipDuplicates: bulkForm.skipDuplicates,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(
          `Bulk payroll completed: ${result.summary.success} successful, ${result.summary.duplicates} duplicates, ${result.summary.errors} errors`
        );
        setActiveTab('list');
        await syncPayroll(); // Sync table after bulk process
      } else {
        alert(result.error || 'Failed to process bulk payroll');
      }
    } catch (error: any) {
      console.error('Error:', error);
      alert('Error processing bulk payroll');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprovalAction() {
    if (!selectedPayroll) return;

    setLoading(true);

    try {
      const response = await fetch('/api/payroll/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payrollId: selectedPayroll.id,
          action: approvalAction,
          rejectionReason: approvalAction === 'REJECT' ? rejectionReason : undefined,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Payroll ${approvalAction === 'APPROVE' ? 'approved' : 'rejected'} successfully`);
        setShowApprovalModal(false);
        setRejectionReason('');
        await syncPayroll(); // Sync table after approve/reject
      } else {
        alert(result.error || 'Failed to process approval');
      }
    } catch (error: any) {
      console.error('Error:', error);
      alert('Error processing approval');
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAsPaid(payrollId: string) {
    setLoading(true);

    try {
      const response = await fetch('/api/payroll/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payrollId,
          action: 'MARK_PAID',
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert('Payroll marked as paid');
        await syncPayroll(); // Sync table after mark as paid
      } else {
        alert(result.error || 'Failed to mark as paid');
      }
    } catch (error: any) {
      console.error('Error:', error);
      alert('Error marking as paid');
    } finally {
      setLoading(false);
    }
  }

  async function downloadPayslip(payrollId: string) {
    window.open(`/api/payroll/payslip?id=${payrollId}`, '_blank');
  }

  async function downloadReport(reportType: string) {
    const reportUrl = `/api/payroll/reports?type=${reportType}&month=${selectedMonth}`;
    const response = await fetch(reportUrl);
    const data = await response.json();

    // Create downloadable JSON
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${reportType}_${selectedMonth}.json`;
    a.click();
    URL.revokeObjectURL(downloadUrl);
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      DRAFT: 'neutral',
      PENDING_APPROVAL: 'warning',
      APPROVED: 'success',
      REJECTED: 'danger',
      PAID: 'info',
    };

    const icons = {
      DRAFT: <FileText size={12} />,
      PENDING_APPROVAL: <Clock size={12} />,
      APPROVED: <CheckCircle size={12} />,
      REJECTED: <XCircle size={12} />,
      PAID: <CheckCircle size={12} />,
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] as any} className="gap-1">
        {icons[status as keyof typeof icons]}
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getStats = (): PayrollStats => {
    return {
      totalEmployees: payroll.length,
      totalGrossSalary: payroll.reduce((sum, p) => sum + Number(p.grossSalary), 0),
      totalDeductions: payroll.reduce((sum, p) => sum + Number(p.totalDeductions), 0),
      totalNetSalary: payroll.reduce((sum, p) => sum + Number(p.netSalary), 0),
      pendingApproval: payroll.filter((p) => p.status === 'DRAFT' || p.status === 'PENDING_APPROVAL').length,
      approved: payroll.filter((p) => p.status === 'APPROVED').length,
      paid: payroll.filter((p) => p.status === 'PAID').length,
    };
  };

  const filteredPayroll = payroll.filter((p) => {
    const matchesSearch =
      p.employee.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.employee.employeeCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = getStats();

  // EMPLOYEE VIEW
  if (role === 'EMPLOYEE') {
    return (
      <AppShell title="My Payslips">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">My Payslips</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">View and download your salary payslips</p>
            </div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 bg-white dark:bg-slate-800"
            >
              {getMonthOptions().map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">YTD Gross Salary</p>
                  <p className="text-2xl font-bold text-blue-600 mt-2">{formatCurrency(stats.totalGrossSalary)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">YTD Deductions</p>
                  <p className="text-2xl font-bold text-red-600 mt-2">{formatCurrency(stats.totalDeductions)}</p>
                </div>
                <TrendingDown className="w-8 h-8 text-red-600" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">YTD Net Salary</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">{formatCurrency(stats.totalNetSalary)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </Card>
          </div>

          {/* Payslips List */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-gray-100">Your Payslips</h2>
            {payroll.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No payslips available yet</p>
            ) : (
              <div className="space-y-3">
                {filteredPayroll.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-slate-800 transition cursor-pointer"
                    onClick={() => {
                      setSelectedPayroll(item);
                      setShowPayslipModal(true);
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-bold">
                        {item.employee.user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{formatMonth(item.month)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusBadge(item.status)}
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {item.presentDays}/{item.workingDays} days
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Net Salary</p>
                      <p className="text-xl font-bold text-blue-600 mt-1">{formatCurrency(Number(item.netSalary))}</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadPayslip(item.id);
                        }}
                        className="mt-2 flex items-center gap-1 rounded px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 text-blue-600 font-medium transition"
                      >
                        <Download size={14} />
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </AppShell>
    );
  }

  // ADMIN / HR MANAGER VIEW
  return (
    <AppShell title="Payroll Management">
      <div className="space-y-6">
        {/* Header with Tabs */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Payroll Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage employee salaries, generate payslips, and run reports
            </p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 bg-white dark:bg-slate-800"
            >
              {getMonthOptions().map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <Button onClick={() => fetchPayroll()} variant="outline" className="gap-2">
              <RefreshCw size={18} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <TabButton active={activeTab === 'list'} onClick={() => setActiveTab('list')} icon={<FileText size={16} />}>
            Payroll List
          </TabButton>
          <TabButton
            active={activeTab === 'generate'}
            onClick={() => setActiveTab('generate')}
            icon={<Plus size={16} />}
          >
            Generate Payroll
          </TabButton>
          <TabButton
            active={activeTab === 'bulk'}
            onClick={() => setActiveTab('bulk')}
            icon={<Users size={16} />}
          >
            Bulk Process
          </TabButton>
          <TabButton
            active={activeTab === 'reports'}
            onClick={() => setActiveTab('reports')}
            icon={<BarChart3 size={16} />}
          >
            Reports
          </TabButton>
          {['ADMIN', 'PAYROLL_ADMIN'].includes(role) && (
            <TabButton
              active={activeTab === 'revisions'}
              onClick={() => setActiveTab('revisions')}
              icon={<History size={16} />}
            >
              Salary Revisions
            </TabButton>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Employees</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stats.totalEmployees}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Gross Salary</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(stats.totalGrossSalary)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Deductions</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(stats.totalDeductions)}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Net Salary</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(stats.totalNetSalary)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </Card>
        </div>

        {/* Additional Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-5 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-yellow-700 dark:text-yellow-400">Pending Approval</p>
                <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-400 mt-1">{stats.pendingApproval}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </Card>
          <Card className="p-5 border-green-200 bg-green-50 dark:bg-green-900/20">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-green-700 dark:text-green-400">Approved</p>
                <p className="text-3xl font-bold text-green-700 dark:text-green-400 mt-1">{stats.approved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </Card>
          <Card className="p-5 border-blue-200 bg-blue-50 dark:bg-blue-900/20">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-400">Paid</p>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-400 mt-1">{stats.paid}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
          </Card>
        </div>

        {/* TAB CONTENT */}
        {activeTab === 'list' && (
          <Card className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search by employee name or code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 bg-white dark:bg-slate-800"
                >
                  <option value="all">All Status</option>
                  <option value="DRAFT">Draft</option>
                  <option value="APPROVED">Approved</option>
                  <option value="PAID">Paid</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoaderCircle className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : filteredPayroll.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No payroll records found for {formatMonth(selectedMonth)}</p>
                <Button onClick={() => setActiveTab('generate')} className="mt-4">
                  <Plus size={16} className="mr-2" />
                  Generate Payroll
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Employee</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Department</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Attendance</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Gross Salary</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Deductions</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Net Salary</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">Status</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayroll.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-slate-800"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-bold text-sm">
                              {item.employee.user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">{item.employee.user.name}</p>
                              <p className="text-xs text-gray-500">{item.employee.employeeCode}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {item.employee.department.name}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-gray-900 dark:text-gray-100 font-medium">
                            {item.presentDays}/{item.workingDays}
                          </span>
                          {item.overtimeHours > 0 && (
                            <p className="text-xs text-orange-600">{item.overtimeHours}h OT</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-gray-100">
                          {formatCurrency(Number(item.grossSalary))}
                        </td>
                        <td className="px-4 py-3 text-right text-red-600">
                          {formatCurrency(Number(item.totalDeductions))}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-blue-600">
                          {formatCurrency(Number(item.netSalary))}
                        </td>
                        <td className="px-4 py-3 text-center">{getStatusBadge(item.status)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => downloadPayslip(item.id)}
                              className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded transition"
                              title="Download Payslip"
                            >
                              <Download size={16} className="text-gray-600 dark:text-gray-400" />
                            </button>
                            {['DRAFT', 'PENDING_APPROVAL'].includes(item.status) && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedPayroll(item);
                                    setApprovalAction('APPROVE');
                                    setShowApprovalModal(true);
                                  }}
                                  className="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition"
                                  title="Approve"
                                >
                                  <Check size={16} className="text-green-600" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedPayroll(item);
                                    setApprovalAction('REJECT');
                                    setShowApprovalModal(true);
                                  }}
                                  className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition"
                                  title="Reject"
                                >
                                  <X size={16} className="text-red-600" />
                                </button>
                              </>
                            )}
                            {item.status === 'APPROVED' && (
                              <button
                                onClick={() => handleMarkAsPaid(item.id)}
                                className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition"
                                title="Mark as Paid"
                              >
                                <CheckCircle size={16} className="text-blue-600" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {activeTab === 'generate' && (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-gray-100">Generate Payroll</h2>
            
            {/* Employee count indicator */}
            <div className="mb-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    {employees.length === 0 
                      ? 'No employees found in the system' 
                      : `${employees.length} employee(s) available`}
                  </p>
                  {employees.length === 0 && (
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Please add employees first before generating payroll.{' '}
                      <a href="/admin/employees/add" className="underline font-medium">Add Employee</a>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={handleGeneratePayroll} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Employee <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={generateForm.employeeId}
                    onChange={(e) => setGenerateForm({ ...generateForm, employeeId: e.target.value })}
                    required
                    disabled={employeesLoading}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 bg-white dark:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {employeesLoading 
                        ? 'Loading employees...' 
                        : employees.length === 0 
                          ? 'No employees available' 
                          : 'Select Employee'}
                    </option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.user.name} ({emp.employeeCode})
                      </option>
                    ))}
                  </select>
                  {employees.length === 0 && !employeesLoading && (
                    <p className="text-sm text-red-600 mt-2">
                      No employees found. Please <a href="/admin/employees/add" className="underline">add employees</a> first.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Month <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="month"
                    value={generateForm.month}
                    onChange={(e) => setGenerateForm({ ...generateForm, month: e.target.value })}
                    required
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Overtime Hours
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={generateForm.overtimeHours}
                    onChange={(e) => setGenerateForm({ ...generateForm, overtimeHours: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bonus</label>
                  <input
                    type="number"
                    value={generateForm.bonus}
                    onChange={(e) => setGenerateForm({ ...generateForm, bonus: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 bg-white dark:bg-slate-800"
                    step="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Incentive</label>
                  <input
                    type="number"
                    value={generateForm.incentive}
                    onChange={(e) => setGenerateForm({ ...generateForm, incentive: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 bg-white dark:bg-slate-800"
                    step="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Arrears</label>
                  <input
                    type="number"
                    value={generateForm.arrears}
                    onChange={(e) => setGenerateForm({ ...generateForm, arrears: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 bg-white dark:bg-slate-800"
                    step="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Loan Deduction
                  </label>
                  <input
                    type="number"
                    value={generateForm.loanDeduction}
                    onChange={(e) =>
                      setGenerateForm({ ...generateForm, loanDeduction: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 bg-white dark:bg-slate-800"
                    step="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Advance Deduction
                  </label>
                  <input
                    type="number"
                    value={generateForm.advanceDeduction}
                    onChange={(e) =>
                      setGenerateForm({ ...generateForm, advanceDeduction: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 bg-white dark:bg-slate-800"
                    step="100"
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={loading} className="gap-2">
                  {loading ? <LoaderCircle className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                  {loading ? 'Generating...' : 'Generate Payroll'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setActiveTab('list')}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {activeTab === 'bulk' && (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-gray-100">Bulk Payroll Processing</h2>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">Bulk Processing Information</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    This will generate payroll for all active employees for the selected month. Existing payroll records
                    will be skipped unless configured otherwise.
                  </p>
                </div>
              </div>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleBulkPayroll();
              }}
              className="space-y-6"
            >
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Month <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="month"
                    value={bulkForm.month}
                    onChange={(e) => setBulkForm({ ...bulkForm, month: e.target.value })}
                    required
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Options</label>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bulkForm.skipDuplicates}
                        onChange={(e) => setBulkForm({ ...bulkForm, skipDuplicates: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Skip existing payroll records</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bulkForm.autoApprove}
                        onChange={(e) => setBulkForm({ ...bulkForm, autoApprove: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Auto-approve generated payroll</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={loading} className="gap-2">
                  {loading ? <LoaderCircle className="animate-spin" size={16} /> : <Users size={16} />}
                  {loading ? 'Processing...' : 'Process Bulk Payroll'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setActiveTab('list')}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {activeTab === 'reports' && (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-gray-100">Payroll Reports</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <ReportCard
                title="PF Report"
                description="Provident Fund summary with employee and employer contributions"
                icon={<DollarSign size={24} />}
                onClick={() => downloadReport('PF_REPORT')}
              />
              <ReportCard
                title="ESI Report"
                description="Employee State Insurance report with contributions"
                icon={<FileText size={24} />}
                onClick={() => downloadReport('ESI_REPORT')}
              />
              <ReportCard
                title="TDS Report"
                description="Tax deducted at source summary by employee"
                icon={<TrendingDown size={24} />}
                onClick={() => downloadReport('TDS_REPORT')}
              />
              <ReportCard
                title="Professional Tax"
                description="Professional tax deduction report"
                icon={<FileSpreadsheet size={24} />}
                onClick={() => downloadReport('PROFESSIONAL_TAX_REPORT')}
              />
              <ReportCard
                title="Payroll Register"
                description="Complete payroll summary for all employees"
                icon={<BarChart3 size={24} />}
                onClick={() => downloadReport('PAYROLL_REGISTER')}
              />
              <ReportCard
                title="Attendance Summary"
                description="Attendance-based salary calculation report"
                icon={<Clock size={24} />}
                onClick={() => downloadReport('ATTENDANCE_SUMMARY')}
              />
              <ReportCard
                title="Leave Deduction"
                description="Unpaid leave deduction details"
                icon={<XCircle size={24} />}
                onClick={() => downloadReport('LEAVE_DEDUCTION_REPORT')}
              />
              <ReportCard
                title="Overtime Report"
                description="Overtime hours and payment summary"
                icon={<TrendingUp size={24} />}
                onClick={() => downloadReport('OVERTIME_REPORT')}
              />
              <ReportCard
                title="Audit Log"
                description="Payroll changes and approval history"
                icon={<History size={24} />}
                onClick={() => downloadReport('AUDIT_LOG')}
              />
              <ReportCard
                title="Salary Band Report"
                description="Employee distribution across salary ranges"
                icon={<Users size={24} />}
                onClick={() => downloadReport('SALARY_BAND_REPORT')}
              />
            </div>
          </Card>
        )}

        {activeTab === 'revisions' && (
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-2">
              <Link href="/payroll/salary-structures">
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer block">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <DollarSign className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary">Salary Structures</h3>
                      <p className="text-sm text-text-secondary">Configure salary components and templates</p>
                    </div>
                  </div>
                </Card>
              </Link>

              <Link href="/payroll/salary-revisions">
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer block">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary">Salary Revisions</h3>
                      <p className="text-sm text-text-secondary">Manage employee salary changes and hikes</p>
                    </div>
                  </div>
                </Card>
              </Link>
            </div>

            <Card className="p-12 text-center">
              <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text-primary mb-2">Salary Revision Management</h3>
              <p className="text-text-secondary mb-4">
                Use our new salary revision feature to manage employee salary changes, hikes, and promotions.
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => router.push('/payroll/salary-structures')} className="bg-blue-600 text-white">
                  <DollarSign size={18} className="mr-2" />
                  Manage Structures
                </Button>
                <Button onClick={() => router.push('/payroll/salary-revisions')} className="bg-green-600 text-white">
                  <TrendingUp size={18} className="mr-2" />
                  View Revisions
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {showApprovalModal && selectedPayroll && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-900">
              {approvalAction === 'APPROVE' ? 'Approve Payroll' : 'Reject Payroll'}
            </h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Employee</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">{selectedPayroll.employee.user.name}</p>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Month</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">{formatMonth(selectedPayroll.month)}</p>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Net Salary</p>
              <p className="font-medium text-blue-600 text-lg">{formatCurrency(Number(selectedPayroll.netSalary))}</p>
            </div>
            {approvalAction === 'REJECT' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 bg-white dark:bg-slate-800"
                  rows={3}
                  placeholder="Enter reason for rejection..."
                />
              </div>
            )}
            <div className="flex gap-4">
              <Button
                onClick={handleApprovalAction}
                className={approvalAction === 'APPROVE' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                disabled={loading || (approvalAction === 'REJECT' && !rejectionReason)}
              >
                {loading ? <LoaderCircle className="animate-spin" size={16} /> : approvalAction === 'APPROVE' ? 'Approve' : 'Reject'}
              </Button>
              <Button variant="outline" onClick={() => { setShowApprovalModal(false); setRejectionReason(''); }}>
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Payslip Preview Modal */}
      {showPayslipModal && selectedPayroll && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-auto">
          <Card className="max-w-4xl w-full p-6 my-8">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-bold text-gray-900">Payslip Preview</h3>
              <button
                onClick={() => setShowPayslipModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="border rounded-lg p-6 bg-gray-50 dark:bg-slate-800">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Employee</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{selectedPayroll.employee.user.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedPayroll.employee.employeeCode}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Period</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{formatMonth(selectedPayroll.month)}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-700 dark:text-gray-300">Gross Salary</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {formatCurrency(Number(selectedPayroll.grossSalary))}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-700 dark:text-gray-300">Total Deductions</span>
                  <span className="font-semibold text-red-600">
                    {formatCurrency(Number(selectedPayroll.totalDeductions))}
                  </span>
                </div>
                <div className="flex justify-between py-3 bg-blue-600 text-white px-4 rounded">
                  <span className="font-semibold">Net Salary</span>
                  <span className="font-bold text-xl">{formatCurrency(Number(selectedPayroll.netSalary))}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <Button onClick={() => downloadPayslip(selectedPayroll.id)} className="gap-2">
                <Download size={16} />
                Download PDF
              </Button>
              <Button variant="outline" onClick={() => setShowPayslipModal(false)}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </AppShell>
  );
}

function TabButton({ active, onClick, icon, children }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 font-medium transition border-b-2 ${
        active
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function ReportCard({ title, description, icon, onClick }: any) {
  return (
    <div
      onClick={onClick}
      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition cursor-pointer hover:border-blue-300 dark:hover:border-blue-700"
    >
      <div className="flex items-start gap-3">
        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">{icon}</div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
}

function getMonthOptions() {
  const months = [];
  const currentDate = new Date();
  for (let i = 0; i < 24; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const value = date.toISOString().slice(0, 7);
    const label = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    months.push({ value, label });
  }
  return months;
}
