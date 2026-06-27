import { prisma } from '@/lib/prisma';
import { cacheInvalidate } from '@/lib/redis';

/**
 * Master Data Management Service
 * Centralized management of core business entities
 *
 * NOTE: Optimized for current Prisma schema
 * All field references match exact schema definitions
 */

// ============================================================================
// EMPLOYEE MASTER DATA
// ============================================================================

/**
 * Get complete employee master record with all related data
 */
export async function getEmployeeMasterRecord(employeeId: string) {
  return prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true
        }
      },
      department: {
        select: {
          id: true,
          name: true,
          description: true,
          managerId: true
        }
      },
      emergencyContacts: {
        select: {
          id: true,
          name: true,
          phone: true,
          relationship: true
        }
      },
      bankDetails: {
        select: {
          accountHolder: true,
          bankName: true,
          accountNumber: true
        }
      },
      personalInfo: {
        select: {
          nationality: true,
          bloodGroup: true,
          maritalStatus: true,
          panNumber: true,
          aadharNumber: true
        }
      },
      educationDetails: {
        select: {
          type: true,
          institutionName: true,
          fieldOfStudy: true,
          grade: true,
          endDate: true
        }
      }
    }
  });
}

/**
 * Validate master data completeness
 * Returns validation warnings if required fields are missing
 */
export async function validateEmployeeMasterData(employeeId: string): Promise<{
  isValid: boolean;
  warnings: string[];
}> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      user: true,
      department: true,
      emergencyContacts: true,
      bankDetails: true,
      personalInfo: true
    }
  });

  if (!employee) {
    return { isValid: false, warnings: ['Employee not found'] };
  }

  const warnings: string[] = [];

  // Basic employee info
  if (!employee.employeeCode) warnings.push('Employee code missing');
  if (!employee.designation) warnings.push('Designation missing');

  // Contact info
  if (!employee.phone) warnings.push('Contact phone missing');
  if (!employee.address) warnings.push('Address missing');

  // User account
  if (!employee.user) warnings.push('User account not linked');
  if (employee.user && !employee.user.isActive) warnings.push('User account inactive');

  // Department
  if (!employee.departmentId) warnings.push('Department assignment missing');

  // Optional but recommended
  if (!employee.emergencyContacts || employee.emergencyContacts.length === 0)
    warnings.push('Emergency contact missing');
  if (!employee.bankDetails) warnings.push('Bank details missing');
  if (!employee.personalInfo) warnings.push('Personal information incomplete');

  return {
    isValid: warnings.length === 0,
    warnings
  };
}

/**
 * Merge duplicate employee records (admin function)
 * Combines data from duplicate and makes primary record canonical
 */
export async function mergeEmployeeRecords(
  primaryEmployeeId: string,
  duplicateEmployeeId: string
) {
  const primary = await prisma.employee.findUnique({
    where: { id: primaryEmployeeId }
  });

  const duplicate = await prisma.employee.findUnique({
    where: { id: duplicateEmployeeId }
  });

  if (!primary || !duplicate) {
    throw new Error('One or both employee records not found');
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Update all attendance records
      await tx.attendance.updateMany({
        where: { employeeId: duplicate.id },
        data: { employeeId: primary.id }
      });

      // Update all leave requests
      await tx.leaveRequest.updateMany({
        where: { employeeId: duplicate.id },
        data: { employeeId: primary.id }
      });

      // Update payroll records
      await tx.payroll.updateMany({
        where: { employeeId: duplicate.id },
        data: { employeeId: primary.id }
      });

      // Delete duplicate employee and associated user
      await tx.employee.delete({
        where: { id: duplicateEmployeeId }
      });

      if (duplicate.userId) {
        await tx.user.delete({
          where: { id: duplicate.userId }
        });
      }
    });

    await cacheInvalidate(`employee:*`);

    return {
      success: true,
      message: `Merged employee records: ${duplicateEmployeeId} into ${primaryEmployeeId}`
    };
  } catch (error) {
    throw new Error(`Failed to merge records: ${error}`);
  }
}

// ============================================================================
// ORGANIZATION HIERARCHY
// ============================================================================

/**
 * Get complete organization hierarchy
 */
export async function getOrganizationHierarchy() {
  const departments = await prisma.department.findMany({
    include: {
      manager: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      employees: {
        select: {
          id: true,
          employeeCode: true,
          user: {
            select: {
              name: true,
              email: true
            }
          },
          designation: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });

  return departments;
}

/**
 * Get manager hierarchy / reporting structure
 */
export async function getReportingStructure() {
  const employees = await prisma.employee.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      },
      department: {
        select: {
          id: true,
          name: true
        }
      },
      manager: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  // Build hierarchy
  const hierarchy: Record<string, any[]> = {};

  employees.forEach((emp) => {
    const managerId = emp.managerId || 'NO_MANAGER';
    if (!hierarchy[managerId]) {
      hierarchy[managerId] = [];
    }
    hierarchy[managerId].push(emp);
  });

  return hierarchy;
}

// ============================================================================
// MASTER DATA QUALITY
// ============================================================================

/**
 * Check for duplicate employees (same name, DOB, or employee code)
 */
export async function findDuplicateEmployees() {
  const duplicates: Array<{
    reason: string;
    employees: any[];
  }> = [];

  // Check for duplicate employee codes
  const allEmployees = await prisma.employee.findMany({
    include: { user: { select: { name: true, email: true } } }
  });

  // Group by employee code
  const byCode: Record<string, any[]> = {};
  allEmployees.forEach((emp) => {
    if (!byCode[emp.employeeCode]) byCode[emp.employeeCode] = [];
    byCode[emp.employeeCode].push(emp);
  });

  // Find duplicates
  Object.entries(byCode).forEach(([code, emps]) => {
    if (emps.length > 1) {
      duplicates.push({
        reason: `Duplicate employee code: ${code}`,
        employees: emps
      });
    }
  });

  return duplicates;
}

/**
 * Detect circular manager assignments
 */
export async function detectCircularDependencies() {
  const employees = await prisma.employee.findMany({
    select: { id: true, managerId: true }
  });

  const circularDeps: string[] = [];

  employees.forEach((emp) => {
    const visited = new Set<string>();
    let current: (typeof employees)[number] | undefined = emp;

    while (current && current.managerId) {
      if (visited.has(current.managerId)) {
        circularDeps.push(
          `Circular dependency detected: ${emp.id} -> ... -> ${current.managerId} -> ${emp.id}`
        );
        break;
      }

      visited.add(current.managerId);
      current = employees.find((e) => e.id === current?.managerId);
    }
  });

  return circularDeps;
}

/**
 * Validate referential integrity
 */
export async function validateReferentialIntegrity() {
  const issues: string[] = [];

  // Check employees without users
  const noUser = await prisma.employee.findMany({
    where: {
      userId: {
        equals: ''
      }
    }
  });

  if (noUser.length > 0) {
    issues.push(`${noUser.length} employees without valid user account`);
  }

  // Check for orphaned employee records
  const allEmployees = await prisma.employee.count();
  const employeesWithValidDept = await prisma.employee.count({
    where: {
      departmentId: { not: '' }
    }
  });

  if (employeesWithValidDept < allEmployees) {
    issues.push(`${allEmployees - employeesWithValidDept} employees without department assignment`);
  }

  return issues;
}

/**
 * Get data quality metrics
 */
export async function getDataQualityMetrics() {
  const totalEmployees = await prisma.employee.count();

  const completeness = {
    withPhone: await prisma.employee.count({
      where: { phone: { not: '' } }
    }),
    withAddress: await prisma.employee.count({
      where: { address: { not: '' } }
    }),
    withDepartment: await prisma.employee.count({
      where: { departmentId: { not: '' } }
    }),
    withManager: await prisma.employee.count({
      where: { managerId: { not: null } }
    }),
    withBankDetails: await prisma.bankDetails.count(),
    withEmergencyContact: await prisma.emergencyContact.count()
  };

  const issues = await detectCircularDependencies();
  const duplicates = await findDuplicateEmployees();
  const integrity = await validateReferentialIntegrity();

  return {
    totalRecords: totalEmployees,
    completenessScore:
      totalEmployees === 0
        ? 0
        : (Object.values(completeness).reduce((a, b) => a + b, 0) / (totalEmployees * Object.keys(completeness).length)) * 100,
    completeness,
    issues: {
      circularDependencies: issues.length,
      duplicates: duplicates.length,
      integrityIssues: integrity.length
    },
    recommendations: [
      completeness.withPhone < totalEmployees * 0.9
        ? 'Update phone numbers for all employees'
        : 'Phone contact data is current',
      completeness.withAddress < totalEmployees * 0.9
        ? 'Complete address information'
        : 'Address data is complete',
      issues.length > 0 ? 'Resolve circular manager dependencies' : 'Manager hierarchy is valid',
      duplicates.length > 0 ? 'Review and merge duplicate records' : 'No duplicates detected'
    ]
  };
}
