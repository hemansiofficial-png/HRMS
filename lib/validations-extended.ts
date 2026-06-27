import { z } from 'zod';

/**
 * Extended Validation Rules
 * Prevents invalid state transitions and ensures data consistency
 */

// ============================================================================
// EMPLOYEE STATE MACHINE
// ============================================================================

export const EmployeeStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED', 'SUSPENDED']);
export type EmployeeStatus = z.infer<typeof EmployeeStatusEnum>;

// Valid state transitions for employees
export const EMPLOYEE_STATE_TRANSITIONS: Record<EmployeeStatus, EmployeeStatus[]> = {
  ACTIVE: ['INACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED'],
  INACTIVE: ['ACTIVE', 'SUSPENDED'],
  ON_LEAVE: ['ACTIVE', 'SUSPENDED'],
  SUSPENDED: ['ACTIVE', 'INACTIVE', 'TERMINATED'],
  TERMINATED: [] // Terminal state
};

/**
 * Validate employee status transition
 */
export function validateEmployeeStatusTransition(
  currentStatus: EmployeeStatus,
  newStatus: EmployeeStatus
): { valid: boolean; error?: string } {
  if (currentStatus === newStatus) {
    return { valid: false, error: 'New status must be different from current status' };
  }

  const allowedTransitions = EMPLOYEE_STATE_TRANSITIONS[currentStatus];
  if (!allowedTransitions.includes(newStatus)) {
    return {
      valid: false,
      error: `Cannot transition from ${currentStatus} to ${newStatus}. Allowed: ${allowedTransitions.join(', ')}`
    };
  }

  return { valid: true };
}

// ============================================================================
// LEAVE REQUEST STATE MACHINE
// ============================================================================

export const LeaveStatusEnum = z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED']);
export type LeaveStatus = z.infer<typeof LeaveStatusEnum>;

export const LEAVE_STATE_TRANSITIONS: Record<LeaveStatus, LeaveStatus[]> = {
  PENDING: ['APPROVED', 'REJECTED', 'CANCELLED'],
  APPROVED: ['COMPLETED', 'CANCELLED'],
  REJECTED: [], // Terminal state
  CANCELLED: [], // Terminal state
  COMPLETED: [] // Terminal state
};

/**
 * Validate leave request status transition
 */
export function validateLeaveStatusTransition(
  currentStatus: LeaveStatus,
  newStatus: LeaveStatus
): { valid: boolean; error?: string } {
  if (currentStatus === newStatus) {
    return { valid: false, error: 'New status must be different from current status' };
  }

  const allowedTransitions = LEAVE_STATE_TRANSITIONS[currentStatus];
  if (!allowedTransitions.includes(newStatus)) {
    return {
      valid: false,
      error: `Cannot transition from ${currentStatus} to ${newStatus}`
    };
  }

  return { valid: true };
}

// ============================================================================
// LEAVE DATE VALIDATION
// ============================================================================

/**
 * Validate leave request dates
 */
export function validateLeaveDates(startDate: Date, endDate: Date): { valid: boolean; error?: string } {
  if (startDate >= endDate) {
    return { valid: false, error: 'Start date must be before end date' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (startDate < today) {
    return { valid: false, error: 'Cannot request leave for past dates' };
  }

  const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff > 365) {
    return { valid: false, error: 'Leave period cannot exceed 365 days' };
  }

  return { valid: true };
}

// ============================================================================
// ATTENDANCE VALIDATION
// ============================================================================

/**
 * Validate check-in/check-out times
 */
export function validateAttendanceTimes(
  checkInTime: Date | null,
  checkOutTime: Date | null
): { valid: boolean; error?: string } {
  if (!checkInTime) {
    return { valid: false, error: 'Check-in time is required' };
  }

  if (checkOutTime && checkInTime >= checkOutTime) {
    return { valid: false, error: 'Check-out time must be after check-in time' };
  }

  return { valid: true };
}

/**
 * Validate no duplicate attendance records on same day
 */
export function validateNoDuplicateAttendance(
  existingRecords: any[],
  date: Date
): { valid: boolean; error?: string } {
  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);

  const hasDuplicate = existingRecords.some(record => {
    const recordDate = new Date(record.date);
    recordDate.setHours(0, 0, 0, 0);
    return recordDate.getTime() === dateOnly.getTime();
  });

  if (hasDuplicate) {
    return { valid: false, error: 'Attendance already marked for this date' };
  }

  return { valid: true };
}

// ============================================================================
// PAYROLL VALIDATION
// ============================================================================

/**
 * Validate salary amount (non-zero, reasonable limits)
 */
export function validateSalaryAmount(amount: number): { valid: boolean; error?: string } {
  if (amount <= 0) {
    return { valid: false, error: 'Salary must be greater than 0' };
  }

  if (amount > 999999999) {
    return { valid: false, error: 'Salary exceeds reasonable maximum' };
  }

  return { valid: true };
}

/**
 * Validate payroll period (no duplicate payrolls for same month/employee)
 */
export function validatePayrollPeriod(
  existingPayrolls: any[],
  employeeId: string,
  monthYear: Date
): { valid: boolean; error?: string } {
  const dateOnly = new Date(monthYear);
  dateOnly.setDate(1);
  dateOnly.setHours(0, 0, 0, 0);

  const duplicate = existingPayrolls.find(p => {
    const payrollDate = new Date(p.monthYear);
    payrollDate.setDate(1);
    payrollDate.setHours(0, 0, 0, 0);
    return p.userId === employeeId && payrollDate.getTime() === dateOnly.getTime();
  });

  if (duplicate) {
    return { valid: false, error: 'Payroll already generated for this employee in this period' };
  }

  return { valid: true };
}

// ============================================================================
// PERFORMANCE REVIEW VALIDATION
// ============================================================================

export const PerformanceRatingEnum = z.enum(['POOR', 'NEEDS_IMPROVEMENT', 'MEETS_EXPECTATIONS', 'EXCEEDS_EXPECTATIONS', 'OUTSTANDING']);
export type PerformanceRating = z.infer<typeof PerformanceRatingEnum>;

/**
 * Validate performance review rating
 */
export function validatePerformanceRating(rating: number): { valid: boolean; error?: string } {
  if (rating < 1 || rating > 5) {
    return { valid: false, error: 'Rating must be between 1 and 5' };
  }

  return { valid: true };
}

/**
 * Validate review dates
 */
export function validateReviewDates(
  reviewDate: Date,
  employeeJoiningDate: Date
): { valid: boolean; error?: string } {
  if (reviewDate < employeeJoiningDate) {
    return {
      valid: false,
      error: 'Review date cannot be before employee joining date'
    };
  }

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  if (reviewDate < sixMonthsAgo) {
    return {
      valid: false,
      error: 'Performance reviews should not be older than 6 months'
    };
  }

  return { valid: true };
}

// ============================================================================
// RECRUITMENT VALIDATION
// ============================================================================

export const JobStatusEnum = z.enum(['OPEN', 'CLOSED', 'ON_HOLD', 'CANCELLED']);
export type JobStatus = z.infer<typeof JobStatusEnum>;

export const CandidateStatusEnum = z.enum(['APPLIED', 'SHORTLISTED', 'INTERVIEW', 'OFFERED', 'REJECTED', 'ACCEPTED', 'JOINED']);
export type CandidateStatus = z.infer<typeof CandidateStatusEnum>;

export const JOB_STATE_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  OPEN: ['CLOSED', 'ON_HOLD', 'CANCELLED'],
  CLOSED: ['OPEN', 'ON_HOLD'],
  ON_HOLD: ['OPEN', 'CLOSED', 'CANCELLED'],
  CANCELLED: [] // Terminal state
};

export const CANDIDATE_STATE_TRANSITIONS: Record<CandidateStatus, CandidateStatus[]> = {
  APPLIED: ['SHORTLISTED', 'REJECTED'],
  SHORTLISTED: ['INTERVIEW', 'REJECTED'],
  INTERVIEW: ['OFFERED', 'REJECTED'],
  OFFERED: ['ACCEPTED', 'REJECTED'],
  ACCEPTED: ['JOINED', 'REJECTED'],
  REJECTED: [], // Terminal state
  JOINED: [] // Terminal state
};

/**
 * Validate job posting status transition
 */
export function validateJobStatusTransition(
  currentStatus: JobStatus,
  newStatus: JobStatus
): { valid: boolean; error?: string } {
  if (currentStatus === newStatus) {
    return { valid: false, error: 'New status must be different from current status' };
  }

  const allowedTransitions = JOB_STATE_TRANSITIONS[currentStatus];
  if (!allowedTransitions.includes(newStatus)) {
    return {
      valid: false,
      error: `Cannot transition from ${currentStatus} to ${newStatus}`
    };
  }

  return { valid: true };
}

/**
 * Validate candidate status transition
 */
export function validateCandidateStatusTransition(
  currentStatus: CandidateStatus,
  newStatus: CandidateStatus
): { valid: boolean; error?: string } {
  if (currentStatus === newStatus) {
    return { valid: false, error: 'New status must be different from current status' };
  }

  const allowedTransitions = CANDIDATE_STATE_TRANSITIONS[currentStatus];
  if (!allowedTransitions.includes(newStatus)) {
    return {
      valid: false,
      error: `Cannot transition from ${currentStatus} to ${newStatus}`
    };
  }

  return { valid: true };
}

// ============================================================================
// DEPARTMENT VALIDATION
// ============================================================================

/**
 * Validate department hierarchy (prevent circular dependencies)
 */
export async function validateDepartmentHierarchy(
  departmentId: string,
  parentDepartmentId: string | null,
  existingDepartments: any[]
): Promise<{ valid: boolean; error?: string }> {
  if (!parentDepartmentId) {
    return { valid: true };
  }

  if (departmentId === parentDepartmentId) {
    return { valid: false, error: 'Department cannot be its own parent' };
  }

  // Check for circular dependency
  const hasCircularDependency = (deptId: string, parentId: string): boolean => {
    if (deptId === parentId) return true;
    const parent = existingDepartments.find(d => d.id === parentId);
    if (!parent || !parent.parentDepartmentId) return false;
    return hasCircularDependency(deptId, parent.parentDepartmentId);
  };

  if (hasCircularDependency(departmentId, parentDepartmentId)) {
    return { valid: false, error: 'Circular department hierarchy detected' };
  }

  return { valid: true };
}

// ============================================================================
// BULK VALIDATION HELPERS
// ============================================================================

/**
 * Validate multiple state transitions at once
 */
export function validateBulkStatusTransitions(
  transitions: Array<{
    currentStatus: any;
    newStatus: any;
    type: 'EMPLOYEE' | 'LEAVE' | 'CANDIDATE' | 'JOB';
  }>
): {
  valid: boolean;
  errors: Array<{ index: number; error: string }>;
} {
  const errors: Array<{ index: number; error: string }> = [];

  transitions.forEach((transition, index) => {
    let result: any;

    switch (transition.type) {
      case 'EMPLOYEE':
        result = validateEmployeeStatusTransition(transition.currentStatus, transition.newStatus);
        break;
      case 'LEAVE':
        result = validateLeaveStatusTransition(transition.currentStatus, transition.newStatus);
        break;
      case 'CANDIDATE':
        result = validateCandidateStatusTransition(transition.currentStatus, transition.newStatus);
        break;
      case 'JOB':
        result = validateJobStatusTransition(transition.currentStatus, transition.newStatus);
        break;
    }

    if (!result.valid) {
      errors.push({ index, error: result.error || 'Invalid transition' });
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}
