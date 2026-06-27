'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import {
  Users,
  Search,
  LoaderCircle,
  Building2,
  UserCheck,
  Mail,
  Phone,
  Briefcase,
  MapPin,
} from 'lucide-react';

interface Employee {
  id: string;
  employeeCode: string;
  designation: string;
  status: string;
  joiningDate: string;
  phone: string;
  address: string;
  photoUrl?: string | null;
  city?: string | null;
  country?: string | null;
  state?: string | null;
  managerId?: string | null;
  department: {
    id: string;
    name: string;
    description?: string | null;
  } | null;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  manager?: {
    id: string;
    userId: string;
  } | null;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export default function EmployeesPage() {
  const { data: session } = useSession();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('all');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
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
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      (emp?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp?.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp?.designation?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterDept === 'all' || emp?.department?.name === filterDept)
  );

  const departments = [...new Set(employees.map((e) => e.department?.name).filter(Boolean))] as string[];

  if (loading) {
    return (
      <AppShell title="Organization">
        <div className="flex items-center justify-center h-screen">
          <LoaderCircle className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Organization">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Organization</h1>
            <p className="text-gray-600 mt-1">View all employees in the organization</p>
          </div>
        </div>

        {/* Summary Stats */}
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                <UserCheck className="w-6 h-6 text-green-600" />
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
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-purple-700 font-medium">Departments</p>
                <p className="text-2xl font-bold text-purple-900">{departments.length || 1}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Briefcase className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-orange-700 font-medium">Designations</p>
                <p className="text-2xl font-bold text-orange-900">
                  {new Set(employees.map((e) => e.designation)).size}
                </p>
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
              placeholder="Search by name, email, or designation..."
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
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Designation
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp, index) => (
                    <tr key={emp?.id || `emp-${index}`} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                            {emp.user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{emp.user.name}</p>
                            <p className="text-sm text-gray-500">{emp.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {emp.employeeCode}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{emp.designation}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {emp.department?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-3 h-3" />
                            {emp.user.email}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-3 h-3" />
                            {emp.phone || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-3 h-3" />
                          {[emp.city, emp.state, emp.country].filter(Boolean).join(', ') || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
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
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p>No employees found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
