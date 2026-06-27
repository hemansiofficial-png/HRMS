'use client';

import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Input, Select, TextArea } from '@/components/ui/input';
import { Building2, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AddDepartmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    managerId: '',
    budget: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          managerId: formData.managerId || null,
          budget: formData.budget ? parseFloat(formData.budget) : null,
        }),
      });
      if (response.ok) {
        alert('Department created successfully!');
        router.push('/departments');
      } else {
        const error = await response.json();
        alert(`Failed to create department: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating department:', error);
      alert('Failed to create department. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <AppShell title="Add Department">
      <div className="max-w-2xl">
        {/* Back Button */}
        <Link href="/departments" className="inline-flex items-center gap-2 text-sm font-medium text-keka-primary hover:underline mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Departments
        </Link>

        {/* Form Card */}
        <div className="bg-white rounded-xl border border-border-light shadow-card">
          <div className="p-6 border-b border-border-light">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-keka-primary-light text-keka-primary">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-primary">Create New Department</h3>
                <p className="text-sm text-text-secondary mt-1">Add a new department to your organization</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-5">
              <Input
                label="Department Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Human Resources"
                fullWidth
                required
              />

              <TextArea
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter department description..."
                fullWidth
                rows={4}
              />

              <Input
                label="Head of Department (Optional)"
                name="managerId"
                value={formData.managerId}
                onChange={handleChange}
                placeholder="Select department head (Employee ID)"
                fullWidth
              />

              <Input
                label="Budget (Optional)"
                name="budget"
                type="number"
                value={formData.budget}
                onChange={handleChange}
                placeholder="0.00"
                fullWidth
                step="0.01"
              />
            </div>

            <div className="p-6 border-t border-border-light bg-bg-body flex items-center justify-end gap-3">
              <Link href="/departments">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button variant="primary" type="submit" loading={loading}>
                {loading ? 'Creating...' : 'Create Department'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}