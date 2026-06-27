'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { employeeSchema } from '@/lib/validations';
import { z } from 'zod';
import { useState, useEffect } from 'react';

type EmployeeFormValues = z.infer<typeof employeeSchema>;

interface Department {
  id: string;
  name: string;
  description?: string;
}

interface EmployeeFormProps {
  onSuccess?: () => void;
}

export function EmployeeForm({ onSuccess }: EmployeeFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string; password?: string } | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);

  // Fetch departments on mount
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await fetch('/api/departments');
        if (res.ok) {
          const { data } = await res.json();
          setDepartments(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Failed to fetch departments:', error);
      } finally {
        setLoadingDepartments(false);
      }
    };
    fetchDepartments();
  }, []);

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'EMPLOYEE',
      departmentId: '',
      designation: '',
      phone: '',
      address: '',
      joiningDate: new Date().toISOString().split('T')[0],
      salary: 30000
    }
  });

  const onSubmit = async (values: EmployeeFormValues) => {
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      const json = await res.json();
      if (res.ok) {
        const generatedPassword = json.data?.generatedPassword;
        setMessage({
          type: 'success',
          text: 'Employee created successfully!',
          password: generatedPassword
        });
        form.reset({
          name: '',
          email: '',
          role: 'EMPLOYEE',
          departmentId: '',
          designation: '',
          phone: '',
          address: '',
          joiningDate: new Date().toISOString().split('T')[0],
          salary: 30000
        });
        onSuccess?.();
      } else {
        setMessage({ type: 'error', text: json.message || 'Failed to create employee' });
      }
    } catch (error) {
      console.error('Error creating employee:', error);
      setMessage({ type: 'error', text: 'An error occurred while creating employee' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-3">
      {message && (
        <div className={`rounded px-3 py-2 text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          <p className="font-medium">{message.text}</p>
          {message.password && (
            <div className="mt-2">
              <p className="text-xs mb-1">Default Password (share this with the employee):</p>
              <div className="flex items-center gap-2">
                <code className="bg-white px-3 py-1 rounded border border-green-300 font-mono text-sm">
                  {message.password}
                </code>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(message.password!)}
                  className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-green-700 mt-1">
                💡 All new employees have the default password: <strong>Pass@123</strong>
              </p>
            </div>
          )}
        </div>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="grid gap-1">
          <label className="text-xs font-medium">Full Name *</label>
          <input className="rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="John Doe" {...form.register('name')} />
          {form.formState.errors.name && <span className="text-xs text-red-500">{form.formState.errors.name.message}</span>}
        </div>
        <div className="grid gap-1">
          <label className="text-xs font-medium">Email *</label>
          <input className="rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500" type="email" placeholder="john@example.com" {...form.register('email')} />
          {form.formState.errors.email && <span className="text-xs text-red-500">{form.formState.errors.email.message}</span>}
        </div>
        <div className="grid gap-1">
          <label className="text-xs font-medium">Department *</label>
          <select 
            className="rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500" 
            {...form.register('departmentId')}
            disabled={loadingDepartments}
          >
            <option value="">Select Department</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
          {form.formState.errors.departmentId && <span className="text-xs text-red-500">{form.formState.errors.departmentId.message}</span>}
          {loadingDepartments && <span className="text-xs text-gray-500">Loading departments...</span>}
        </div>
        <div className="grid gap-1">
          <label className="text-xs font-medium">Designation *</label>
          <input className="rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Software Engineer" {...form.register('designation')} />
          {form.formState.errors.designation && <span className="text-xs text-red-500">{form.formState.errors.designation.message}</span>}
        </div>
        <div className="grid gap-1">
          <label className="text-xs font-medium">Phone *</label>
          <input className="rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="+91 9876543210" {...form.register('phone')} />
          {form.formState.errors.phone && <span className="text-xs text-red-500">{form.formState.errors.phone.message}</span>}
        </div>
        <div className="grid gap-1">
          <label className="text-xs font-medium">Address *</label>
          <input className="rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="123 Main St, City" {...form.register('address')} />
          {form.formState.errors.address && <span className="text-xs text-red-500">{form.formState.errors.address.message}</span>}
        </div>
        <div className="grid gap-1">
          <label className="text-xs font-medium">Joining Date *</label>
          <input className="rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500" type="date" {...form.register('joiningDate')} />
          {form.formState.errors.joiningDate && <span className="text-xs text-red-500">{form.formState.errors.joiningDate.message}</span>}
        </div>
        <div className="grid gap-1">
          <label className="text-xs font-medium">Salary *</label>
          <input className="rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500" type="number" step="0.01" {...form.register('salary', { valueAsNumber: true })} />
          {form.formState.errors.salary && <span className="text-xs text-red-500">{form.formState.errors.salary.message}</span>}
        </div>
      </div>
      <div className="grid gap-1">
        <label className="text-xs font-medium">Role *</label>
        <select className="rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500" {...form.register('role')}>
          <option value="EMPLOYEE">Employee</option>
          <option value="HR_MANAGER">HR Manager</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>
      <button
        className="rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        type="submit"
        disabled={submitting}
      >
        {submitting ? 'Creating...' : 'Create Employee'}
      </button>
    </form>
  );
}
