'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Search, CheckCircle, Clock, Calendar, Star, FileCheck, LoaderCircle } from 'lucide-react';
import { useDataRefresh } from '@/hooks/use-data-refresh';

interface LeaveRequest {
  id: string;
  employeeId: string;
  employee?: {
    employeeCode: string;
    user: { name: string; email: string };
    department: { name: string };
  };
  leaveType: string;
  startDate: string;
  endDate: string;
  numberOfDays: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  rejectionReason?: string | null;
  createdAt: string;
  approvedBy?: string | null;
}

export default function LeavePage() {
  const { data: session } = useSession();
  const isManager = ['HR_MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(session?.user?.role || '');
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [employeeId, setEmployeeId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [noEmployeeRecord, setNoEmployeeRecord] = useState(false);
  const [formData, setFormData] = useState({
    leaveType: 'ANNUAL',
    startDate: '',
    endDate: '',
    reason: '',
  });

  // Leave balances - will be fetched from API
  const [leaveBalance, setLeaveBalance] = useState({
    ANNUAL: 15,
    SICK: 10,
    CASUAL: 5,
    MATERNITY: 90,
  });

  useEffect(() => {
    if (session) {
      fetchEmployeeId();
    }
  }, [session]);

  useEffect(() => {
    if (employeeId) {
      fetchLeaveRequests();
      fetchLeaveBalance();
    }
  }, [employeeId]);

  async function fetchEmployeeId() {
    try {
      // Fetch employee ID from the user's session
      const response = await fetch('/api/auth/me');
      const result = await response.json();
      console.log('Employee API Response:', result);
      
      if (response.ok && result?.employee?.id) {
        setEmployeeId(result.employee.id);
        console.log('Employee ID set:', result.employee.id);
      } else {
        console.warn('No employee record linked to this user account');
        
        // For users without employee records, show a helpful message
        // This can happen if:
        // 1. User was created directly without an employee record
        // 2. Employee record was deleted
        // In this case, we'll try to find by email
        if (session?.user?.email) {
          try {
            const empResponse = await fetch(`/api/employees?search=${encodeURIComponent(session.user.email)}`);
            const empResult = await empResponse.json();
            const employees = Array.isArray(empResult?.data) ? empResult.data : [];
            const matchingEmployee = employees?.find((e: any) => e?.user?.email === session.user?.email);
            
            if (matchingEmployee?.id) {
              setEmployeeId(matchingEmployee.id);
              console.log('Employee ID found via search:', matchingEmployee.id);
              return;
            }
          } catch (fallbackError) {
            // Silent fail - already logged
          }
        }
        
        // If still no employee ID, user needs to contact admin
        console.error('No employee record found. Please contact your HR admin to create your employee profile.');
        setNoEmployeeRecord(true);
      }
    } catch (error) {
      console.error('Failed to fetch employee ID:', error);
      setNoEmployeeRecord(true);
    }
  }

  useDataRefresh(() => {
    fetchLeaveRequests();
    fetchLeaveBalance();
  }, {
    onVisibilityChange: true,
    onFocus: true,
  });

  async function fetchLeaveRequests() {
    try {
      setLoading(true);
      const url = new URL('/api/leave', window.location.origin);
      
      // For regular employees, fetch only their own requests using employeeId
      // For managers, fetch all requests
      if (!isManager && employeeId) {
        url.searchParams.append('employeeId', employeeId);
        console.log('Fetching leaves for employeeId:', employeeId);
      } else {
        console.log('Manager mode or no employeeId - fetching all leaves');
      }

      const response = await fetch(url);
      const result = await response.json();
      console.log('Leave API Response:', result);
      if (result.data) {
        setLeaves(Array.isArray(result.data) ? result.data : []);
        console.log('Loaded', result.data.length, 'leave requests');
      }
    } catch (error) {
      console.error('Failed to fetch leave requests:', error);
      setError('Failed to fetch leave requests');
    } finally {
      setLoading(false);
    }
  }

  async function fetchLeaveBalance() {
    try {
      const response = await fetch('/api/leave/balance');
      const result = await response.json();
      if (result.success && result.data) {
        const balanceMap: Record<string, number> = {};
        result.data.forEach((b: any) => {
          balanceMap[b.leaveType] = b.remainingDays || b.totalDays;
        });
        setLeaveBalance(prev => ({
          ANNUAL: balanceMap['ANNUAL'] ?? 15,
          SICK: balanceMap['SICK'] ?? 10,
          CASUAL: balanceMap['CASUAL'] ?? 5,
          MATERNITY: balanceMap['MATERNITY'] ?? 90,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch leave balance:', error);
      // Use default values if API fails
    }
  }

  const calculateWorkingDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    let days = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        days++;
      }
      current.setDate(current.getDate() + 1);
    }
    return days;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate form data
    if (!formData.startDate || !formData.endDate) {
      setError('Please select both start and end dates');
      return;
    }

    if (!formData.reason || formData.reason.trim().length < 5) {
      setError('Please provide a reason (at least 5 characters)');
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      setError('Start date cannot be after end date');
      return;
    }

    const days = calculateWorkingDays(formData.startDate, formData.endDate);
    const type = formData.leaveType as keyof typeof leaveBalance;
    const availableDays = leaveBalance[type];

    if (days > availableDays) {
      setError(`Insufficient ${formData.leaveType} leave balance. Available: ${availableDays} days, Requested: ${days} days`);
      return;
    }

    if (!employeeId) {
      setError('Employee ID not found. Please try logging in again.');
      return;
    }

    try {
      const response = await fetch('/api/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: employeeId,
          leaveType: formData.leaveType,
          startDate: formData.startDate,
          endDate: formData.endDate,
          reason: formData.reason.trim(),
        }),
      });

      const result = await response.json();

      if (response.ok && result.data) {
        setSuccess('Leave request submitted successfully!');
        setFormData({ leaveType: 'ANNUAL', startDate: '', endDate: '', reason: '' });
        setShowForm(false);
        fetchLeaveRequests();
        fetchLeaveBalance();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Failed to submit leave request. Please check your leave balance and try again.');
      }
    } catch (error) {
      console.error('Error submitting leave:', error);
      setError('Failed to submit leave request. Please try again.');
    }
  };

  const stats = {
    total: leaves.length,
    approved: leaves.filter(l => l.status === 'APPROVED').length,
    pending: leaves.filter(l => l.status === 'PENDING').length,
    rejected: leaves.filter(l => l.status === 'REJECTED').length,
  };

  let filtered = leaves.filter(l =>
    l.leaveType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.reason?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filterStatus !== 'all') {
    filtered = filtered.filter(l => l.status === filterStatus.toUpperCase());
  }

  const days = calculateWorkingDays(formData.startDate, formData.endDate);

  return (
    <AppShell title="Leave Management">
      <div className="space-y-6">
        {/* No Employee Record Warning */}
        {noEmployeeRecord && (
          <Card className="p-6 bg-orange-50 border-orange-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-orange-900">No Employee Record Found</h3>
                <p className="text-orange-800 mt-2">
                  Your user account doesn't have an associated employee record. This is required to apply for leave and view your leave balance.
                </p>
                <p className="text-orange-800 mt-2 text-sm">
                  <strong>Please contact your HR admin</strong> to create your employee profile in the system.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Leave Balance */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-6">
            <p className="text-sm font-medium text-gray-600">Annual Leave</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{leaveBalance.ANNUAL}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm font-medium text-gray-600">Sick Leave</p>
            <p className="text-3xl font-bold text-red-600 mt-2">{leaveBalance.SICK}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm font-medium text-gray-600">Casual Leave</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{leaveBalance.CASUAL}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm font-medium text-gray-600">Maternity Leave</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">{leaveBalance.MATERNITY}</p>
          </Card>
        </div>

        {/* Status Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-6">
            <p className="text-sm text-gray-600">Total Requests</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-gray-600">Approved</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{stats.approved}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pending}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-gray-600">Rejected</p>
            <p className="text-3xl font-bold text-red-600 mt-2">{stats.rejected}</p>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/leave/policies">
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer block">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileCheck className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">Leave Policies</h3>
                  <p className="text-sm text-text-secondary">Configure organization leave policies</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/leave/holidays">
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer block">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">Holiday Calendar</h3>
                  <p className="text-sm text-text-secondary">Manage organization holidays</p>
                </div>
              </div>
            </Card>
          </Link>

          {isManager && (
            <Link href="/leave/approvals">
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer block">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">Leave Approvals</h3>
                    <p className="text-sm text-text-secondary">Review team leave requests</p>
                  </div>
                </div>
              </Card>
            </Link>
          )}
        </div>

        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Leave Requests</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Apply Leave
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="p-4 bg-red-100 text-red-800 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-green-100 text-green-800 rounded-lg">
            {success}
          </div>
        )}

        {/* Search */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search leave requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Form */}
        {showForm && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Apply for Leave</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Leave Type *</label>
                <select
                  name="leaveType"
                  value={formData.leaveType}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ANNUAL">Annual Leave</option>
                  <option value="SICK">Sick Leave</option>
                  <option value="CASUAL">Casual Leave</option>
                  <option value="MATERNITY">Maternity Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date *</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    required
                    min={formData.startDate || new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {days > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">
                    Total working days: <strong>{days}</strong> days
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason *</label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  required
                  minLength={5}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Please provide a detailed reason for your leave request (min 5 characters)"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition"
                >
                  Apply Leave
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </Card>
        )}

        {/* Leave Requests */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              <LoaderCircle className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
              <p>Loading leave requests...</p>
            </div>
          ) : filtered.length > 0 ? (
            filtered.map(leave => (
              <Card key={leave.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">
                        {getLeaveTypeLabel(leave.leaveType)}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        leave.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        leave.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        leave.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {leave.status.charAt(0).toUpperCase() + leave.status.slice(1).toLowerCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      Duration: <strong>{leave.numberOfDays}</strong> {leave.numberOfDays === 1 ? 'day' : 'days'}
                    </p>
                    <p className="text-sm text-gray-700">{leave.reason}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Applied on {new Date(leave.createdAt).toLocaleDateString()}
                    </p>
                    {leave.rejectionReason && (
                      <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs font-medium text-red-900">Rejection Reason:</p>
                        <p className="text-sm text-red-800 mt-1">{leave.rejectionReason}</p>
                      </div>
                    )}
                  </div>

                  {/* Show approve/reject buttons only for managers */}
                  {isManager && leave.status === 'PENDING' && (
                    <div className="flex flex-col gap-2 ml-4">
                      <Link
                        href={`/leave/approvals`}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition"
                      >
                        Review
                      </Link>
                    </div>
                  )}
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-12 text-center">
              <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Leave Requests</h3>
              <p className="text-gray-500">
                {searchTerm || filterStatus !== 'all'
                  ? 'No leave requests found matching your search'
                  : 'You haven\'t applied for any leave yet'}
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Apply for Leave
                </button>
              )}
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function getLeaveTypeLabel(type: string) {
  const labels: Record<string, string> = {
    ANNUAL: '🏖️ Annual Leave',
    SICK: '🤒 Sick Leave',
    CASUAL: '📅 Casual Leave',
    MATERNITY: '👶 Maternity Leave',
  };
  return labels[type] || type;
}
