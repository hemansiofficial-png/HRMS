'use client';

import { AppShell } from '@/components/layout/app-shell';
import { Users, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EmployeeForm } from '@/components/forms/employee-form';

export default function AddEmployeePage() {
  const router = useRouter();

  // const handleSuccess = () => {
  //   // Redirect back to employees list after successful creation
  //   setTimeout(() => {
  //     router.push('/employees');
  //   }, 1500);
  // };

  return (
    <AppShell title="Add Employee">
      <div className="max-w-4xl">
        {/* Back Button */}
        <Link href="/admin/employees" className="inline-flex items-center gap-2 text-sm font-medium text-keka-primary hover:underline mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Employees
        </Link>

        {/* Form Card */}
        <div className="bg-white rounded-xl border border-border-light shadow-card">
          <div className="p-6 border-b border-border-light">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-keka-primary-light text-keka-primary">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-primary">Add New Employee</h3>
                <p className="text-sm text-text-secondary mt-1">Create a new employee profile</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <EmployeeForm />
            {/* <EmployeeForm onSuccess={handleSuccess} /> */}
          </div>
        </div>
      </div>
    </AppShell>
  );
}