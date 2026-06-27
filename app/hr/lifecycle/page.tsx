'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import {
  Users,
  TrendingUp,
  LogOut,
  UserCheck,
  FileText,
  Plus,
  Edit,
  Trash2,
  X,
  LoaderCircle,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

interface LifecycleEvent {
  id: string;
  employeeId: string;
  employeeName: string;
  eventType: 'PROMOTION' | 'RESIGNATION' | 'TRANSFER' | 'EXIT' | 'ONBOARDING';
  eventDate: string;
  description: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
}

interface Employee {
  id: string;
  employeeCode: string;
  designation: string;
  department: string;
  status: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export default function HRLifecyclePage() {
  const { data: session } = useSession();
  const [events, setEvents] = useState<LifecycleEvent[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingEmployees, setFetchingEmployees] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<LifecycleEvent | null>(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    employeeName: '',
    eventType: 'PROMOTION' as 'PROMOTION' | 'RESIGNATION' | 'TRANSFER' | 'EXIT' | 'ONBOARDING',
    eventDate: '',
    description: '',
    status: 'PENDING' as 'PENDING' | 'COMPLETED' | 'CANCELLED',
  });

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/lifecycle-events');
      if (response.ok) {
        const { data } = await response.json();
        setEvents(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch lifecycle events:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      setFetchingEmployees(true);
      const response = await fetch('/api/admin/employees-for-lifecycle');
      if (response.ok) {
        const { data } = await response.json();
        setEmployees(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally {
      setFetchingEmployees(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchEmployees();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'employeeId') {
      const selectedEmployee = employees.find(emp => emp.id === value);
      setFormData(prev => ({
        ...prev,
        employeeId: value,
        employeeName: selectedEmployee ? selectedEmployee.user.name : '',
      }));
    } else if (name === 'eventType') {
      setFormData(prev => ({ ...prev, [name]: value as any }));
    } else if (name === 'status') {
      setFormData(prev => ({ ...prev, [name]: value as any }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/lifecycle-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const { data } = await response.json();
        setEvents([...events, data]);
        resetForm();
        alert('Lifecycle event created successfully!');
      } else {
        const result = await response.json();
        alert(`Failed to create event: ${result.error || result.message}`);
      }
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create lifecycle event');
    }
  };

  const handleEditEvent = (event: LifecycleEvent) => {
    setEditingEvent(event);
    setFormData({
      employeeId: event.employeeId,
      employeeName: event.employeeName,
      eventType: event.eventType,
      eventDate: event.eventDate,
      description: event.description,
      status: event.status,
    });
    setShowForm(true);
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;

    try {
      const response = await fetch(`/api/lifecycle-events/${editingEvent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const { data } = await response.json();
        setEvents(events.map(ev => ev.id === editingEvent.id ? data : ev));
        resetForm();
        alert('Lifecycle event updated successfully!');
      }
    } catch (error) {
      console.error('Error updating event:', error);
      alert('Failed to update lifecycle event');
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Delete this lifecycle event?')) return;

    try {
      const response = await fetch(`/api/lifecycle-events/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setEvents(events.filter(e => e.id !== id));
        alert('Lifecycle event deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete lifecycle event');
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      employeeName: '',
      eventType: 'PROMOTION',
      eventDate: '',
      description: '',
      status: 'PENDING',
    });
    setEditingEvent(null);
    setShowForm(false);
  };

  const getEventTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'PROMOTION':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'RESIGNATION':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'TRANSFER':
        return <Users className="w-5 h-5 text-blue-600" />;
      case 'EXIT':
        return <LogOut className="w-5 h-5 text-red-600" />;
      case 'ONBOARDING':
        return <UserCheck className="w-5 h-5 text-purple-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const filteredEvents = events.filter((e) =>
    filterType === 'all' ? true : e.eventType === filterType
  );

  const stats = {
    total: events.length,
    promotions: events.filter((e) => e.eventType === 'PROMOTION').length,
    resignations: events.filter((e) => e.eventType === 'RESIGNATION').length,
    exits: events.filter((e) => e.eventType === 'EXIT').length,
    transfers: events.filter((e) => e.eventType === 'TRANSFER').length,
    onboarding: events.filter((e) => e.eventType === 'ONBOARDING').length,
  };

  if (loading) {
    return (
      <AppShell title="Employee Lifecycle">
        <div className="flex items-center justify-center h-screen">
          <LoaderCircle className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Employee Lifecycle">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Employee Lifecycle Management
            </h1>
            <p className="text-gray-600 mt-1">
              Track promotions, transfers, resignations, and exits
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New Event
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">Total Events</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">Promotions</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.promotions}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">Resignations</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{stats.resignations}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">Transfers</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{stats.transfers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">Exits</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{stats.exits}</p>
              </div>
              <LogOut className="w-8 h-8 text-red-600" />
            </div>
          </Card>
        </div>

        {/* Form */}
        {showForm && (
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingEvent ? 'Edit Lifecycle Event' : 'Create New Lifecycle Event'}
              </h3>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={editingEvent ? handleUpdateEvent : handleAddEvent} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employee *</label>
                  <select
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleChange}
                    required
                    disabled={fetchingEmployees}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                  >
                    <option value="">Select Employee</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.user.name} ({emp.employeeCode})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employee Name</label>
                  <input
                    type="text"
                    name="employeeName"
                    value={formData.employeeName}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    placeholder="Auto-filled from selection"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Event Type *</label>
                  <select
                    name="eventType"
                    value={formData.eventType}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="PROMOTION">Promotion</option>
                    <option value="RESIGNATION">Resignation</option>
                    <option value="TRANSFER">Transfer</option>
                    <option value="EXIT">Exit</option>
                    <option value="ONBOARDING">Onboarding</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Event Date *</label>
                  <input
                    type="date"
                    name="eventDate"
                    value={formData.eventDate}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Event description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="PENDING">Pending</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition"
                >
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </Card>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          {['all', 'PROMOTION', 'RESIGNATION', 'TRANSFER', 'EXIT', 'ONBOARDING'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterType === type
                  ? type === 'PROMOTION' ? 'bg-green-600 text-white'
                  : type === 'RESIGNATION' ? 'bg-orange-600 text-white'
                  : type === 'TRANSFER' ? 'bg-blue-500 text-white'
                  : type === 'EXIT' ? 'bg-red-600 text-white'
                  : type === 'ONBOARDING' ? 'bg-purple-600 text-white'
                  : 'bg-blue-600 text-white'
                  : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {type === 'all' ? 'All Events' : getEventTypeLabel(type)}
            </button>
          ))}
        </div>

        {/* Events List */}
        <Card className="p-6">
          {filteredEvents.length > 0 ? (
            <div className="space-y-4">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-4 pb-4 border-b border-gray-200 last:border-b-0"
                >
                  {getEventIcon(event.eventType)}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-900">{event.employeeName}</h4>
                        <p className="text-sm text-gray-600">{getEventTypeLabel(event.eventType)}</p>
                      </div>
                      <div
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          event.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-800'
                            : event.status === 'PENDING'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {event.status}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mt-2">{event.description}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(event.eventDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditEvent(event)}
                      className="p-2 hover:bg-blue-100 rounded text-blue-600 transition"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="p-2 hover:bg-red-100 rounded text-red-600 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600 py-8">
              {filterType === 'all' ? 'No lifecycle events found' : `No ${getEventTypeLabel(filterType)} events found`}
            </p>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
