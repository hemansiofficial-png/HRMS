import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withAdminAuth } from '@/lib/rbac';
import { logManagerRemoval } from '@/lib/audit-log-service';

/**
 * POST /api/admin/remove-manager
 * Remove manager assignment from employees (set managerId to null)
 * 
 * Request Body:
 * {
 *   "employeeIds": string[]
 * }
 */
export const POST = withAdminAuth(async (req) => {
  try {
    const body = await req.json();
    const { employeeIds } = body;

    // Validation: Check required fields
    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'employeeIds array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Remove duplicates
    const uniqueEmployeeIds = [...new Set(employeeIds)];

    // Verify all employees exist and currently have a manager
    // First check in Employee model
    const employeesFromDB = await prisma.employee.findMany({
      where: {
        id: { in: uniqueEmployeeIds.filter(id => !id.startsWith('user-')) },
      },
      include: {
        user: true,
        manager: true,
      },
    });

    // Also fetch users directly for IDs that weren't found in Employee table
    const foundEmployeeIds = employeesFromDB.map(e => e.id);
    const missingIds = uniqueEmployeeIds.filter(id => !foundEmployeeIds.includes(id));
    
    let employees: any[] = employeesFromDB;
    
    // Users without Employee records can't have managers, so they're skipped
    const usersWithoutRecords = missingIds;

    // Filter employees who actually have a manager
    const employeesWithManager = employees.filter((e) => e.managerId);
    const employeesWithoutManager = employees.filter((e) => !e.managerId);

    if (employeesWithManager.length === 0) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'None of the selected employees have a manager assigned' },
        { status: 400 }
      );
    }

    // Update all employees to remove managerId in a transaction
    const updatePromises = employeesWithManager.map((employee) =>
      prisma.employee.update({
        where: { id: employee.id },
        data: { managerId: null },
        include: {
          user: true,
          manager: true,
        },
      })
    );

    const updatedEmployees = await prisma.$transaction(updatePromises);

    // Get session for audit logging
    const session = await auth();
    const adminUserId = session?.user?.id || 'unknown';
    const adminName = session?.user?.name || 'Unknown';
    const organizationId = (session?.user as any)?.organizationId || undefined;

    // Group employees by their previous manager for audit logging
    const employeesByManager = new Map<string, typeof employeesWithManager>();
    employeesWithManager.forEach((e) => {
      if (e.managerId) {
        if (!employeesByManager.has(e.managerId)) {
          employeesByManager.set(e.managerId, []);
        }
        employeesByManager.get(e.managerId)!.push(e);
      }
    });

    // Create audit logs for each manager
    for (const [managerId, emps] of employeesByManager.entries()) {
      const manager = emps[0].manager;
      await logManagerRemoval({
        adminUserId,
        adminName,
        employeeIds: emps.map((e) => e.id),
        employeeNames: emps.map((e) => e.user.name),
        previousManagerId: managerId,
        previousManagerName: manager?.name || 'Unknown',
        organizationId,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully removed manager from ${updatedEmployees.length} employee(s)${usersWithoutRecords.length > 0 ? ` (Skipped ${usersWithoutRecords.length} user(s) without employee records)` : ''}`,
      data: {
        updatedEmployees: updatedEmployees.map((e) => ({
          id: e.id,
          employeeCode: e.employeeCode,
          name: e.user.name,
          email: e.user.email,
          previousManager: e.manager
            ? {
                id: e.manager.id,
                name: e.manager.name,
                email: e.manager.email,
              }
            : null,
          newManagerId: null,
        })),
        summary: {
          totalUpdated: updatedEmployees.length,
          skippedWithoutRecords: usersWithoutRecords.length,
          managersRemoved: employeesByManager.size,
          alreadyWithoutManager: employeesWithoutManager.length,
        },
      },
    });
  } catch (error) {
    console.error('[Remove Manager] Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to remove manager' },
      { status: 500 }
    );
  }
});
