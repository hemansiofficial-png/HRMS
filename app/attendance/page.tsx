'use client';

import { useEffect, useState, useCallback } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { useDataRefresh } from '@/hooks/use-data-refresh';
import {
  Clock,
  LogOut,
  Check,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  TrendingUp,
  MapPin,
  Navigation,
  Fingerprint,
  FileText,
  Plus,
  Sun,
  Moon,
  Sunrise,
  Settings,
  Loader2,
  X
} from 'lucide-react';

interface Attendance {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  workingHours: number | null;
  shiftId: string | null;
  overtimeHours: number;
  overtimeApproved: boolean;
  checkInLocation: any;
  checkOutLocation: any;
  checkInDeviceId: string | null;
  checkOutDeviceId: string | null;
  isRegularized: boolean;
  shift?: {
    name: string;
    startTime: string;
    endTime: string;
    nightShift?: boolean | null;
  };
}

interface Shift {
  id: string;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  isFlexible: boolean;
  nightShift: boolean;
}

interface AttendanceStats {
  present: number;
  absent: number;
  halfDay: number;
  late: number;
  overtime: number;
  totalDays: number;
  attendancePercentage: number;
}

interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export default function AttendancePage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [todayRecord, setTodayRecord] = useState<Attendance | null>(null);
  const [monthlyRecords, setMonthlyRecords] = useState<Attendance[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [userShift, setUserShift] = useState<Shift | null>(null);
  const [stats, setStats] = useState<AttendanceStats>({
    present: 0,
    absent: 0,
    halfDay: 0,
    late: 0,
    overtime: 0,
    totalDays: 0,
    attendancePercentage: 0
  });
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showRegularizationModal, setShowRegularizationModal] = useState(false);
  const [showOvertimeModal, setShowOvertimeModal] = useState(false);
  const [regularizationData, setRegularizationData] = useState({
    date: '',
    reason: '',
    checkIn: '',
    checkOut: ''
  });
  const [overtimeData, setOvertimeData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    reason: ''
  });

  // Get user's current location
  const getCurrentLocation = useCallback((): Promise<GeoLocation> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser. Please use a modern browser like Chrome, Firefox, or Edge.'));
        return;
      }

      console.log('Requesting location permission...');

      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Location received:', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          let errorMessage = 'Unable to get your location. ';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += 'Location permission was denied. Please allow location access in your browser settings and try again.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += 'Location information is unavailable. Please check your GPS settings.';
              break;
            case error.TIMEOUT:
              errorMessage += 'Location request timed out. Please try again.';
              break;
            default:
              errorMessage += error.message || 'An unknown error occurred.';
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        }
      );
    });
  }, []);

  useEffect(() => {
    fetchAttendance();
    fetchShifts();
  }, [currentMonth]);

  async function fetchAttendance() {
    try {
      const month = currentMonth?.getMonth() + 1 || new Date().getMonth() + 1;
      const year = currentMonth?.getFullYear() || new Date().getFullYear();
      const response = await fetch(`/api/attendance?month=${month}&year=${year}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();

      // Handle both response structures: { attendance } and { data: [...] }
      const attendance = Array.isArray(result.attendance) ? result.attendance : 
                         Array.isArray(result.data) ? result.data : [];

      setMonthlyRecords(attendance);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayData = attendance?.find(
        (a: Attendance) => {
          if (!a || !a.date) return false;
          return new Date(a.date).toDateString() === today.toDateString();
        }
      );
      setTodayRecord(todayData || null);

      calculateStats(attendance);
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
      setMonthlyRecords([]);
      setTodayRecord(null);
    }
  }

  // Auto-refresh on visibility change and focus
  useDataRefresh(fetchAttendance, {
    onVisibilityChange: true,
    onFocus: true,
  });

  // Listen for attendance updates from header buttons
  useEffect(() => {
    const handleAttendanceUpdate = (event: CustomEvent) => {
      console.log('Attendance updated from header:', event.detail);
      fetchAttendance();
    };

    window.addEventListener('attendance-updated', handleAttendanceUpdate as EventListener);
    return () => window.removeEventListener('attendance-updated', handleAttendanceUpdate as EventListener);
  }, []);

  async function fetchShifts() {
    try {
      const response = await fetch('/api/shifts');
      const result = await response.json();
      const shifts = result.shifts || result.data || [];
      setShifts(shifts);

      // Find user's assigned shift from attendance records
      if (monthlyRecords.length > 0) {
        const userShiftId = monthlyRecords[0]?.shiftId;
        if (userShiftId) {
          const shift = shifts.find((s: Shift) => s.id === userShiftId);
          if (shift) setUserShift(shift);
        }
      }
    } catch (error) {
      console.error('Failed to fetch shifts:', error);
      setShifts([]);
    }
  }

  function calculateStats(attendance: Attendance[]) {
    const present = attendance.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
    const absent = attendance.filter((a) => a.status === 'ABSENT').length;
    const halfDay = attendance.filter((a) => a.status === 'HALF_DAY').length;
    const late = attendance.filter((a) => a.status === 'LATE').length;
    const overtime = attendance.reduce((sum, a) => sum + (a.overtimeHours || 0), 0);

    setStats({
      present,
      absent,
      halfDay,
      late,
      overtime,
      totalDays: attendance.length,
      attendancePercentage: attendance.length > 0 ? Math.round((present / attendance.length) * 100) : 0
    });
  }

  async function handleGeoCheckIn() {
    setGeoLoading(true);
    setLocationError(null);

    console.log('Starting check-in process...');

    try {
      const userLocation = await getCurrentLocation();
      console.log('Location obtained:', userLocation);
      setLocation(userLocation);

      const response = await fetch('/api/attendance/geo-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          accuracy: userLocation.accuracy,
          action: 'check-in'
        })
      });

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response data:', result);

      if (response.ok) {
        const newRecord = result.data;
        setTodayRecord(newRecord);
        
        // Update monthlyRecords immediately to sync the history table
        setMonthlyRecords((prev) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const todayStr = today.toISOString().split('T')[0];
          
          // Check if today's record already exists in monthlyRecords
          const existingIndex = prev.findIndex(
            (r) => new Date(r.date).toDateString() === today.toDateString()
          );
          
          if (existingIndex >= 0) {
            // Update existing record
            const updated = [...prev];
            updated[existingIndex] = newRecord;
            return updated;
          } else {
            // Add new record at the beginning
            return [newRecord, ...prev];
          }
        });
        
        // Recalculate stats with updated records
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];
        const updatedRecords = monthlyRecords.some(
          (r) => new Date(r.date).toDateString() === today.toDateString()
        )
          ? monthlyRecords.map((r) =>
              new Date(r.date).toDateString() === today.toDateString() ? newRecord : r
            )
          : [newRecord, ...monthlyRecords];
        calculateStats(updatedRecords);
      } else {
        setLocationError(result.error || 'Check-in failed');
      }
    } catch (error: any) {
      console.error('Check-in error:', error);
      setLocationError(error.message || 'Unable to get your location');
    } finally {
      setGeoLoading(false);
    }
  }

  async function handleGeoCheckOut() {
    setGeoLoading(true);
    setLocationError(null);

    console.log('Starting check-out process...');

    try {
      const userLocation = await getCurrentLocation();
      console.log('Location obtained:', userLocation);
      setLocation(userLocation);

      const response = await fetch('/api/attendance/geo-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          accuracy: userLocation.accuracy,
          action: 'check-out'
        })
      });

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response data:', result);

      if (response.ok) {
        const updatedRecord = result.data;
        setTodayRecord(updatedRecord);
        
        // Update monthlyRecords immediately to sync the history table
        setMonthlyRecords((prev) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          // Find and update today's record in monthlyRecords
          const existingIndex = prev.findIndex(
            (r) => new Date(r.date).toDateString() === today.toDateString()
          );
          
          if (existingIndex >= 0) {
            // Update existing record
            const updated = [...prev];
            updated[existingIndex] = updatedRecord;
            return updated;
          } else {
            // This shouldn't happen, but add it if not found
            return [updatedRecord, ...prev];
          }
        });
        
        // Recalculate stats with updated records
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const updatedRecords = monthlyRecords.some(
          (r) => new Date(r.date).toDateString() === today.toDateString()
        )
          ? monthlyRecords.map((r) =>
              new Date(r.date).toDateString() === today.toDateString() ? updatedRecord : r
            )
          : [updatedRecord, ...monthlyRecords];
        calculateStats(updatedRecords);
      } else {
        setLocationError(result.error || 'Check-out failed');
      }
    } catch (error: any) {
      console.error('Check-out error:', error);
      setLocationError(error.message || 'Unable to get your location');
    } finally {
      setGeoLoading(false);
    }
  }

  async function handleRegularizationSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/attendance-regularization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: 'current-user-id',
          date: regularizationData.date,
          reason: regularizationData.reason,
          missingDetails: ['check-in', 'check-out'],
          proposedCheckIn: regularizationData.checkIn ? new Date(regularizationData.checkIn).toISOString() : null,
          proposedCheckOut: regularizationData.checkOut ? new Date(regularizationData.checkOut).toISOString() : null
        })
      });

      if (response.ok) {
        setShowRegularizationModal(false);
        setRegularizationData({ date: '', reason: '', checkIn: '', checkOut: '' });
        fetchAttendance();
      }
    } catch (error) {
      console.error('Regularization failed:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleOvertimeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/overtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendanceId: todayRecord?.id,
          employeeId: 'current-user-id',
          date: overtimeData.date,
          startTime: overtimeData.startTime,
          endTime: overtimeData.endTime,
          reason: overtimeData.reason
        })
      });

      if (response.ok) {
        setShowOvertimeModal(false);
        setOvertimeData({ date: '', startTime: '', endTime: '', reason: '' });
        fetchAttendance();
      }
    } catch (error) {
      console.error('Overtime request failed:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '--:--';
    return new Date(dateString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTableDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PRESENT: 'bg-green-100 text-green-700 border-green-200',
      ABSENT: 'bg-red-100 text-red-700 border-red-200',
      HALF_DAY: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      LATE: 'bg-orange-100 text-orange-700 border-orange-200',
      WFH: 'bg-blue-100 text-blue-700 border-blue-200',
      ON_LEAVE: 'bg-gray-100 text-gray-700 border-gray-200',
      OVERTIME: 'bg-purple-100 text-purple-700 border-purple-200'
    };
    return styles[status] || styles.PRESENT;
  };

  const getShiftIcon = (shift: { name: string; startTime: string; endTime: string; nightShift?: boolean | null }) => {
    if (shift.nightShift) return Moon;
    if (shift.startTime < '12:00') return Sun;
    return Sunrise;
  };

  const workingHours = todayRecord?.checkIn && todayRecord?.checkOut
    ? ((new Date(todayRecord.checkOut).getTime() - new Date(todayRecord.checkIn).getTime()) / (1000 * 60 * 60)).toFixed(1)
    : todayRecord?.checkIn
      ? ((new Date().getTime() - new Date(todayRecord.checkIn).getTime()) / (1000 * 60 * 60)).toFixed(1)
      : '0';

  return (
    <AppShell title="Time & Attendance">
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Attendance</h1>
            <p className="text-sm text-gray-500 mt-1.5">Manage your daily check-ins, view attendance history, and track work hours</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    alert(`Location permission granted!\nLat: ${pos.coords.latitude}\nLng: ${pos.coords.longitude}`);
                    setLocation({
                      latitude: pos.coords.latitude,
                      longitude: pos.coords.longitude,
                      accuracy: pos.coords.accuracy
                    });
                  },
                  (err) => {
                    alert(`Location permission error: ${err.message}`);
                  }
                );
              }}
              className="hidden sm:flex items-center gap-2 bg-white text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-all border border-gray-200 text-sm font-semibold shadow-sm hover:shadow-md"
            >
              <Navigation className="h-4 w-4" />
              Test Location
            </button>
            <div className="flex items-center gap-1.5 bg-white rounded-xl border border-gray-200 p-1.5 shadow-sm">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-2.5 px-4 py-2 bg-gray-50 rounded-lg">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="font-semibold text-gray-900 min-w-[180px] text-center text-sm">
                  {currentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                </span>
              </div>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Today's Attendance Card - Redesigned */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#673ab7] via-[#5e35b1] to-[#512da8] rounded-2xl shadow-xl shadow-purple-900/20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>
          
          <div className="relative p-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
              {/* Left Section - Status & Details */}
              <div className="flex-1 space-y-6">
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="h-1 w-8 bg-white/60 rounded-full"></div>
                    <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Today's Status</h2>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    {todayRecord?.checkIn ? (
                      <div className="flex items-center gap-3 bg-white/15 backdrop-blur-sm px-5 py-2.5 rounded-xl">
                        <div className="h-10 w-10 rounded-full bg-green-400/20 flex items-center justify-center">
                          <Check className="h-5 w-5 text-green-300" />
                        </div>
                        <span className="text-2xl font-bold text-white">Checked In</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 bg-white/15 backdrop-blur-sm px-5 py-2.5 rounded-xl">
                        <div className="h-10 w-10 rounded-full bg-amber-400/20 flex items-center justify-center">
                          <AlertCircle className="h-5 w-5 text-amber-300" />
                        </div>
                        <span className="text-2xl font-bold text-white">Not Checked In</span>
                      </div>
                    )}
                  </div>
                </div>

                {userShift && (
                  <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm px-5 py-3 rounded-xl border border-white/10">
                    <div className="h-10 w-10 rounded-lg bg-white/15 flex items-center justify-center">
                      {userShift.nightShift ? <Moon className="h-5 w-5 text-indigo-300" /> : <Sun className="h-5 w-5 text-amber-300" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{userShift.name}</p>
                      <p className="text-xs text-white/60">{userShift.startTime} - {userShift.endTime}</p>
                    </div>
                  </div>
                )}

                {todayRecord?.checkIn && (
                  <div className="grid grid-cols-3 gap-5 pt-6 border-t border-white/15">
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-white/60 uppercase tracking-wide">Check In</p>
                      <p className="text-2xl font-bold text-white">{formatTime(todayRecord.checkIn)}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {todayRecord.checkInDeviceId && (
                          <span className="inline-flex items-center gap-1 text-xs text-white/70 bg-white/10 px-2 py-1 rounded-md">
                            <Fingerprint className="h-3 w-3" /> Biometric
                          </span>
                        )}
                        {todayRecord.checkInLocation && (
                          <span className="inline-flex items-center gap-1 text-xs text-white/70 bg-white/10 px-2 py-1 rounded-md">
                            <MapPin className="h-3 w-3" /> GPS
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-white/60 uppercase tracking-wide">Check Out</p>
                      <p className="text-2xl font-bold text-white">{formatTime(todayRecord.checkOut)}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {todayRecord.checkOutDeviceId && (
                          <span className="inline-flex items-center gap-1 text-xs text-white/70 bg-white/10 px-2 py-1 rounded-md">
                            <Fingerprint className="h-3 w-3" /> Biometric
                          </span>
                        )}
                        {todayRecord.checkOutLocation && (
                          <span className="inline-flex items-center gap-1 text-xs text-white/70 bg-white/10 px-2 py-1 rounded-md">
                            <MapPin className="h-3 w-3" /> GPS
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-white/60 uppercase tracking-wide">Working Hours</p>
                      <p className="text-2xl font-bold text-white">{workingHours}<span className="text-lg font-normal text-white/70 ml-0.5">hrs</span></p>
                      {todayRecord.overtimeHours > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-400/25 text-amber-100 px-2.5 py-1 rounded-full mt-1.5">
                          +{todayRecord.overtimeHours}h OT
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Section - Actions */}
              <div className="flex flex-col gap-4 lg:w-72">
                {!todayRecord?.checkIn ? (
                  <button
                    onClick={handleGeoCheckIn}
                    disabled={geoLoading}
                    className="group relative flex items-center justify-center gap-3 bg-white text-[#673ab7] px-8 py-4 rounded-xl font-bold hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-900/25 hover:shadow-xl hover:shadow-purple-900/30 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {geoLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <MapPin className="h-6 w-6 group-hover:scale-110 transition-transform" />
                    )}
                    <span className="text-lg">Check In</span>
                  </button>
                ) : !todayRecord?.checkOut ? (
                  <button
                    onClick={handleGeoCheckOut}
                    disabled={geoLoading}
                    className="group flex items-center justify-center gap-3 bg-white/15 backdrop-blur-sm text-white border-2 border-white/30 px-8 py-4 rounded-xl font-bold hover:bg-white/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {geoLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <LogOut className="h-6 w-6 group-hover:scale-110 transition-transform" />
                    )}
                    <span className="text-lg">Check Out</span>
                  </button>
                ) : (
                  <div className="flex items-center justify-center gap-3 bg-green-400/20 backdrop-blur-sm border border-green-400/30 px-8 py-4 rounded-xl">
                    <div className="h-10 w-10 rounded-full bg-green-400/30 flex items-center justify-center">
                      <Check className="h-5 w-5 text-green-300" />
                    </div>
                    <span className="text-lg font-bold text-white">Day Complete</span>
                  </div>
                )}

                {/* Secondary Actions */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => setShowOvertimeModal(true)}
                    disabled={!todayRecord?.checkIn}
                    className="flex items-center justify-center gap-2 bg-white/10 text-white px-4 py-3 rounded-xl text-sm font-semibold hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
                  >
                    <Clock className="h-4 w-4" />
                    Log OT
                  </button>
                  <button
                    onClick={() => setShowRegularizationModal(true)}
                    className="flex items-center justify-center gap-2 bg-white/10 text-white px-4 py-3 rounded-xl text-sm font-semibold hover:bg-white/20 transition-all border border-white/10"
                  >
                    <FileText className="h-4 w-4" />
                    Regularize
                  </button>
                </div>

                {/* Location Status with Mini Map */}
                {location && (
                  <div className="bg-white/10 backdrop-blur-sm px-5 py-4 rounded-xl border border-white/10 mt-1">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Navigation className="h-4 w-4 text-white/70" />
                        <span className="text-xs font-semibold text-white/80 uppercase tracking-wide">Last Location</span>
                      </div>
                      <a
                        href={`https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=19/${location.latitude}/${location.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-white/70 hover:text-white font-medium transition-colors flex items-center gap-1"
                      >
                        Full Map →
                      </a>
                    </div>
                    
                    {/* Mini Map */}
                    <div className="relative w-full h-40 bg-white/20 rounded-lg overflow-hidden border border-white/20">
                      <iframe
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        scrolling="no"
                        marginHeight={0}
                        marginWidth={0}
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.longitude - 0.002},${location.latitude - 0.002},${location.longitude + 0.002},${location.latitude + 0.002}&layer=mapnik&marker=${location.latitude},${location.longitude}`}
                        className="filter invert brightness-90 contrast-125"
                        title="Location Map"
                      />
                      {/* Center Marker Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="relative">
                          <div className="absolute -inset-4 bg-red-500/30 rounded-full animate-ping" />
                          <div className="h-4 w-4 bg-red-500 border-2 border-white rounded-full shadow-lg" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Display */}
                {locationError && (
                  <div className="bg-red-500/20 border border-red-400/30 text-red-100 px-5 py-3.5 rounded-xl text-sm backdrop-blur-sm">
                    <div className="flex items-center gap-2.5 font-semibold mb-1.5">
                      <AlertCircle className="h-4 w-4" />
                      <span>Location Error</span>
                    </div>
                    <p className="text-xs opacity-90 leading-relaxed">{locationError}</p>
                    <button
                      onClick={() => setLocationError(null)}
                      className="text-xs font-semibold underline opacity-80 hover:opacity-100 mt-2"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards - Redesigned */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
          <div className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Check className="h-7 w-7 text-green-600" />
              </div>
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">Good</span>
            </div>
            <p className="text-sm font-medium text-gray-500">Present Days</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.present}</p>
          </div>

          <div className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <AlertCircle className="h-7 w-7 text-red-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500">Absent Days</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.absent}</p>
          </div>

          <div className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-7 w-7 text-orange-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500">Late Arrivals</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.late}</p>
          </div>

          <div className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Sun className="h-7 w-7 text-yellow-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500">Half Days</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.halfDay}</p>
          </div>

          <div className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-7 w-7 text-purple-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500">Overtime (Hrs)</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.overtime.toFixed(1)}</p>
          </div>

          <div className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Navigation className="h-7 w-7 text-blue-600" />
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                stats.attendancePercentage >= 90 ? 'bg-green-50 text-green-600' :
                stats.attendancePercentage >= 75 ? 'bg-yellow-50 text-yellow-600' :
                'bg-red-50 text-red-600'
              }`}>
                {stats.attendancePercentage >= 90 ? 'Excellent' : stats.attendancePercentage >= 75 ? 'Good' : 'Needs Improvement'}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-500">Attendance Rate</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.attendancePercentage}<span className="text-lg font-normal text-gray-400 ml-1">%</span></p>
          </div>
        </div>

        {/* Attendance History Table - Redesigned */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Attendance History</h3>
              <p className="text-sm text-gray-500 mt-1">
                {currentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="flex items-center gap-1.5 text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                <MapPin className="h-4 w-4 text-green-600" /> GPS
              </span>
              <span className="flex items-center gap-1.5 text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                <Fingerprint className="h-4 w-4 text-blue-600" /> Biometric
              </span>
              <span className="flex items-center gap-1.5 text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                <FileText className="h-4 w-4 text-purple-600" /> Regularized
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-50/50">
                <tr>
                  <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Shift</th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Check In</th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Check Out</th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Working Hours</th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Overtime</th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {monthlyRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-8 py-16 text-center">
                      <div className="flex flex-col items-center">
                        <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                          <Calendar className="h-10 w-10 text-gray-300" />
                        </div>
                        <p className="text-gray-600 font-semibold">No attendance records for this month</p>
                        <p className="text-sm text-gray-400 mt-1.5">Your daily check-ins will appear here</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  monthlyRecords.map((record) => {
                    const hours = record.checkIn && record.checkOut
                      ? ((new Date(record.checkOut).getTime() - new Date(record.checkIn).getTime()) / (1000 * 60 * 60)).toFixed(1)
                      : record.checkIn
                        ? ((new Date().getTime() - new Date(record.checkIn).getTime()) / (1000 * 60 * 60)).toFixed(1)
                        : '--';

                    return (
                      <tr key={record.id} className="group hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent transition-colors">
                        <td className="px-8 py-5">
                          <div>
                            <p className="font-bold text-gray-900">{formatTableDate(record.date)}</p>
                            <p className="text-sm text-gray-500 mt-0.5">{formatDate(record.date)}</p>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          {record.shift ? (
                            <div className="flex items-center gap-2.5">
                              <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                                record.shift.nightShift ? 'bg-indigo-50' : 'bg-amber-50'
                              }`}>
                                {(() => {
                                  const Icon = getShiftIcon(record.shift);
                                  return <Icon className={record.shift.nightShift ? 'h-4 w-4 text-indigo-600' : 'h-4 w-4 text-amber-600'} />;
                                })()}
                              </div>
                              <span className="text-sm font-semibold text-gray-700">{record.shift.name}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2.5">
                            <div className="h-9 w-9 rounded-lg bg-gray-50 flex items-center justify-center">
                              <Clock className="h-4 w-4 text-gray-400" />
                            </div>
                            <span className="text-gray-900 font-bold">{formatTime(record.checkIn)}</span>
                            {record.checkInDeviceId && (
                              <div className="h-7 w-7 rounded-md bg-blue-50 flex items-center justify-center" title="Biometric">
                                <Fingerprint className="h-3.5 w-3.5 text-blue-600" />
                              </div>
                            )}
                            {record.checkInLocation && (
                              <div className="h-7 w-7 rounded-md bg-green-50 flex items-center justify-center" title="GPS">
                                <MapPin className="h-3.5 w-3.5 text-green-600" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2.5">
                            <div className="h-9 w-9 rounded-lg bg-gray-50 flex items-center justify-center">
                              <LogOut className="h-4 w-4 text-gray-400" />
                            </div>
                            <span className="text-gray-900 font-bold">{formatTime(record.checkOut)}</span>
                            {record.checkOutDeviceId && (
                              <div className="h-7 w-7 rounded-md bg-blue-50 flex items-center justify-center" title="Biometric">
                                <Fingerprint className="h-3.5 w-3.5 text-blue-600" />
                              </div>
                            )}
                            {record.checkOutLocation && (
                              <div className="h-7 w-7 rounded-md bg-green-50 flex items-center justify-center" title="GPS">
                                <MapPin className="h-3.5 w-3.5 text-green-600" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className="text-gray-900 font-bold">{hours}<span className="text-sm font-normal text-gray-400 ml-0.5">h</span></span>
                        </td>
                        <td className="px-8 py-5">
                          {record.overtimeHours > 0 ? (
                            <div className="flex items-center gap-2">
                              <span className="text-purple-600 font-bold bg-purple-50 px-2.5 py-1 rounded-lg text-sm">+{record.overtimeHours}h</span>
                              {record.overtimeApproved ? (
                                <div className="h-6 w-6 rounded-full bg-green-50 flex items-center justify-center" title="Approved">
                                  <Check className="h-3.5 w-3.5 text-green-600" />
                                </div>
                              ) : (
                                <div className="h-6 w-6 rounded-full bg-yellow-50 flex items-center justify-center" title="Pending">
                                  <AlertCircle className="h-3.5 w-3.5 text-yellow-600" />
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2.5">
                            <span className={`inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-bold border ${getStatusBadge(record.status)}`}>
                              {record.status.replace('_', ' ')}
                            </span>
                            {record.isRegularized && (
                              <div className="h-7 w-7 rounded-md bg-purple-50 flex items-center justify-center" title="Regularized">
                                <FileText className="h-3.5 w-3.5 text-purple-600" />
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Regularization Modal - Redesigned */}
      {showRegularizationModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Regularize Attendance</h2>
                  <p className="text-xs text-gray-500">Submit a request for missing attendance</p>
                </div>
              </div>
              <button
                onClick={() => setShowRegularizationModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleRegularizationSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    Date
                  </span>
                </label>
                <input
                  type="date"
                  required
                  value={regularizationData.date}
                  onChange={(e) => setRegularizationData({ ...regularizationData, date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <span className="flex items-center gap-2">
                      <Sun className="h-4 w-4 text-gray-400" />
                      Check In
                    </span>
                  </label>
                  <input
                    type="time"
                    value={regularizationData.checkIn}
                    onChange={(e) => setRegularizationData({ ...regularizationData, checkIn: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <span className="flex items-center gap-2">
                      <Moon className="h-4 w-4 text-gray-400" />
                      Check Out
                    </span>
                  </label>
                  <input
                    type="time"
                    value={regularizationData.checkOut}
                    onChange={(e) => setRegularizationData({ ...regularizationData, checkOut: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-gray-400" />
                    Reason for Regularization
                  </span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={regularizationData.reason}
                  onChange={(e) => setRegularizationData({ ...regularizationData, reason: e.target.value })}
                  placeholder="Explain why you need to regularize this attendance (e.g., forgot to check-in, system issue, etc.)..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 font-medium resize-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRegularizationModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    'Submit Request'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Overtime Modal - Redesigned */}
      {showOvertimeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Log Overtime</h2>
                  <p className="text-xs text-gray-500">Record additional work hours</p>
                </div>
              </div>
              <button
                onClick={() => setShowOvertimeModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleOvertimeSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    Date
                  </span>
                </label>
                <input
                  type="date"
                  required
                  value={overtimeData.date}
                  onChange={(e) => setOvertimeData({ ...overtimeData, date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-gray-900 font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <span className="flex items-center gap-2">
                      <Sun className="h-4 w-4 text-gray-400" />
                      Start Time
                    </span>
                  </label>
                  <input
                    type="time"
                    required
                    value={overtimeData.startTime}
                    onChange={(e) => setOvertimeData({ ...overtimeData, startTime: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-gray-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <span className="flex items-center gap-2">
                      <Moon className="h-4 w-4 text-gray-400" />
                      End Time
                    </span>
                  </label>
                  <input
                    type="time"
                    required
                    value={overtimeData.endTime}
                    onChange={(e) => setOvertimeData({ ...overtimeData, endTime: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-gray-900 font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    Work Description
                  </span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={overtimeData.reason}
                  onChange={(e) => setOvertimeData({ ...overtimeData, reason: e.target.value })}
                  placeholder="Describe the work completed during overtime hours (tasks, deliverables, etc.)..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-gray-900 font-medium resize-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowOvertimeModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-semibold hover:from-amber-600 hover:to-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/25"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    'Submit Overtime'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
