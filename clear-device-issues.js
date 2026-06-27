const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('Clearing DeviceIssue table...');
    await prisma.deviceIssue.deleteMany();
    console.log('✓ DeviceIssue table cleared');
    
    console.log('Pushing schema changes...');
    await prisma.$disconnect();
    console.log('✓ Done');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
