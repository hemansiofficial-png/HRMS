/**
 * Complete fix for Hemant Saini's leave request visibility issue
 * This script will:
 * 1. Assign the correct organizationId to the employee
 * 2. Assign a manager to the employee
 * 
 * Run with: node fix-hemant-leave-issue.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixHemantLeaveIssue() {
  console.log('🔧 Fixing Hemant Sainis Leave Request Visibility Issue...\n');

  try {
    // Find Hemant's user record
    const hemantUser = await prisma.user.findFirst({
      where: {
        email: 'Hemantsaini@hrms.local'
      },
      include: {
        employee: true,
        organization: true
      }
    });

    if (!hemantUser) {
      console.log('❌ User Hemantsaini@hrms.local not found!');
      return;
    }

    console.log('✅ Found User:');
    console.log(`   Name: ${hemantUser.name}`);
    console.log(`   Email: ${hemantUser.email}`);
    console.log(`   Role: ${hemantUser.role}`);
    console.log(`   User ID: ${hemantUser.id}`);
    console.log(`   Organization ID: ${hemantUser.organizationId || 'NULL'}`);
    console.log('');

    if (!hemantUser.employee) {
      console.log('❌ ERROR: User does not have an Employee record!');
      console.log('   Cannot proceed without an Employee record.');
      return;
    }

    console.log('✅ Employee Record:');
    console.log(`   Employee ID: ${hemantUser.employee.id}`);
    console.log(`   Employee Code: ${hemantUser.employee.employeeCode}`);
    console.log(`   Department ID: ${hemantUser.employee.departmentId}`);
    console.log(`   Manager ID: ${hemantUser.employee.managerId || 'NULL'}`);
    console.log(`   Organization ID: ${hemantUser.employee.organizationId || 'NULL'}`);
    console.log('');

    // Find an organization to assign (use the user's organization if available)
    let organizationId = hemantUser.organizationId;
    
    if (!organizationId) {
      // Try to find any organization in the system
      const org = await prisma.organization.findFirst();
      if (org) {
        organizationId = org.id;
        console.log(`ℹ️  User has no organization, will use: ${org.name} (${org.id})`);
      } else {
        console.log('❌ ERROR: No organization found in the system!');
        console.log('   Please create an organization first.');
        return;
      }
    }

    // Find a manager to assign (look for MANAGER role users in same organization)
    let managerToAssign = null;
    
    if (hemantUser.organizationId) {
      managerToAssign = await prisma.user.findFirst({
        where: {
          organizationId: hemantUser.organizationId,
          role: 'MANAGER'
        }
      });
    }

    if (!managerToAssign && organizationId) {
      // Try to find any manager in the organization
      managerToAssign = await prisma.user.findFirst({
        where: {
          organizationId: organizationId,
          role: 'MANAGER'
        }
      });
    }

    if (!managerToAssign) {
      // Try to find any manager in the system
      managerToAssign = await prisma.user.findFirst({
        where: {
          role: 'MANAGER'
        }
      });
    }

    if (!managerToAssign) {
      console.log('⚠️  WARNING: No MANAGER user found in the system!');
      console.log('   Leave requests will only be visible to ADMIN/HR_MANAGER users.');
      console.log('   Consider creating a manager user or assigning an existing user as manager.\n');
    } else {
      console.log('✅ Found Manager to Assign:');
      console.log(`   Name: ${managerToAssign.name}`);
      console.log(`   Email: ${managerToAssign.email}`);
      console.log(`   Manager User ID: ${managerToAssign.id}`);
      console.log('');
    }

    // Apply fixes
    console.log('🔧 Applying Fixes...\n');

    const updateData = {
      organizationId: organizationId
    };

    if (managerToAssign) {
      updateData.managerId = managerToAssign.id;
    }

    console.log(`Updating Employee record:`);
    console.log(`   - Setting organizationId to: ${organizationId}`);
    if (managerToAssign) {
      console.log(`   - Setting managerId to: ${managerToAssign.id} (${managerToAssign.name})`);
    }
    console.log('');

    const updatedEmployee = await prisma.employee.update({
      where: { id: hemantUser.employee.id },
      data: updateData,
      include: {
        user: true,
        manager: true,
        organization: true
      }
    });

    console.log('✅ Employee Record Updated Successfully!\n');
    console.log('Updated Employee Details:');
    console.log(`   Employee ID: ${updatedEmployee.id}`);
    console.log(`   Employee Code: ${updatedEmployee.employeeCode}`);
    console.log(`   Manager: ${updatedEmployee.manager?.name || 'Still NULL'}`);
    console.log(`   Organization: ${updatedEmployee.organization?.name || 'Still NULL'}`);
    console.log('');

    // Verify leave requests are now visible
    const leaveRequests = await prisma.leaveRequest.findMany({
      where: {
        employeeId: updatedEmployee.id
      },
      include: {
        employee: {
          include: {
            manager: true
          }
        }
      }
    });

    console.log(`📄 Leave Requests: ${leaveRequests.length}`);
    leaveRequests.forEach((leave, index) => {
      console.log(`\n   Leave #${index + 1}:`);
      console.log(`      ID: ${leave.id}`);
      console.log(`      Type: ${leave.leaveType}`);
      console.log(`      Status: ${leave.status}`);
      console.log(`      Employee Manager: ${leave.employee.manager?.name || 'NULL'}`);
    });
    console.log('');

    console.log('✅ Fix Complete!\n');
    console.log('📋 Next Steps:');
    console.log('   1. Restart the development server (if running)');
    console.log('   2. Clear browser cache');
    console.log('   3. Login as the manager and check /leave/approvals');
    console.log('   4. The leave request should now be visible\n');

  } catch (error) {
    console.error('❌ Error during fix:', error);
    if (error.code === 'P2002') {
      console.log('\n⚠️  Unique constraint violation. This might happen if data is inconsistent.');
      console.log('   Please check the database manually.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

fixHemantLeaveIssue();
