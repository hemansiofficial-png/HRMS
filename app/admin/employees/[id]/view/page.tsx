'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, User, Mail, Phone, MapPin, Calendar, DollarSign, Briefcase, Building,
  LoaderCircle, AlertCircle, Pencil, GraduationCap, FileText, Shield, Award,
  TrendingUp, Star, Activity, CreditCard, History, Wrench, AlertTriangle,
  CheckCircle, Clock, X, Banknote, Heart, Users, BarChart3, Key
} from 'lucide-react';
import { AdminResetPasswordModal } from '@/components/profile/admin-reset-password-modal';

interface Employee {
  id: string;
  employeeCode: string;
  designation: string;
  status: string;
  joiningDate: string;
  phone: string;
  address: string;
  city: string | null;
  state: string | null;
  country: string | null;
  zipCode: string | null;
  salary: number;
  photoUrl: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  department: {
    id: string;
    name: string;
    description: string | null;
  } | null;
  skills?: any[];
  documents?: any[];
  educationDetails?: any[];
  emergencyContacts?: any[];
  bankDetails?: any;
  personalInfo?: any;
  attendance?: any[];
  leaves?: any[];
  payroll?: any[];
  reviews?: any[];
  assignedAssets?: any[];
  deviceIssues?: any[];
}

export default function EmployeeViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [showResetPassword, setShowResetPassword] = useState(false);

  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  useEffect(() => {
    if (resolvedParams) {
      fetchEmployee(resolvedParams.id);
    }
  }, [resolvedParams]);

  const fetchEmployee = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/employees/${id}`);
      if (response.ok) {
        const { data } = await response.json();
        setEmployee(data);
      } else {
        setError('Failed to load employee details');
      }
    } catch (error) {
      console.error('Failed to fetch employee:', error);
      setError('Failed to load employee details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      ACTIVE: 'success',
      INACTIVE: 'neutral',
      PROBATION: 'warning',
      RESIGNED: 'danger',
      CONTRACT: 'info',
    };
    return <Badge variant={variants[status] || 'neutral'}>{status}</Badge>;
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const getAttendanceForDay = (day: number) => {
    if (!employee?.attendance) return null;
    const date = new Date(currentYear, currentMonth, day);
    const dateStr = date.toISOString().split('T')[0];
    return employee.attendance.find(att => {
      const attDate = new Date(att.date).toISOString().split('T')[0];
      return attDate === dateStr;
    });
  };

  const getAttendanceStatusColor = (status: string) => {
    const colors: any = {
      PRESENT: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      ABSENT: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      HALF_DAY: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      LEAVE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      WEEK_OFF: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    };
    return colors[status] || colors.WEEK_OFF;
  };

  const navigateMonth = (direction: number) => {
    let newMonth = currentMonth + direction;
    let newYear = currentYear;
    
    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }
    
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'skills', label: 'Skills', icon: Award },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'leave', label: 'Leave', icon: Calendar },
    { id: 'payroll', label: 'Payroll', icon: DollarSign },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'assets', label: 'Assets', icon: Briefcase },
  ];

  if (loading) {
    return (
      <AppShell title="Employee Details">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <LoaderCircle className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading employee details...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !employee) {
    return (
      <AppShell title="Employee Details">
        <Card className="p-12 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Employee Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The requested employee could not be found.'}</p>
          <Button onClick={() => router.push('/admin/employees')} className="bg-purple-600 hover:bg-purple-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Employees
          </Button>
        </Card>
      </AppShell>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-purple-600" />
                Personal Information
              </h3>
              <Card className="p-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Full Name</p>
                    <p className="text-gray-900 font-medium">{employee.user.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Email</p>
                    <p className="text-gray-900 font-medium">{employee.user.email}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Phone</p>
                    <p className="text-gray-900 font-medium">{employee.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Date of Birth</p>
                    <p className="text-gray-900 font-medium">
                      {employee.dateOfBirth
                        ? new Date(employee.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                        : 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Gender</p>
                    <p className="text-gray-900 font-medium">{employee.gender || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Address</p>
                    <p className="text-gray-900 font-medium">{employee.address || 'Not provided'}</p>
                    <p className="text-gray-600 text-sm mt-1">
                      {[employee.city, employee.state, employee.zipCode, employee.country].filter(Boolean).join(', ') || ''}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Employment Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-purple-600" />
                Employment Information
              </h3>
              <Card className="p-6">
                <div className="grid gap-4 md:grid-cols-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Employee ID</p>
                    <p className="text-gray-900 font-mono font-medium">{employee.employeeCode}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Designation</p>
                    <p className="text-gray-900 font-medium">{employee.designation}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Department</p>
                    <p className="text-gray-900 font-medium">{employee.department?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Joining Date</p>
                    <p className="text-gray-900 font-medium">
                      {new Date(employee.joiningDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Status</p>
                    <div>{getStatusBadge(employee.status)}</div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Role</p>
                    <p className="text-gray-900 font-medium">{employee.user.role}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Salary</p>
                    <p className="text-gray-900 font-medium">₹{employee.salary.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Additional Information */}
            {(employee.bankDetails || employee.personalInfo || employee.emergencyContacts) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  Additional Information
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {employee.bankDetails && (
                    <Card className="p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Banknote className="w-4 h-4 text-purple-600" />
                        Bank Details
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Account Holder:</span>
                          <span className="text-gray-900 font-medium">{employee.bankDetails.accountHolder}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Account Number:</span>
                          <span className="text-gray-900 font-medium">{employee.bankDetails.accountNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Bank Name:</span>
                          <span className="text-gray-900 font-medium">{employee.bankDetails.bankName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">IFSC Code:</span>
                          <span className="text-gray-900 font-medium">{employee.bankDetails.ifscCode}</span>
                        </div>
                      </div>
                    </Card>
                  )}
                  {employee.personalInfo && (
                    <Card className="p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <User className="w-4 h-4 text-purple-600" />
                        Personal Info
                      </h4>
                      <div className="space-y-2 text-sm">
                        {employee.personalInfo.nationality && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Nationality:</span>
                            <span className="text-gray-900 font-medium">{employee.personalInfo.nationality}</span>
                          </div>
                        )}
                        {employee.personalInfo.bloodGroup && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Blood Group:</span>
                            <span className="text-gray-900 font-medium">{employee.personalInfo.bloodGroup}</span>
                          </div>
                        )}
                        {employee.personalInfo.maritalStatus && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Marital Status:</span>
                            <span className="text-gray-900 font-medium">{employee.personalInfo.maritalStatus}</span>
                          </div>
                        )}
                        {employee.personalInfo.panNumber && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">PAN:</span>
                            <span className="text-gray-900 font-medium">{employee.personalInfo.panNumber}</span>
                          </div>
                        )}
                      </div>
                    </Card>
                  )}
                  {employee.emergencyContacts && employee.emergencyContacts.length > 0 && (
                    <Card className="p-4 md:col-span-2">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Heart className="w-4 h-4 text-purple-600" />
                        Emergency Contacts
                      </h4>
                      <div className="grid gap-3 md:grid-cols-2">
                        {employee.emergencyContacts.map((contact: any) => (
                          <div key={contact.id} className="space-y-1 text-sm">
                            <p className="font-medium text-gray-900">{contact.name}</p>
                            <p className="text-gray-600">{contact.relationship}</p>
                            <p className="text-gray-600">{contact.phone}</p>
                            {contact.email && <p className="text-gray-600">{contact.email}</p>}
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 'skills':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Professional Skills</h3>
            {employee.skills && employee.skills.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {employee.skills.map((skill) => (
                  <Card key={skill.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">{skill.skillName}</h4>
                        <Badge className="mt-1 text-xs">{skill.proficiency}</Badge>
                      </div>
                      {skill.verified && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                    {skill.yearsOfExp && (
                      <p className="text-sm text-gray-600 mt-2">
                        <Award className="w-4 h-4 inline mr-1" />
                        {skill.yearsOfExp} years
                      </p>
                    )}
                    {skill.lastUsed && (
                      <p className="text-sm text-gray-600">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Last used: {new Date(skill.lastUsed).toLocaleDateString()}
                      </p>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No skills recorded yet</p>
            )}
          </div>
        );

      case 'documents':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Documents</h3>
            {employee.documents && employee.documents.length > 0 ? (
              <div className="space-y-3">
                {employee.documents.map((doc) => (
                  <Card key={doc.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-purple-600" />
                        <div>
                          <h4 className="font-semibold text-gray-900">{doc.documentName}</h4>
                          <p className="text-sm text-gray-600">{doc.documentType}</p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        Uploaded: {new Date(doc.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No documents uploaded yet</p>
            )}
          </div>
        );

      case 'education':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Education & Certifications</h3>
            {employee.educationDetails && employee.educationDetails.length > 0 ? (
              <div className="space-y-3">
                {employee.educationDetails.map((edu) => (
                  <Card key={edu.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <GraduationCap className="w-6 h-6 text-purple-600 mt-1" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{edu.institutionName}</h4>
                        <p className="text-sm text-gray-600">{edu.fieldOfStudy} - {edu.type}</p>
                        {edu.grade && <p className="text-sm text-gray-600">Grade: {edu.grade}</p>}
                        <p className="text-sm text-gray-500">
                          {new Date(edu.startDate).getFullYear()} - {edu.endDate ? new Date(edu.endDate).getFullYear() : 'Present'}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No education records yet</p>
            )}
          </div>
        );

      case 'attendance':
        return (
          <div className="space-y-4">
            {/* Calendar Header with Navigation */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Attendance Calendar</h3>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => navigateMonth(-1)}
                  variant="outline"
                  size="sm"
                  disabled={currentYear === 2024 && currentMonth === 0}
                >
                  Previous
                </Button>
                <span className="text-sm font-medium px-4">
                  {monthNames[currentMonth]} {currentYear}
                </span>
                <Button
                  onClick={() => navigateMonth(1)}
                  variant="outline"
                  size="sm"
                  disabled={currentYear === new Date().getFullYear() && currentMonth === new Date().getMonth()}
                >
                  Next
                </Button>
              </div>
            </div>

            {/* Legend */}
            <div className="flex gap-4 mb-4 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                <span className="text-sm text-gray-600">Present</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                <span className="text-sm text-gray-600">Absent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
                <span className="text-sm text-gray-600">Half Day</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
                <span className="text-sm text-gray-600">Leave</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
                <span className="text-sm text-gray-600">Week Off</span>
              </div>
            </div>

            {/* Calendar Grid */}
            <Card className="p-6">
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-xs font-medium text-gray-500 uppercase py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for days before the first day of the month */}
                {Array.from({ length: getFirstDayOfMonth(currentMonth, currentYear) }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-24"></div>
                ))}

                {/* Days of the month */}
                {Array.from({ length: getDaysInMonth(currentMonth, currentYear) }).map((_, i) => {
                  const day = i + 1;
                  const attendance = getAttendanceForDay(day);
                  const date = new Date(currentYear, currentMonth, day);
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  const isToday = day === new Date().getDate() && 
                                  currentMonth === new Date().getMonth() && 
                                  currentYear === new Date().getFullYear();

                  return (
                    <div
                      key={day}
                      className={`h-24 border rounded-lg p-2 relative transition-all ${
                        isToday ? 'border-purple-500 border-2' : 'border-gray-200 dark:border-gray-700'
                      } ${!attendance && isWeekend ? 'bg-gray-50 dark:bg-gray-800/50' : 'bg-white dark:bg-gray-900'}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-medium ${
                          isToday ? 'text-purple-600 font-bold' : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {day}
                        </span>
                        {attendance && (
                          <Badge className={`text-xs ${getAttendanceStatusColor(attendance.status)}`}>
                            {attendance.status === 'HALF_DAY' ? 'HD' : attendance.status}
                          </Badge>
                        )}
                      </div>
                      
                      {attendance && (
                        <div className="space-y-0.5 text-xs text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <span className="font-medium">In:</span>
                            <span>
                              {attendance.checkIn 
                                ? new Date(attendance.checkIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                                : '-'
                              }
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Out:</span>
                            <span>
                              {attendance.checkOut
                                ? new Date(attendance.checkOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                                : '-'
                              }
                            </span>
                          </div>
                          {attendance.workingHours && (
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Hrs:</span>
                              <span>{attendance.workingHours}h</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {!attendance && isWeekend && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs text-gray-400">Week Off</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Summary Stats */}
            {employee.attendance && employee.attendance.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {['PRESENT', 'ABSENT', 'LEAVE', 'HALF_DAY'].map(status => {
                  const count = employee.attendance?.filter(att => att.status === status).length || 0;
                  const color = status === 'PRESENT' ? 'green' : status === 'ABSENT' ? 'red' : status === 'LEAVE' ? 'blue' : 'yellow';
                  return (
                    <Card key={status} className={`p-4 border-${color}-200 dark:border-${color}-800`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500 uppercase">{status.replace('_', ' ')}</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
                        </div>
                        <div className={`w-10 h-10 rounded-full bg-${color}-100 dark:bg-${color}-900/30 flex items-center justify-center`}>
                          <CheckCircle className={`w-5 h-5 text-${color}-600`} />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 'leave':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Leave History</h3>
            {employee.leaves && employee.leaves.length > 0 ? (
              <div className="space-y-3">
                {employee.leaves.map((leave) => (
                  <Card key={leave.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={leave.status === 'APPROVED' ? 'success' : leave.status === 'PENDING' ? 'warning' : 'danger'}>
                            {leave.status}
                          </Badge>
                          <span className="text-sm text-gray-600">{leave.leaveType}</span>
                        </div>
                        <p className="text-sm text-gray-900">
                          {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">{leave.reason}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{leave.numberOfDays} days</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No leave records yet</p>
            )}
          </div>
        );

      case 'payroll':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payroll History</h3>
            {employee.payroll && employee.payroll.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Month</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Gross Salary</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Deductions</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Net Salary</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {employee.payroll.map((payroll) => (
                      <tr key={payroll.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3 text-sm text-gray-900">{payroll.month} {payroll.year}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">₹{payroll.grossSalary.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">₹{payroll.totalDeductions.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">₹{payroll.netSalary.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3">
                          <Badge variant={payroll.status === 'PAID' ? 'success' : payroll.status === 'PENDING' ? 'warning' : 'neutral'}>
                            {payroll.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No payroll records yet</p>
            )}
          </div>
        );

      case 'performance':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Reviews</h3>
            {employee.reviews && employee.reviews.length > 0 ? (
              <div className="space-y-3">
                {employee.reviews.map((review) => (
                  <Card key={review.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <Star className="w-6 h-6 text-yellow-500 mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">{review.rating}/5</span>
                        </div>
                        <p className="text-sm text-gray-900">{review.feedback}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(review.reviewDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No performance reviews yet</p>
            )}
          </div>
        );

      case 'assets':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Assigned Assets & Devices</h3>
            {employee.assignedAssets && employee.assignedAssets.length > 0 ? (
              <div className="space-y-3">
                {employee.assignedAssets.map((asset) => (
                  <Card key={asset.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Briefcase className="w-8 h-8 text-purple-600" />
                        <div>
                          <h4 className="font-semibold text-gray-900">{asset.assetName}</h4>
                          <p className="text-sm text-gray-600">{asset.description}</p>
                          <p className="text-xs text-gray-500">Tag: {asset.assetTag}</p>
                        </div>
                      </div>
                      <Badge variant={asset.status === 'ACTIVE' ? 'success' : 'neutral'}>{asset.status}</Badge>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No assets assigned yet</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AppShell title="Employee Details">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 -mx-6 -mt-6 px-6 py-6 rounded-b-2xl border-b border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin/employees')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition text-gray-600 dark:text-gray-400"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Employee Details</h1>
                  {getStatusBadge(employee.status)}
                </div>
                <p className="text-gray-600 dark:text-gray-400 flex items-center gap-4 text-sm">
                  <span className="font-medium">{employee.employeeCode}</span>
                  <span>•</span>
                  <span>{employee.user.name}</span>
                  <span>•</span>
                  <span>{employee.designation}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={() => router.push('/admin/employees')} variant="outline">
                <X className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={() => setShowResetPassword(true)} 
                variant="outline"
                className="text-purple-600 border-purple-300 hover:bg-purple-50"
              >
                <Key className="w-4 h-4 mr-2" />
                Reset Password
              </Button>
              <Button onClick={() => router.push(`/admin/employees/${employee.id}/edit`)}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit Employee
              </Button>
            </div>
          </div>
        </div>

        {/* Profile Header */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Picture */}
          <Card className="p-6 flex flex-col items-center shadow-md">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-4xl font-bold mb-4 shadow-lg">
              {employee.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{employee.user.name}</h2>
            <p className="text-gray-600 text-sm mt-1">{employee.employeeCode}</p>
            <div className="mt-4">{getStatusBadge(employee.status)}</div>
          </Card>

          {/* Contact Information */}
          <Card className="p-6 md:col-span-2 shadow-md">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b">
              <User className="w-5 h-5 text-gray-700" />
              <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Email</p>
                  <p className="text-gray-900 font-medium">{employee.user.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Phone</p>
                  <p className="text-gray-900 font-medium">{employee.phone || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 md:col-span-2">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 uppercase">Address</p>
                  <p className="text-gray-900 font-medium">{employee.address || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Employment Details */}
        <Card className="shadow-md">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b">
            <Briefcase className="w-5 h-5 text-gray-700" />
            <h3 className="text-lg font-semibold text-gray-900">Employment Details</h3>
          </div>
          <div className="grid gap-6 md:grid-cols-4">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Designation</p>
              <p className="text-gray-900 font-medium">{employee.designation}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Department</p>
              <p className="text-gray-900 font-medium">{employee.department?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Joining Date</p>
              <p className="text-gray-900 font-medium">
                {new Date(employee.joiningDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Salary</p>
              <p className="text-gray-900 font-medium">₹{employee.salary.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <Card className="shadow-md">
          <div className="p-6">
            {renderTabContent()}
          </div>
        </Card>

        {/* Reset Password Modal */}
        {showResetPassword && employee && (
          <AdminResetPasswordModal
            user={{
              id: employee.user.id,
              name: employee.user.name,
              email: employee.user.email,
              role: employee.user.role,
              employeeCode: employee.employeeCode,
              designation: employee.designation
            }}
            onClose={() => setShowResetPassword(false)}
            onSuccess={() => setShowResetPassword(false)}
          />
        )}
      </div>
    </AppShell>
  );
}
