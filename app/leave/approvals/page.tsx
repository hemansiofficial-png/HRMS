'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDataRefresh } from '@/hooks/use-data-refresh';
import {
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Search,
  Filter,
  User,
  MessageSquare,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface LeaveRequest {
  id: string;
  employee: {
    id: string;
    employeeCode: string;
    user: { name: string; email: string };
    department: { name: string };
  };
  leaveType: string;
  startDate: string;
  endDate: string;
  numberOfDays: number;
  reason: string;
  status: string;
  rejectionReason?: string;
  createdAt: string;
  approver?: { name: string } | null;
}

export default function LeaveApprovalsPage() {
  const { data: session } = useSession();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      fetchLeaveRequests();
    }
  }, [session, filterStatus]);

  // Auto-refresh on visibility change and focus
  useDataRefresh(fetchLeaveRequests, {
    onVisibilityChange: true,
    onFocus: true,
  });

  async function fetchLeaveRequests() {
    try {
      setLoading(true);
      const url = new URL('/api/leave/approve', window.location.origin);
      url.searchParams.append('status', filterStatus);

      console.log('Fetching leave approvals from:', url.toString());
      const response = await fetch(url);
      const result = await response.json();
      console.log('Leave approvals API response:', result);
      
      if (result.success) {
        setLeaveRequests(result.data);
        console.log('Loaded', result.data.length, 'leave requests for approval');
      } else {
        console.error('API returned error:', result.error);
        setError(result.error || 'Failed to fetch leave requests');
      }
    } catch (error) {
      console.error('Failed to fetch leave requests:', error);
      setError('Failed to fetch leave requests');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: string) {
    if (!confirm('Are you sure you want to approve this leave request?')) return;

    try {
      setProcessing(id);
      const response = await fetch('/api/leave/approve', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'APPROVED' }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Leave request approved successfully');
        fetchLeaveRequests();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Failed to approve leave request');
      }
    } catch (error) {
      console.error('Error approving leave:', error);
      setError('Failed to approve leave request');
    } finally {
      setProcessing(null);
    }
  }

  function handleRejectClick(request: LeaveRequest) {
    setSelectedRequest(request);
    setShowRejectModal(true);
    setRejectionReason('');
  }

  async function handleRejectSubmit() {
    if (!selectedRequest) return;
    if (!rejectionReason.trim()) {
      setError('Rejection reason is required');
      return;
    }

    try {
      setProcessing(selectedRequest.id);
      const response = await fetch('/api/leave/approve', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: selectedRequest.id, 
          status: 'REJECTED',
          rejectionReason 
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Leave request rejected');
        setShowRejectModal(false);
        setSelectedRequest(null);
        fetchLeaveRequests();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Failed to reject leave request');
      }
    } catch (error) {
      console.error('Error rejecting leave:', error);
      setError('Failed to reject leave request');
    } finally {
      setProcessing(null);
      setShowRejectModal(false);
      setSelectedRequest(null);
    }
  }

  const filteredRequests = leaveRequests.filter((request) => {
    return (
      request.employee.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.employee.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.leaveType.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="danger" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock size={14} className="mr-1" />
            Pending
          </Badge>
        );
      case 'APPROVED':
        return (
          <Badge variant="success" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle size={14} className="mr-1" />
            Approved
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="danger" className="bg-red-50 text-red-700 border-red-200">
            <XCircle size={14} className="mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getLeaveTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      ANNUAL: '🏖️ Annual',
      SICK: '🤒 Sick',
      CASUAL: '📅 Casual',
      MATERNITY: '👶 Maternity',
      PATERNITY: '👨‍🍼 Paternity',
      MARRIAGE: '💒 Marriage',
      BEREAVEMENT: '🕯️ Bereavement',
      SABBATICAL: '🎓 Sabbatical',
    };
    return labels[type] || type;
  };

  return (
    <AppShell title="Leave Approvals">
      <div className="space-y-6">
        {/* Success/Error Messages */}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-800">
            <CheckCircle size={20} />
            {success}
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
            <Info size={20} />
            {error}
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">Leave Approvals</h2>
            <p className="text-text-secondary text-sm mt-1">
              Review and approve team leave requests
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="neutral" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              <Clock size={14} className="mr-1" />
              {leaveRequests.filter(r => r.status === 'PENDING').length} Pending
            </Badge>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock size={24} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {leaveRequests.filter(r => r.status === 'PENDING').length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {leaveRequests.filter(r => r.status === 'APPROVED').length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle size={24} className="text-red-600" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Rejected</p>
                <p className="text-2xl font-bold text-red-600">
                  {leaveRequests.filter(r => r.status === 'REJECTED').length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search
                  size={20}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search by employee name or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 h-10 border border-border-light rounded-lg bg-white text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-keka-primary/20 focus:border-keka-primary"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {['pending', 'approved', 'rejected', 'all'].map((status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus(status)}
                  className={filterStatus === status ? 'bg-keka-primary text-white' : ''}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Leave Requests List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12 text-text-secondary">Loading leave requests...</div>
          ) : filteredRequests.length === 0 ? (
            <Card className="p-12 text-center">
              <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                {filterStatus === 'pending' ? 'No Pending Requests' : 'No Leave Requests'}
              </h3>
              <p className="text-text-secondary">
                {filterStatus === 'pending' 
                  ? 'All caught up! No pending leave requests to review.'
                  : `No ${filterStatus === 'all' ? '' : filterStatus.toLowerCase()} leave requests found.`}
              </p>
            </Card>
          ) : (
            filteredRequests.map((request) => (
              <Card key={request.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full bg-keka-primary-light flex items-center justify-center text-keka-primary font-semibold">
                      {request.employee.user.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-text-primary">
                          {request.employee.user.name}
                        </h3>
                        {getStatusBadge(request.status)}
                        <Badge variant="neutral" className="text-xs">
                          {request.employee.employeeCode}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-text-secondary mb-2">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {getLeaveTypeLabel(request.leaveType)}
                        </span>
                        <span>
                          {formatDate(request.startDate)} - {formatDate(request.endDate)}
                        </span>
                        <span className="font-medium text-text-primary">
                          {request.numberOfDays} {request.numberOfDays === 1 ? 'day' : 'days'}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary line-clamp-1">
                        {request.reason}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {request.status === 'PENDING' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(request.id)}
                          disabled={processing === request.id}
                          className="bg-green-600 text-white hover:bg-green-700"
                        >
                          <CheckCircle size={18} className="mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectClick(request)}
                          disabled={processing === request.id}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <XCircle size={18} className="mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedRequest(expandedRequest === request.id ? null : request.id)}
                    >
                      {expandedRequest === request.id ? (
                        <ChevronUp size={20} />
                      ) : (
                        <ChevronDown size={20} />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedRequest === request.id && (
                  <div className="mt-4 pt-4 border-t border-border-light">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-text-secondary mb-1">Department</h4>
                        <p className="text-sm text-text-primary">
                          {request.employee.department.name}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-text-secondary mb-1">Email</h4>
                        <p className="text-sm text-text-primary">
                          {request.employee.user.email}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-text-secondary mb-1">Applied On</h4>
                        <p className="text-sm text-text-primary">
                          {formatDate(request.createdAt)}
                        </p>
                      </div>
                      {request.approver && (
                        <div>
                          <h4 className="text-sm font-medium text-text-secondary mb-1">
                            {request.status === 'APPROVED' ? 'Approved' : 'Rejected'} By
                          </h4>
                          <p className="text-sm text-text-primary">
                            {request.approver.name}
                          </p>
                        </div>
                      )}
                      {request.rejectionReason && (
                        <div className="col-span-2">
                          <h4 className="text-sm font-medium text-text-secondary mb-1 flex items-center gap-1">
                            <MessageSquare size={14} />
                            Rejection Reason
                          </h4>
                          <p className="text-sm text-text-primary bg-red-50 p-3 rounded-lg">
                            {request.rejectionReason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-text-primary">Reject Leave Request</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowRejectModal(false);
                      setSelectedRequest(null);
                      setRejectionReason('');
                    }}
                  >
                    <XCircle size={20} />
                  </Button>
                </div>

                {selectedRequest && (
                  <>
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-text-secondary">
                        <strong>Employee:</strong> {selectedRequest.employee.user.name}
                      </p>
                      <p className="text-sm text-text-secondary">
                        <strong>Type:</strong> {getLeaveTypeLabel(selectedRequest.leaveType)}
                      </p>
                      <p className="text-sm text-text-secondary">
                        <strong>Dates:</strong> {formatDate(selectedRequest.startDate)} - {formatDate(selectedRequest.endDate)}
                      </p>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Rejection Reason <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Please provide a reason for rejecting this leave request..."
                        rows={4}
                        className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-keka-primary/20 focus:border-keka-primary"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        onClick={handleRejectSubmit}
                        disabled={processing === selectedRequest.id || !rejectionReason.trim()}
                        className="flex-1 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {processing === selectedRequest.id ? (
                          <>Processing...</>
                        ) : (
                          <>
                            <XCircle size={18} className="mr-2" />
                            Reject Request
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowRejectModal(false);
                          setSelectedRequest(null);
                          setRejectionReason('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}
