'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Save,
  X,
  Calendar,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Info,
  DollarSign,
} from 'lucide-react';

interface LeavePolicy {
  id: string;
  name: string;
  leaveType: string;
  totalDays: number;
  carryingForward: boolean;
  carryForwardDays?: number;
  encashmentAllowed: boolean;
  minTenure: number;
  applicableFor: string[];
  createdAt: string;
}

const LEAVE_TYPES = [
  { value: 'ANNUAL', label: 'Annual Leave', icon: '🏖️' },
  { value: 'SICK', label: 'Sick Leave', icon: '🤒' },
  { value: 'CASUAL', label: 'Casual Leave', icon: '📅' },
  { value: 'MATERNITY', label: 'Maternity Leave', icon: '👶' },
  { value: 'PATERNITY', label: 'Paternity Leave', icon: '👨‍' },
  { value: 'MARRIAGE', label: 'Marriage Leave', icon: '💒' },
  { value: 'BEREAVEMENT', label: 'Bereavement Leave', icon: '🕯️' },
  { value: 'SABBATICAL', label: 'Sabbatical Leave', icon: '🎓' },
];

const EMPLOYEE_TYPES = [
  { value: 'PERMANENT', label: 'Permanent' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'PROBATION', label: 'Probation' },
  { value: 'INTERN', label: 'Intern' },
  { value: 'PART_TIME', label: 'Part-time' },
];

export default function LeavePoliciesPage() {
  const { data: session } = useSession();
  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<LeavePolicy | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLeaveType, setFilterLeaveType] = useState<string>('all');
  const [expandedPolicy, setExpandedPolicy] = useState<string | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    leaveType: 'ANNUAL',
    totalDays: 24,
    carryingForward: false,
    carryForwardDays: 10,
    encashmentAllowed: false,
    minTenure: 12,
    applicableFor: ['PERMANENT'],
  });

  // Check if user can manage policies (only ADMIN and HR_MANAGER)
  const canManagePolicies = session?.user?.role === 'ADMIN' || session?.user?.role === 'HR_MANAGER';

  useEffect(() => {
    if (session) {
      fetchPolicies();
    }
  }, [session]);

  async function fetchPolicies() {
    try {
      setLoading(true);
      const response = await fetch('/api/leave/policies');
      const result = await response.json();
      if (result.success) {
        setPolicies(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch leave policies:', error);
      setError('Failed to fetch leave policies');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const url = editingPolicy
        ? `/api/leave/policies?id=${editingPolicy.id}`
        : '/api/leave/policies';
      const method = editingPolicy ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (result.success) {
        setSuccess(editingPolicy ? 'Policy updated successfully' : 'Policy created successfully');
        setShowForm(false);
        setEditingPolicy(null);
        fetchPolicies();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Failed to save policy');
      }
    } catch (error) {
      console.error('Error saving policy:', error);
      setError('Failed to save policy');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this policy?')) return;
    try {
      const response = await fetch(`/api/leave/policies?id=${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        setSuccess('Policy deleted successfully');
        fetchPolicies();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Failed to delete policy');
      }
    } catch (error) {
      console.error('Error deleting policy:', error);
      setError('Failed to delete policy');
    }
  }

  function handleEdit(policy: LeavePolicy) {
    setEditingPolicy(policy);
    setFormData({
      name: policy.name,
      leaveType: policy.leaveType,
      totalDays: policy.totalDays,
      carryingForward: policy.carryingForward,
      carryForwardDays: policy.carryForwardDays || 10,
      encashmentAllowed: policy.encashmentAllowed,
      minTenure: policy.minTenure,
      applicableFor: policy.applicableFor,
    });
    setShowForm(true);
  }

  function resetForm() {
    setShowForm(false);
    setEditingPolicy(null);
    setFormData({
      name: '',
      leaveType: 'ANNUAL',
      totalDays: 24,
      carryingForward: false,
      carryForwardDays: 10,
      encashmentAllowed: false,
      minTenure: 12,
      applicableFor: ['PERMANENT'],
    });
    setError('');
    setSuccess('');
  }

  function toggleEmployeeType(type: string) {
    setFormData((prev) => ({
      ...prev,
      applicableFor: prev.applicableFor.includes(type)
        ? prev.applicableFor.filter((t) => t !== type)
        : [...prev.applicableFor, type],
    }));
  }

  const filteredPolicies = policies.filter((policy) => {
    const matchesSearch = policy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.leaveType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterLeaveType === 'all' || policy.leaveType === filterLeaveType;
    return matchesSearch && matchesFilter;
  });

  const getLeaveTypeIcon = (type: string) => {
    return LEAVE_TYPES.find((t) => t.value === type)?.icon || '📅';
  };

  const getLeaveTypeLabel = (type: string) => {
    return LEAVE_TYPES.find((t) => t.value === type)?.label || type;
  };

  return (
    <AppShell title="Leave Policies">
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
            <h2 className="text-2xl font-bold text-text-primary">Leave Policies</h2>
            <p className="text-text-secondary text-sm mt-1">
              Manage custom leave policies for your organization
            </p>
          </div>
          {canManagePolicies && (
            <Button onClick={() => setShowForm(true)} className="bg-keka-primary text-white">
              <Plus size={20} className="mr-2" />
              Add Policy
            </Button>
          )}
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
                  placeholder="Search policies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 h-10 border border-border-light rounded-lg bg-white text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-keka-primary/20 focus:border-keka-primary"
                />
              </div>
            </div>
            <div className="w-[200px]">
              <select
                value={filterLeaveType}
                onChange={(e) => setFilterLeaveType(e.target.value)}
                className="w-full h-10 border border-border-light rounded-lg bg-white text-text-primary px-4 focus:outline-none focus:ring-2 focus:ring-keka-primary/20 focus:border-keka-primary"
              >
                <option value="all">All Types</option>
                {LEAVE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Policy List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12 text-text-secondary">Loading policies...</div>
          ) : filteredPolicies.length === 0 ? (
            <Card className="p-12 text-center">
              <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-text-primary mb-2">No Leave Policies</h3>
              <p className="text-text-secondary mb-4">
                {searchTerm || filterLeaveType !== 'all'
                  ? 'No policies match your search criteria'
                  : 'Get started by creating your first leave policy'}
              </p>
              {!searchTerm && filterLeaveType === 'all' && canManagePolicies && (
                <Button onClick={() => setShowForm(true)} className="bg-keka-primary text-white">
                  <Plus size={20} className="mr-2" />
                  Create Policy
                </Button>
              )}
            </Card>
          ) : (
            filteredPolicies.map((policy) => (
              <div
                key={policy.id}
                className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setExpandedPolicy(expandedPolicy === policy.id ? null : policy.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="text-4xl">{getLeaveTypeIcon(policy.leaveType)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-text-primary">{policy.name}</h3>
                        <Badge variant="primary" className="bg-keka-primary-light text-keka-primary">
                          {getLeaveTypeLabel(policy.leaveType)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-text-secondary">
                        <span className="flex items-center gap-1">
                          <Calendar size={16} />
                          {policy.totalDays} days/year
                        </span>
                        {policy.carryingForward && (
                          <span className="flex items-center gap-1">
                            <CheckCircle size={16} className="text-green-600" />
                            Carry forward: {policy.carryForwardDays} days
                          </span>
                        )}
                        {policy.encashmentAllowed && (
                          <span className="flex items-center gap-1">
                            <DollarSign size={16} className="text-green-600" />
                            Encashment allowed
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock size={16} />
                          Min tenure: {policy.minTenure} months
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {canManagePolicies && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(policy);
                          }}
                          className="text-gray-600 hover:text-keka-primary"
                        >
                          <Edit size={18} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(policy.id);
                          }}
                          className="text-gray-600 hover:text-red-600"
                        >
                          <Trash2 size={18} />
                        </Button>
                      </>
                    )}
                    {expandedPolicy === policy.id ? (
                      <ChevronUp size={20} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={20} className="text-gray-400" />
                    )}
                  </div>
                </div>
                {/* Expanded Details */}
                {expandedPolicy === policy.id && (
                  <div className="mt-4 pt-4 border-t border-border-light">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-text-secondary mb-2">Applicable For</h4>
                        <div className="flex flex-wrap gap-2">
                          {policy.applicableFor.map((type) => (
                            <Badge key={type} variant="neutral" className="text-xs">
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-text-secondary mb-2">Created</h4>
                        <p className="text-sm text-text-primary">
                          {new Date(policy.createdAt).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Create/Edit Modal */}
        {showForm && canManagePolicies && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-text-primary">
                    {editingPolicy ? 'Edit Leave Policy' : 'Create Leave Policy'}
                  </h3>
                  <Button variant="ghost" size="sm" onClick={resetForm}>
                    <X size={20} />
                  </Button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Policy Name */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Policy Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Standard Annual Leave Policy"
                      className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-keka-primary/20 focus:border-keka-primary"
                    />
                  </div>
                  {/* Leave Type */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Leave Type
                    </label>
                    <select
                      value={formData.leaveType}
                      onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                      className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-keka-primary/20 focus:border-keka-primary"
                    >
                      {LEAVE_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Total Days */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Total Days per Year
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="365"
                      value={formData.totalDays}
                      onChange={(e) => setFormData({ ...formData, totalDays: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-keka-primary/20 focus:border-keka-primary"
                    />
                  </div>
                  {/* Carry Forward */}
                  <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-text-primary">Carry Forward Allowed</label>
                        <p className="text-xs text-text-secondary mt-1">
                          Allow unused leaves to be carried forward to next year
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.carryingForward}
                        onChange={(e) =>
                          setFormData({ ...formData, carryingForward: e.target.checked })
                        }
                        className="w-5 h-5 rounded border-gray-300 text-keka-primary focus:ring-keka-primary"
                      />
                    </div>
                    {formData.carryingForward && (
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                          Maximum Carry Forward Days
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={formData.totalDays}
                          value={formData.carryForwardDays}
                          onChange={(e) =>
                            setFormData({ ...formData, carryForwardDays: parseInt(e.target.value) || 0 })
                          }
                          className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-keka-primary/20 focus:border-keka-primary"
                        />
                      </div>
                    )}
                  </div>
                  {/* Encashment */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-text-primary">Encashment Allowed</label>
                        <p className="text-xs text-text-secondary mt-1">
                          Allow employees to encash unused leaves
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.encashmentAllowed}
                        onChange={(e) =>
                          setFormData({ ...formData, encashmentAllowed: e.target.checked })
                        }
                        className="w-5 h-5 rounded border-gray-300 text-keka-primary focus:ring-keka-primary"
                      />
                    </div>
                  </div>
                  {/* Minimum Tenure */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Minimum Tenure (months)
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.minTenure}
                      onChange={(e) => setFormData({ ...formData, minTenure: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-keka-primary/20 focus:border-keka-primary"
                    />
                    <p className="text-xs text-text-secondary mt-1">
                      Minimum tenure required for employees to be eligible
                    </p>
                  </div>
                  {/* Applicable For */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Applicable For
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {EMPLOYEE_TYPES.map((type) => (
                        <label
                          key={type.value}
                          className="flex items-center gap-2 p-3 border border-border-light rounded-lg cursor-pointer hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={formData.applicableFor.includes(type.value)}
                            onChange={() => toggleEmployeeType(type.value)}
                            className="w-4 h-4 rounded border-gray-300 text-keka-primary focus:ring-keka-primary"
                          />
                          <span className="text-sm text-text-primary">{type.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t">
                    <Button type="submit" className="flex-1 bg-keka-primary text-white">
                      <Save size={20} className="mr-2" />
                      {editingPolicy ? 'Update Policy' : 'Create Policy'}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      <X size={20} className="mr-2" />
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}
