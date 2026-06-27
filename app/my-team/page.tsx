'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { useDataRefresh } from '@/hooks/use-data-refresh';
import {
  Users,
  UserCheck,
  Mail,
  Phone,
  Briefcase,
  MapPin,
  LoaderCircle,
  Calendar,
  Clock,
  Home,
  Laptop,
  AlertCircle,
  CheckCircle2,
  UserX,
  PartyPopper,
} from 'lucide-react';

interface Employee {
  id: string;
  employeeCode: string;
  designation: string;
  status: string;
  joiningDate: string;
  phone: string;
  address: string;
  photoUrl?: string | null;
  city?: string | null;
  country?: string | null;
  state?: string | null;
  managerId?: string | null;
  department: {
    id: string;
    name: string;
    description?: string | null;
  } | null;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  isRegularized: boolean;
  workingHours?: number | null;
  checkInLocation?: any;
}

interface TeamMemberWithAttendance extends Employee {
  attendance?: Attendance;
}

function EmployeeCard({ employee }: { employee: Employee }) {
  const initials = employee.user.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <div className="rounded-xl border-2 bg-white p-4 shadow-sm transition-all duration-200 border-gray-200 hover:shadow-md">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-gray-400 to-gray-500 text-lg font-bold text-white">
          {employee.photoUrl ? (
            <img src={employee.photoUrl} alt={employee.user.name} className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 truncate">{employee.user.name}</p>
          <p className="text-sm text-gray-600 mt-0.5">{employee.designation}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              employee.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {employee.status}
            </span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
              {employee.department?.name || 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  count, 
  icon: Icon, 
  color 
}: { 
  title: string; 
  count: number; 
  icon: any; 
  color: 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'pink' | 'indigo';
}) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 bg-blue-50 text-blue-700 border-blue-200',
    green: 'from-green-500 to-green-600 bg-green-50 text-green-700 border-green-200',
    red: 'from-red-500 to-red-600 bg-red-50 text-red-700 border-red-200',
    orange: 'from-orange-500 to-orange-600 bg-orange-50 text-orange-700 border-orange-200',
    purple: 'from-purple-500 to-purple-600 bg-purple-50 text-purple-700 border-purple-200',
    pink: 'from-pink-500 to-pink-600 bg-pink-50 text-pink-700 border-pink-200',
    indigo: 'from-indigo-500 to-indigo-600 bg-indigo-50 text-indigo-700 border-indigo-200',
  };

  return (
    <Card className={`p-4 border-2 ${colorClasses[color].split(' ').slice(2).join(' ')}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold mt-1">{count}</p>
        </div>
        <div className={`p-3 rounded-lg bg-gradient-to-br ${colorClasses[color].split(' ').slice(0, 2).join(' ')} text-white`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );
}

function TeamCalendar({ employees }: { employees: Employee[] }) {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'];
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const holidays: Record<number, { name: string; type: string }> = {
    1: { name: "New Year's Day", type: "holiday" },
    26: { name: "Republic Day", type: "holiday" },
  };

  return (
    <Card className="p-0 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">{monthNames[currentMonth]} {currentYear}</h2>
            <p className="text-blue-100 text-xs mt-0.5">Team Calendar & Events</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/20">
          <div className="flex items-center gap-1.5 text-xs">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span>Holiday</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            <span>Event</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <div className="w-2 h-2 rounded-full bg-purple-400" />
            <span>Anniversary</span>
          </div>
        </div>
      </div>

      <div className="p-3">
        <div className="grid grid-cols-7 gap-0.5 mb-2">
          {dayNames.map((day) => (
            <div key={day} className="text-center text-[10px] font-semibold text-gray-500 py-1">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const isToday = day === today.getDate();
            const isWeekend = [0, 6].includes(new Date(currentYear, currentMonth, day).getDay());
            const hasHoliday = holidays[day];

            return (
              <div
                key={day}
                className={`aspect-square border rounded-lg p-1 flex flex-col relative transition-all hover:shadow-md ${
                  isToday
                    ? 'border-blue-500 bg-blue-50'
                    : isWeekend
                    ? 'border-gray-200 bg-gray-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className={`text-xs font-semibold ${
                  isToday ? 'text-blue-600' : isWeekend ? 'text-red-500' : 'text-gray-700'
                }`}>
                  {day}
                </div>

                {hasHoliday && (
                  <div className="mt-0.5">
                    <div className="text-[8px] bg-green-100 text-green-700 px-1 py-0.5 rounded truncate font-medium">
                      🏖️ {hasHoliday.name}
                    </div>
                  </div>
                )}

                {isToday && (
                  <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-blue-600 rounded-full" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

export default function TeamPage() {
  const { data: session } = useSession();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);

  const fetchTeamData = async () => {
    try {
      setLoading(true);

      const empResponse = await fetch('/api/employees');
      if (empResponse.ok) {
        const { data } = await empResponse.json();
        const allEmployees = Array.isArray(data) ? data : [];
        setEmployees(allEmployees);

        const currentEmp = allEmployees.find((e: Employee) => e.user.email === session?.user?.email);
        setCurrentUser(currentEmp || null);

        const depts = [...new Set(allEmployees.map((e) => e.department?.name).filter(Boolean))] as string[];
        setDepartments(depts);
      }

      const today = new Date().toISOString().split('T')[0];
      const attResponse = await fetch(`/api/attendance?date=${today}&allEmployees=true`);
      if (attResponse.ok) {
        const { data } = await attResponse.json();
        const transformedAttendance = (Array.isArray(data) ? data : []).map((item: any) => ({
          id: item.id,
          employeeId: item.employeeId,
          date: item.date,
          checkIn: item.checkIn,
          checkOut: item.checkOut,
          status: item.status,
          isRegularized: item.isRegularized,
          workingHours: item.workingHours,
          checkInLocation: item.checkInLocation,
        }));
        setAttendance(transformedAttendance);
      }
    } catch (error) {
      console.error('Failed to fetch team data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, []);

  // Auto-refresh on visibility change and focus
  useDataRefresh(fetchTeamData, {
    onVisibilityChange: true,
    onFocus: true,
  });

  const categorizeByAttendance = () => {
    const today = new Date().toISOString().split('T')[0];
    
    const offToday: TeamMemberWithAttendance[] = [];
    const notLoggedIn: TeamMemberWithAttendance[] = [];
    const onTime: TeamMemberWithAttendance[] = [];
    const lateArrival: TeamMemberWithAttendance[] = [];
    const workFromHome: TeamMemberWithAttendance[] = [];
    const remoteClockIn: TeamMemberWithAttendance[] = [];

    employees.forEach((emp) => {
      const empAttendance = attendance.find((a) => a.employeeId === emp.id);
      const empWithAttendance = { ...emp, attendance: empAttendance };

      if (!empAttendance || empAttendance.status === 'ABSENT') {
        offToday.push(empWithAttendance);
      } else if (empAttendance.status === 'PRESENT') {
        const checkInTime = empAttendance.checkIn ? new Date(empAttendance.checkIn) : null;
        const checkInHour = checkInTime?.getHours() || 0;
        const checkInMinute = checkInTime?.getMinutes() || 0;

        if (checkInHour > 9 || (checkInHour === 9 && checkInMinute > 30)) {
          lateArrival.push(empWithAttendance);
        } else {
          onTime.push(empWithAttendance);
        }

        if (empAttendance.checkInLocation) {
          remoteClockIn.push(empWithAttendance);
        }
      } else if (empAttendance.status === 'WORK_FROM_HOME') {
        workFromHome.push(empWithAttendance);
      }
    });

    const notLoggedInYet = employees.filter((emp) => {
      const empAttendance = attendance.find((a) => a.employeeId === emp.id);
      return !empAttendance && emp.status === 'ACTIVE';
    });

    return {
      offToday,
      notLoggedInYet,
      onTime,
      lateArrival,
      workFromHome,
      remoteClockIn,
    };
  };

  const attendanceStats = categorizeByAttendance();

  if (loading) {
    return (
      <AppShell title="Team">
        <div className="flex items-center justify-center h-screen">
          <LoaderCircle className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Team">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Dashboard</h1>
          <p className="text-gray-600 mt-1">View team attendance and activities</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Who is Off Today"
            count={attendanceStats.offToday.length}
            icon={PartyPopper}
            color="pink"
          />
          <StatCard
            title="Not Login Yet Today"
            count={attendanceStats.notLoggedInYet.length}
            icon={UserX}
            color="orange"
          />
          <StatCard
            title="Employee On Time"
            count={attendanceStats.onTime.length}
            icon={CheckCircle2}
            color="green"
          />
          <StatCard
            title="Late Arrival Today"
            count={attendanceStats.lateArrival.length}
            icon={AlertCircle}
            color="red"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Work From Home / On Duty Today"
            count={attendanceStats.workFromHome.length}
            icon={Home}
            color="purple"
          />
          <StatCard
            title="Remote Clock in Today"
            count={attendanceStats.remoteClockIn.length}
            icon={Laptop}
            color="indigo"
          />
          <StatCard
            title="Total Team Members"
            count={employees.length}
            icon={Users}
            color="blue"
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <TeamCalendar employees={employees} />
        </div>
      </div>
    </AppShell>
  );
}
