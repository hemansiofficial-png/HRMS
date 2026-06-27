const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createManager() {
  // Generate a random password for the manager
  const managerPassword = 'Manager@2026';
  const passwordHash = await bcrypt.hash(managerPassword, 10);

  // Get or create the organization
  let organization = await prisma.organization.findFirst();
  
  if (!organization) {
    organization = await prisma.organization.create({
      data: {
        name: 'Default Organization',
        code: 'ORG-001',
        status: 'ACTIVE'
      }
    });
    console.log('Created default organization:', organization.name);
  }

  // Get or create a department for the manager
  let department = await prisma.department.findFirst({
    where: { name: 'Operations' }
  });

  if (!department) {
    department = await prisma.department.create({
      data: {
        name: 'Operations',
        description: 'Operations department managed by manager'
      }
    });
    console.log('Created Operations department');
  }

  // Create the manager user
  const manager = await prisma.user.create({
    data: {
      name: 'Operations Manager',
      email: 'manager@hrms.local',
      password: passwordHash,
      role: 'MANAGER',
      organizationId: organization.id
    }
  });

  console.log('Created manager user:', manager.email);

  // Create employee record for the manager
  const employee = await prisma.employee.create({
    data: {
      userId: manager.id,
      employeeCode: 'EMP-MGR-001',
      departmentId: department.id,
      designation: 'Operations Manager',
      phone: '9876543210',
      address: 'Corporate Office, India',
      joiningDate: new Date('2024-01-01'),
      salary: 75000,
      status: 'ACTIVE',
      organizationId: organization.id,
      managerId: null // Top-level manager
    }
  });

  // Update the department to have this manager
  await prisma.department.update({
    where: { id: department.id },
    data: {
      managerId: manager.id
    }
  });

  console.log('\n========================================');
  console.log('✅ MANAGER PROFILE CREATED SUCCESSFULLY');
  console.log('========================================');
  console.log('📧 Email:    manager@hrms.local');
  console.log('🔑 Password: Manager@2026');
  console.log('👤 Role:     MANAGER');
  console.log('🏢 Department: Operations');
  console.log('========================================\n');

  return { manager, employee };
}

createManager()
  .catch((error) => {
    console.error('❌ Error creating manager:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
