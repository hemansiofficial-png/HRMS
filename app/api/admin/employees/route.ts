import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withAdminAuth } from '@/lib/rbac';

/**
 * GET /api/admin/employees
 * Get all employees/users with their manager information
 * For Team Management, use ?skipOrgFilter=true&includeAllUsers=true to get all users
 */
export const GET = withAdminAuth(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const departmentId = searchParams.get('departmentId') || undefined;
    const managerId = searchParams.get('managerId') || undefined;
    const withoutManager = searchParams.get('withoutManager');
    const withManager = searchParams.get('withManager');
    const limit = parseInt(searchParams.get('limit') || '500', 10);
    const skipOrgFilter = searchParams.get('skipOrgFilter') === 'true';
    const includeAllUsers = searchParams.get('includeAllUsers') === 'true';

    const session = await auth();
    const organizationId = (session?.user as any)?.organizationId || undefined;
    const userRole = (session?.user as any)?.role || 'EMPLOYEE';

    const where: Record<string, unknown> = {};

    // Only filter by organization if it exists and skipOrgFilter is not true
    // SUPER_ADMIN can always see all employees
    if (organizationId && !skipOrgFilter && userRole !== 'SUPER_ADMIN') {
      where.organizationId = organizationId;
    }

    // For Team Management - include all users (not just those with Employee records)
    if (includeAllUsers) {
      return getUsersAsEmployees(search, where, limit);
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (managerId) {
      where.managerId = managerId;
    }

    if (withoutManager === 'true') {
      where.managerId = null;
    } else if (withManager === 'true') {
      where.managerId = { not: null };
    }

    // Add search filter
    if (search) {
      const matchingUsers = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
          ],
        },
        select: { id: true },
      });

      where.userId = { in: matchingUsers.map((u) => u.id) };
    }

    const employees = await prisma.employee.findMany({
      where,
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
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Format the response
    const formattedEmployees = employees.map((employee) => ({
      id: employee.id,
      employeeCode: employee.employeeCode,
      name: employee.user.name,
      email: employee.user.email,
      role: employee.user.role,
      isActive: employee.user.isActive,
      lastLoginAt: employee.user.lastLoginAt,
      department: employee.department,
      designation: employee.designation,
      status: employee.status,
      joiningDate: employee.joiningDate,
      phone: employee.phone,
      manager: employee.manager
        ? {
            id: employee.manager.id,
            name: employee.manager.name,
            email: employee.manager.email,
          }
        : null,
      hasManager: !!employee.managerId,
      organization: employee.organization,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: formattedEmployees,
      meta: {
        total: formattedEmployees.length,
        limit,
        filters: {
          search,
          departmentId,
          managerId,
          withoutManager,
          withManager,
        },
      },
    });
  } catch (error) {
    console.error('[Get Employees] Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
});

/**
 * Helper function to get all users formatted as employees
 * This includes users without Employee records (like MANAGER role users who have employee records)
 * Excludes: ADMIN, SUPER_ADMIN, DIRECTOR roles as they cannot have managers assigned
 */
async function getUsersAsEmployees(
  search: string | undefined,
  baseWhere: Record<string, unknown>,
  limit: number
) {
  const userWhere: Record<string, unknown> = {
    isActive: true,
  };

  // Apply organization filter
  if (baseWhere.organizationId) {
    userWhere.organizationId = baseWhere.organizationId;
  }

  // Apply search filter
  if (search) {
    userWhere.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
    ];
  }

  const users = await prisma.user.findMany({
    where: userWhere,
    include: {
      employee: {
        include: {
          department: {
            select: {
              id: true,
              name: true,
            },
          },
          manager: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      managedTeam: {
        select: {
          id: true,
          employeeCode: true,
        },
      },
      organization: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  // Filter out ADMIN, SUPER_ADMIN, DIRECTOR roles as they cannot have managers assigned
  const excludedRoles = ['ADMIN', 'SUPER_ADMIN', 'DIRECTOR'];
  const filteredUsers = users.filter(user => !excludedRoles.includes(user.role));

  // Format users as employees
  const formattedEmployees = filteredUsers.map((user) => {
    const emp = user.employee;
    return {
      id: emp?.id || `user-${user.id}`,
      employeeCode: emp?.employeeCode || `USR-${user.id.slice(0, 8).toUpperCase()}`,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      department: emp?.department || null,
      designation: emp?.designation || user.role,
      status: emp?.status || 'ACTIVE',
      joiningDate: emp?.joiningDate || user.createdAt,
      phone: emp?.phone || user.phone || '',
      manager: emp?.manager
        ? {
            id: emp.manager.id,
            name: emp.manager.name,
            email: emp.manager.email,
          }
        : null,
      hasManager: !!emp?.managerId,
      organization: user.organization,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  });

  return NextResponse.json({
    success: true,
    data: formattedEmployees,
    meta: {
      total: formattedEmployees.length,
      limit,
      filters: {
        search,
        includeAllUsers: true,
      },
    },
  });
}
