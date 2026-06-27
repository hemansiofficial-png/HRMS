'use client';

import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Plus, Search, MoreVertical, Edit, Trash2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Department {
  id: string;
  name: string;
  description?: string | null;
  manager?: {
    id: string;
    name: string;
    email: string;
  } | null;
  employees?: any[];
  _count?: {
    employees: number;
  };
}

export default function DepartmentsPage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/departments');
      if (response.ok) {
        const { data } = await response.json();
        setDepartments(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDepartments();
    setRefreshing(false);
  };

  // Auto-refresh when returning to this page
  useEffect(() => {
    const handleFocus = () => {
      fetchDepartments();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete department "${name}"? This action cannot be undone.`)) return;
    try {
      const response = await fetch(`/api/departments/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        alert('Department deleted successfully!');
        fetchDepartments();
      } else {
        alert('Failed to delete department');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error deleting department');
    }
  };

  const filteredDepartments = departments.filter(
    (dept) =>
      dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (dept.description && dept.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalEmployees = departments.reduce((sum, d) => sum + (d._count?.employees || d.employees?.length || 0), 0);

  if (loading) {
    return (
      <AppShell title="Departments">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="h-8 w-8 border-2 border-keka-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading departments...</p>
          </div>
        </div>
      </AppShell>
    );
  }  return (
    <AppShell title="Departments">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 h-10 text-sm border border-border-light rounded-lg bg-white text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-keka-primary/20 focus:border-keka-primary"
            />
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
            <Link href="/admin/departments/add">
              <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
                Add Department
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <StatsCard label="Total Departments" value={departments.length} />
          <StatsCard label="Total Employees" value={totalEmployees} />
          <StatsCard label="Active Departments" value={departments.length} />
          <StatsCard label="Avg Employees/Dept" value={departments.length > 0 ? Math.round(totalEmployees / departments.length) : 0} />
        </div>

        {/* Departments Table */}
        <div className="bg-white rounded-xl border border-border-light shadow-card overflow-hidden">
          <div className="p-5 border-b border-border-light">
            <h3 className="text-base font-bold text-text-primary">All Departments</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-bg-body">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-bold text-text-muted uppercase">Department</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-text-muted uppercase">Head</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-text-muted uppercase">Employees</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-text-muted uppercase">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-text-muted uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDepartments.length > 0 ? (
                  filteredDepartments.map((dept) => (
                    <tr key={dept.id} className="border-t border-border-light hover:bg-keka-primary-light/30">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-keka-primary-light text-keka-primary">
                            <Building2 className="h-5 w-5" />
                          </div>
                          <div>
                            <span className="font-semibold text-text-primary">{dept.name}</span>
                            {dept.description && (
                              <p className="text-xs text-text-secondary mt-0.5">{dept.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {dept.manager ? (
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-keka-primary to-keka-primary-dark flex items-center justify-center text-white text-xs font-bold">
                              {dept.manager.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <span className="text-sm text-text-primary">{dept.manager.name}</span>
                              <p className="text-xs text-text-secondary">{dept.manager.email}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-text-secondary">No manager assigned</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-semibold text-text-primary">
                          {dept._count?.employees || dept.employees?.length || 0}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="success" size="sm">Active</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <button className="p-1.5 rounded-lg hover:bg-gray-100 text-blue-600">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(dept.id, dept.name)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-600">
                      {searchTerm ? 'No departments found matching your search' : 'No departments found. Click "Add Department" to create one.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function StatsCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl border border-border-light shadow-card p-5">
      <p className="text-xs font-bold text-text-muted uppercase">{label}</p>
      <p className="text-2xl font-bold text-text-primary mt-2">{value}</p>
    </div>
  );
}