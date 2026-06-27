/**
 * Diagnostic script to check leave request visibility issues
 * Run with: node check-leave-requests.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLeaveRequests() {
  console.log('🔍 Checking Leave Request Visibility Issues...\n');

  try {
    // Find the user Hemantsaini
    const user = await prisma.user.findFirst({
      where: {
        email: {
          contains: 'hemantsaini',
          mode: 'insensitive'
        }
      },
      include: {
        employee: {
          include: {
            department: true,
            manager: true
          }
        },
        organization: true
      }
    });

    if (!user) {
      console.log('❌ User with email containing "hemantsaini" not found!');
      return;
    }

    console.log('✅ User Found:');
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   Organization ID: ${user.organizationId}`);
    console.log('');

    if (!user.employee) {
      console.log('❌ CRITICAL ISSUE: User does not have an Employee record!');
      console.log('   This means leave requests cannot be created for this user.');
      console.log('   Solution: Create an Employee record for this user.');
      return;
    }

    console.log('✅ Employee Record:');
    console.log(`   Employee ID: ${user.employee.id}`);
    console.log(`   Employee Code: ${user.employee.employeeCode}`);
    console.log(`   Department: ${user.employee.department?.name || 'N/A'}`);
    console.log(`   Manager ID: ${user.employee.managerId || '⚠️ NULL - No manager assigned!'}`);
    console.log(`   Organization ID: ${user.employee.organizationId}`);
    console.log('');

    // Check if employee has a manager
    if (!user.employee.managerId) {
      console.log('⚠️  WARNING: Employee has no manager assigned!');
      console.log('   This means:');
      console.log('   - Managers won\'t see this employee\'s leave requests');
      console.log('   - Only ADMIN/HR_MANAGER will see the requests');
      console.log('');
    }

    // Fetch leave requests for this employee
    const leaveRequests = await prisma.leaveRequest.findMany({
      where: {
        employeeId: user.employee.id
      },
      include: {
        employee: {
          include: {
            user: true,
            manager: true
          }
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📄 Leave Requests Found: ${leaveRequests.length}`);
    console.log('');

    if (leaveRequests.length === 0) {
      console.log('ℹ️  No leave requests found for this employee.');
      console.log('   The employee hasn\'t submitted any leave requests yet.');
      return;
    }

    leaveRequests.forEach((leave, index) => {
      console.log(`--- Leave Request #${index + 1} ---`);
      console.log(`   ID: ${leave.id}`);
      console.log(`   Type: ${leave.leaveType}`);
      console.log(`   From: ${leave.startDate.toDateString()} To: ${leave.endDate.toDateString()}`);
      console.log(`   Days: ${leave.numberOfDays}`);
      console.log(`   Status: ${leave.status}`);
      console.log(`   Reason: ${leave.reason.substring(0, 50)}...`);
      console.log(`   Created: ${leave.createdAt.toISOString()}`);
      console.log(`   Employee Manager ID: ${leave.employee.managerId || 'NULL'}`);
      console.log(`   Approved By: ${leave.approver ? leave.approver.name : 'N/A'}`);
      console.log('');
    });

    // Check who can see these leave requests
    console.log('👥 Visibility Analysis:');
    
    // Find all managers in the organization
    const managers = await prisma.user.findMany({
      where: {
        organizationId: user.organizationId,
        role: 'MANAGER'
      },
      include: {
        employee: true
      }
    });

    console.log(`\n   Managers in organization: ${managers.length}`);
    for (const manager of managers) {
      const canSeeLeaves = user.employee.managerId === manager.id;
      console.log(`   - ${manager.name} (${manager.email}): ${canSeeLeaves ? '✅ CAN see' : '❌ CANNOT see'} leaves`);
    }

    // Find admin/HR managers
    const adminUsers = await prisma.user.findMany({
      where: {
        organizationId: user.organizationId,
        role: {
          in: ['ADMIN', 'HR_MANAGER', 'SUPER_ADMIN']
        }
      }
    });

    console.log(`\n   Admin/HR Users (can see all leaves): ${adminUsers.length}`);
    adminUsers.forEach(admin => {
      console.log(`   - ${admin.name} (${admin.email})`);
    });

    // Check for other employees in same department
    if (user.employee.departmentId) {
      const deptColleagues = await prisma.employee.findMany({
        where: {
          departmentId: user.employee.departmentId,
          id: {
            not: user.employee.id
          }
        },
        include: {
          user: true
        }
      });

      console.log(`\n   Colleagues in same department: ${deptColleagues.length}`);
      deptColleagues.forEach(colleague => {
        console.log(`   - ${colleague.user.name} (${colleague.user.email})`);
      });
    }

    console.log('\n✅ Diagnostic Complete!\n');

  } catch (error) {
    console.error('❌ Error during diagnostic:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLeaveRequests();
