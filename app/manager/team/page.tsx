'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  Search,
  Loader2,
  Mail,
  Phone,
  Building2,
  Calendar,
  CheckCircle,
  AlertCircle,
  UserCheck,
  Briefcase,
} from 'lucide-react';

interface TeamMember {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  department: { id: string; name: string } | null;
  designation: string;
  status: string;
  joiningDate: string;
  phone: string;
}

interface TeamStats {
  totalMembers: number;
  activeMembers: number;
  departments: string[];
}

export default function ManagerDashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [managerInfo, setManagerInfo] = useState<{ id: string; employeeCode: string; name: string; email: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/manager/my-team');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch team');
      }

      if (data.data) {
        if (Array.isArray(data.data)) {
          // Admin view - multiple managers
          setTeamMembers(data.data.flatMap((d: any) => d.teamMembers));
        } else {
          // Manager view - single manager
          setManagerInfo(data.data.manager);
          setTeamMembers(data.data.teamMembers);
          setStats(data.data.stats);
        }
      }
    } catch (error) {
      console.error('Failed to fetch team:', error);
      addToast({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to load team',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = teamMembers.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.designation.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const isManagerView = !!managerInfo;

  if (loading) {
    return (
      <AppShell title="My Team">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-keka-purple" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="My Team">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isManagerView ? 'My Team' : 'All Teams'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isManagerView
                ? `View and manage your team members (${stats?.totalMembers || 0} members)`
                : 'Overview of all teams and managers'}
            </p>
          </div>
        </div>

        {/* Manager Info Card */}
        {isManagerView && managerInfo && (
          <Card className="bg-gradient-to-r from-keka-purple-light to-keka-purple-light/50 border-keka-purple/20">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-keka-purple text-white flex items-center justify-center text-2xl font-bold">
                {managerInfo.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">{managerInfo.name}</h2>
                <p className="text-gray-600">{managerInfo.email}</p>
                <p className="text-sm text-gray-500">Employee Code: {managerInfo.employeeCode}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-keka-purple">{stats?.totalMembers || 0}</p>
                <p className="text-sm text-gray-600">Team Members</p>
              </div>
            </div>
          </Card>
        )}

        {/* Stats Cards */}
        {isManagerView && stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <UserCheck className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Active Members</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeMembers}</p>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Departments</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.departments.length}</p>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-keka-purple-light rounded-lg">
                  <Users className="w-6 h-6 text-keka-purple" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Total Team</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalMembers}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Search */}
        <Card>
          <Input
            placeholder="Search team members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            fullWidth
          />
        </Card>

        {/* Team Members List */}
        <Card title="Team Members" description={`Showing ${filteredMembers.length} of ${teamMembers.length} members`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMembers.length === 0 ? (
              <div className="col-span-full py-12 text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-500">No team members found</p>
              </div>
            ) : (
              filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="group p-5 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-keka-purple hover:shadow-md transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-keka-purple to-keka-purple-dark text-white flex items-center justify-center font-semibold text-lg">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{member.name}</h3>
                      <p className="text-sm text-gray-500 truncate">{member.designation}</p>
                    </div>
                    {member.isActive ? (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{member.email}</span>
                    </div>
                    {member.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{member.phone}</span>
                      </div>
                    )}
                    {member.department && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="truncate">{member.department.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Briefcase className="w-4 h-4 text-gray-400" />
                      <span>{member.employeeCode}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>Joined {new Date(member.joiningDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Status: <span className="font-medium text-gray-700">{member.status}</span>
                    </span>
                    <Button variant="ghost" size="sm" className="text-keka-purple hover:text-keka-purple">
                      View Profile
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Quick Actions */}
        {isManagerView && (
          <Card title="Quick Actions">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button variant="outline" fullWidth className="justify-start">
                <Mail className="w-4 h-4 mr-2" />
                Email Team
              </Button>
              <Button variant="outline" fullWidth className="justify-start">
                <Users className="w-4 h-4 mr-2" />
                Team Meeting
              </Button>
              <Button variant="outline" fullWidth className="justify-start">
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve Leave
              </Button>
              <Button variant="outline" fullWidth className="justify-start">
                <Briefcase className="w-4 h-4 mr-2" />
                View Reports
              </Button>
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
