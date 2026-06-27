'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { useDataRefresh } from '@/hooks/use-data-refresh';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Calendar as CalendarIcon,
  Users,
  CheckCircle,
  Home,
  Plane,
  Loader2,
} from 'lucide-react';

interface Employee {
  id: string;
  employeeCode?: string;
  name: string;
  email?: string;
  designation: string;
  department: string;
  avatar?: string;
  status?: string;
  joiningDate?: string;
}

interface LeaveRecord {
  id: string;
  employeeId: string;
  date: string;
  type: 'WFH' | 'PAID_LEAVE' | 'UNPAID_LEAVE' | 'HOLIDAY';
  status?: 'PENDING' | 'APPROVED';
  reason?: string;
}

interface Holiday {
  id: string;
  name: string;
  date: string;
  description?: string;
  isNational: boolean;
}

const leaveConfig = {
  WFH: { bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-600', label: 'WFH' },
  PAID_LEAVE: { bg: 'bg-green-500', light: 'bg-green-100', text: 'text-green-600', label: 'Leave' },
  UNPAID_LEAVE: { bg: 'bg-orange-500', light: 'bg-orange-100', text: 'text-orange-600', label: 'Unpaid' },
  HOLIDAY: { bg: 'bg-purple-500', light: 'bg-purple-100', text: 'text-purple-600', label: 'Holiday' },
};

function LeaveModal({ isOpen, onClose, date, onSubmit }: any) {
  const [selectedType, setSelectedType] = useState('WFH');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setReason('');
      setSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen || !date) return null;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit({ leaveType: selectedType, reason, startDate: date, endDate: date });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Request Time Off</h3>
            <p className="text-sm text-gray-500 mt-1">{new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>
          <button 
            onClick={onClose} 
            disabled={submitting}
            className="p-2 hover:bg-gray-100 rounded-xl transition disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Request Type</label>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(leaveConfig).map(([key, config]) => {
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedType(key)}
                    disabled={submitting}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                      selectedType === key
                        ? `${config.light} ${config.text} border-current`
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg ${selectedType === key ? config.bg : 'bg-gray-100'} flex items-center justify-center`} />
                    <span className="text-sm font-semibold">{config.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Reason (Optional)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Brief reason..."
              disabled={submitting}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm disabled:bg-gray-100"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              onClick={onClose} 
              disabled={submitting}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MemberCalendarRow({
  employee,
  isCurrentUser,
  leaveRecords,
  holidays,
  currentDate,
  onDateClick
}: {
  employee: Employee;
  isCurrentUser: boolean;
  leaveRecords: LeaveRecord[];
  holidays: Holiday[];
  currentDate: Date;
  onDateClick: (date: string, employeeId: string) => void;
}) {
  // Skip rendering if employee data is incomplete
  if (!employee?.id || !employee?.name) {
    return null;
  }

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const today = new Date();
  const isCurrentMonth = today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();

  const memberLeaves = leaveRecords.filter(r =>
    r.employeeId === employee.id &&
    r.date.startsWith(`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`)
  );

  const wfhCount = memberLeaves.filter(r => r.type === 'WFH').length;
  const leaveCount = memberLeaves.filter(r => r.type === 'PAID_LEAVE' || r.type === 'UNPAID_LEAVE').length;

  return (
    <Card className={`border-2 shadow-md overflow-hidden ${isCurrentUser ? 'border-blue-300 ring-2 ring-blue-100' : 'border-gray-200'}`}>
      <div className="flex">
        {/* Compact Member Info */}
        <div className={`w-24 flex-shrink-0 p-1.5 ${isCurrentUser ? 'bg-gradient-to-b from-blue-50 to-indigo-50' : 'bg-gray-50'}`}>
          <div className="flex items-center gap-1.5">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-gray-900 truncate">{employee.name}</p>
              <p className="text-[8px] text-gray-500 truncate">{employee.designation}</p>
              {isCurrentUser && (
                <span className="text-[7px] text-blue-600 font-medium bg-blue-100 px-1 py-0.5 rounded-full">You</span>
              )}
            </div>
          </div>
          {/* Compact Stats */}
          <div className="flex gap-1.5 mt-1.5">
            <div className="text-center flex-1 bg-blue-50 rounded py-0.5">
              <p className="text-xs font-bold text-blue-600">{wfhCount}</p>
              <p className="text-[6px] text-gray-500">WFH</p>
            </div>
            <div className="text-center flex-1 bg-green-50 rounded py-0.5">
              <p className="text-xs font-bold text-green-600">{leaveCount}</p>
              <p className="text-[6px] text-gray-500">Leave</p>
            </div>
          </div>
        </div>

        {/* Calendar - All Days in Single Row */}
        <div className="flex-1 p-1.5">
          <div className="flex items-center gap-0.5 w-full">
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isToday = isCurrentMonth && day === today.getDate();
              const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
              const isWeekend = [0, 6].includes(dayDate.getDay());
              const leaveRecord = leaveRecords.find(r => r.employeeId === employee.id && r.date === dateStr);
              const isHoliday = holidays.some(h => h.date === dateStr);
              const config = leaveRecord ? leaveConfig[leaveRecord.type as keyof typeof leaveConfig] : null;

              return (
                <button
                  key={day}
                  onClick={() => onDateClick(dateStr, employee.id)}
                  disabled={!isCurrentUser}
                  className={`flex-1 min-w-0 aspect-square rounded border transition-all flex flex-col items-center justify-center relative ${
                    isToday
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : isWeekend
                      ? 'border-red-200 bg-red-50'
                      : 'border-gray-200 bg-white hover:border-blue-300'
                  } ${config ? config.light : ''} ${!isCurrentUser ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <span className={`text-[7px] font-medium leading-none ${
                    isToday ? 'text-blue-600' : isWeekend ? 'text-red-500' : 'text-gray-400'
                  }`}>
                    {day}
                  </span>
                  {config && (
                    <div className={`w-1.5 h-1.5 rounded-full ${config.bg} mt-0.5`} />
                  )}
                  {isHoliday && !leaveRecord && (
                    <span className="text-[7px] mt-0.5">🎉</span>
                  )}
                  {isToday && (
                    <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-blue-500 rounded-full border border-white" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function TeamCalendarPage() {
  const { data: session } = useSession();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveRecords, setLeaveRecords] = useState<LeaveRecord[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);

  // Fetch all data: employees, attendance, leave requests, and holidays
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();

      // Fetch employees first (required)
      let employeesData: Employee[] = [];
      try {
        const employeesRes = await fetch('/api/employees');
        if (employeesRes.ok) {
          const result = await employeesRes.json();
          // Map the employee data from admin panel format
          const rawEmployees = result.data || [];
          employeesData = rawEmployees
            .filter((e: any) => {
              // Skip System Admin and ensure valid data
              const employeeName = e.user?.name || e.name;
              return e?.id && 
                     employeeName && 
                     employeeName.toLowerCase() !== 'system admin' &&
                     employeeName.toLowerCase() !== 'admin';
            })
            .map((e: any) => ({
              id: e.id,
              employeeCode: e.employeeCode,
              name: e.user?.name || e.name,
              email: e.user?.email || e.email,
              designation: e.designation || 'Employee',
              department: e.department?.name || e.department || 'General',
              avatar: (e.user?.name || e.name || '').split(' ').map((n: string) => n[0]).join('').toUpperCase(),
              status: e.status,
              joiningDate: e.joiningDate,
            }))
            .filter((e: Employee) => e.id && e.name); // Ensure valid data
        }
      } catch (e) {
        console.warn('Failed to fetch employees:', e);
      }

      setEmployees(employeesData);
      
      // Find the logged-in user from session
      if (session?.user?.email && employeesData.length > 0) {
        const loggedInUser = employeesData.find(e => e.email === session.user?.email);
        if (loggedInUser) {
          setCurrentUser(loggedInUser);
        } else {
          // Fallback to first employee if logged-in user not found
          setCurrentUser(employeesData[0]);
        }
      } else if (employeesData.length > 0) {
        // Fallback to first employee if no session
        setCurrentUser(employeesData[0]);
      }

      // Fetch attendance data
      let attendanceLeaves: LeaveRecord[] = [];
      try {
        const attendanceRes = await fetch(`/api/attendance?month=${month}&year=${year}&allEmployees=true`);
        if (attendanceRes.ok) {
          const result = await attendanceRes.json();
          const attendanceData = result.data || [];
          attendanceLeaves = attendanceData
            .filter((record: any) => {
              const status = record.status?.toUpperCase() || '';
              return ['WFH', 'PAID_LEAVE', 'UNPAID_LEAVE', 'ON_LEAVE'].includes(status);
            })
            .map((record: any) => ({
              id: record.id,
              employeeId: record.employeeId,
              date: new Date(record.date).toISOString().split('T')[0],
              type: (record.status?.toUpperCase() === 'WFH' ? 'WFH' :
                     record.status?.toUpperCase() === 'PAID_LEAVE' ? 'PAID_LEAVE' :
                     record.status?.toUpperCase() === 'UNPAID_LEAVE' ? 'UNPAID_LEAVE' :
                     'PAID_LEAVE') as 'WFH' | 'PAID_LEAVE' | 'UNPAID_LEAVE',
              status: 'APPROVED' as const,
            }));
        }
      } catch (e) {
        console.warn('Failed to fetch attendance:', e);
      }

      // Fetch leave requests data
      let leaveRequestRecords: LeaveRecord[] = [];
      try {
        const leaveRes = await fetch('/api/leave');
        if (leaveRes.ok) {
          const result = await leaveRes.json();
          const leaveData = result.data || [];
          leaveRequestRecords = leaveData
            .filter((leave: any) => {
              const leaveDate = new Date(leave.startDate);
              const leaveMonth = leaveDate.getMonth() + 1;
              const leaveYear = leaveDate.getFullYear();
              return leaveMonth === month && leaveYear === year;
            })
            .flatMap((leave: any) => {
              const records: LeaveRecord[] = [];
              const startDate = new Date(leave.startDate);
              const endDate = new Date(leave.endDate || leave.startDate);
              
              for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().split('T')[0];
                records.push({
                  id: `${leave.id}-${dateStr}`,
                  employeeId: leave.employeeId,
                  date: dateStr,
                  type: leave.leaveType === 'WFH' ? 'WFH' : 
                        leave.leaveType === 'PAID_LEAVE' ? 'PAID_LEAVE' : 'UNPAID_LEAVE',
                  status: leave.status as 'PENDING' | 'APPROVED',
                  reason: leave.reason,
                });
              }
              return records;
            });
        }
      } catch (e) {
        console.warn('Failed to fetch leave requests:', e);
      }

      // Fetch holidays data
      let formattedHolidays: Holiday[] = [];
      try {
        const holidaysRes = await fetch(`/api/holidays?year=${year}`);
        if (holidaysRes.ok) {
          const result = await holidaysRes.json();
          const holidaysData = result.data || [];
          formattedHolidays = holidaysData.map((h: any) => ({
            id: h.id,
            name: h.name,
            date: new Date(h.date).toISOString().split('T')[0],
            description: h.description,
            isNational: h.isNational,
          }));
        }
      } catch (e) {
        console.warn('Failed to fetch holidays:', e);
      }

      // Combine attendance and leave records (avoid duplicates)
      const combinedRecords = [...attendanceLeaves];
      leaveRequestRecords.forEach((leave) => {
        const exists = combinedRecords.some(
          r => r.employeeId === leave.employeeId && r.date === leave.date
        );
        if (!exists) {
          combinedRecords.push(leave);
        }
      });

      setLeaveRecords(combinedRecords);
      setHolidays(formattedHolidays);

    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError('Failed to load team calendar data. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  // Fetch data on mount and when month changes
  useEffect(() => {
    fetchAllData();
  }, [currentDate]);

  const handleRefresh = useCallback(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Auto-refresh on visibility change and focus
  useDataRefresh(handleRefresh, {
    onVisibilityChange: true,
    onFocus: true,
  });

  // Refresh data when page regains focus (e.g., after returning from attendance page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchAllData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchAllData]);

  const calculateSummary = () => {
    if (!currentUser?.id) {
      return {
        totalLeaves: 24,
        remainingLeaves: 24,
        takenLeaves: 0,
        wfhCount: 0,
        teamSize: employees?.length || 0,
      };
    }

    const userRecords = leaveRecords.filter(r => r.employeeId === currentUser.id);
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const monthRecords = userRecords.filter(r => {
      const date = new Date(r.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const takenLeaves = monthRecords.filter(r => r.type === 'PAID_LEAVE' || r.type === 'UNPAID_LEAVE').length;
    const wfhCount = monthRecords.filter(r => r.type === 'WFH').length;

    return {
      totalLeaves: 24,
      remainingLeaves: 24 - takenLeaves,
      takenLeaves,
      wfhCount,
      teamSize: employees?.length || 0,
    };
  };

  const handleDateClick = (date: string, employeeId: string) => {
    if (currentUser?.id && employeeId === currentUser.id) {
      setSelectedDate(date);
      setIsLeaveModalOpen(true);
    } else {
      alert('You can only apply for leave for your own calendar. Please select your own row.');
    }
  };

  const handleLeaveSubmit = async ({ leaveType, reason, startDate, endDate }: { leaveType: string; reason: string; startDate: string; endDate: string }) => {
    try {
      // Submit leave request to API
      const response = await fetch('/api/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: currentUser?.id,
          leaveType,
          startDate,
          endDate,
          reason,
          status: 'PENDING',
        }),
      });

      if (response.ok) {
        // Refresh data after successful submission
        await fetchAllData();
        setIsLeaveModalOpen(false);
        alert('Leave request submitted successfully!');
      } else {
        const result = await response.json();
        throw new Error(result.error || 'Failed to submit leave request');
      }
    } catch (error: any) {
      console.error('Leave submission error:', error);
      alert(error.message || 'Failed to submit leave request. Please try again.');
    }
  };

  const sortedEmployees = currentUser?.id
    ? [
        currentUser,
        ...employees
          .filter(e => e?.id !== currentUser?.id) // Remove current user from list
          .sort((a, b) => (a.name || '').localeCompare(b.name || '')) // Sort rest alphabetically
      ]
    : employees.filter(e => e?.id).sort((a, b) => (a.name || '').localeCompare(b.name || '')); // Sort all if no current user

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const summary = calculateSummary();
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const todayOnLeave = leaveRecords.filter(r => r.date === todayStr && (r.type === 'PAID_LEAVE' || r.type === 'UNPAID_LEAVE')).length;
  const todayWFH = leaveRecords.filter(r => r.date === todayStr && r.type === 'WFH').length;
  const todayAvailable = (employees?.length || 0) - todayOnLeave - todayWFH;

  const filteredEmployees = sortedEmployees.filter(emp =>
    emp.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppShell title="Team Calendar">
      <div className="space-y-3">
        {/* Header with Gradient */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold">Team Calendar</h1>
                <p className="text-blue-100 mt-0.5 text-xs">View each team member's schedule - all days in one row</p>
              </div>
              <button
                onClick={fetchAllData}
                disabled={loading}
                className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg hover:bg-white/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh data"
              >
                <Loader2 className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span className="text-xs font-semibold hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
          <div className="absolute right-0 top-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute right-16 bottom-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2" />
        </div>

        {/* Error Message */}
        {error && (
          <Card className="p-3 border-0 shadow-md bg-red-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center">
                  <X className="w-3.5 h-3.5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-red-800">Failed to load data</p>
                  <p className="text-[10px] text-red-600">{error}</p>
                </div>
              </div>
              <button
                onClick={fetchAllData}
                disabled={loading}
                className="px-2.5 py-1 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                Retry
              </button>
            </div>
          </Card>
        )}

        {/* Loading State */}
        {loading && !error && (
          <Card className="p-8 border-0 shadow-md">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
              <p className="text-gray-600 text-sm font-semibold">Loading team data...</p>
            </div>
          </Card>
        )}

        {!loading && !error && employees.length > 0 && (
          <>
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <Card className="p-2.5 border-0 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-gray-500 font-medium">Team Size</p>
                <p className="text-xl font-bold text-gray-900 mt-0.5">{summary.teamSize}</p>
              </div>
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-2.5 border-0 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-gray-500 font-medium">Available</p>
                <p className="text-xl font-bold text-green-600 mt-0.5">{todayAvailable}</p>
              </div>
              <div className="p-1.5 bg-green-100 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-2.5 border-0 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-gray-500 font-medium">On Leave</p>
                <p className="text-xl font-bold text-orange-600 mt-0.5">{todayOnLeave}</p>
              </div>
              <div className="p-1.5 bg-orange-100 rounded-lg">
                <Plane className="w-4 h-4 text-orange-600" />
              </div>
            </div>
          </Card>

          <Card className="p-2.5 border-0 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-gray-500 font-medium">WFH</p>
                <p className="text-xl font-bold text-purple-600 mt-0.5">{todayWFH}</p>
              </div>
              <div className="p-1.5 bg-purple-100 rounded-lg">
                <Home className="w-4 h-4 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Calendar Controls */}
        <Card className="p-2.5 border-0 shadow-md">
          <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <h2 className="text-xs font-bold text-gray-900 min-w-[160px] text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search team members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-48 pl-7 pr-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-xs"
              />
            </div>
          </div>
        </Card>

        {/* Legend */}
        <Card className="p-2.5 border-0 shadow-md">
          <div className="flex flex-wrap gap-2">
            {Object.entries(leaveConfig).map(([key, config]) => {
              return (
                <div key={key} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded ${config.bg}`} />
                  <span className="text-[10px] font-semibold text-gray-700">{config.label}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Team Members Calendar Rows - All Days in Single Row (No Scroll) */}
        <div className="space-y-3">
          {filteredEmployees.map((employee) => (
            <MemberCalendarRow
              key={employee.id}
              employee={employee}
              isCurrentUser={employee.id === currentUser?.id}
              leaveRecords={leaveRecords}
              holidays={holidays}
              currentDate={currentDate}
              onDateClick={handleDateClick}
            />
          ))}
        </div>
          </>
        )}

        {employees.length === 0 && !loading && !error && (
          <Card className="p-12 border-0 shadow-md text-center">
            <div className="flex flex-col items-center">
              <div className="h-20 w-20 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                <Users className="w-10 h-10 text-blue-400" />
              </div>
              <p className="text-gray-700 font-semibold text-lg">No team members found</p>
              <p className="text-sm text-gray-500 mt-2 max-w-md text-center">
                Make sure employees are added to your organization. Check back after employees are registered.
              </p>
            </div>
          </Card>
        )}

        {filteredEmployees.length === 0 && employees.length > 0 && !loading && !error && (
          <Card className="p-12 border-0 shadow-md text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No team members found</p>
            <p className="text-sm text-gray-400 mt-2">Try adjusting your search</p>
          </Card>
        )}
      </div>

      <LeaveModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        date={selectedDate}
        onSubmit={handleLeaveSubmit}
      />
    </AppShell>
  );
}
