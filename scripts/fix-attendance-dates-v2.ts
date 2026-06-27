/**
 * Script to fix attendance dates based on checkIn/checkOut timestamps
 * Uses the actual check-in time to determine the correct local date
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixAttendanceDatesFromCheckIn() {
  console.log('Starting attendance date fix based on checkIn times...\n');

  try {
    const attendanceRecords = await prisma.attendance.findMany({
      orderBy: { createdAt: 'asc' }
    });

    console.log(`Found ${attendanceRecords.length} attendance records\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const record of attendanceRecords) {
      // Use checkIn time if available, otherwise createdAt
      const referenceTime = record.checkIn || record.checkOut || record.createdAt;
      const referenceDate = new Date(referenceTime);

      // Extract LOCAL date components from the reference time
      const localYear = referenceDate.getFullYear();
      const localMonth = referenceDate.getMonth();
      const localDay = referenceDate.getDate();

      // Create UTC midnight for this LOCAL date
      const correctDateUTC = new Date(Date.UTC(localYear, localMonth, localDay));

      // Compare with current date field
      const currentDateUTC = record.date;

      if (currentDateUTC.getTime() !== correctDateUTC.getTime()) {
        await prisma.attendance.update({
          where: { id: record.id },
          data: { date: correctDateUTC }
        });

        console.log(`✓ Updated record ${record.id}`);
        console.log(`  Old date: ${currentDateUTC.toISOString()}`);
        console.log(`  New date: ${correctDateUTC.toISOString()}`);
        console.log(`  Based on checkIn: ${record.checkIn || 'N/A'}`);
        console.log(`  Based on checkOut: ${record.checkOut || 'N/A'}`);
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

fixAttendanceDatesFromCheckIn()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
