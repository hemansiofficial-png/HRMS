'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  LogOut,
  FileText,
  Award,
  LoaderCircle,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  ChevronRight,
  Filter,
  Search,
  Download,
  Plus
} from 'lucide-react';
import { ResignationStatus } from '@/components/resignation/resignation-status';
import { ResignationForm } from '@/components/resignation/resignation-form';

interface Promotion {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  employeePhoto?: string | null;
  previousDesignation: string;
  newDesignation: string;
  previousSalary: number;
  newSalary: number;
  salaryIncrease: number;
  increasePercentage: string;
  effectiveDate: string;
  reason?: string | null;
  department: string;
  createdAt: string;
}

interface Resignation {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  employeePhoto?: string | null;
  designation: string;
  department: string;
  type: string;
  status: string;
  resignationDate: string;
  noticeDate: string;
  lastWorkingDay: string;
  reason: string;
  reasonCategory?: string | null;
  discussionWithManager: boolean;
  discussionSummary?: string | null;
  managerComments?: string | null;
  hrComments?: string | null;
  noticePeriodDays: number;
  noticePeriodWaiver: boolean;
  waiverReason?: string | null;
  okToRehire: boolean;
  approvedBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  hasExitInterview: boolean;
  clearanceProgress: {
    total: number;
    completed: number;
    pending: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface ExitInterview {
  id: string;
  resignationId: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  employeePhoto?: string | null;
  designation: string;
  department: string;
  interviewDate: string;
  feedback?: string | null;
  reason?: string | null;
  suggestions?: string | null;
  wouldRehire?: boolean | null;
  resignationStatus: string;
  lastWorkingDay: string;
  createdAt: string;
}

interface LifecycleStats {
  totalPromotions: number;
  totalResignations: number;
  totalExitInterviews: number;
  pendingResignations: number;
  approvedResignations: number;
  rejectedResignations: number;
}

export default function EmployeeLifecyclePage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'promotions' | 'resignations' | 'exit'>('promotions');
  
  // Data state
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [resignations, setResignations] = useState<Resignation[]>([]);
  const [exitInterviews, setExitInterviews] = useState<ExitInterview[]>([]);
  const [stats, setStats] = useState<LifecycleStats | null>(null);
  
  // My resignation state
  const [myResignation, setMyResignation] = useState<any>(null);
  const [showResignationForm, setShowResignationForm] = useState(false);
  const [resignationLoading, setResignationLoading] = useState(false);
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    fetchData();
    fetchMyResignation();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/employee-lifecycle');
      if (response.ok) {
        const result = await response.json();
        setPromotions(result.promotions || []);
        setResignations(result.resignations || []);
        setExitInterviews(result.exitInterviews || []);
        setStats(result.stats || null);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyResignation = async () => {
    try {
      const response = await fetch('/api/resignation');
      if (response.ok) {
        const result = await response.json();
        if (result.hasResignation && result.resignation) {
          setMyResignation(result.resignation);
        }
      }
    } catch (error) {
      console.error('Error fetching resignation:', error);
    }
  };

  const handleSubmitResignation = async (data: any) => {
    setResignationLoading(true);
    try {
      const response = await fetch('/api/resignation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        const result = await response.json();
        alert('Resignation submitted successfully! Your manager will be notified.');
        setShowResignationForm(false);
        fetchMyResignation();
        fetchData();
      } else {
        const result = await response.json();
        alert(`Failed to submit resignation: ${result.error}`);
      }
    } catch (error) {
      console.error('Error submitting resignation:', error);
      alert('Failed to submit resignation');
    } finally {
      setResignationLoading(false);
    }
  };

  const handleWithdrawResignation = async () => {
    if (!myResignation || !confirm('Are you sure you want to withdraw your resignation? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/resignation/approval?id=${myResignation.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Resignation withdrawn successfully');
        setMyResignation(null);
        fetchData();
      } else {
        const result = await response.json();
        alert(`Failed to withdraw: ${result.error}`);
      }
    } catch (error) {
      console.error('Error withdrawing resignation:', error);
      alert('Failed to withdraw resignation');
    }
  };

  // Filter data based on search and filters
  const filterData = (data: any[], searchFields: string[]) => {
    return data.filter(item => {
      const matchesSearch = searchTerm === '' || 
        searchFields.some(field => {
          const value = item[field];
          return value && String(value).toLowerCase().includes(searchTerm.toLowerCase());
        });
      
      const matchesStatus = filterStatus === 'all' || 
        (item.status && item.status.toLowerCase() === filterStatus.toLowerCase());
      
      return matchesSearch && matchesStatus;
    });
  };

  const filteredPromotions = filterData(promotions, ['employeeName', 'employeeCode', 'department', 'newDesignation']);
  const filteredResignations = filterData(resignations, ['employeeName', 'employeeCode', 'department', 'designation']);
  const filteredExitInterviews = filterData(exitInterviews, ['employeeName', 'employeeCode', 'department']);

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'APPROVED':
      case 'ACCEPTED':
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
        return 'bg-yellow-100 text-yellow-800';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (loading) {
    return (
      <AppShell title="Employee Lifecycle">
        <div className="flex items-center justify-center h-screen">
          <LoaderCircle className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Employee Lifecycle">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Employee Lifecycle</h1>
            <p className="text-gray-600 mt-1">Manage employee journey from promotions to offboarding</p>
          </div>
          <Button
            onClick={() => setShowResignationForm(true)}
            disabled={!!myResignation}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Submit Resignation
          </Button>
        </div>

        {/* My Resignation Status */}
        {myResignation && (
          <Card>
            <ResignationStatus
              resignation={myResignation}
              onWithdraw={handleWithdrawResignation}
            />
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm">Total Promotions</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{stats?.totalPromotions || 0}</p>
              </div>
              <Award className="w-8 h-8 text-blue-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm">Total Resignations</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">{stats?.totalResignations || 0}</p>
              </div>
              <LogOut className="w-8 h-8 text-yellow-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm">Exit Interviews</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{stats?.totalExitInterviews || 0}</p>
              </div>
              <FileText className="w-8 h-8 text-red-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm">Pending Actions</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{stats?.pendingResignations || 0}</p>
              </div>
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('promotions')}
            className={`px-4 py-2 font-medium flex items-center gap-2 ${
              activeTab === 'promotions'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Promotions
          </button>
          <button
            onClick={() => setActiveTab('resignations')}
            className={`px-4 py-2 font-medium flex items-center gap-2 ${
              activeTab === 'resignations'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <LogOut className="w-4 h-4" />
            Resignations
          </button>
          <button
            onClick={() => setActiveTab('exit')}
            className={`px-4 py-2 font-medium flex items-center gap-2 ${
              activeTab === 'exit'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            Exit Interviews
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, employee code, department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                borderColor: 'var(--border)',
                backgroundColor: 'var(--card)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{
              borderColor: 'var(--border)',
              backgroundColor: 'var(--card)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Content */}
        {activeTab === 'promotions' && (
          <div className="space-y-4">
            {filteredPromotions.length > 0 ? (
              filteredPromotions.map((promotion) => (
                <Card key={promotion.id} className="p-6 hover:shadow-lg transition">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-lg">
                        {promotion.employeeName.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{promotion.employeeName}</h3>
                          <span className="text-sm text-gray-500">({promotion.employeeCode})</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{promotion.department}</p>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-gray-700 font-medium">{promotion.previousDesignation}</span>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900 font-bold">{promotion.newDesignation}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-gray-600">
                            <DollarSign className="w-4 h-4" />
                            <span>Previous: ₹{promotion.previousSalary.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-600">
                            <DollarSign className="w-4 h-4" />
                            <span>New: ₹{promotion.newSalary.toLocaleString()}</span>
                          </div>
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            +{promotion.increasePercentage}%
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Effective: {new Date(promotion.effectiveDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                        {promotion.reason && (
                          <p className="text-sm text-gray-600 mt-2 italic">"{promotion.reason}"</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        Promoted
                      </span>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-12 text-center">
                <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No promotions found</p>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'resignations' && (
          <div className="space-y-4">
            {filteredResignations.length > 0 ? (
              filteredResignations.map((resignation) => (
                <Card key={resignation.id} className="p-6 hover:shadow-lg transition">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-yellow-700 font-bold text-lg">
                        {resignation.employeeName.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{resignation.employeeName}</h3>
                          <span className="text-sm text-gray-500">({resignation.employeeCode})</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{resignation.designation} • {resignation.department}</p>
                        
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(resignation.status)}`}>
                            {resignation.status}
                          </span>
                          {resignation.hasExitInterview && (
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              Exit Interview Done
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Resignation Date: {new Date(resignation.resignationDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>Notice Period: {resignation.noticePeriodDays} days</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4" />
                            <span>Last Day: {new Date(resignation.lastWorkingDay).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            <span>Clearance: {resignation.clearanceProgress.completed}/{resignation.clearanceProgress.total}</span>
                          </div>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-lg mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">Reason for Resignation</p>
                          <p className="text-sm text-gray-600">{resignation.reason}</p>
                        </div>

                        {resignation.rejectionReason && (
                          <div className="bg-red-50 p-3 rounded-lg mb-3">
                            <p className="text-sm font-medium text-red-800 mb-1 flex items-center gap-1">
                              <XCircle className="w-4 h-4" />
                              Rejection Reason
                            </p>
                            <p className="text-sm text-red-700">{resignation.rejectionReason}</p>
                          </div>
                        )}

                        {resignation.approvedBy && (
                          <div className="bg-green-50 p-3 rounded-lg">
                            <p className="text-sm font-medium text-green-800 mb-2 flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" />
                              Approved By
                            </p>
                            <div className="flex items-center gap-2 text-sm text-green-700">
                              <User className="w-4 h-4" />
                              <span>{resignation.approvedBy.name}</span>
                              <Mail className="w-3 h-3" />
                              <span>{resignation.approvedBy.email}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-12 text-center">
                <LogOut className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No resignations found</p>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'exit' && (
          <div className="space-y-4">
            {filteredExitInterviews.length > 0 ? (
              filteredExitInterviews.map((interview) => (
                <Card key={interview.id} className="p-6 hover:shadow-lg transition">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-700 font-bold text-lg">
                        {interview.employeeName.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{interview.employeeName}</h3>
                          <span className="text-sm text-gray-500">({interview.employeeCode})</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{interview.designation} • {interview.department}</p>
                        
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(interview.resignationStatus)}`}>
                            {interview.resignationStatus}
                          </span>
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            Exit Interview Completed
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Interview Date: {new Date(interview.interviewDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4" />
                            <span>Last Day: {new Date(interview.lastWorkingDay).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {interview.feedback && (
                          <div className="bg-gray-50 p-3 rounded-lg mb-3">
                            <p className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                              <MessageSquare className="w-4 h-4" />
                              Feedback
                            </p>
                            <p className="text-sm text-gray-600 mt-1">{interview.feedback}</p>
                          </div>
                        )}

                        {interview.suggestions && (
                          <div className="bg-blue-50 p-3 rounded-lg mb-3">
                            <p className="text-sm font-medium text-blue-800 mb-1 flex items-center gap-1">
                              <TrendingUp className="w-4 h-4" />
                              Suggestions
                            </p>
                            <p className="text-sm text-blue-700 mt-1">{interview.suggestions}</p>
                          </div>
                        )}

                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Would Rehire:</span>
                            {interview.wouldRehire === true ? (
                              <span className="flex items-center gap-1 text-green-700 font-medium">
                                <ThumbsUp className="w-4 h-4" />
                                Yes
                              </span>
                            ) : interview.wouldRehire === false ? (
                              <span className="flex items-center gap-1 text-red-700 font-medium">
                                <ThumbsDown className="w-4 h-4" />
                                No
                              </span>
                            ) : (
                              <span className="text-gray-400">Not specified</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-12 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No exit interviews found</p>
              </Card>
            )}
          </div>
        )}

        {/* Resignation Form Modal */}
        {showResignationForm && (
          <ResignationForm
            onClose={() => setShowResignationForm(false)}
            onSubmit={handleSubmitResignation}
          />
        )}
      </div>
    </AppShell>
  );
}
