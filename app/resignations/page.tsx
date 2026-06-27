'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LogOut,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  User,
  Calendar,
  Briefcase,
  MoreVertical
} from 'lucide-react';

interface Resignation {
  id: string;
  type: string;
  status: string;
  displayStatus?: string;
  employee: {
    id: string;
    name: string;
    email: string;
    employeeCode: string;
    designation: string;
    department: string;
  };
  resignationDate: string;
  noticeDate: string;
  lastWorkingDay: string;
  reason: string;
  reasonCategory: string;
  noticePeriodDays: number;
  okToRehire: boolean;
  clearanceProgress: {
    total: number;
    completed: number;
    pending: number;
  };
}

const statusColors: any = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  SUBMITTED: 'bg-blue-100 text-blue-800',
  UNDER_REVIEW: 'bg-purple-100 text-purple-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  WITHDRAWN: 'bg-gray-100 text-gray-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-green-100 text-green-800',
  // Display status mappings
  CANCELLED: 'bg-red-100 text-red-800'
};

export default function ResignationsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [resignations, setResignations] = useState<Resignation[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResignation, setSelectedResignation] = useState<Resignation | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchResignations();
  }, [filter]);

  const fetchResignations = async () => {
    try {
      const typeParam = filter !== 'ALL' ? `&type=${filter}` : '';
      const response = await fetch(`/api/exits${typeParam}`);
      if (response.ok) {
        const result = await response.json();
        setResignations(result.resignations);
      }
    } catch (error) {
      console.error('Error fetching resignations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (resignationId: string) => {
    setActionLoading(`approve-${resignationId}`);
    try {
      const response = await fetch('/api/resignation/approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resignationId,
          action: 'APPROVED',
          comments: 'Approved'
        })
      });
      if (response.ok) {
        alert('✅ Resignation approved successfully');
        await fetchResignations();
      } else {
        const result = await response.json();
        alert(`Failed to approve: ${result.error}`);
      }
    } catch (error) {
      console.error('Error approving resignation:', error);
      alert('Failed to approve resignation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (resignationId: string) => {
    const reason = prompt('Please provide rejection reason:');
    if (!reason) return;
    
    setActionLoading(`reject-${resignationId}`);
    try {
      const response = await fetch('/api/resignation/approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resignationId,
          action: 'REJECTED',
          rejectionReason: reason
        })
      });
      if (response.ok) {
        alert('✅ Resignation rejected');
        await fetchResignations();
      } else {
        const result = await response.json();
        alert(`Failed to reject: ${result.error || response.statusText}`);
        console.error('Reject error:', result);
      }
    } catch (error) {
      console.error('Error rejecting resignation:', error);
      alert('Failed to reject resignation: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setActionLoading(null);
    }
  };

  const filteredResignations = resignations.filter(r => {
    const search = searchTerm.toLowerCase();
    return r.employee.name.toLowerCase().includes(search) ||
      r.employee.employeeCode.toLowerCase().includes(search) ||
      r.employee.department.toLowerCase().includes(search);
  });

  const stats = {
    total: resignations.length,
    pending: resignations.filter(r => (r.displayStatus || r.status) === 'PENDING').length,
    underReview: resignations.filter(r => r.status === 'UNDER_REVIEW').length,
    approved: resignations.filter(r => (r.displayStatus || r.status) === 'COMPLETED').length
  };

  return (
    <AppShell title="Resignations & Exits">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Resignations & Exits</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage employee offboarding process</p>
          </div>
          <a
            href="/admin/employees"
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Initiate Exit
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Exits</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
              </div>
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full">
                <LogOut className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Under Review</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">{stats.underReview}</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                <AlertCircle className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Approved</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.approved}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, employee code, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800"
              />
            </div>
            <div className="flex gap-2">
              {['ALL', 'PENDING', 'UNDER_REVIEW', 'APPROVED'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === status
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {status === 'ALL' ? 'All' : status.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Resignations List */}
        {loading ? (
          <Card className="p-12 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto" />
            <p className="text-gray-600 dark:text-gray-400 mt-4">Loading resignations...</p>
          </Card>
        ) : filteredResignations.length === 0 ? (
          <Card className="p-12 text-center">
            <LogOut className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No resignations found</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredResignations.map((resignation) => (
              <Card key={resignation.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Employee Avatar */}
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-bold text-lg flex-shrink-0">
                      {resignation.employee.name.charAt(0).toUpperCase()}
                    </div>
                    {/* Employee Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                          {resignation.employee.name}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[resignation.displayStatus || resignation.status]}`}>
                          {resignation.displayStatus || resignation.status}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                          {resignation.type}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{resignation.employee.designation}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          <span>{resignation.employee.department}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Last Day: {new Date(resignation.lastWorkingDay).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{resignation.noticePeriodDays} days notice</span>
                        </div>
                      </div>
                      {/* Reason */}
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <AlertCircle className="h-4 w-4" />
                        <span>{resignation.reasonCategory}</span>
                      </div>
                      {/* Clearance Progress */}
                      {(resignation.status === 'APPROVED' || resignation.status === 'ACCEPTED') && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>Clearance Progress</span>
                            <span>{resignation.clearanceProgress.completed}/{resignation.clearanceProgress.total}</span>
                          </div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 transition-all duration-500"
                              style={{
                                width: `${(resignation.clearanceProgress.completed / resignation.clearanceProgress.total) * 100}%`
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex gap-2">
                    {(resignation.status === 'PENDING' || resignation.status === 'SUBMITTED' || resignation.status === 'UNDER_REVIEW') && (
                      <>
                        <Button
                          onClick={() => handleApprove(resignation.id)}
                          disabled={actionLoading === `approve-${resignation.id}`}
                          className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
                          size="sm"
                        >
                          {actionLoading === `approve-${resignation.id}` ? (
                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          onClick={() => handleReject(resignation.id)}
                          disabled={actionLoading === `reject-${resignation.id}`}
                          variant="outline"
                          size="sm"
                          className="border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          {actionLoading === `reject-${resignation.id}` ? (
                            <div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedResignation(resignation)}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
