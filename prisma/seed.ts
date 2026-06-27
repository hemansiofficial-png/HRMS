import * as bcrypt from 'bcryptjs';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Minimal seed file - Creates only essential admin users
 * 
 * NOTE: All other data (employees, resignations, lifecycle events, etc.) 
 * should be created through the application UI/API, not via seed files.
 * This ensures data consistency and proper business logic execution.
 */

async function upsertUserWithEmployee(params: {
  name: string;
  email: string;
  role: Role;
  employeeCode: string;
  designation: string;
}) {
  const passwordHash = await bcrypt.hash('Pass@123', 10);

  const user = await prisma.user.upsert({
    where: { email: params.email },
    update: {
      name: params.name,
      role: params.role,
      password: passwordHash
    },
    create: {
      name: params.name,
      email: params.email,
      password: passwordHash,
      role: params.role
    }
  });

  // Check if employee already exists for this user
  const existingEmployee = await prisma.employee.findUnique({
    where: { userId: user.id }
  });

  if (!existingEmployee) {
    const department = await prisma.department.upsert({
      where: { name: 'General' },
      update: {},
      create: {
        name: 'General',
        description: 'Default department'
      }
    });

    // Check if employee code already exists
    const existingCode = await prisma.employee.findUnique({
      where: { employeeCode: params.employeeCode }
    });

    if (!existingCode) {
      await prisma.employee.create({
        data: {
          userId: user.id,
          employeeCode: params.employeeCode,
          departmentId: department.id,
          designation: params.designation,
          phone: '9999999999',
          address: 'India',
          joiningDate: new Date(),
          salary: 50000,
          status: 'ACTIVE'
        }
      });
    }
  }
}

async function main() {
  console.log('🌱 Seeding essential admin users...\n');

  await upsertUserWithEmployee({
    name: 'System Admin',
    email: 'admin@hrms.local',
    role: 'ADMIN',
    employeeCode: 'EMP-ADMIN-001',
    designation: 'Administrator'
  });

  await upsertUserWithEmployee({
    name: 'HR Manager',
    email: 'hr@hrms.local',
    role: 'HR_MANAGER',
    employeeCode: 'EMP-HR-001',
    designation: 'HR Manager'
  });

  await upsertUserWithEmployee({
    name: 'Demo Employee',
    email: 'employee@hrms.local',
    role: 'EMPLOYEE',
    employeeCode: 'EMP-USER-001',
    designation: 'Software Engineer'
  });

  console.log('✅ Seed completed successfully!\n');
  console.log('📋 Demo credentials:');
  console.log('  ADMIN      -> admin@hrms.local    / Pass@123');
  console.log('  HR_MANAGER -> hr@hrms.local       / Pass@123');
  console.log('  EMPLOYEE   -> employee@hrms.local / Pass@123\n');
  console.log('💡 Note: Create employees, resignations, and other data through the application UI.\n');
}

main()
  .catch((error) => {
    console.error('❌ Seed error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
