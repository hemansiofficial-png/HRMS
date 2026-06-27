'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Save,
  X,
  Calendar,
  Star,
  Globe,
  Building,
  Info,
  CheckCircle,
  Lock,
} from 'lucide-react';

interface Holiday {
  id: string;
  name: string;
  date: string;
  description?: string;
  isNational: boolean;
  createdAt: string;
}

// Allowed roles for holiday management
const ALLOWED_ROLES = ['ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'];

export default function HolidaysPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [filterType, setFilterType] = useState<string>('all');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    date: '',
    description: '',
    isNational: false,
  });

  // Fetch holidays function
  const fetchHolidays = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/holidays');
      const result = await response.json();
      if (result.success) {
        setHolidays(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch holidays:', error);
      setError('Failed to fetch holidays');
    } finally {
      setLoading(false);
    }
  }, []);

  // Check user role authorization and fetch data
  useEffect(() => {
    if (session?.user?.role) {
      if (ALLOWED_ROLES.includes(session.user.role)) {
        setIsAuthorized(true);
        fetchHolidays();
      } else {
        setIsAuthorized(false);
        // Redirect unauthorized users after a short delay
        const timer = setTimeout(() => {
          router.push('/leave');
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [session, router, fetchHolidays]);

  // If session exists and user is not authorized, show access denied
  if (session && !isAuthorized) {
    return (
      <AppShell title="Holiday Calendar">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="p-12 max-w-md">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <Lock className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
                <p className="text-gray-600 mb-4">
                  You don't have permission to access the Holiday Management page.
                  This feature is only available for HR and Admin users.
                </p>
                <p className="text-sm text-gray-500">
                  Redirecting to Leave page...
                </p>
              </div>
              <Button
                onClick={() => router.push('/leave')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
              >
                Go to Leave Page
              </Button>
            </div>
          </Card>
        </div>
      </AppShell>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const url = editingHoliday
        ? `/api/holidays?id=${editingHoliday.id}`
        : '/api/holidays';
      const method = editingHoliday ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(editingHoliday ? 'Holiday updated successfully' : 'Holiday created successfully');
        setShowForm(false);
        setEditingHoliday(null);
        fetchHolidays();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Failed to save holiday');
      }
    } catch (error) {
      console.error('Error saving holiday:', error);
      setError('Failed to save holiday');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this holiday?')) return;

    try {
      const response = await fetch(`/api/holidays?id=${id}`, { method: 'DELETE' });
      const result = await response.json();

      if (result.success) {
        setSuccess('Holiday deleted successfully');
        fetchHolidays();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Failed to delete holiday');
      }
    } catch (error) {
      console.error('Error deleting holiday:', error);
      setError('Failed to delete holiday');
    }
  }

  function handleEdit(holiday: Holiday) {
    setEditingHoliday(holiday);
    setFormData({
      name: holiday.name,
      date: holiday.date.split('T')[0],
      description: holiday.description || '',
      isNational: holiday.isNational,
    });
    setShowForm(true);
  }

  function resetForm() {
    setShowForm(false);
    setEditingHoliday(null);
    setFormData({
      name: '',
      date: '',
      description: '',
      isNational: false,
    });
    setError('');
    setSuccess('');
  }

  const filteredHolidays = holidays.filter((holiday) => {
    const holidayYear = new Date(holiday.date).getFullYear().toString();
    const matchesSearch = holiday.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesYear = filterYear === 'all' || holidayYear === filterYear;
    const matchesType = filterType === 'all' || 
      (filterType === 'national' && holiday.isNational) ||
      (filterType === 'organization' && !holiday.isNational);
    return matchesSearch && matchesYear && matchesType;
  });

  const getUniqueYears = () => {
    const years = new Set(holidays.map(h => new Date(h.date).getFullYear().toString()));
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <AppShell title="Holiday Calendar">
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
            <h2 className="text-2xl font-bold text-text-primary">Holiday Calendar</h2>
            <p className="text-text-secondary text-sm mt-1">
              Manage organization holidays and national holidays
            </p>
          </div>
          <Button onClick={() => setShowForm(true)} className="bg-keka-primary text-white">
            <Plus size={20} className="mr-2" />
            Add Holiday
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Total Holidays</p>
                <p className="text-2xl font-bold text-text-primary">{holidays.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Star size={24} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">National Holidays</p>
                <p className="text-2xl font-bold text-text-primary">
                  {holidays.filter(h => h.isNational).length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Building size={24} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Organization Holidays</p>
                <p className="text-2xl font-bold text-text-primary">
                  {holidays.filter(h => !h.isNational).length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search
                  size={20}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search holidays..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 h-10 border border-border-light rounded-lg bg-white text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-keka-primary/20 focus:border-keka-primary"
                />
              </div>
            </div>
            <div className="w-[150px]">
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="w-full h-10 border border-border-light rounded-lg bg-white text-text-primary px-4 focus:outline-none focus:ring-2 focus:ring-keka-primary/20 focus:border-keka-primary"
              >
                <option value="all">All Years</option>
                {getUniqueYears().map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-[180px]">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full h-10 border border-border-light rounded-lg bg-white text-text-primary px-4 focus:outline-none focus:ring-2 focus:ring-keka-primary/20 focus:border-keka-primary"
              >
                <option value="all">All Types</option>
                <option value="national">National Holidays</option>
                <option value="organization">Organization Holidays</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Holiday List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12 text-text-secondary">Loading holidays...</div>
          ) : filteredHolidays.length === 0 ? (
            <Card className="p-12 text-center">
              <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-text-primary mb-2">No Holidays</h3>
              <p className="text-text-secondary mb-4">
                {searchTerm || filterYear !== 'all' || filterType !== 'all'
                  ? 'No holidays match your search criteria'
                  : 'Get started by adding your first holiday'}
              </p>
              {!searchTerm && filterYear === 'all' && filterType === 'all' && (
                <Button onClick={() => setShowForm(true)} className="bg-keka-primary text-white">
                  <Plus size={20} className="mr-2" />
                  Add Holiday
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredHolidays.map((holiday) => (
                <Card key={holiday.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {holiday.isNational ? (
                        <Star size={20} className="text-yellow-500 fill-yellow-500" />
                      ) : (
                        <Building size={20} className="text-purple-500" />
                      )}
                      <h3 className="font-semibold text-text-primary">{holiday.name}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(holiday)}
                        className="text-gray-600 hover:text-keka-primary"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(holiday.id)}
                        className="text-gray-600 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-text-secondary flex items-center gap-2">
                      <Calendar size={14} />
                      {formatDate(holiday.date)}
                    </p>
                    {holiday.description && (
                      <p className="text-sm text-text-secondary line-clamp-2">
                        {holiday.description}
                      </p>
                    )}
                    <Badge variant="neutral" className={holiday.isNational ? 'bg-yellow-50 text-yellow-700' : 'bg-purple-50 text-purple-700'}>
                      {holiday.isNational ? 'National Holiday' : 'Organization Holiday'}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-text-primary">
                    {editingHoliday ? 'Edit Holiday' : 'Add Holiday'}
                  </h3>
                  <Button variant="ghost" size="sm" onClick={resetForm}>
                    <X size={20} />
                  </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Holiday Name */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Holiday Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Diwali, Christmas, Company Anniversary"
                      className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-keka-primary/20 focus:border-keka-primary"
                    />
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-keka-primary/20 focus:border-keka-primary"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description about the holiday"
                      rows={3}
                      className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-keka-primary/20 focus:border-keka-primary"
                    />
                  </div>

                  {/* Holiday Type */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-text-primary flex items-center gap-2">
                          {formData.isNational ? (
                            <Star size={16} className="text-yellow-500" />
                          ) : (
                            <Building size={16} className="text-purple-500" />
                          )}
                          {formData.isNational ? 'National Holiday' : 'Organization Holiday'}
                        </label>
                        <p className="text-xs text-text-secondary mt-1">
                          {formData.isNational
                            ? 'Applies to all organizations'
                            : 'Specific to your organization'}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.isNational}
                        onChange={(e) =>
                          setFormData({ ...formData, isNational: e.target.checked })
                        }
                        className="w-5 h-5 rounded border-gray-300 text-keka-primary focus:ring-keka-primary"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t">
                    <Button type="submit" className="flex-1 bg-keka-primary text-white">
                      <Save size={20} className="mr-2" />
                      {editingHoliday ? 'Update Holiday' : 'Add Holiday'}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
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
