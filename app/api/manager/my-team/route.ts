import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@/lib/rbac';

/**
 * GET /api/manager/my-team
 * Get all employees managed by the current logged-in manager
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userRole = session.user.role as Role;

    // Only MANAGERS and ADMINS can access this
    const allowedRoles: Role[] = ['MANAGER', 'ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'];
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Only managers can access their team' },
        { status: 403 }
      );
    }

    // For MANAGER role, get their team
    if (userRole === 'MANAGER') {
      const managerEmployee = await prisma.employee.findUnique({
        where: { userId },
      });

      if (!managerEmployee) {
        return NextResponse.json(
          { error: 'Not Found', message: 'Manager profile not found' },
          { status: 404 }
        );
      }

      const teamMembers = await prisma.employee.findMany({
        where: { managerId: userId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              isActive: true,
              lastLoginAt: true,
            },
          },
          department: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const formattedTeam = teamMembers.map((member) => ({
        id: member.id,
        employeeCode: member.employeeCode,
        name: member.user.name,
        email: member.user.email,
        role: member.user.role,
        isActive: member.user.isActive,
        lastLoginAt: member.user.lastLoginAt,
        department: member.department,
        designation: member.designation,
        status: member.status,
        joiningDate: member.joiningDate,
        phone: member.phone,
        createdAt: member.createdAt,
      }));

      return NextResponse.json({
        success: true,
        data: {
          manager: {
            id: managerEmployee.id,
            employeeCode: managerEmployee.employeeCode,
            name: session.user.name,
            email: session.user.email,
          },
          teamMembers: formattedTeam,
          stats: {
            totalMembers: formattedTeam.length,
            activeMembers: formattedTeam.filter((m) => m.isActive).length,
            departments: [...new Set(formattedTeam.map((m) => m.department?.name).filter(Boolean))] as string[],
          },
        },
      });
    }

    // For ADMIN/HR_MANAGER, they can view all teams
    const allManagers = await prisma.user.findMany({
      where: { role: 'MANAGER', isActive: true },
      include: {
        managedTeam: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
              },
            },
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    const formattedData = allManagers.map((manager) => ({
      manager: {
        id: manager.id,
        name: manager.name,
        email: manager.email,
      },
      teamMembers: manager.managedTeam.map((member) => ({
        id: member.id,
        employeeCode: member.employeeCode,
        name: member.user.name,
        email: member.user.email,
        role: member.user.role,
        isActive: member.user.isActive,
        department: member.department,
        designation: member.designation,
        status: member.status,
      })),
      teamSize: manager.managedTeam.length,
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error('[Get My Team] Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to fetch team' },
      { status: 500 }
    );
  }
}
