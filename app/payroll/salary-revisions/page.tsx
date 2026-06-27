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
  TrendingUp,
  DollarSign,
  Calendar,
  User,
  Info,
  CheckCircle,
  X,
  Save,
  Percent,
  FileText,
} from 'lucide-react';

interface SalaryRevision {
  id: string;
  employee: {
    id: string;
    employeeCode: string;
    user: { name: string; email: string };
    department: { name: string };
    designation: string;
  };
  revisionType: string;
  revisionDate: string;
  previousSalary: number;
  newSalary: number;
  revisionAmount: number;
  revisionPercentage: number;
  reason?: string;
  effectiveFrom: string;
  remarks?: string;
  createdAt: string;
}

interface Employee {
  id: string;
  employeeCode: string;
  designation: string;
  salary: number;
  user: { name: string; email: string };
  department: { name: string };
}

const REVISION_TYPES = [
  { value: 'ANNUAL_HIKE', label: 'Annual Hike', icon: '📈' },
  { value: 'PROMOTION', label: 'Promotion', icon: '🎯' },
  { value: 'MARKET_ADJUSTMENT', label: 'Market Adjustment', icon: '⚖️' },
  { value: 'PERFORMANCE_BONUS', label: 'Performance Bonus', icon: '🏆' },
  { value: 'OFF_CYCLE', label: 'Off-Cycle', icon: '🔄' },
  { value: 'CORRECTION', label: 'Correction', icon: '✏️' },
];

export default function SalaryRevisionsPage() {
  const { data: session } = useSession();
  const [revisions, setRevisions] = useState<SalaryRevision[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    employeeId: '',
    revisionType: 'ANNUAL_HIKE',
    revisionDate: new Date().toISOString().split('T')[0],
    previousSalary: 0,
    newSalary: 0,
    reason: '',
    effectiveFrom: new Date().toISOString().split('T')[0],
    remarks: '',
  });

  useEffect(() => {
    if (session) {
      fetchRevisions();
      fetchEmployees();
    }
  }, [session]);

  async function fetchRevisions() {
    try {
      setLoading(true);
      const response = await fetch('/api/payroll/salary-revision');
      const result = await response.json();
      if (result.success) {
        setRevisions(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch salary revisions:', error);
      setError('Failed to fetch salary revisions');
    } finally {
      setLoading(false);
    }
  }

  async function fetchEmployees() {
    try {
      const response = await fetch('/api/employees');
      const result = await response.json();
      if (result.success) {
        setEmployees(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.employeeId) {
      setError('Please select an employee');
      return;
    }

    if (formData.newSalary <= formData.previousSalary) {
      setError('New salary must be greater than previous salary');
      return;
    }

    try {
      const response = await fetch('/api/payroll/salary-revision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Salary revision created successfully');
        setShowForm(false);
        fetchRevisions();
        setTimeout(() => setSuccess(''), 3000);
        resetForm();
      } else {
        setError(result.error || 'Failed to create salary revision');
      }
    } catch (error) {
      console.error('Error creating salary revision:', error);
      setError('Failed to create salary revision');
    }
  }

  function resetForm() {
    setFormData({
      employeeId: '',
      revisionType: 'ANNUAL_HIKE',
      revisionDate: new Date().toISOString().split('T')[0],
      previousSalary: 0,
      newSalary: 0,
      reason: '',
      effectiveFrom: new Date().toISOString().split('T')[0],
      remarks: '',
    });
    setShowForm(false);
    setError('');
    setSuccess('');
  }

  const handleEmployeeChange = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    setFormData({
      ...formData,
      employeeId,
      previousSalary: employee ? employee.salary : 0,
      newSalary: employee ? employee.salary : 0,
    });
  };

  const calculateIncrease = () => {
    return formData.newSalary - formData.previousSalary;
  };

  const calculatePercentage = () => {
    if (formData.previousSalary === 0) return 0;
    return ((formData.newSalary - formData.previousSalary) / formData.previousSalary) * 100;
  };

  const filteredRevisions = revisions.filter((revision) => {
    return (
      revision.employee.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      revision.employee.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      revision.revisionType.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const getRevisionTypeIcon = (type: string) => {
    return REVISION_TYPES.find(t => t.value === type)?.icon || '📈';
  };

  const getRevisionTypeLabel = (type: string) => {
    return REVISION_TYPES.find(t => t.value === type)?.label || type;
  };

  const selectedEmployee = employees.find(e => e.id === formData.employeeId);

  return (
    <AppShell title="Salary Revisions">
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
            <h2 className="text-2xl font-bold text-text-primary">Salary Revisions</h2>
            <p className="text-text-secondary text-sm mt-1">
              Manage employee salary revisions and hikes
            </p>
          </div>
          <Button onClick={() => setShowForm(true)} className="bg-keka-primary text-white">
            <Plus size={20} className="mr-2" />
            New Revision
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Total Revisions</p>
                <p className="text-2xl font-bold text-text-primary">{revisions.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Total Increase</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(revisions.reduce((sum, r) => sum + r.revisionAmount, 0))}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Percent size={24} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Avg. Hike %</p>
                <p className="text-2xl font-bold text-purple-600">
                  {revisions.length > 0 
                    ? `${(revisions.reduce((sum, r) => sum + r.revisionPercentage, 0) / revisions.length).toFixed(1)}%`
                    : '0%'
                  }
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search */}
        <Card className="p-4">
          <div className="relative max-w-md">
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
        </Card>

        {/* Revisions List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12 text-text-secondary">Loading revisions...</div>
          ) : filteredRevisions.length === 0 ? (
            <Card className="p-12 text-center">
              <TrendingUp size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-text-primary mb-2">No Salary Revisions</h3>
              <p className="text-text-secondary mb-4">
                {searchTerm ? 'No revisions match your search' : 'Get started by creating your first salary revision'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowForm(true)} className="bg-keka-primary text-white">
                  <Plus size={20} className="mr-2" />
                  Create Revision
                </Button>
              )}
            </Card>
          ) : (
            filteredRevisions.map((revision) => (
              <Card key={revision.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full bg-keka-primary-light flex items-center justify-center text-keka-primary font-semibold">
                      {revision.employee.user.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-text-primary">
                          {revision.employee.user.name}
                        </h3>
                        <Badge variant="neutral" className="text-xs">
                          {getRevisionTypeIcon(revision.revisionType)} {getRevisionTypeLabel(revision.revisionType)}
                        </Badge>
                        <Badge variant="neutral" className="text-xs">
                          {revision.employee.employeeCode}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-text-secondary mb-2">
                        <span>{revision.employee.designation}</span>
                        <span>•</span>
                        <span>{revision.employee.department.name}</span>
                      </div>
                      <div className="flex items-center gap-6">
                        <div>
                          <p className="text-xs text-text-secondary">Previous Salary</p>
                          <p className="text-sm font-medium text-text-secondary line-through">
                            {formatCurrency(revision.previousSalary)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-text-secondary">New Salary</p>
                          <p className="text-sm font-bold text-green-600">
                            {formatCurrency(revision.newSalary)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-text-secondary">Increase</p>
                          <p className="text-sm font-bold text-green-600">
                            +{formatCurrency(revision.revisionAmount)} ({revision.revisionPercentage.toFixed(1)}%)
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text-secondary mb-1">Effective From</p>
                    <p className="text-sm font-medium text-text-primary">
                      {formatDate(revision.effectiveFrom)}
                    </p>
                  </div>
                </div>

                {(revision.reason || revision.remarks) && (
                  <div className="mt-3 pt-3 border-t border-border-light">
                    {revision.reason && (
                      <p className="text-sm text-text-secondary">
                        <strong>Reason:</strong> {revision.reason}
                      </p>
                    )}
                    {revision.remarks && (
                      <p className="text-sm text-text-secondary">
                        <strong>Remarks:</strong> {revision.remarks}
                      </p>
                    )}
                  </div>
                )}
              </Card>
            ))
          )}
        </div>

        {/* Create Revision Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-text-primary">New Salary Revision</h3>
                  <Button variant="ghost" size="sm" onClick={() => resetForm()}>
                    <X size={20} />
                  </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Employee Selection */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Employee <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.employeeId}
                      onChange={(e) => handleEmployeeChange(e.target.value)}
                      className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-keka-primary/20 focus:border-keka-primary"
                      required
                    >
                      <option value="">Select Employee</option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.user.name} ({employee.employeeCode}) - {formatCurrency(employee.salary)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Current Salary Display */}
                  {selectedEmployee && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User size={20} className="text-blue-600" />
                          <span className="font-medium text-blue-900">{selectedEmployee.user.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-blue-700">Current Salary</p>
                          <p className="text-lg font-bold text-blue-900">
                            {formatCurrency(selectedEmployee.salary)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Revision Type */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Revision Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.revisionType}
                      onChange={(e) => setFormData({ ...formData, revisionType: e.target.value })}
                      className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-keka-primary/20 focus:border-keka-primary"
                    >
                      {REVISION_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Salary Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Previous Salary (₹)
                      </label>
                      <input
                        type="number"
                        value={formData.previousSalary}
                        onChange={(e) => setFormData({ ...formData, previousSalary: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-keka-primary/20 focus:border-keka-primary"
                        readOnly
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        New Salary (₹) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min={formData.previousSalary + 1}
                        value={formData.newSalary}
                        onChange={(e) => setFormData({ ...formData, newSalary: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-keka-primary/20 focus:border-keka-primary"
                      />
                    </div>
                  </div>

                  {/* Increase Summary */}
                  {formData.newSalary > formData.previousSalary && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TrendingUp size={20} className="text-green-600" />
                          <span className="font-medium text-green-900">Salary Increase</span>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-700">
                            +{formatCurrency(calculateIncrease())}
                          </p>
                          <p className="text-sm text-green-600">
                            +{calculatePercentage().toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Revision Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.revisionDate}
                        onChange={(e) => setFormData({ ...formData, revisionDate: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-keka-primary/20 focus:border-keka-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Effective From <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.effectiveFrom}
                        onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
                        min={formData.revisionDate || new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-keka-primary/20 focus:border-keka-primary"
                      />
                    </div>
                  </div>

                  {/* Reason */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Reason
                    </label>
                    <textarea
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      placeholder="Brief reason for this salary revision..."
                      rows={3}
                      className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-keka-primary/20 focus:border-keka-primary"
                    />
                  </div>

                  {/* Remarks */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Remarks
                    </label>
                    <textarea
                      value={formData.remarks}
                      onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                      placeholder="Additional remarks or notes..."
                      rows={2}
                      className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-keka-primary/20 focus:border-keka-primary"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t">
                    <Button type="submit" className="flex-1 bg-keka-primary text-white">
                      <Save size={20} className="mr-2" />
                      Create Revision
                    </Button>
                    <Button type="button" variant="outline" onClick={() => resetForm()}>
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
