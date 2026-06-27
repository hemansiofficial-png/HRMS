import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withAdminAuth } from '@/lib/rbac';

/**
 * GET /api/admin/managers
 * Get all potential managers - users with MANAGER role OR employees with Manager designation
 */
export const GET = withAdminAuth(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const departmentId = searchParams.get('departmentId') || undefined;
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const skipOrgFilter = searchParams.get('skipOrgFilter') === 'true';

    const session = await auth();
    const organizationId = (session?.user as any)?.organizationId || undefined;
    const userRole = (session?.user as any)?.role || 'EMPLOYEE';

    // Find users who can be managers:
    // 1. Users with MANAGER, ADMIN, HR_MANAGER, SUPER_ADMIN roles
    const where: Record<string, unknown> = {
      isActive: true,
    };

    // Only filter by organization if it exists and skipOrgFilter is not true
    // SUPER_ADMIN can always see all managers
    if (organizationId && !skipOrgFilter && userRole !== 'SUPER_ADMIN') {
      where.organizationId = organizationId;
    }

    // Add search filter
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    // Get all users with MANAGER-related roles (including SUPER_ADMIN)
    const managers = await prisma.user.findMany({
      where: {
        ...where,
        role: {
          in: ['MANAGER', 'ADMIN', 'HR_MANAGER', 'SUPER_ADMIN']
        }
      },
      include: {
        employee: {
          include: {
            department: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        },
        managedTeam: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        managedDept: true,
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { name: 'asc' },
      take: limit,
    });

    // Format the response
    const formattedManagers = managers.map((manager) => ({
      id: manager.id,
      name: manager.name,
      email: manager.email,
      role: manager.role,
      organizationId: manager.organizationId,
      organization: manager.organization,
      teamSize: manager.managedTeam.length,
      teamMembers: manager.managedTeam.map((e) => ({
        id: e.id,
        employeeCode: e.employeeCode,
        name: e.user.name,
        email: e.user.email,
      })),
      departmentsManaged: manager.managedDept.map((d) => ({
        id: d.id,
        name: d.name,
      })),
      designation: manager.employee?.designation || 'Manager',
      createdAt: manager.createdAt,
      lastLoginAt: manager.lastLoginAt,
    }));

    return NextResponse.json({
      success: true,
      data: formattedManagers,
      meta: {
        total: formattedManagers.length,
        limit,
        search,
        departmentId,
      },
    });
  } catch (error) {
    console.error('[Get Managers] Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to fetch managers' },
      { status: 500 }
    );
  }
});
