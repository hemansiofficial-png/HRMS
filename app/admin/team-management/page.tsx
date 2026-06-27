                                                                                                                            'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  UserCheck,
  UserX,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle,
  History,
  Shield,
  Building2,
  Mail,
} from 'lucide-react';

interface Manager {
  id: string;
  name: string;
  email: string;
  role: string;
  teamSize: number;
  departmentsManaged: { id: string; name: string }[];
}

interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  role: string;
  department: { id: string; name: string } | null;
  designation: string;
  hasManager: boolean;
  manager: { id: string; name: string; email: string } | null;
}

interface AuditLog {
  id: string;
  action: string;
  createdAt: string;
  metadata: Record<string, unknown>;
  employee: {
    employeeCode: string;
    name: string;
    email: string;
  } | null;
}

export default function TeamManagementPage() {
  const { data: session } = useSession();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [selectedManager, setSelectedManager] = useState<string>('');
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState<string>('');
  const [filterManager, setFilterManager] = useState<string>('all'); // all, without-manager, with-manager, specific-manager
  const [showAuditLogs, setShowAuditLogs] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [managersRes, employeesRes] = await Promise.all([
        fetch('/api/admin/managers?skipOrgFilter=true'),
        fetch('/api/admin/employees?skipOrgFilter=true&includeAllUsers=true'), // Get ALL users including ADMIN, MANAGER, DIRECTOR
      ]);

      if (managersRes.ok) {
        const managersData = await managersRes.json();
        setManagers(managersData.data || []);
        console.log('[Team Management] Loaded managers:', managersData.data?.length);
      }

      if (employeesRes.ok) {
        const employeesData = await employeesRes.json();
        setEmployees(employeesData.data || []);
        console.log('[Team Management] Loaded employees:', employeesData.data?.length);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      addToast({
        title: 'Error',
        message: 'Failed to load data',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/admin/team-audit-logs?limit=20');
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    }
  };

  const handleAssignManager = async () => {
    if (!selectedManager) {
      addToast({
        title: 'Validation Error',
        message: 'Please select a manager',
        type: 'error',
      });
      return;
    }

    if (selectedEmployeeIds.length === 0) {
      addToast({
        title: 'Validation Error',
        message: 'Please select at least one employee',
        type: 'error',
      });
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/admin/assign-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          managerId: selectedManager,
          employeeIds: selectedEmployeeIds,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to assign manager');
      }

      addToast({
        title: 'Success',
        message: data.message || 'Manager assigned successfully',
        type: 'success',
      });

      // Reset selection
      setSelectedManager('');
      setSelectedEmployeeIds([]);
      
      // Refresh data
      await fetchData();
    } catch (error) {
      console.error('Failed to assign manager:', error);
      addToast({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to assign manager',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveManager = async () => {
    if (selectedEmployeeIds.length === 0) {
      addToast({
        title: 'Validation Error',
        message: 'Please select at least one employee',
        type: 'error',
      });
      return;
    }

    if (!confirm(`Are you sure you want to remove manager from ${selectedEmployeeIds.length} employee(s)?`)) {
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/admin/remove-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeIds: selectedEmployeeIds,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to remove manager');
      }

      addToast({
        title: 'Success',
        message: data.message || 'Manager removed successfully',
        type: 'success',
      });

      // Reset selection
      setSelectedEmployeeIds([]);
      
      // Refresh data
      await fetchData();
    } catch (error) {
      console.error('Failed to remove manager:', error);
      addToast({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to remove manager',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const selectAllEmployees = () => {
    if (filteredEmployees.length === selectedEmployeeIds.length) {
      setSelectedEmployeeIds([]);
    } else {
      setSelectedEmployeeIds(filteredEmployees.map((e) => e.id));
    }
  };

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeCode.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDept = !filterDept || employee.department?.id === filterDept;
    
    // Filter by manager status
    let matchesManager = true;
    if (filterManager === 'without-manager') {
      matchesManager = !employee.hasManager;
    } else if (filterManager === 'with-manager') {
      matchesManager = employee.hasManager;
    } else if (filterManager.startsWith('manager-')) {
      // Filter by specific manager
      const managerId = filterManager.replace('manager-', '');
      matchesManager = employee.manager?.id === managerId;
    }

    return matchesSearch && matchesDept && matchesManager;
  });

  const departments = [...new Map(
    employees
      .filter((e) => e.department)
      .map((e) => [e.department!.id, e.department])
  ).values()].filter(Boolean) as { id: string; name: string }[];

  if (loading) {
    return (
      <AppShell title="Team Management">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-keka-purple" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Team Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
              <p className="text-gray-600 mt-1">Assign managers to employees and manage reporting structure</p>
            </div>
            <Button
              variant="outline"
              leftIcon={<History className="w-4 h-4" />}
              onClick={() => {
                fetchAuditLogs();
                setShowAuditLogs(!showAuditLogs);
              }}
            >
              Audit Logs
            </Button>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900">How to Assign a Manager</h3>
                <ol className="text-sm text-blue-800 mt-2 space-y-1 list-decimal list-inside">
                  <li>Select a manager from the dropdown above</li>
                  <li>Select one or more employees from the table (use checkboxes)</li>
                  <li>Click "Assign Manager" button to complete the assignment</li>
                </ol>
                <div className="flex items-center gap-4 mt-3 text-xs text-blue-700">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    {employees.filter(e => e.hasManager).length} with manager
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                    {employees.filter(e => !e.hasManager).length} without manager
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    {managers.length} available managers
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-keka-purple-light rounded-lg">
                <Users className="w-6 h-6 text-keka-purple" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Total Managers</p>
                <p className="text-2xl font-bold text-gray-900">{managers.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">With Manager</p>
                <p className="text-2xl font-bold text-gray-900">
                  {employees.filter((e) => e.hasManager).length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <UserX className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Without Manager</p>
                <p className="text-2xl font-bold text-gray-900">
                  {employees.filter((e) => !e.hasManager).length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Selected</p>
                <p className="text-2xl font-bold text-gray-900">{selectedEmployeeIds.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Assignment Form */}
        <Card 
          title="Assign Manager to Employees" 
          description="Select a manager and employees to assign. You can select multiple employees at once."
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Select Manager *"
                value={selectedManager}
                onChange={(e) => setSelectedManager(e.target.value)}
                options={[
                  { value: '', label: 'Choose a manager...' },
                  ...managers.map((m) => ({
                    value: m.id,
                    label: `${m.name} - ${m.teamSize > 0 ? `${m.teamSize} team members` : 'No team yet'}`,
                  })),
                ]}
                fullWidth
              />
              {selectedManager && (
                <div className="flex items-end">
                  <div className="text-sm text-gray-600">
                    <p>Selected: <strong>{managers.find(m => m.id === selectedManager)?.name}</strong></p>
                    <p className="text-xs text-gray-500">
                      {managers.find(m => m.id === selectedManager)?.email}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
              <p className="font-medium mb-2">Quick Actions:</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Select all employees without manager
                    const withoutManager = employees.filter(e => !e.hasManager).map(e => e.id);
                    setSelectedEmployeeIds(withoutManager);
                  }}
                  disabled={employees.filter(e => !e.hasManager).length === 0}
                >
                  Select All Without Manager ({employees.filter(e => !e.hasManager).length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedEmployeeIds(employees.map(e => e.id))}
                >
                  Select All ({employees.length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedEmployeeIds([])}
                >
                  Clear Selection
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant={selectedEmployeeIds.length > 0 ? 'danger' : 'outline'}
                onClick={handleRemoveManager}
                disabled={selectedEmployeeIds.length === 0 || submitting}
                leftIcon={<UserX className="w-4 h-4" />}
                size="sm"
              >
                Remove Manager from Selected ({selectedEmployeeIds.length})
              </Button>
            </div>
          </div>
        </Card>

        {/* Filters */}
        <Card>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name, email, or employee code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
                fullWidth
              />
            </div>
            <Select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              options={[
                { value: '', label: 'All Departments' },
                ...departments.map((d) => ({ value: d.id, label: d.name })),
              ]}
              className="md:w-48"
            />
            <Select
              value={filterManager}
              onChange={(e) => setFilterManager(e.target.value)}
              options={[
                { value: 'all', label: 'All Employees' },
                { value: 'without-manager', label: 'Without Manager' },
                { value: 'with-manager', label: 'With Manager' },
                // Add dynamic manager options
                ...managers.map((m) => ({
                  value: `manager-${m.id}`,
                  label: `Reports to: ${m.name}`,
                })),
              ]}
              className="md:w-48"
            />
          </div>
          <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
            <span>Showing: <strong>{filteredEmployees.length}</strong> of <strong>{employees.length}</strong> employees</span>
            {employees.filter(e => !e.hasManager).length > 0 && (
              <span className="text-orange-600">
                • {employees.filter(e => !e.hasManager).length} without manager
              </span>
            )}
          </div>
        </Card>

        {/* Employee List */}
        <Card 
          title="All Employees" 
          description={`Select employees to assign/remove manager. Showing ${filteredEmployees.length} of ${employees.length} employees.`}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4">
                    <input
                      type="checkbox"
                      checked={filteredEmployees.length > 0 && selectedEmployeeIds.length === filteredEmployees.length}
                      onChange={selectAllEmployees}
                      className="w-4 h-4 rounded border-gray-300 text-keka-purple focus:ring-keka-purple"
                    />
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Employee</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Code</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Department</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Designation</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Current Manager</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      No employees found
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((employee) => (
                    <tr
                      key={employee.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                        selectedEmployeeIds.includes(employee.id) ? 'bg-keka-purple-light/20' : ''
                      }`}
                      onClick={() => toggleEmployeeSelection(employee.id)}
                    >
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedEmployeeIds.includes(employee.id)}
                          onChange={() => toggleEmployeeSelection(employee.id)}
                          className="w-4 h-4 rounded border-gray-300 text-keka-purple focus:ring-keka-purple"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-keka-purple-light flex items-center justify-center text-keka-purple font-medium text-sm">
                            {employee.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{employee.name}</p>
                            <p className="text-xs text-gray-500">{employee.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{employee.employeeCode}</td>
                      <td className="py-3 px-4">
                        {employee.department ? (
                          <span className="inline-flex items-center gap-1.5 text-sm text-gray-700">
                            <Building2 className="w-3.5 h-3.5" />
                            {employee.department.name}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">{employee.designation}</td>
                      <td className="py-3 px-4">
                        {employee.manager ? (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-gray-700">{employee.manager.name}</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full">
                            <AlertCircle className="w-3 h-3" />
                            No Manager
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {employee.hasManager ? (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            Assigned
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                            Unassigned
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Audit Logs */}
        {showAuditLogs && (
          <Card title="Recent Activity" description="Manager assignment audit logs">
            <div className="space-y-3">
              {auditLogs.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No audit logs found</p>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className={`p-2 rounded-lg ${
                      log.action === 'MANAGER_ASSIGNED' ? 'bg-green-100 text-green-600' :
                      log.action === 'MANAGER_REMOVED' ? 'bg-red-100 text-red-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      <Shield className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{log.action.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(log.createdAt).toLocaleString()}
                      </p>
                      {log.metadata && (
                        <p className="text-xs text-gray-600 mt-1">
                          Admin: {(log.metadata as { adminName?: string }).adminName || 'Unknown'}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 sticky bottom-4 bg-white dark:bg-slate-900 p-4 rounded-lg border border-gray-200 shadow-lg">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedManager('');
              setSelectedEmployeeIds([]);
            }}
            disabled={submitting}
          >
            Reset
          </Button>
          <Button
            variant="primary"
            onClick={handleAssignManager}
            disabled={!selectedManager || selectedEmployeeIds.length === 0 || submitting}
            loading={submitting}
            leftIcon={<UserCheck className="w-4 h-4" />}
          >
            Assign Manager ({selectedEmployeeIds.length})
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
