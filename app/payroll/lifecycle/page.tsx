'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import {
  TrendingUp,
  Users,
  FileText,
  LoaderCircle,
  DollarSign,
  Briefcase,
} from 'lucide-react';

interface LifecycleEvent {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  eventType: 'PROMOTION' | 'RESIGNATION' | 'TRANSFER' | 'EXIT' | 'ONBOARDING';
  eventDate: string;
  description: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
}

export default function PayrollLifecyclePage() {
  const { data: session } = useSession();
  const [events, setEvents] = useState<LifecycleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

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

  useEffect(() => {
    fetchEvents();
  }, []);

  const getEventTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'PROMOTION':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'TRANSFER':
        return <Users className="w-5 h-5 text-blue-600" />;
      case 'ONBOARDING':
        return <Briefcase className="w-5 h-5 text-purple-600" />;
      case 'RESIGNATION':
        return <FileText className="w-5 h-5 text-orange-600" />;
      case 'EXIT':
        return <DollarSign className="w-5 h-5 text-red-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  // Filter only salary-impacting events by default
  const salaryEvents = events.filter(e => 
    ['PROMOTION', 'TRANSFER', 'ONBOARDING', 'EXIT'].includes(e.eventType)
  );

  const filteredEvents = filterType === 'salary' ? salaryEvents : 
    filterType === 'all' ? events : 
    events.filter(e => e.eventType === filterType);

  const stats = {
    total: events.length,
    promotions: events.filter((e) => e.eventType === 'PROMOTION').length,
    transfers: events.filter((e) => e.eventType === 'TRANSFER').length,
    exits: events.filter((e) => e.eventType === 'EXIT').length,
    salaryImpacting: salaryEvents.length,
  };

  if (loading) {
    return (
      <AppShell title="Payroll Lifecycle">
        <div className="flex items-center justify-center h-screen">
          <LoaderCircle className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Payroll Lifecycle Events">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Payroll Lifecycle Events
          </h1>
          <p className="text-gray-600 mt-1">
            Track salary-impacting events: promotions, transfers, and exits
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <p className="text-sm text-gray-600">Transfers</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{stats.transfers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-purple-700">Salary Impacting</p>
                <p className="text-3xl font-bold text-purple-700 mt-2">{stats.salaryImpacting}</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterType === 'all'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
            }`}
          >
            All Events
          </button>
          <button
            onClick={() => setFilterType('salary')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterType === 'salary'
                ? 'bg-purple-600 text-white'
                : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <DollarSign className="w-4 h-4 inline mr-1" />
            Salary Impacting
          </button>
          <button
            onClick={() => setFilterType('PROMOTION')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterType === 'PROMOTION'
                ? 'bg-green-600 text-white'
                : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Promotions
          </button>
          <button
            onClick={() => setFilterType('TRANSFER')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterType === 'TRANSFER'
                ? 'bg-blue-500 text-white'
                : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Transfers
          </button>
          <button
            onClick={() => setFilterType('EXIT')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterType === 'EXIT'
                ? 'bg-red-600 text-white'
                : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Exits
          </button>
        </div>

        {/* Events Table */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-6 text-gray-900">
            {filterType === 'salary' ? 'Salary Impacting Events' : 'All Lifecycle Events'}
          </h2>
          {filteredEvents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Event Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Employee
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {getEventIcon(event.eventType)}
                          <span className="font-medium text-gray-900">
                            {getEventTypeLabel(event.eventType)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{event.employeeName}</p>
                          <p className="text-sm text-gray-500">{event.employeeCode}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {new Date(event.eventDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700 max-w-xs truncate">
                        {event.description}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            event.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-800'
                              : event.status === 'PENDING'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {event.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <FileText className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">No events found</p>
              <p className="text-sm text-gray-500 mt-1">
                {filterType === 'salary'
                  ? 'No salary impacting events'
                  : 'No lifecycle events found'}
              </p>
            </div>
          )}
        </Card>

        {/* Info Card */}
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-purple-100">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Payroll Impact</h3>
              <p className="text-sm text-gray-700 mt-1">
                Lifecycle events like promotions and transfers directly impact payroll calculations. 
                Ensure these events are processed timely to maintain accurate salary disbursements.
                Exit events trigger final settlement calculations.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
