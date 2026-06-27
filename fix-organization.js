const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAndFixOrganization() {
  try {
    console.log('Checking database for organization and user data...\n');

    // Check organizations
    const orgCount = await prisma.organization.count();
    console.log(`📊 Total organizations found: ${orgCount}`);

    if (orgCount === 0) {
      console.log('\n⚠️  No organizations found! Creating default organization...\n');
      
      const org = await prisma.organization.create({
        data: {
          name: 'Default Organization',
          slug: 'default-org',
          country: 'India'
        }
      });
      
      console.log(`✅ Created organization: ${org.name} (ID: ${org.id})`);
    }

    // Get the first organization
    const org = await prisma.organization.findFirst();
    console.log(`\n🏢 Active organization: ${org?.name || 'None'}`);

    // Check users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        organizationId: true,
        role: true
      }
    });

    console.log(`\n👥 Total users found: ${users.length}`);
    
    const usersWithoutOrg = users.filter(u => !u.organizationId);
    console.log(`⚠️  Users without organization: ${usersWithoutOrg.length}`);

    if (usersWithoutOrg.length > 0 && org) {
      console.log('\n🔧 Assigning organization to users without one...\n');
      
      for (const user of usersWithoutOrg) {
        await prisma.user.update({
          where: { id: user.id },
          data: { organizationId: org.id }
        });
        console.log(`   ✓ Updated user: ${user.name} (${user.email})`);
      }
      
      console.log('\n✅ All users now have an organization assigned!');
    }

    // Check employees
    const employees = await prisma.employee.findMany({
      select: {
        id: true,
        employeeCode: true,
        userId: true
      }
    });

    console.log(`\n👨‍💼 Total employees found: ${employees.length}`);

    // Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Organizations: ${orgCount > 0 ? orgCount : 1} (created if needed)`);
    console.log(`Users: ${users.length}`);
    console.log(`Employees: ${employees.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (org) {
      console.log(`\n✅ Database is properly configured!`);
      console.log(`   Organization: ${org.name}`);
      console.log(`   Slug: ${org.slug}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndFixOrganization();
