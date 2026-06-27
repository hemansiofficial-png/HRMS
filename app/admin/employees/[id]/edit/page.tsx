'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Save,
  LoaderCircle,
  AlertCircle,
  CheckCircle,
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  DollarSign,
} from 'lucide-react';

interface Employee {
  id: string;
  employeeCode: string;
  designation: string;
  status: string;
  joiningDate: string;
  phone: string;
  address: string;
  city: string | null;
  state: string | null;
  country: string | null;
  zipCode: string | null;
  salary: number;
  photoUrl: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  department: {
    id: string;
    name: string;
    description: string | null;
  } | null;
}

interface Department {
  id: string;
  name: string;
}

export default function EmployeeEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'EMPLOYEE',
    departmentId: '',
    designation: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    joiningDate: '',
    salary: 0,
    gender: '',
    dateOfBirth: '',
    status: 'ACTIVE',
  });

  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  useEffect(() => {
    if (resolvedParams) {
      fetchEmployee(resolvedParams.id);
      fetchDepartments();
    }
  }, [resolvedParams]);

  const fetchEmployee = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/employees/${id}`);
      if (response.ok) {
        const { data } = await response.json();
        setEmployee(data);
        setFormData({
          name: data.user.name || '',
          email: data.user.email || '',
          role: data.user.role || 'EMPLOYEE',
          departmentId: data.departmentId || '',
          designation: data.designation || '',
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          country: data.country || '',
          zipCode: data.zipCode || '',
          joiningDate: data.joiningDate ? new Date(data.joiningDate).toISOString().split('T')[0] : '',
          salary: data.salary || 0,
          gender: data.gender || '',
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : '',
          status: data.status || 'ACTIVE',
        });
      } else {
        setMessage({ type: 'error', text: 'Failed to load employee details' });
      }
    } catch (error) {
      console.error('Failed to fetch employee:', error);
      setMessage({ type: 'error', text: 'Failed to load employee details' });
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (response.ok) {
        const { data } = await response.json();
        setDepartments(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/employees/${resolvedParams?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const json = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Employee updated successfully!' });
        setTimeout(() => {
          router.push(`/admin/employees/${resolvedParams?.id}/view`);
        }, 1500);
      } else {
        setMessage({ type: 'error', text: json.message || 'Failed to update employee' });
      }
    } catch (error) {
      console.error('Failed to update employee:', error);
      setMessage({ type: 'error', text: 'Failed to update employee' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      ACTIVE: 'success' as const,
      INACTIVE: 'neutral' as const,
      PROBATION: 'warning' as const,
      RESIGNED: 'danger' as const,
      CONTRACT: 'info' as const,
    };
    return <Badge variant={variants[status as keyof typeof variants] || 'neutral'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <AppShell title="Edit Employee">
        <div className="flex items-center justify-center h-screen">
          <LoaderCircle className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </AppShell>
    );
  }

  if (!employee) {
    return (
      <AppShell title="Edit Employee">
        <Card className="p-12 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Employee Not Found</h2>
          <p className="text-gray-600 mb-6">The requested employee could not be found.</p>
          <button
            onClick={() => router.push('/admin/employees')}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Employees
          </button>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell title="Edit Employee">
      <div className="space-y-6">
        {/* Redesigned Header - Clean White Background */}
        <div className="bg-white dark:bg-slate-900 -mx-6 -mt-6 px-6 py-6 rounded-b-2xl border-b border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/admin/employees/${employee.id}/view`)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition text-gray-600 dark:text-gray-400"
                title="Back to Employee Details"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Edit Employee</h1>
                  {getStatusBadge(employee.status)}
                </div>
                <p className="text-gray-600 dark:text-gray-400 flex items-center gap-4 text-sm">
                  <span className="font-medium">{employee.employeeCode}</span>
                  <span>•</span>
                  <span>{employee.user.name}</span>
                  <span>•</span>
                  <span>{employee.designation}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/admin/employees')}
                className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg transition text-sm font-medium"
              >
                <X className="w-4 h-4" />
                Back to List
              </button>
              <button
                onClick={() => router.push(`/admin/employees/${employee.id}/view`)}
                className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                View Details
              </button>
            </div>
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <Card className={`p-4 flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-3">
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <p className="font-medium">{message.text}</p>
            </div>
            <button
              onClick={() => setMessage(null)}
              className="p-1 hover:bg-black/10 rounded transition"
            >
              <X className="w-4 h-4" />
            </button>
          </Card>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Card>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b">
              <User className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Personal Information</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-1">
                <label className="text-xs font-medium text-gray-700">Full Name *</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="rounded border px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
              </div>
              <div className="grid gap-1">
                <label className="text-xs font-medium text-gray-700">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="rounded border pl-10 pr-3 py-2.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    required
                  />
                </div>
              </div>
              <div className="grid gap-1">
                <label className="text-xs font-medium text-gray-700">Phone *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="rounded border pl-10 pr-3 py-2.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    required
                  />
                </div>
              </div>
              <div className="grid gap-1">
                <label className="text-xs font-medium text-gray-700">Date of Birth</label>
                <input
                  name="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="rounded border px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              <div className="grid gap-1">
                <label className="text-xs font-medium text-gray-700">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="rounded border px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                >
                  <option value="">Select...</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="grid gap-1">
                <label className="text-xs font-medium text-gray-700">Role *</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="rounded border px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="HR_MANAGER">HR Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Address Information */}
          <Card>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b">
              <MapPin className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Address Information</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-1 md:col-span-2">
                <label className="text-xs font-medium text-gray-700">Address *</label>
                <input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="rounded border px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
              </div>
              <div className="grid gap-1">
                <label className="text-xs font-medium text-gray-700">City</label>
                <input
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="rounded border px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              <div className="grid gap-1">
                <label className="text-xs font-medium text-gray-700">State</label>
                <input
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="rounded border px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              <div className="grid gap-1">
                <label className="text-xs font-medium text-gray-700">ZIP Code</label>
                <input
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  className="rounded border px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              <div className="grid gap-1">
                <label className="text-xs font-medium text-gray-700">Country</label>
                <input
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="rounded border px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>
          </Card>

          {/* Employment Information */}
          <Card>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b">
              <Briefcase className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Employment Information</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-1">
                <label className="text-xs font-medium text-gray-700">Department *</label>
                <select
                  name="departmentId"
                  value={formData.departmentId}
                  onChange={handleChange}
                  className="rounded border px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                >
                  <option value="">Select Department...</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1">
                <label className="text-xs font-medium text-gray-700">Designation *</label>
                <input
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  className="rounded border px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
              </div>
              <div className="grid gap-1">
                <label className="text-xs font-medium text-gray-700">Joining Date *</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    name="joiningDate"
                    type="date"
                    value={formData.joiningDate}
                    onChange={handleChange}
                    className="rounded border pl-10 pr-3 py-2.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    required
                  />
                </div>
              </div>
              <div className="grid gap-1">
                <label className="text-xs font-medium text-gray-700">Salary *</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    name="salary"
                    type="number"
                    step="0.01"
                    value={formData.salary}
                    onChange={handleChange}
                    className="rounded border pl-10 pr-3 py-2.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    required
                  />
                </div>
              </div>
              <div className="grid gap-1">
                <label className="text-xs font-medium text-gray-700">Status *</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="rounded border px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="PROBATION">Probation</option>
                  <option value="RESIGNED">Resigned</option>
                  <option value="CONTRACT">Contract</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Action Buttons - Fixed at bottom */}
          <div className="sticky bottom-0 bg-white dark:bg-slate-900 py-4 border-t flex justify-between items-center gap-4">
            <button
              type="button"
              onClick={() => router.push(`/admin/employees/${employee.id}/view`)}
              className="flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-200 transition font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 text-white px-8 py-2.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg shadow-blue-600/30"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
