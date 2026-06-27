import { z } from 'zod';

export const employeeSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(['ADMIN', 'HR_MANAGER', 'EMPLOYEE']),
  departmentId: z.string().min(1),
  designation: z.string().min(2),
  phone: z.string().min(8),
  address: z.string().min(5),
  joiningDate: z.string(),
  salary: z.number().positive()
});

export const departmentSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  managerId: z.string().optional().nullable(),
  budget: z.number().optional().nullable()
});

export const leaveRequestSchema = z.object({
  employeeId: z.string().min(1),
  leaveType: z.string().min(2),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().min(5)
});

export const approveLeaveSchema = z.object({
  requestId: z.string().min(1),
  status: z.enum(['APPROVED', 'REJECTED'])
});

export const payrollGenerateSchema = z.object({
  employeeId: z.string().min(1),
  month: z.string().min(3),
  bonus: z.number().min(0),
  deductions: z.number().min(0)
});
