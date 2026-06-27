'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Copy, 
  Clock, 
  Users,
  CheckCircle,
  XCircle,
  ChevronDown,
  Building2,
  User,
  Briefcase
} from 'lucide-react';

// Policy types configuration
const POLICY_TYPES = [
  { id: 'payroll', name: 'Payroll Policy', icon: '💰', color: 'blue' },
  { id: 'tax', name: 'Tax Policy', icon: '📊', color: 'green' },
  { id: 'overtime', name: 'Overtime Policy', icon: '⏰', color: 'orange' },
  { id: 'bonus', name: 'Bonus Policy', icon: '🎁', color: 'purple' },
  { id: 'incentive', name: 'Incentive Policy', icon: '🏆', color: 'pink' },
  { id: 'attendance', name: 'Attendance Policy', icon: '📅', color: 'red' },
  { id: 'reimbursement', name: 'Reimbursement Policy', icon: '💳', color: 'indigo' },
  { id: 'statutory', name: 'Gratuity/PF/ESI', icon: '🏛️', color: 'cyan' },
  { id: 'salary-structure', name: 'Salary Templates', icon: '📋', color: 'teal' },
  { id: 'compliance', name: 'Compliance Policy', icon: '⚖️', color: 'amber' },
  { id: 'leave', name: 'Leave Policy', icon: '🏖️', color: 'emerald' },
];

interface Policy {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  effectiveFrom: string;
  effectiveTo?: string;
  [key: string]: any;
}

export default function PolicyManagementPage() {
  const router = useRouter();
  const [selectedPolicyType, setSelectedPolicyType] = useState<string>('all');
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Fetch policies
  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const endpoints = selectedPolicyType === 'all' 
        ? POLICY_TYPES.filter(t => t.id !== 'leave').map(t => `/api/policies/${t.id}`)
        : [`/api/policies/${selectedPolicyType}`];

      const responses = await Promise.all(endpoints.map(url => fetch(url)));
      const results = await Promise.all(responses.map(r => r.json()));
      
      const allPolicies = results.flatMap((result, index) => {
        const policyType = selectedPolicyType === 'all' ? POLICY_TYPES[index].id : selectedPolicyType;
        if (result.success) {
          if (policyType === 'statutory') {
            // Statutory returns multiple policy types
            return [
              ...(result.data.gratuity || []).map((p: any) => ({ ...p, policyType: 'gratuity' })),
              ...(result.data.pf || []).map((p: any) => ({ ...p, policyType: 'pf' })),
              ...(result.data.esi || []).map((p: any) => ({ ...p, policyType: 'esi' })),
            ];
          }
          return Array.isArray(result.data) 
            ? result.data.map((p: any) => ({ ...p, policyType }))
            : [result.data];
        }
        return [];
      });

      setPolicies(allPolicies);
    } catch (error) {
      console.error('Error fetching policies:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, [selectedPolicyType]);

  // Filter policies
  const filteredPolicies = policies.filter(policy =>
    policy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    policy.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get policy type config
  const getPolicyTypeConfig = (typeId: string) => {
    return POLICY_TYPES.find(t => t.id === typeId) || { name: typeId, icon: '📄', color: 'gray' };
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Policy Management
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Manage all organizational policies, rules, and configurations
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Policy
            </button>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white dark:bg-gray-700 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FileText className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 truncate">
                        Total Policies
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-white">
                        {policies.length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-700 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-6 w-6 text-green-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 truncate">
                        Active Policies
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-white">
                        {policies.filter(p => p.isActive).length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-700 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <XCircle className="h-6 w-6 text-red-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 truncate">
                        Inactive Policies
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-white">
                        {policies.filter(p => !p.isActive).length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-700 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 truncate">
                        Policy Types
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-white">
                        {POLICY_TYPES.length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
          <div className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search policies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    value={selectedPolicyType}
                    onChange={(e) => setSelectedPolicyType(e.target.value)}
                    className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm appearance-none"
                  >
                    <option value="all">All Policy Types</option>
                    {POLICY_TYPES.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Policy Type Quick Select */}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedPolicyType('all')}
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedPolicyType === 'all'
                    ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                All
              </button>
              {POLICY_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedPolicyType(type.id)}
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selectedPolicyType === type.id
                      ? `bg-${type.color}-100 text-${type.color}-800 dark:bg-${type.color}-900 dark:text-${type.color}-200`
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <span className="mr-1">{type.icon}</span>
                  {type.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Policy List */}
        {loading ? (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">Loading policies...</p>
          </div>
        ) : filteredPolicies.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No policies found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating a new policy.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Policy
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredPolicies.map((policy) => {
                const config = getPolicyTypeConfig(policy.policyType);
                return (
                  <li key={policy.id}>
                    <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center min-w-0 flex-1">
                          <div className="flex-shrink-0 text-2xl mr-3">
                            {config.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 truncate">
                                {policy.name}
                              </p>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                policy.isActive
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                              }`}>
                                {policy.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                              {policy.description || 'No description'}
                            </p>
                            <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                Created: {new Date(policy.createdAt).toLocaleDateString()}
                              </span>
                              <span className="flex items-center">
                                <Users className="h-3 w-3 mr-1" />
                                Effective: {new Date(policy.effectiveFrom).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="ml-4 flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedPolicy(policy);
                              setShowViewModal(true);
                            }}
                            className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                          >
                            <span className="sr-only">View</span>
                            <FileText className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedPolicy(policy);
                              setShowAssignModal(true);
                            }}
                            className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                          >
                            <span className="sr-only">Assign</span>
                            <Users className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => {
                              // Navigate to edit page
                              router.push(`/admin/policies/${policy.policyType}/${policy.id}/edit`);
                            }}
                            className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                          >
                            <span className="sr-only">Edit</span>
                            <Edit className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Create Policy Modal */}
      {showCreateModal && (
        <CreatePolicyModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchPolicies();
          }}
        />
      )}

      {/* View Policy Modal */}
      {showViewModal && selectedPolicy && (
        <ViewPolicyModal
          policy={selectedPolicy}
          onClose={() => setShowViewModal(false)}
        />
      )}

      {/* Assign Policy Modal */}
      {showAssignModal && selectedPolicy && (
        <AssignPolicyModal
          policy={selectedPolicy}
          onClose={() => setShowAssignModal(false)}
          onSuccess={() => {
            setShowAssignModal(false);
            fetchPolicies();
          }}
        />
      )}
    </div>
  );
}

// Create Policy Modal Component
function CreatePolicyModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [selectedType, setSelectedType] = useState(POLICY_TYPES[0].id);
  const router = useRouter();

  const handleCreate = () => {
    router.push(`/admin/policies/${selectedType}/new`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Create New Policy</h3>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Select the type of policy you want to create:
          </p>
          <div className="grid grid-cols-2 gap-4">
            {POLICY_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`p-4 border rounded-lg text-left transition-all ${
                  selectedType === type.id
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <span className="text-2xl mb-2 block">{type.icon}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{type.name}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

// View Policy Modal Component
function ViewPolicyModal({ policy, onClose }: { policy: Policy; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Policy Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <XCircle className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Policy Name</label>
              <p className="mt-1 text-lg font-medium text-gray-900 dark:text-white">{policy.name}</p>
            </div>
            {policy.description && (
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</label>
                <p className="mt-1 text-gray-900 dark:text-white">{policy.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                <p className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    policy.isActive
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {policy.isActive ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</label>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {new Date(policy.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Effective From</label>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {new Date(policy.effectiveFrom).toLocaleDateString()}
                </p>
              </div>
              {policy.effectiveTo && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Effective To</label>
                  <p className="mt-1 text-gray-900 dark:text-white">
                    {new Date(policy.effectiveTo).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
            {/* Policy Data */}
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Policy Configuration</label>
              <pre className="mt-1 p-4 bg-gray-50 dark:bg-gray-900 rounded-md overflow-x-auto text-xs text-gray-900 dark:text-gray-100">
                {JSON.stringify(policy, (key, value) => {
                  if (['id', 'createdAt', 'updatedAt', 'effectiveFrom', 'effectiveTo', 'isActive', 'name', 'description', 'policyType'].includes(key)) {
                    return undefined;
                  }
                  return value;
                }, 2)}
              </pre>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Assign Policy Modal Component
function AssignPolicyModal({ policy, onClose, onSuccess }: { policy: Policy; onClose: () => void; onSuccess: () => void }) {
  const [entityType, setEntityType] = useState('DEPARTMENT');
  const [entityId, setEntityId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/policies/assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          policyType: `${policy.policyType || 'PAYROLL'}_POLICY`.toUpperCase(),
          policyId: policy.id,
          entityType,
          entityId,
        }),
      });

      const result = await response.json();
      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || 'Failed to assign policy');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Assign Policy</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{policy.name}</p>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Assign To
            </label>
            <select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
            >
              <option value="DEPARTMENT">Department</option>
              <option value="EMPLOYEE">Employee</option>
              <option value="ROLE">Role</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {entityType === 'DEPARTMENT' ? 'Department ID' : entityType === 'EMPLOYEE' ? 'Employee ID' : 'Role'}
            </label>
            <input
              type="text"
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
              required
              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
              placeholder={`Enter ${entityType.toLowerCase()} ID`}
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Assigning...' : 'Assign Policy'}
          </button>
        </div>
      </form>
    </div>
  );
}
