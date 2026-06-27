/**
 * Fix script to assign manager to employees without one
 * This resolves the issue where leave requests don't appear in manager portal
 * 
 * Usage: node fix-employee-manager.js [manager-email]
 * Example: node fix-employee-manager.js admin@company.com
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixEmployeeManager(managerEmail) {
  console.log('🔧 Fixing Employee Manager Assignment...\n');

  try {
    // Find employees without a manager
    const employeesWithoutManager = await prisma.employee.findMany({
      where: {
        managerId: null
      },
      include: {
        user: true,
        department: true
      }
    });

    if (employeesWithoutManager.length === 0) {
      console.log('✅ All employees have a manager assigned. No fixes needed!');
      return;
    }

    console.log(`⚠️  Found ${employeesWithoutManager.length} employee(s) without a manager:\n`);
    
    employeesWithoutManager.forEach((emp, index) => {
      console.log(`${index + 1}. ${emp.user.name} (${emp.user.email}) - ${emp.employeeCode}`);
    });
    console.log('');

    // If manager email provided, assign that manager to all employees without one
    if (managerEmail) {
      const manager = await prisma.user.findFirst({
        where: {
          email: managerEmail,
          role: 'MANAGER'
        }
      });

      if (!manager) {
        console.log(`❌ Manager with email "${managerEmail}" not found or is not a MANAGER role!`);
        return;
      }

      console.log(`📋 Assigning ${manager.name} (${manager.email}) as manager to ${employeesWithoutManager.length} employee(s)...\n`);

      let updatedCount = 0;
      for (const employee of employeesWithoutManager) {
        try {
          await prisma.employee.update({
            where: { id: employee.id },
            data: { managerId: manager.id }
          });
          console.log(`✅ Updated: ${employee.user.name} -> Manager: ${manager.name}`);
          updatedCount++;
        } catch (error) {
          console.log(`❌ Failed to update ${employee.user.name}: ${error.message}`);
        }
      }

      console.log(`\n✅ Successfully assigned manager to ${updatedCount}/${employeesWithoutManager.length} employee(s)`);
    } else {
      console.log('ℹ️  To assign a manager, run:');
      console.log(`   node fix-employee-manager.js <manager-email>\n`);
      console.log('Example:');
      console.log(`   node fix-employee-manager.js manager@company.com\n`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get manager email from command line
const managerEmail = process.argv[2];
fixEmployeeManager(managerEmail);
