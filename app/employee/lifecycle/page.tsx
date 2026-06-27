'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import {
  TrendingUp,
  LogOut,
  UserCheck,
  FileText,
  LoaderCircle,
  AlertCircle,
  Users,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface LifecycleEvent {
  id: string;
  employeeId: string;
  employeeName: string;
  eventType: 'PROMOTION' | 'RESIGNATION' | 'TRANSFER' | 'EXIT' | 'ONBOARDING';
  eventDate: string;
  description: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
}

export default function EmployeeLifecyclePage() {
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
        return <TrendingUp className="w-6 h-6 text-green-600" />;
      case 'RESIGNATION':
        return <AlertCircle className="w-6 h-6 text-orange-600" />;
      case 'TRANSFER':
        return <Users className="w-6 h-6 text-blue-600" />;
      case 'EXIT':
        return <LogOut className="w-6 h-6 text-red-600" />;
      case 'ONBOARDING':
        return <UserCheck className="w-6 h-6 text-purple-600" />;
      default:
        return <FileText className="w-6 h-6 text-gray-600" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4" />;
      case 'PENDING':
        return <Clock className="w-4 h-4" />;
      case 'CANCELLED':
        return <XCircle className="w-4 h-4" />;
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
  };

  if (loading) {
    return (
      <AppShell title="My Lifecycle">
        <div className="flex items-center justify-center h-screen">
          <LoaderCircle className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="My Lifecycle Events">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            My Lifecycle Events
          </h1>
          <p className="text-gray-600 mt-1">
            Track your journey in the organization - promotions, transfers, and milestones
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
                <p className="text-3xl font-bold text-blue-600 mt-2">{events.filter((e) => e.eventType === 'TRANSFER').length}</p>
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

        {/* Timeline */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-6 text-gray-900">Your Journey</h2>
          {filteredEvents.length > 0 ? (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-600 via-purple-600 to-green-600" />
              
              <div className="space-y-6">
                {filteredEvents.map((event, index) => (
                  <div key={event.id} className="relative flex gap-4 pl-12">
                    {/* Timeline dot */}
                    <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-lg ${
                      event.eventType === 'PROMOTION' ? 'bg-green-600' :
                      event.eventType === 'RESIGNATION' ? 'bg-orange-600' :
                      event.eventType === 'TRANSFER' ? 'bg-blue-600' :
                      event.eventType === 'EXIT' ? 'bg-red-600' :
                      'bg-purple-600'
                    }`}>
                      <div className="text-white">
                        {getEventIcon(event.eventType)}
                      </div>
                    </div>
                    
                    {/* Event card */}
                    <div className="flex-1 bg-gradient-to-r from-gray-50 to-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">
                            {getEventTypeLabel(event.eventType)}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(event.eventDate).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                          event.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-800'
                            : event.status === 'PENDING'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {getStatusIcon(event.status)}
                          {event.status}
                        </div>
                      </div>
                      <p className="text-gray-700">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <FileText className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">No lifecycle events yet</p>
              <p className="text-sm text-gray-500 mt-1">
                {filterType === 'all' 
                  ? 'Your journey will be tracked here' 
                  : `No ${getEventTypeLabel(filterType)} events found`}
              </p>
            </div>
          )}
        </Card>

        {/* Info Card */}
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-blue-100">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">About Lifecycle Events</h3>
              <p className="text-sm text-gray-700 mt-1">
                This section tracks your professional journey within the organization, including promotions, 
                department transfers, onboarding milestones, and other significant career events.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
