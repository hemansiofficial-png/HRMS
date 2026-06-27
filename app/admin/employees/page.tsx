'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import {
  Users,
  Plus,
  Edit,
  Download,
  Search,
  LoaderCircle,
  Eye,
  Trash2,
  LogOut,
  RefreshCw,
  Key,
} from 'lucide-react';
import { useDataRefresh } from '@/hooks/use-data-refresh';
import { TerminationForm } from '@/components/resignation/termination-form';
import { AdminResetPasswordModal } from '@/components/profile/admin-reset-password-modal';
import { useRouter } from 'next/navigation';

interface Employee {
  id: string;
  employeeCode: string;
  designation: string;
  status: string;
  joiningDate: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  department: {
    id: string;
    name: string;
    description?: string;
  } | null;
}

export default function AdminEmployeesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [showTerminationForm, setShowTerminationForm] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/employees');
      if (response.ok) {
        const { data } = await response.json();
        console.log('Fetched employees:', data);
        setEmployees(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch employees:', response.statusText);
        setEmployees([]);
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEmployees();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Auto-refresh on visibility change and focus
  useDataRefresh(fetchEmployees, {
    onVisibilityChange: true,
    onFocus: true,
  });

  // Refresh when navigating back from add/edit pages
  useEffect(() => {
    const handleFocus = () => {
      fetchEmployees();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchEmployees]);

  const handleInitiateExit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowTerminationForm(true);
  };

  const handleResetPassword = (employee: Employee) => {
    setSelectedEmployee({
      ...employee,
      userId: employee.user.id,
      role: 'EMPLOYEE' // Default role for employees
    });
    setShowPasswordReset(true);
  };

  const handleExport = () => {
    if (filteredEmployees.length === 0) {
      alert('No employees to export');
      return;
    }

    const headers = ['Employee Code', 'Name', 'Email', 'Designation', 'Department', 'Join Date', 'Status'];
    const csvData = filteredEmployees.map((emp) => [
      emp.employeeCode,
      emp.user.name,
      emp.user.email,
      emp.designation,
      emp.department?.name || 'N/A',
      new Date(emp.joiningDate).toLocaleDateString(),
      emp.status,
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `employees_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTerminateSubmit = async (data: any) => {
    try {
      const response = await fetch('/api/exits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, employeeId: data.employeeId || selectedEmployee?.id })
      });

      if (response.ok) {
        alert('Exit initiated successfully');
        setShowTerminationForm(false);
        setSelectedEmployee(null);
      } else {
        const result = await response.json();
        alert(`Failed to initiate exit: ${result.error}`);
      }
    } catch (error) {
      console.error('Error initiating exit:', error);
      alert('Failed to initiate exit');
    }
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      (emp?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp?.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterDept === 'all' || emp?.department?.name === filterDept)
  );

  const departments = [...new Set(employees.map((e) => e.department?.name).filter(Boolean))] as string[];

  if (loading) {
    return (
      <AppShell title="Employee Management">
        <div className="flex items-center justify-center h-screen">
          <LoaderCircle className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Employee Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
            <p className="text-gray-600 mt-1">Manage all employees in the organization</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <a
              href="/admin/employees/add"
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" />
              Add Employee
            </a>
          </div>
        </div>

        {/* Summary Stats - Moved Above Search */}
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-700 font-medium">Total Employees</p>
                <p className="text-2xl font-bold text-blue-900">{employees.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-green-700 font-medium">Active</p>
                <p className="text-2xl font-bold text-green-900">
                  {employees.filter((e) => e.status === 'ACTIVE').length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-purple-700 font-medium">Departments</p>
                <p className="text-2xl font-bold text-purple-900">{departments.length || 1}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Search and Filter */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        {/* Employees Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Employee Code
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Designation
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Join Date
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp, index) => (
                    <tr key={emp?.id || `emp-${index}`} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {emp.employeeCode}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{emp.user.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{emp.user.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{emp.designation}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{emp.department?.name || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(emp.joiningDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            emp.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {emp.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <a
                            href={`/admin/employees/${emp.id}/view`}
                            className="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                          <a
                            href={`/admin/employees/${emp.id}/edit`}
                            className="p-2 bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleResetPassword(emp)}
                            className="p-2 bg-purple-50 text-purple-600 rounded hover:bg-purple-100 transition"
                            title="Reset Password"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleInitiateExit(emp)}
                            className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition"
                            title="Initiate Exit"
                          >
                            <LogOut className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p>No employees found</p>
                      <p className="text-sm mt-2">Add your first employee to get started</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Termination Form Modal */}
      {showTerminationForm && selectedEmployee && (
        <TerminationForm
          employee={{
            id: selectedEmployee.id,
            name: selectedEmployee.user.name,
            designation: selectedEmployee.designation,
            department: selectedEmployee.department?.name || 'N/A',
            employeeCode: selectedEmployee.employeeCode
          }}
          onClose={() => {
            setShowTerminationForm(false);
            setSelectedEmployee(null);
          }}
          onSubmit={handleTerminateSubmit}
        />
      )}

      {/* Password Reset Modal */}
      {showPasswordReset && selectedEmployee && (
        <AdminResetPasswordModal
          user={{
            id: selectedEmployee.userId || selectedEmployee.id,
            name: selectedEmployee.user?.name || selectedEmployee.name,
            email: selectedEmployee.user?.email || selectedEmployee.email,
            role: selectedEmployee.role || 'EMPLOYEE',
            employeeCode: selectedEmployee.employeeCode,
            designation: selectedEmployee.designation
          }}
          onClose={() => {
            setShowPasswordReset(false);
            setSelectedEmployee(null);
          }}
          onSuccess={() => {
            setShowPasswordReset(false);
            setSelectedEmployee(null);
          }}
        />
      )}
    </AppShell>
  );
}
