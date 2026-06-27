import { prisma } from '@/lib/prisma';
import { cacheGet, cacheSet, cacheInvalidate } from '@/lib/redis';
import { employeeSchema } from '@/lib/validations';

// Cache keys patterns
const CACHE_KEYS = {
  employees: 'employees:*',
  employee: (id: string) => `employee:${id}`,
  employeesByDept: (deptId: string) => `employees:dept:${deptId}`,
  employeeList: 'employees:list'
};

/**
 * List employees with caching
 * Optimal for dashboard and employee directory pages
 */
export async function listEmployeesOptimized(search?: string, departmentId?: string) {
  // Cache key based on filters
  const cacheKey = `${CACHE_KEYS.employeeList}:${search || 'all'}:${departmentId || 'all'}`;

  // Try cache first
  const cached = await cacheGet(cacheKey);
  if (cached) {
    console.log('Cache HIT for:', cacheKey);
    return cached;
  }

  // Query database with optimized selects
  const employees = await prisma.employee.findMany({
    where: {
      ...(search ? { user: { name: { contains: search, mode: 'insensitive' } } } : {}),
      ...(departmentId ? { departmentId } : {})
    },
    select: {
      id: true,
      employeeCode: true,
      designation: true,
      joiningDate: true,
      salary: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      },
      department: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: {
      user: {
        name: 'asc'
      }
    }
  });

  // Cache the result for 5 minutes
  await cacheSet(cacheKey, employees, 300);

  return employees;
}

/**
 * Get single employee with aggressive caching
 */
export async function getEmployeeOptimized(id: string) {
  const cacheKey = CACHE_KEYS.employee(id);

  // Try cache first
  const cached = await cacheGet(cacheKey);
  if (cached) {
    console.log('Cache HIT for:', cacheKey);
    return cached;
  }

  // Query database
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      user: true,
      department: true
    }
  });

  if (!employee) return null;

  // Cache for 10 minutes
  await cacheSet(cacheKey, employee, 600);

  return employee;
}

/**
 * Create employee with cache invalidation
 */
export async function createEmployeeOptimized(payload: unknown) {
  const parsed = employeeSchema.parse(payload);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: parsed.name,
        email: parsed.email,
        password: '$2a$10$examplehashedpasswordstringforseed',
        role: parsed.role
      }
    });

    return tx.employee.create({
      data: {
        userId: user.id,
        employeeCode: `EMP-${Date.now()}`,
        departmentId: parsed.departmentId,
        designation: parsed.designation,
        phone: parsed.phone,
        address: parsed.address,
        joiningDate: new Date(parsed.joiningDate),
        salary: parsed.salary
      },
      include: { user: true, department: true }
    });
  });

  // Invalidate all employee list caches
  await cacheInvalidate(CACHE_KEYS.employees);
  await cacheInvalidate(CACHE_KEYS.employeesByDept(parsed.departmentId));

  return result;
}

/**
 * Update employee with cache invalidation
 */
export async function updateEmployeeOptimized(id: string, payload: unknown) {
  const parsed = employeeSchema.parse(payload);

  const employee = await prisma.employee.update({
    where: { id },
    data: {
      designation: parsed.designation,
      phone: parsed.phone,
      address: parsed.address,
      salary: parsed.salary
    },
    include: { user: true, department: true }
  });

  // Invalidate specific employee cache and list caches
  await cacheInvalidate(CACHE_KEYS.employee(id));
  await cacheInvalidate(CACHE_KEYS.employees);
  if (employee.departmentId) {
    await cacheInvalidate(CACHE_KEYS.employeesByDept(employee.departmentId));
  }

  return employee;
}

/**
 * Delete employee with cache invalidation
 */
export async function deleteEmployeeOptimized(id: string) {
  // Get employee first to know which caches to invalidate
  const employee = await prisma.employee.findUnique({
    where: { id },
    select: { departmentId: true, userId: true }
  });

  if (!employee) throw new Error('Employee not found');

  // Delete in transaction
  await prisma.$transaction(async (tx) => {
    await tx.employee.delete({ where: { id } });
    await tx.user.delete({ where: { id: employee.userId } });
  });

  // Invalidate caches
  await cacheInvalidate(CACHE_KEYS.employee(id));
  await cacheInvalidate(CACHE_KEYS.employees);
  if (employee.departmentId) {
    await cacheInvalidate(CACHE_KEYS.employeesByDept(employee.departmentId));
  }
}

/**
 * Get employees by department (optimized for department pages)
 */
export async function getEmployeesByDepartmentOptimized(departmentId: string) {
  const cacheKey = CACHE_KEYS.employeesByDept(departmentId);

  const cached = await cacheGet(cacheKey);
  if (cached) {
    console.log('Cache HIT for:', cacheKey);
    return cached;
  }

  const employees = await prisma.employee.findMany({
    where: { departmentId },
    select: {
      id: true,
      employeeCode: true,
      designation: true,
      user: {
        select: {
          name: true,
          email: true
        }
      }
    },
    orderBy: { user: { name: 'asc' } }
  });

  await cacheSet(cacheKey, employees, 600);
  return employees;
}
