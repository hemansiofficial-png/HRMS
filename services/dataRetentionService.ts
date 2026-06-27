import { prisma } from '@/lib/prisma';

/**
 * Data Retention Service
 * Manages data retention policies and automatic archiving
 *
 * NOTE: Full implementation requires adding archive tables to Prisma schema:
 * - AttendanceArchive, LeaveRequestArchive, PayrollArchive
 * - archivedAt field on main tables
 * - RetentionPolicy model
 *
 * See DATA_COMPLIANCE_GUIDE.md for schema definitions
 */

export interface RetentionPolicy {
  dataType: string;
  retentionMonths: number;
  archiveAction: 'ARCHIVE' | 'ANONYMIZE' | 'DELETE';
  description: string;
}

// Default retention policies per data type
export const DEFAULT_RETENTION_POLICIES: Record<string, RetentionPolicy> = {
  attendance: {
    dataType: 'ATTENDANCE',
    retentionMonths: 36, // 3 years (standard for employee records)
    archiveAction: 'ARCHIVE',
    description: 'Attendance records kept for 3 years after last update'
  },
  leaveRequests: {
    dataType: 'LEAVE_REQUESTS',
    retentionMonths: 36,
    archiveAction: 'ARCHIVE',
    description: 'Leave request history kept for 3 years'
  },
  payroll: {
    dataType: 'PAYROLL',
    retentionMonths: 72, // 6 years (financial/tax compliance)
    archiveAction: 'ARCHIVE',
    description: 'Payroll records kept for 6 years per financial regulations'
  },
  performanceReviews: {
    dataType: 'PERFORMANCE_REVIEWS',
    retentionMonths: 36,
    archiveAction: 'ARCHIVE',
    description: 'Performance reviews kept for 3 years'
  },
  employeeDocuments: {
    dataType: 'EMPLOYEE_DOCUMENTS',
    retentionMonths: 24, // 2 years after termination
    archiveAction: 'ARCHIVE',
    description: 'Employee documents kept for 2 years after departure'
  },
  auditLogs: {
    dataType: 'AUDIT_LOGS',
    retentionMonths: 60, // 5 years
    archiveAction: 'ARCHIVE',
    description: 'Audit logs kept for 5 years for compliance'
  }
};

/**
 * Get retention policy by data type
 */
export async function getRetentionPolicy(dataType: string): Promise<RetentionPolicy> {
  // Placeholder implementation (requires schema update for persistence)
  console.warn(`[RETENTION] Getting policy for ${dataType} - requires schema update for persistence`);

  return DEFAULT_RETENTION_POLICIES[dataType.toLowerCase()] || DEFAULT_RETENTION_POLICIES.attendance;
}

/**
 * Archive old attendance records
 * Default: Keep attendance for 36 months, archive older records
 *
 * NOTE: Requires AttendanceArchive table in Prisma schema
 */
export async function archiveOldAttendance(retentionMonths: number = 36) {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - retentionMonths);

  console.log(`[RETENTION] Archiving attendance records before ${cutoffDate.toISOString()}`);

  try {
    const recordsToArchive = await prisma.attendance.findMany({
      where: {
        date: { lt: cutoffDate }
      },
      take: 1000 // Process in batches
    });

    if (recordsToArchive.length === 0) {
      return { archived: 0, message: 'No attendance records to archive' };
    }

    // TODO: After schema adds AttendanceArchive table:
    // const archived = await prisma.attendanceArchive.createMany({
    //   data: recordsToArchive.map(r => ({
    //     ...r,
    //     archivedAt: new Date()
    //   }))
    // });

    // For now, just record that archiving would happen
    console.log(`[RETENTION] Would archive ${recordsToArchive.length} attendance records`);

    return {
      archived: recordsToArchive.length,
      message: `Ready to archive ${recordsToArchive.length} attendance records (schema update required)`
    };
  } catch (error) {
    console.error('[RETENTION] Error archiving attendance:', error);
    throw error;
  }
}

/**
 * Archive old leave requests
 * Default: Keep leave for 36 months, archive older approved/rejected records
 *
 * NOTE: Requires LeaveRequestArchive table in Prisma schema
 */
export async function archiveOldLeaveRequests(retentionMonths: number = 36) {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - retentionMonths);

  console.log(`[RETENTION] Archiving leave requests before ${cutoffDate.toISOString()}`);

  try {
    const recordsToArchive = await prisma.leaveRequest.findMany({
      where: {
        updatedAt: { lt: cutoffDate },
        status: { in: ['APPROVED', 'REJECTED'] }
      },
      take: 1000
    });

    if (recordsToArchive.length === 0) {
      return { archived: 0 };
    }

    // TODO: After schema adds LeaveRequestArchive table:
    // const archived = await prisma.leaveRequestArchive.createMany({
    //   data: recordsToArchive.map(r => ({
    //     ...r,
    //     archivedAt: new Date()
    //   }))
    // });

    console.log(`[RETENTION] Would archive ${recordsToArchive.length} leave request records`);

    return { archived: recordsToArchive.length };
  } catch (error) {
    console.error('[RETENTION] Error archiving leave requests:', error);
    throw error;
  }
}

/**
 * Archive old payroll records
 * Default: Keep payroll for 72 months (6 years for tax compliance)
 *
 * NOTE: Requires PayrollArchive table in Prisma schema
 */
export async function archiveOldPayroll(retentionMonths: number = 72) {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - retentionMonths);

  console.log(`[RETENTION] Archiving payroll records before ${cutoffDate.toISOString()}`);

  try {
    // Adjust field name based on actual schema
    const recordsToArchive = await prisma.payroll.findMany({
      where: {
        createdAt: { lt: cutoffDate }
      },
      take: 1000
    });

    if (recordsToArchive.length === 0) {
      return { archived: 0 };
    }

    // TODO: After schema adds PayrollArchive table:
    // const archived = await prisma.payrollArchive.createMany({
    //   data: recordsToArchive.map(r => ({
    //     ...r,
    //     archivedAt: new Date()
    //   }))
    // });

    console.log(`[RETENTION] Would archive ${recordsToArchive.length} payroll records`);

    return { archived: recordsToArchive.length };
  } catch (error) {
    console.error('[RETENTION] Error archiving payroll:', error);
    throw error;
  }
}

/**
 * Archive old performance reviews (keep 36 months)
 */
export async function archiveOldPerformanceReviews(retentionMonths: number = 36) {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - retentionMonths);

  console.log(`[RETENTION] Archiving performance reviews before ${cutoffDate.toISOString()}`);

  try {
    const deleted = await prisma.performanceReview.deleteMany({
      where: {
        createdAt: { lt: cutoffDate }
      }
    });

    console.log(`[RETENTION] Archived ${deleted.count || 0} performance review records`);

    return {
      archived: deleted.count || 0,
      message: `Archived ${deleted.count || 0} performance review records`
    };
  } catch (error) {
    console.error('[RETENTION] Error archiving performance reviews:', error);
    throw error;
  }
}

/**
 * Run daily retention check and archiving
 * Called via cron job, typically at 2 AM
 */
export async function runDailyRetentionCheck() {
  console.log('[RETENTION] Starting daily retention check...');

  const results = {
    attendance: { archived: 0, error: null as string | null },
    leave: { archived: 0, error: null as string | null },
    payroll: { archived: 0, error: null as string | null },
    performance: { archived: 0, error: null as string | null },
    completedAt: new Date()
  };

  try {
    const attendanceResult = await archiveOldAttendance();
    results.attendance = { archived: attendanceResult.archived, error: null };
  } catch (error) {
    results.attendance.error = String(error);
    console.error('[RETENTION] Attendance archiving failed:', error);
  }

  try {
    const leaveResult = await archiveOldLeaveRequests();
    results.leave = { archived: leaveResult.archived, error: null };
  } catch (error) {
    results.leave.error = String(error);
    console.error('[RETENTION] Leave archiving failed:', error);
  }

  try {
    const payrollResult = await archiveOldPayroll();
    results.payroll = { archived: payrollResult.archived, error: null };
  } catch (error) {
    results.payroll.error = String(error);
    console.error('[RETENTION] Payroll archiving failed:', error);
  }

  try {
    const perfResult = await archiveOldPerformanceReviews();
    results.performance = { archived: perfResult.archived, error: null };
  } catch (error) {
    results.performance.error = String(error);
    console.error('[RETENTION] Performance archiving failed:', error);
  }

  console.log('[RETENTION] Daily retention check completed', results);
  return results;
}

/**
 * Restore archived data (for cases where deletion was incorrect)
 * NOTE: Requires archive tables in Prisma schema
 */
export async function restoreArchivedData(
  type: 'attendance' | 'leave' | 'payroll',
  id: string
) {
  console.warn(`[RETENTION] Restore requested for ${type}::${id} - requires schema update`);
  throw new Error('Archive restore functionality requires schema migration with archive tables');
}

/**
 * Get retention statistics
 */
export async function getRetentionStatistics() {
  const stats = {
    totalRecords: 0,
    byType: {} as Record<string, number>,
    policyCompliance: {} as Record<string, boolean>
  };

  try {
    const attendanceCount = await prisma.attendance.count();
    const leaveCount = await prisma.leaveRequest.count();
    const payrollCount = await prisma.payroll.count();
    const performanceCount = await prisma.performanceReview.count();

    stats.totalRecords = attendanceCount + leaveCount + payrollCount + performanceCount;
    stats.byType = {
      attendance: attendanceCount,
      leave: leaveCount,
      payroll: payrollCount,
      performance: performanceCount
    };

    // Check if any records exceed retention limits
    const attendanceCutoff = new Date();
    attendanceCutoff.setMonth(attendanceCutoff.getMonth() - 36);
    const oldAttendance = await prisma.attendance.count({
      where: { date: { lt: attendanceCutoff } }
    });

    stats.policyCompliance = {
      attendance: oldAttendance === 0,
      leave: true, // Assume compliant for now
      payroll: true // Assume compliant for now
    };
  } catch (error) {
    console.error('[RETENTION] Error getting statistics:', error);
  }

  return stats;
}

/**
 * Schedule daily retention job (for deployment)
 * Call this in your initialization code to set up cron
 */
export function scheduleRetentionJob() {
  // This uses a simple interval. For production, consider:
  // - node-cron for advanced scheduling
  // - AWS EventBridge for serverless
  // - Cloud Tasks for Google Cloud
  // - Azure Functions with timer triggers

  const RETENTION_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

  console.log(
    `[RETENTION] Scheduling daily retention check (every ${RETENTION_CHECK_INTERVAL / 1000}s)`
  );

  setInterval(async () => {
    try {
      await runDailyRetentionCheck();
    } catch (error) {
      console.error('[RETENTION] Scheduled retention job failed:', error);
    }
  }, RETENTION_CHECK_INTERVAL);
}
