'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import {
  Fingerprint,
  Plus,
  Edit,
  Trash2,
  Search,
  X,
  Check,
  RefreshCw,
  Wifi,
  WifiOff,
  Server,
  Clock
} from 'lucide-react';

interface BiometricDevice {
  id: string;
  name: string;
  deviceId: string;
  deviceType: string;
  ipAddress: string | null;
  location: string | null;
  serialNumber: string | null;
  isActive: boolean;
  lastSyncAt: string | null;
  syncStatus: string;
  organizationId: string | null;
  createdAt: string;
}

const DEVICE_TYPES = [
  { value: 'FINGERPRINT', label: 'Fingerprint Scanner' },
  { value: 'FACIAL', label: 'Facial Recognition' },
  { value: 'RFID', label: 'RFID/NFC Reader' },
  { value: 'MULTIMODAL', label: 'Multi-Modal Device' },
  { value: 'MOBILE', label: 'Mobile App' }
];

export default function BiometricDevicesPage() {
  const [devices, setDevices] = useState<BiometricDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState<BiometricDevice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [syncingDevice, setSyncingDevice] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    deviceId: '',
    deviceType: 'FINGERPRINT',
    ipAddress: '',
    location: '',
    serialNumber: ''
  });

  useEffect(() => {
    fetchDevices();
  }, []);

  async function fetchDevices() {
    try {
      const response = await fetch('/api/biometric');
      const { devices } = await response.json();
      setDevices(devices);
    } catch (error) {
      console.error('Failed to fetch devices:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingDevice ? `/api/biometric/${editingDevice.id}` : '/api/biometric';
      const method = editingDevice ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowModal(false);
        setEditingDevice(null);
        resetForm();
        fetchDevices();
      }
    } catch (error) {
      console.error('Failed to save device:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this device?')) return;

    try {
      const response = await fetch(`/api/biometric/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchDevices();
      }
    } catch (error) {
      console.error('Failed to delete device:', error);
    }
  }

  async function handleSync(device: BiometricDevice) {
    setSyncingDevice(device.id);
    try {
      // Simulate sync - in production, this would call the actual device
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert(`Sync initiated for ${device.name}`);
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncingDevice(null);
    }
  }

  function handleEdit(device: BiometricDevice) {
    setEditingDevice(device);
    setFormData({
      name: device.name,
      deviceId: device.deviceId,
      deviceType: device.deviceType,
      ipAddress: device.ipAddress || '',
      location: device.location || '',
      serialNumber: device.serialNumber || ''
    });
    setShowModal(true);
  }

  function resetForm() {
    setFormData({
      name: '',
      deviceId: '',
      deviceType: 'FINGERPRINT',
      ipAddress: '',
      location: '',
      serialNumber: ''
    });
  }

  const filteredDevices = devices.filter(device =>
    device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.deviceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'FACIAL':
        return '👤';
      case 'RFID':
        return '📇';
      case 'MULTIMODAL':
        return '🔐';
      case 'MOBILE':
        return '📱';
      default:
        return '👆';
    }
  };

  return (
    <AppShell title="Biometric Devices">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Biometric Devices</h1>
            <p className="text-sm text-gray-500 mt-1">Manage attendance tracking devices</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setEditingDevice(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-keka-purple text-white px-4 py-2 rounded-lg hover:bg-keka-purple-dark transition-colors"
          >
            <Plus className="h-5 w-5" />
            Add Device
          </button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Server className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Devices</p>
                <p className="text-2xl font-bold text-gray-900">{devices.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                <Wifi className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-2xl font-bold text-gray-900">{devices.filter(d => d.isActive).length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-red-100 flex items-center justify-center">
                <WifiOff className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Inactive</p>
                <p className="text-2xl font-bold text-gray-900">{devices.filter(d => !d.isActive).length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <RefreshCw className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Synced Today</p>
                <p className="text-2xl font-bold text-gray-900">
                  {devices.filter(d => {
                    const today = new Date().toDateString();
                    return d.lastSyncAt && new Date(d.lastSyncAt).toDateString() === today;
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search devices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-keka-purple focus:border-transparent"
          />
        </div>

        {/* Devices Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Device</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">IP Address</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Sync</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDevices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <Fingerprint className="h-12 w-12 text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">No biometric devices found</p>
                        <p className="text-sm text-gray-400 mt-1">Add your first device to enable biometric attendance</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredDevices.map((device) => (
                    <tr key={device.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getDeviceIcon(device.deviceType)}</span>
                          <div>
                            <p className="font-medium text-gray-900">{device.name}</p>
                            <p className="text-sm text-gray-500">{device.deviceId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {DEVICE_TYPES.find(t => t.value === device.deviceType)?.label || device.deviceType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900 font-mono text-sm">{device.ipAddress || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900 text-sm">{device.location || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {device.isActive ? (
                            <>
                              <div className="h-2 w-2 rounded-full bg-green-500"></div>
                              <span className="text-sm text-gray-700">Active</span>
                            </>
                          ) : (
                            <>
                              <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                              <span className="text-sm text-gray-500">Inactive</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {device.lastSyncAt ? (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Clock className="h-4 w-4 text-gray-400" />
                            {new Date(device.lastSyncAt).toLocaleString()}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Never</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleSync(device)}
                            disabled={syncingDevice === device.id || !device.isActive}
                            className="p-2 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Sync Device"
                          >
                            <RefreshCw className={`h-4 w-4 text-blue-600 ${syncingDevice === device.id ? 'animate-spin' : ''}`} />
                          </button>
                          <button
                            onClick={() => handleEdit(device)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <Edit className="h-4 w-4 text-gray-500" />
                          </button>
                          <button
                            onClick={() => handleDelete(device.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Device Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {editingDevice ? 'Edit Device' : 'Add Biometric Device'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Device Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Main Entrance Scanner"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-keka-purple focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Device ID *</label>
                <input
                  type="text"
                  required
                  value={formData.deviceId}
                  onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
                  placeholder="e.g., DEVICE_001"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-keka-purple focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Device Type *</label>
                <select
                  value={formData.deviceType}
                  onChange={(e) => setFormData({ ...formData, deviceType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-keka-purple focus:border-transparent"
                >
                  {DEVICE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IP Address</label>
                <input
                  type="text"
                  value={formData.ipAddress}
                  onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                  placeholder="e.g., 192.168.1.100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-keka-purple focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Main Lobby, Floor 1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-keka-purple focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                <input
                  type="text"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  placeholder="Device serial number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-keka-purple focus:border-transparent"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-keka-purple text-white rounded-lg hover:bg-keka-purple-dark transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingDevice ? 'Update Device' : 'Add Device'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
