import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withAdminAuth, Role } from '@/lib/rbac';
import { logManagerAssignment, logManagerReassignment } from '@/lib/audit-log-service';

/**
 * POST /api/admin/assign-manager
 * Assign a manager to multiple employees
 * 
 * Request Body:
 * {
 *   "managerId": string,
 *   "employeeIds": string[]
 * }
 */
export const POST = withAdminAuth(async (req) => {
  try {
    const body = await req.json();
    const { managerId, employeeIds } = body;

    // Validation: Check required fields
    if (!managerId) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'managerId is required' },
        { status: 400 }
      );
    }

    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'employeeIds array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Remove duplicates
    const uniqueEmployeeIds = [...new Set(employeeIds)];

    // Validation: Prevent assigning manager to themselves
    if (uniqueEmployeeIds.includes(managerId)) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Cannot assign a manager to themselves' },
        { status: 400 }
      );
    }

    // Verify the manager exists and has MANAGER role
    const manager = await prisma.user.findUnique({
      where: { id: managerId },
      include: { employee: true },
    });

    if (!manager) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Manager not found' },
        { status: 404 }
      );
    }

    // Allow ADMIN, HR_MANAGER, MANAGER, and SUPER_ADMIN roles to be assigned as managers
    const allowedManagerRoles = ['ADMIN', 'HR_MANAGER', 'MANAGER', 'SUPER_ADMIN'];
    if (!allowedManagerRoles.includes(manager.role)) {
      return NextResponse.json(
        { error: 'Validation Error', message: `User "${manager.name}" does not have a valid manager role. Current role: ${manager.role}. Allowed roles: ${allowedManagerRoles.join(', ')}` },
        { status: 400 }
      );
    }

    // Verify all employees/users exist
    // First check in Employee model, then in User model for those without employee records
    const employeesFromDB = await prisma.employee.findMany({
      where: {
        id: { in: uniqueEmployeeIds.filter(id => !id.startsWith('user-')) },
      },
      include: {
        user: true,
        manager: true,
      },
    });

    // Also fetch users directly for IDs that start with 'user-' or weren't found in Employee table
    const foundEmployeeIds = employeesFromDB.map(e => e.id);
    const missingIds = uniqueEmployeeIds.filter(id => !foundEmployeeIds.includes(id));
    
    let employees: any[] = employeesFromDB;
    
    if (missingIds.length > 0) {
      // Try to find these as users without employee records
      const userIds = missingIds.map(id => id.startsWith('user-') ? id.replace('user-', '') : id);
      const users = await prisma.user.findMany({
        where: {
          id: { in: userIds }
        },
        include: {
          employee: true,
        }
      });
      
      // Format users as employees for consistency
      const usersAsEmployees = users.map(user => ({
        id: user.employee?.id || `user-${user.id}`,
        userId: user.id,
        employeeCode: user.employee?.employeeCode || `USR-${user.id.slice(0, 8).toUpperCase()}`,
        user: user,
        manager: null,
        managerId: null,
        departmentId: user.employee?.departmentId || null,
        designation: user.employee?.designation || user.role,
        status: user.employee?.status || 'ACTIVE',
        joiningDate: user.employee?.joiningDate || user.createdAt,
        phone: user.employee?.phone || user.phone || '',
      }));
      
      employees = [...employeesFromDB, ...usersAsEmployees];
    }

    if (employees.length !== uniqueEmployeeIds.length) {
      const foundIds = employees.map((e) => e.id);
      const missingIdsFinal = uniqueEmployeeIds.filter((id) => !foundIds.includes(id));
      return NextResponse.json(
        { error: 'Not Found', message: `Employees/Users not found: ${missingIdsFinal.join(', ')}` },
        { status: 404 }
      );
    }

    // Validate all employees have valid roles (allow EMPLOYEE, MANAGER, and also ADMIN, SUPER_ADMIN, etc.)
    const allowedRoles = ['EMPLOYEE', 'MANAGER', 'ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'PAYROLL_ADMIN'];
    const invalidRoleUsers = employees.filter(
      (e) => !allowedRoles.includes(e.user.role)
    );
    if (invalidRoleUsers.length > 0) {
      const names = invalidRoleUsers.map((e) => e.user.name).join(', ');
      return NextResponse.json(
        { error: 'Validation Error', message: `Cannot assign manager to users with invalid roles: ${names}` },
        { status: 400 }
      );
    }

    // Check for circular hierarchy
    // Prevent assigning if the manager would become subordinate to any of these employees
    const employeeUserIds = employees.map((e) => e.userId);

    // Get the manager's own manager (if any) to prevent circular reference
    const managersManager = await prisma.employee.findUnique({
      where: { userId: managerId },
      select: { managerId: true },
    });

    if (managersManager?.managerId) {
      const circularCheck = employeeUserIds.includes(managersManager.managerId);
      if (circularCheck) {
        return NextResponse.json(
          {
            error: 'Validation Error',
            message: 'Cannot create circular hierarchy. The selected manager reports to one of the employees being assigned.'
          },
          { status: 400 }
        );
      }
    }

    // Separate employees into new assignments and reassignments
    const newAssignments = employees.filter((e) => !e.managerId);
    const reassignments = employees.filter((e) => e.managerId && e.managerId !== managerId);
    const alreadyAssigned = employees.filter((e) => e.managerId === managerId);

    // Update all employees with the new managerId in a transaction
    // For users with Employee records, update the Employee model
    // For users without Employee records, we skip the update (they can't have managers in the current schema)
    const employeesWithRecords = employees.filter((e) => e.id && !e.id.startsWith('user-'));
    const usersWithoutRecords = employees.filter((e) => e.id && e.id.startsWith('user-'));
    
    const updatePromises = employeesWithRecords.map((employee) =>
      prisma.employee.update({
        where: { id: employee.id },
        data: { managerId },
        include: {
          user: true,
          manager: true,
        },
      })
    );

    const updatedEmployees = await prisma.$transaction(updatePromises);
    
    // Note: Users without Employee records (usersWithoutRecords) cannot have managers assigned
    // in the current schema. They are included in the list for visibility but manager assignment is skipped.

    // Get session for audit logging
    const session = await auth();
    const adminUserId = session?.user?.id || 'unknown';
    const adminName = session?.user?.name || 'Unknown';
    const organizationId = (session?.user as any)?.organizationId || undefined;

    // Prepare audit log data
    const employeeNames = employees.map((e) => e.user.name);
    
    // Log each assignment
    if (newAssignments.length > 0) {
      await logManagerAssignment({
        adminUserId,
        adminName,
        managerId,
        managerName: manager.name,
        employeeIds: newAssignments.map((e) => e.id),
        employeeNames: newAssignments.map((e) => e.user.name),
        organizationId,
      });
    }

    if (reassignments.length > 0) {
      const oldManagerIds = [...new Set(reassignments.map((e) => e.managerId).filter(Boolean) as string[])];
      
      // Get old manager details
      const oldManagers = await prisma.user.findMany({
        where: { id: { in: oldManagerIds } },
      });

      for (const oldManager of oldManagers) {
        const reassignedToThisManager = reassignments.filter((e) => e.managerId === oldManager.id);
        await logManagerReassignment({
          adminUserId,
          adminName,
          employeeIds: reassignedToThisManager.map((e) => e.id),
          employeeNames: reassignedToThisManager.map((e) => e.user.name),
          oldManagerId: oldManager.id,
          oldManagerName: oldManager.name,
          newManagerId: managerId,
          newManagerName: manager.name,
          organizationId,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully assigned ${manager.name} as manager to ${updatedEmployees.length} employee(s)${usersWithoutRecords.length > 0 ? ` (Skipped ${usersWithoutRecords.length} user(s) without employee records)` : ''}`,
      data: {
        manager: {
          id: manager.id,
          name: manager.name,
          email: manager.email,
        },
        updatedEmployees: updatedEmployees.map((e) => ({
          id: e.id,
          employeeCode: e.employeeCode,
          name: e.user.name,
          email: e.user.email,
          previousManagerId: employees.find((emp) => emp.id === e.id)?.managerId || null,
          newManagerId: managerId,
        })),
        summary: {
          totalUpdated: updatedEmployees.length,
          skippedWithoutRecords: usersWithoutRecords.length,
          newAssignments: newAssignments.length,
          reassignments: reassignments.length,
          alreadyAssigned: alreadyAssigned.length,
        },
      },
    });
  } catch (error) {
    console.error('[Assign Manager] Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to assign manager' },
      { status: 500 }
    );
  }
});
