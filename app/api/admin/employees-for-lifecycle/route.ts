import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRoleAuth, Role } from '@/lib/rbac';

/**
 * GET /api/admin/employees-for-lifecycle
 * Get all employees (excluding users with ADMIN role) for lifecycle event dropdown
 * Accessible by: ADMIN, HR_MANAGER, PAYROLL_ADMIN, MANAGER
 */
export const GET = withRoleAuth('HR_MANAGER', async (req, _context) => {
  try {
    const session = await auth();
    const organizationId = (session?.user as any)?.organizationId || undefined;

    // Get all employees excluding ADMIN role users
    const employees = await prisma.employee.findMany({
      where: {
        organizationId: organizationId,
        user: {
          role: {
            not: 'ADMIN'
          },
          isActive: true
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        department: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: { 
        user: { 
          name: 'asc' 
        } 
      },
    });

    // Format the response
    const formattedEmployees = employees.map((emp) => ({
      id: emp.id,
      employeeCode: emp.employeeCode,
      designation: emp.designation,
      department: emp.department?.name || 'N/A',
      status: emp.status,
      user: {
        id: emp.user.id,
        name: emp.user.name,
        email: emp.user.email,
      }
    }));

    return NextResponse.json({
      success: true,
      data: formattedEmployees,
      meta: {
        total: formattedEmployees.length,
      },
    });
  } catch (error) {
    console.error('[Get Employees for Lifecycle] Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
});
