'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Laptop, Smartphone, Monitor, Headphones, LoaderCircle, AlertCircle, CheckCircle, Plus, Trash2 } from 'lucide-react';

interface Device {
  id: string;
  assetName: string;
  assetTag: string;
  serialNumber: string;
  description?: string;
  assignmentDate: string;
  returnDate?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DAMAGED' | 'LOST' | 'RETURNED';
  condition?: string;
}

interface IssuReport {
  id: string;
  deviceId: string;
  deviceName: string;
  issue: string;
  severity: 'low' | 'medium' | 'high';
  reportedDate: string;
  status: 'open' | 'in-progress' | 'resolved';
}

export default function DevicesPage() {
  const { data: session } = useSession();
  const [devices, setDevices] = useState<Device[]>([]);
  const [issues, setIssues] = useState<IssuReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReportForm, setShowReportForm] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [reportData, setReportData] = useState({
    issue: '',
    severity: 'medium' as 'low' | 'medium' | 'high',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDevices();
    fetchIssues();
  }, []);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/devices?role=EMPLOYEE');
      if (response.ok) {
        const { data } = await response.json();
        setDevices(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch devices:', error);
      setDevices([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchIssues = async () => {
    try {
      const response = await fetch('/api/device-issues');
      if (response.ok) {
        const { data } = await response.json();
        // Transform the API response to match the IssuReport interface
        const transformedIssues: IssuReport[] = Array.isArray(data) 
          ? data.map((issue: any) => ({
              id: issue.id,
              deviceId: issue.deviceId,
              deviceName: issue.device?.assetName || 'Unknown Device',
              issue: issue.issue,
              severity: issue.severity,
              reportedDate: issue.reportedDate,
              status: issue.status,
            }))
          : [];
        setIssues(transformedIssues);
      }
    } catch (error) {
      console.error('Failed to fetch issues:', error);
    }
  };

  const getDeviceIcon = (assetName: string) => {
    const lower = assetName.toLowerCase();
    if (lower.includes('laptop')) return <Laptop className="w-8 h-8 text-blue-600" />;
    if (lower.includes('phone') || lower.includes('mobile')) return <Smartphone className="w-8 h-8 text-green-600" />;
    if (lower.includes('monitor') || lower.includes('screen')) return <Monitor className="w-8 h-8 text-purple-600" />;
    if (lower.includes('headset') || lower.includes('headphone')) return <Headphones className="w-8 h-8 text-yellow-600" />;
    return <Laptop className="w-8 h-8 text-gray-600" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium"><CheckCircle className="w-3 h-3" /> Active</span>;
      case 'DAMAGED':
        return <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium"><AlertCircle className="w-3 h-3" /> Damaged</span>;
      case 'LOST':
        return <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium"><AlertCircle className="w-3 h-3" /> Lost</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  const handleReportIssue = (device: Device) => {
    setSelectedDevice(device);
    setReportData({ issue: '', severity: 'medium' });
    setShowReportForm(true);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/device-issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: selectedDevice.id,
          issue: reportData.issue,
          severity: reportData.severity,
        }),
      });

      if (response.ok) {
        const { data } = await response.json();
        // Add the new issue to the list
        setIssues(prev => [...prev, {
          id: data.id,
          deviceId: data.deviceId,
          deviceName: selectedDevice.assetName,
          issue: data.issue,
          severity: data.severity,
          reportedDate: data.reportedDate,
          status: data.status,
        }]);
        alert('Issue reported successfully! IT support will contact you soon.');
        setShowReportForm(false);
        setSelectedDevice(null);
        setReportData({ issue: '', severity: 'medium' });
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to report issue');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Error reporting issue');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangeReport = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setReportData(prev => ({ ...prev, [name]: value }));
  };

  const handleDeleteReport = async (id: string) => {
    if (confirm('Are you sure you want to delete this report?')) {
      try {
        const response = await fetch(`/api/device-issues?id=${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setIssues(issues.filter(i => i.id !== id));
          alert('Report deleted successfully');
        } else {
          const error = await response.json();
          alert(error.error || 'Failed to delete report');
        }
      } catch (error) {
        console.error('Error deleting report:', error);
        alert('Error deleting report');
      }
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const getIssueStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-orange-100 text-orange-800';
    }
  };

  if (loading) {
    return (
      <AppShell title="My Devices">
        <div className="flex items-center justify-center h-screen">
          <LoaderCircle className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="My Devices">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Devices</h1>
          <p className="text-gray-600 mt-1">Manage your assigned company devices and report issues</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-6">
            <p className="text-sm text-gray-600">Total Devices</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{devices.length}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-gray-600">Active Devices</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{devices.filter(d => d.status === 'ACTIVE').length}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-gray-600">Issues Reported</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">{issues.length}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-gray-600">Unresolved</p>
            <p className="text-3xl font-bold text-red-600 mt-2">{issues.filter(i => i.status !== 'resolved').length}</p>
          </Card>
        </div>

        {/* Report Form */}
        {showReportForm && selectedDevice && (
          <Card className="p-6 bg-blue-50 border border-blue-200">
            <h3 className="text-lg font-semibold mb-4">Report Issue - {selectedDevice.assetName}</h3>
            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Describe the Issue *</label>
                <textarea
                  name="issue"
                  value={reportData.issue}
                  onChange={handleChangeReport}
                  required
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the problem you're experiencing..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Severity *</label>
                <select
                  name="severity"
                  value={reportData.severity}
                  onChange={handleChangeReport}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low - Minor inconvenience</option>
                  <option value="medium">Medium - Affects productivity</option>
                  <option value="high">High - Unable to work</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 rounded-lg transition flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <LoaderCircle className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Report'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReportForm(false);
                    setSelectedDevice(null);
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </Card>
        )}

        {/* Devices List */}
        <div>
          <h2 className="text-xl font-bold mb-4">Assigned Devices</h2>
          <div className="space-y-4">
            {devices.length > 0 ? (
              devices.map((device) => (
                <Card key={device.id} className="p-6 hover:shadow-lg transition">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      {getDeviceIcon(device.assetName)}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">{device.assetName}</h3>
                        <div className="mt-3 space-y-2 text-sm text-gray-600">
                          <p><span className="font-medium text-gray-700">Asset Tag:</span> {device.assetTag}</p>
                          <p><span className="font-medium text-gray-700">Serial Number:</span> {device.serialNumber}</p>
                          {device.description && <p><span className="font-medium text-gray-700">Description:</span> {device.description}</p>}
                          {device.condition && <p><span className="font-medium text-gray-700">Condition:</span> {device.condition}</p>}
                          <p><span className="font-medium text-gray-700">Assigned:</span> {new Date(device.assignmentDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      {getStatusBadge(device.status)}
                      <button
                        onClick={() => handleReportIssue(device)}
                        className="px-3 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg text-sm font-medium transition flex items-center gap-1"
                      >
                        <AlertCircle className="w-4 h-4" />
                        Report Issue
                      </button>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-12 text-center">
                <Laptop className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No devices assigned yet</p>
              </Card>
            )}
          </div>
        </div>

        {/* Issue Reports */}
        {issues.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4">Your Issue Reports</h2>
            <div className="space-y-3">
              {issues.map(report => (
                <Card key={report.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold">{report.deviceName}</h4>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(report.severity)}`}>
                          {report.severity.charAt(0).toUpperCase() + report.severity.slice(1)}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getIssueStatusColor(report.status)}`}>
                          {report.status === 'in-progress' ? 'In Progress' : report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{report.issue}</p>
                      <p className="text-xs text-gray-500">Reported on {new Date(report.reportedDate).toLocaleDateString()}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteReport(report.id)}
                      className="ml-4 p-2 text-red-600 hover:bg-red-100 rounded transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Notice */}
        <Card className="p-4 bg-blue-50 border-l-4 border-blue-600">
          <p className="text-sm text-blue-900">
            <strong>📋 Important:</strong> Please ensure all devices are kept in good condition. Report any damage or loss immediately using the "Report Issue" button. Unauthorized modifications or software installations are prohibited.
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
