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
  LoaderCircle,
  AlertCircle,
  Eye,
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

export default function ManagerLifecyclePage() {
  const { data: session } = useSession();
  const [events, setEvents] = useState<LifecycleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState<LifecycleEvent | null>(null);
  const [showModal, setShowModal] = useState(false);

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

  const handleViewEvent = (event: LifecycleEvent) => {
    setSelectedEvent(event);
    setShowModal(true);
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
      <AppShell title="Team Lifecycle">
        <div className="flex items-center justify-center h-screen">
          <LoaderCircle className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Team Lifecycle">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Team Lifecycle Events
          </h1>
          <p className="text-gray-600 mt-1">
            View promotions, transfers, resignations, and exits for your team
          </p>
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
                  <button
                    onClick={() => handleViewEvent(event)}
                    className="p-2 hover:bg-blue-100 rounded text-blue-600 transition"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600 py-8">
              {filterType === 'all' ? 'No lifecycle events found' : `No ${getEventTypeLabel(filterType)} events found`}
            </p>
          )}
        </Card>

        {/* View Modal */}
        {showModal && selectedEvent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">Lifecycle Event Details</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Employee</p>
                  <p className="font-semibold text-gray-900">{selectedEvent.employeeName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Event Type</p>
                  <p className="font-semibold text-gray-900">{getEventTypeLabel(selectedEvent.eventType)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Event Date</p>
                  <p className="font-semibold text-gray-900">{new Date(selectedEvent.eventDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      selectedEvent.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-800'
                        : selectedEvent.status === 'PENDING'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {selectedEvent.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Description</p>
                  <p className="text-gray-900 mt-1">{selectedEvent.description}</p>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function X({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
