/**
 * Script to fix attendance date fields
 * Converts local midnight dates to UTC midnight dates
 * 
 * Usage: npx tsx scripts/fix-attendance-dates.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixAttendanceDates() {
  console.log('Starting attendance date fix...\n');

  try {
    // Fetch all attendance records
    const attendanceRecords = await prisma.attendance.findMany({
      orderBy: { date: 'asc' }
    });

    console.log(`Found ${attendanceRecords.length} attendance records\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const record of attendanceRecords) {
      const originalDate = record.date;
      
      // Extract the local date components (year, month, day)
      const year = originalDate.getUTCFullYear();
      const month = originalDate.getUTCMonth();
      const day = originalDate.getUTCDate();

      // Create a new date with UTC midnight for the SAME calendar day
      // This ensures the date represents the correct day regardless of timezone
      const correctedDate = new Date(Date.UTC(year, month, day));

      // Only update if the date is different
      if (originalDate.getTime() !== correctedDate.getTime()) {
        await prisma.attendance.update({
          where: { id: record.id },
          data: { date: correctedDate }
        });

        console.log(`✓ Updated record ${record.id}`);
        console.log(`  Original: ${originalDate.toISOString()}`);
        console.log(`  Corrected: ${correctedDate.toISOString()}`);
        console.log();

        updatedCount++;
      } else {
        skippedCount++;
      }
    }

    console.log('\n===========================================');
    console.log('Fix completed!');
    console.log(`Total records: ${attendanceRecords.length}`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Skipped (already correct): ${skippedCount}`);
    console.log('===========================================\n');

  } catch (error) {
    console.error('Error fixing attendance dates:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixAttendanceDates()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
