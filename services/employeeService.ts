import { prisma } from '@/lib/prisma';
import { employeeSchema } from '@/lib/validations';
import bcrypt from 'bcryptjs';

// Hardcoded default password
const DEFAULT_PASSWORD = 'Pass@123';

// Hash password using bcrypt
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function listEmployees(search?: string, departmentId?: string) {
  return prisma.employee.findMany({
    where: {
      ...(search ? { user: { name: { contains: search, mode: 'insensitive' } } } : {}),
      ...(departmentId ? { departmentId } : {})
    },
    include: {
      user: true,
      department: true,
      manager: true
    }
  });
}

export async function createEmployee(payload: unknown) {
  const parsed = employeeSchema.parse(payload);
  
  // Hash the default password
  const hashedPassword = await hashPassword(DEFAULT_PASSWORD);
  
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: parsed.name,
        email: parsed.email,
        password: hashedPassword,
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
      include: {
        user: true
      }
    });
  });
  
  // Return the default password for display to admin
  return { ...result, generatedPassword: DEFAULT_PASSWORD };
}
