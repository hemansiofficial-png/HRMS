/**
 * Script to clean up duplicate attendance records and fix dates
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupAndFix() {
  console.log('Starting attendance cleanup...\n');

  try {
    // Get all records grouped by employee
    const allRecords = await prisma.attendance.findMany({
      orderBy: { createdAt: 'asc' }
    });

    // Group by employeeId
    const byEmployee = new Map<string, any[]>();
    for (const record of allRecords) {
      const existing = byEmployee.get(record.employeeId) || [];
      existing.push(record);
      byEmployee.set(record.employeeId, existing);
    }

    console.log(`Found ${allRecords.length} records for ${byEmployee.size} employees\n`);

    // For each employee, keep only one record per date (the one with checkIn)
    let deletedCount = 0;
    for (const [employeeId, records] of byEmployee.entries()) {
      console.log(`Processing employee ${employeeId} (${records.length} records)...`);
      
      const dateMap = new Map<string, any[]>();
      for (const record of records) {
        const dateKey = record.date.toISOString().split('T')[0];
        const existing = dateMap.get(dateKey) || [];
        existing.push(record);
        dateMap.set(dateKey, existing);
      }

      // Delete duplicates, keep the one with checkIn
      for (const [dateKey, dupes] of dateMap.entries()) {
        if (dupes.length > 1) {
          console.log(`  Found ${dupes.length} duplicates for ${dateKey}`);
          
          // Keep the first one (usually has checkIn)
          const toKeep = dupes[0];
          const toDelete = dupes.slice(1);
          
          for (const dupe of toDelete) {
            await prisma.attendance.delete({
              where: { id: dupe.id }
            });
            console.log(`    Deleted: ${dupe.id}`);
            deletedCount++;
          }
        }
      }
    }

    console.log(`\nDeleted ${deletedCount} duplicate records\n`);

    // Now fix the dates
    const remainingRecords = await prisma.attendance.findMany({
      orderBy: { createdAt: 'asc' }
    });

    let updatedCount = 0;
    for (const record of remainingRecords) {
      const referenceTime = record.checkIn || record.checkOut || record.createdAt;
      const referenceDate = new Date(referenceTime);

      const localYear = referenceDate.getFullYear();
      const localMonth = referenceDate.getMonth();
      const localDay = referenceDate.getDate();

      const correctDateUTC = new Date(Date.UTC(localYear, localMonth, localDay));
      const currentDateUTC = record.date;

      if (currentDateUTC.getTime() !== correctDateUTC.getTime()) {
        await prisma.attendance.update({
          where: { id: record.id },
          data: { date: correctDateUTC }
        });

        console.log(`✓ Updated ${record.id}`);
        console.log(`  Old: ${currentDateUTC.toISOString()}`);
        console.log(`  New: ${correctDateUTC.toISOString()}`);
        updatedCount++;
      }
    }

    console.log('\n===========================================');
    console.log('Cleanup completed!');
    console.log(`Deleted: ${deletedCount}`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Remaining: ${remainingRecords.length - updatedCount}`);
    console.log('===========================================\n');

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanupAndFix()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
