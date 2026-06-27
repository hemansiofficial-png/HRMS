import { prisma } from '@/lib/prisma';
import { approveLeaveSchema, leaveRequestSchema } from '@/lib/validations';
import { LeaveType } from '@prisma/client';

export async function submitLeave(payload: unknown) {
  const parsed = leaveRequestSchema.parse(payload);
  
  // Calculate number of days
  const startDate = new Date(parsed.startDate);
  const endDate = new Date(parsed.endDate);
  const numberOfDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  return prisma.leaveRequest.create({
    data: {
      employeeId: parsed.employeeId,
      leaveType: parsed.leaveType as LeaveType,
      startDate,
      endDate,
      numberOfDays,
      reason: parsed.reason
    }
  });
}

export async function approveLeave(payload: unknown, approverId: string) {
  const parsed = approveLeaveSchema.parse(payload);
  return prisma.leaveRequest.update({
    where: { id: parsed.requestId },
    data: { status: parsed.status, approvedBy: approverId }
  });
}
