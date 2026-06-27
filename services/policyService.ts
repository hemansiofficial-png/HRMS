import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// ==================== TYPES ====================

export type PolicyType = 
  | 'LEAVE_POLICY'
  | 'PAYROLL_POLICY'
  | 'TAX_POLICY'
  | 'OVERTIME_POLICY'
  | 'BONUS_POLICY'
  | 'INCENTIVE_POLICY'
  | 'ATTENDANCE_POLICY'
  | 'REIMBURSEMENT_POLICY'
  | 'GRATUITY_POLICY'
  | 'PF_POLICY'
  | 'ESI_POLICY'
  | 'SALARY_STRUCTURE_TEMPLATE'
  | 'COMPLIANCE_POLICY';

export type EntityType = 'EMPLOYEE' | 'DEPARTMENT' | 'ROLE';

export interface PolicyVersionInput {
  policyType: PolicyType;
  policyId: string;
  changesSummary: string;
  changedBy: string;
  approvedBy?: string;
  effectiveFrom: Date;
  effectiveTo?: Date;
  previousData: Prisma.InputJsonValue;
  currentData: Prisma.InputJsonValue;
  organizationId: string;
}

export interface PolicyAssignmentInput {
  policyType: PolicyType;
  policyId: string;
  entityType: EntityType;
  entityId: string;
  effectiveFrom?: Date;
  effectiveTo?: Date;
  organizationId: string;
}

// ==================== POLICY VERSION SERVICE ====================

export async function createPolicyVersion(data: PolicyVersionInput) {
  const { policyType, policyId, organizationId } = data;
  
  // Get the latest version number
  const latestVersion = await prisma.policyVersion.findFirst({
    where: {
      policyType,
      policyId,
    },
    orderBy: {
      versionNumber: 'desc',
    },
  });

  const newVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

  // Deactivate previous versions
  await prisma.policyVersion.updateMany({
    where: {
      policyType,
      policyId,
      isActive: true,
    },
    data: {
      isActive: false,
    },
  });

  // Create new version
  const policyVersion = await prisma.policyVersion.create({
    data: {
      ...data,
      versionNumber: newVersionNumber,
      isActive: true,
    },
  });

  return policyVersion;
}

export async function getPolicyVersions(policyType: PolicyType, policyId: string) {
  return prisma.policyVersion.findMany({
    where: {
      policyType,
      policyId,
    },
    orderBy: {
      versionNumber: 'desc',
    },
  });
}

export async function getActivePolicyVersion(policyType: PolicyType, policyId: string) {
  return prisma.policyVersion.findFirst({
    where: {
      policyType,
      policyId,
      isActive: true,
    },
  });
}

export async function activatePolicyVersion(versionId: string) {
  // Get the version to activate
  const version = await prisma.policyVersion.findUnique({
    where: { id: versionId },
  });

  if (!version) {
    throw new Error('Policy version not found');
  }

  // Deactivate all versions for this policy
  await prisma.policyVersion.updateMany({
    where: {
      policyType: version.policyType,
      policyId: version.policyId,
    },
    data: {
      isActive: false,
    },
  });

  // Activate the selected version
  return prisma.policyVersion.update({
    where: { id: versionId },
    data: { isActive: true },
  });
}

// ==================== POLICY ASSIGNMENT SERVICE ====================

export async function assignPolicy(data: PolicyAssignmentInput) {
  // Check for existing assignment
  const existing = await prisma.policyAssignment.findFirst({
    where: {
      policyType: data.policyType,
      policyId: data.policyId,
      entityType: data.entityType,
      entityId: data.entityId,
      isActive: true,
    },
  });

  if (existing) {
    throw new Error('Policy already assigned to this entity');
  }

  return prisma.policyAssignment.create({
    data: {
      ...data,
      effectiveFrom: data.effectiveFrom || new Date(),
      isActive: true,
    },
  });
}

export async function unassignPolicy(assignmentId: string) {
  return prisma.policyAssignment.update({
    where: { id: assignmentId },
    data: { isActive: false },
  });
}

export async function getPolicyAssignments(
  policyType?: PolicyType,
  policyId?: string,
  entityType?: EntityType,
  entityId?: string
) {
  return prisma.policyAssignment.findMany({
    where: {
      policyType,
      policyId,
      entityType,
      entityId,
      isActive: true,
    },
  });
}

export async function getAssignedPoliciesForEntity(
  entityType: EntityType,
  entityId: string,
  organizationId: string
) {
  return prisma.policyAssignment.findMany({
    where: {
      entityType,
      entityId,
      organizationId,
      isActive: true,
    },
  });
}

// ==================== PAYROLL POLICY SERVICE ====================

export interface PayrollPolicyInput {
  organizationId: string;
  name: string;
  description?: string;
  salaryComponents?: Prisma.InputJsonValue;
  deductionRules?: Prisma.InputJsonValue;
  overtimeRules?: Prisma.InputJsonValue;
  bonusRules?: Prisma.InputJsonValue;
  leaveEncashmentRules?: Prisma.InputJsonValue;
  arrearsRules?: Prisma.InputJsonValue;
  loanDeductionRules?: Prisma.InputJsonValue;
  advanceSalaryRules?: Prisma.InputJsonValue;
  gratuityRules?: Prisma.InputJsonValue;
  effectiveFrom?: Date;
  effectiveTo?: Date;
}

export async function createPayrollPolicy(data: PayrollPolicyInput) {
  const policy = await prisma.payrollPolicy.create({
    data: {
      ...data,
      salaryComponents: data.salaryComponents || {},
      deductionRules: data.deductionRules || {},
      overtimeRules: data.overtimeRules || {},
      bonusRules: data.bonusRules || {},
      leaveEncashmentRules: data.leaveEncashmentRules || {},
      arrearsRules: data.arrearsRules || {},
      loanDeductionRules: data.loanDeductionRules || {},
      advanceSalaryRules: data.advanceSalaryRules || {},
      gratuityRules: data.gratuityRules || {},
      effectiveFrom: data.effectiveFrom || new Date(),
    },
  });

  // Create initial version
  if (data.salaryComponents) {
    await createPolicyVersion({
      policyType: 'PAYROLL_POLICY',
      policyId: policy.id,
      changesSummary: 'Initial policy creation',
      changedBy: 'SYSTEM',
      effectiveFrom: policy.effectiveFrom,
      previousData: {},
      currentData: data.salaryComponents as Prisma.InputJsonValue,
      organizationId: data.organizationId,
    });
  }

  return policy;
}

export async function updatePayrollPolicy(id: string, data: Partial<PayrollPolicyInput>) {
  const existing = await prisma.payrollPolicy.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error('Payroll policy not found');
  }

  const updated = await prisma.payrollPolicy.update({
    where: { id },
    data,
  });

  // Create version if salary components changed
  if (data.salaryComponents) {
    await createPolicyVersion({
      policyType: 'PAYROLL_POLICY',
      policyId: id,
      changesSummary: 'Updated salary components',
      changedBy: 'SYSTEM',
      effectiveFrom: updated.effectiveFrom,
      previousData: existing.salaryComponents as Prisma.InputJsonValue,
      currentData: data.salaryComponents as Prisma.InputJsonValue,
      organizationId: existing.organizationId,
    });
  }

  return updated;
}

export async function getPayrollPolicies(organizationId: string, isActive?: boolean) {
  return prisma.payrollPolicy.findMany({
    where: {
      organizationId,
      ...(isActive !== undefined && { isActive }),
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getPayrollPolicy(id: string) {
  return prisma.payrollPolicy.findUnique({
    where: { id },
  });
}

export async function deletePayrollPolicy(id: string) {
  return prisma.payrollPolicy.update({
    where: { id },
    data: { isActive: false },
  });
}

// ==================== TAX POLICY SERVICE ====================

export interface TaxPolicyInput {
  organizationId: string;
  name: string;
  country?: string;
  state?: string;
  financialYear: string;
  taxRegime?: string;
  taxSlabs: Prisma.InputJsonValue;
  surchargeRules?: Prisma.InputJsonValue;
  cessRate?: number;
  standardDeduction?: number;
  rebate87ALimit?: number;
  basicExemption?: number;
  deductions?: Prisma.InputJsonValue;
  exemptions?: Prisma.InputJsonValue;
  professionalTax?: number;
  ptExemptionMonths?: number[];
  effectiveFrom?: Date;
  effectiveTo?: Date;
}

export async function createTaxPolicy(data: TaxPolicyInput) {
  return prisma.taxPolicy.create({
    data: {
      ...data,
      taxSlabs: data.taxSlabs || [],
      surchargeRules: data.surchargeRules || {},
      deductions: data.deductions || {},
      exemptions: data.exemptions || {},
      ptExemptionMonths: data.ptExemptionMonths || [2],
      cessRate: data.cessRate || 4,
      standardDeduction: data.standardDeduction || 50000,
      rebate87ALimit: data.rebate87ALimit || 500000,
      basicExemption: data.basicExemption || 300000,
      professionalTax: data.professionalTax || 200,
      taxRegime: data.taxRegime || 'NEW',
      country: data.country || 'IN',
      effectiveFrom: data.effectiveFrom || new Date(),
    },
  });
}

export async function updateTaxPolicy(id: string, data: Partial<TaxPolicyInput>) {
  return prisma.taxPolicy.update({
    where: { id },
    data,
  });
}

export async function getTaxPolicies(organizationId: string, financialYear?: string, isActive?: boolean) {
  return prisma.taxPolicy.findMany({
    where: {
      organizationId,
      ...(financialYear && { financialYear }),
      ...(isActive !== undefined && { isActive }),
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getTaxPolicy(id: string) {
  return prisma.taxPolicy.findUnique({
    where: { id },
  });
}

export async function deleteTaxPolicy(id: string) {
  return prisma.taxPolicy.update({
    where: { id },
    data: { isActive: false },
  });
}

// ==================== OVERTIME POLICY SERVICE ====================

export interface OvertimePolicyInput {
  organizationId: string;
  name: string;
  description?: string;
  eligibleRoles?: string[];
  eligibleDepartments?: string[];
  minOtHours?: number;
  otRate?: number;
  otCalculationBase?: string;
  fixedOtRate?: number;
  maxOtHoursPerMonth?: number;
  maxOtAmountPerMonth?: number;
  approvalRequired?: boolean;
  autoApproveThreshold?: number;
  weekendMultiplier?: number;
  holidayMultiplier?: number;
  nightShiftAllowance?: number;
  effectiveFrom?: Date;
  effectiveTo?: Date;
}

export async function createOvertimePolicy(data: OvertimePolicyInput) {
  return prisma.overtimePolicy.create({
    data: {
      ...data,
      eligibleRoles: data.eligibleRoles || [],
      eligibleDepartments: data.eligibleDepartments || [],
      minOtHours: data.minOtHours || 1,
      otRate: data.otRate || 2,
      otCalculationBase: data.otCalculationBase || 'HOURLY_BASIC',
      approvalRequired: data.approvalRequired ?? true,
      weekendMultiplier: data.weekendMultiplier || 2,
      holidayMultiplier: data.holidayMultiplier || 3,
      nightShiftAllowance: data.nightShiftAllowance || 0,
      effectiveFrom: data.effectiveFrom || new Date(),
    },
  });
}

export async function updateOvertimePolicy(id: string, data: Partial<OvertimePolicyInput>) {
  return prisma.overtimePolicy.update({
    where: { id },
    data,
  });
}

export async function getOvertimePolicies(organizationId: string, isActive?: boolean) {
  return prisma.overtimePolicy.findMany({
    where: {
      organizationId,
      ...(isActive !== undefined && { isActive }),
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getOvertimePolicy(id: string) {
  return prisma.overtimePolicy.findUnique({
    where: { id },
  });
}

export async function deleteOvertimePolicy(id: string) {
  return prisma.overtimePolicy.update({
    where: { id },
    data: { isActive: false },
  });
}

// ==================== BONUS POLICY SERVICE ====================

export interface BonusPolicyInput {
  organizationId: string;
  name: string;
  bonusType?: string;
  description?: string;
  calculationType?: string;
  percentage?: number;
  fixedAmount?: number;
  formula?: string;
  minEligibleMonths?: number;
  maxBonusAmount?: number;
  minBonusAmount?: number;
  prorated?: boolean;
  performanceLinked?: boolean;
  performanceCriteria?: Prisma.InputJsonValue;
  departmentWise?: boolean;
  departmentRules?: Prisma.InputJsonValue;
  roleWise?: boolean;
  roleRules?: Prisma.InputJsonValue;
  paymentMonth?: number;
  paymentFrequency?: string;
  effectiveFrom?: Date;
  effectiveTo?: Date;
}

export async function createBonusPolicy(data: BonusPolicyInput) {
  return prisma.bonusPolicy.create({
    data: {
      ...data,
      bonusType: data.bonusType || 'STATUTORY',
      calculationType: data.calculationType || 'PERCENTAGE',
      percentage: data.percentage || 8.33,
      minEligibleMonths: data.minEligibleMonths || 0,
      minBonusAmount: data.minBonusAmount || 0,
      prorated: data.prorated ?? true,
      performanceLinked: data.performanceLinked ?? false,
      departmentWise: data.departmentWise ?? false,
      roleWise: data.roleWise ?? false,
      paymentMonth: data.paymentMonth || 3,
      paymentFrequency: data.paymentFrequency || 'ANNUAL',
      effectiveFrom: data.effectiveFrom || new Date(),
    },
  });
}

export async function updateBonusPolicy(id: string, data: Partial<BonusPolicyInput>) {
  return prisma.bonusPolicy.update({
    where: { id },
    data,
  });
}

export async function getBonusPolicies(organizationId: string, bonusType?: string, isActive?: boolean) {
  return prisma.bonusPolicy.findMany({
    where: {
      organizationId,
      ...(bonusType && { bonusType }),
      ...(isActive !== undefined && { isActive }),
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getBonusPolicy(id: string) {
  return prisma.bonusPolicy.findUnique({
    where: { id },
  });
}

export async function deleteBonusPolicy(id: string) {
  return prisma.bonusPolicy.update({
    where: { id },
    data: { isActive: false },
  });
}

// ==================== INCENTIVE POLICY SERVICE ====================

export interface IncentivePolicyInput {
  organizationId: string;
  name: string;
  incentiveType?: string;
  description?: string;
  calculationType?: string;
  percentage?: number;
  fixedAmount?: number;
  tieredRules?: Prisma.InputJsonValue;
  targetBased?: boolean;
  targetAmount?: number;
  achievementRules?: Prisma.InputJsonValue;
  capped?: boolean;
  maxIncentiveAmount?: number;
  minIncentiveAmount?: number;
  payoutFrequency?: string;
  deferredPercentage?: number;
  cliffPeriodMonths?: number;
  effectiveFrom?: Date;
  effectiveTo?: Date;
}

export async function createIncentivePolicy(data: IncentivePolicyInput) {
  return prisma.incentivePolicy.create({
    data: {
      ...data,
      incentiveType: data.incentiveType || 'PERFORMANCE',
      calculationType: data.calculationType || 'PERCENTAGE',
      percentage: data.percentage || 0,
      minIncentiveAmount: data.minIncentiveAmount || 0,
      payoutFrequency: data.payoutFrequency || 'MONTHLY',
      deferredPercentage: data.deferredPercentage || 0,
      cliffPeriodMonths: data.cliffPeriodMonths || 0,
      effectiveFrom: data.effectiveFrom || new Date(),
    },
  });
}

export async function updateIncentivePolicy(id: string, data: Partial<IncentivePolicyInput>) {
  return prisma.incentivePolicy.update({
    where: { id },
    data,
  });
}

export async function getIncentivePolicies(organizationId: string, incentiveType?: string, isActive?: boolean) {
  return prisma.incentivePolicy.findMany({
    where: {
      organizationId,
      ...(incentiveType && { incentiveType }),
      ...(isActive !== undefined && { isActive }),
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getIncentivePolicy(id: string) {
  return prisma.incentivePolicy.findUnique({
    where: { id },
  });
}

export async function deleteIncentivePolicy(id: string) {
  return prisma.incentivePolicy.update({
    where: { id },
    data: { isActive: false },
  });
}

// ==================== ATTENDANCE POLICY SERVICE ====================

export interface AttendancePolicyInput {
  organizationId: string;
  name: string;
  description?: string;
  workingDays?: number;
  workingHoursPerDay?: number;
  flexibleTiming?: boolean;
  gracePeriodMinutes?: number;
  lateThresholdMinutes?: number;
  latePenalty?: Prisma.InputJsonValue;
  lateCountRules?: Prisma.InputJsonValue;
  earlyDepartureRules?: Prisma.InputJsonValue;
  halfDayRules?: Prisma.InputJsonValue;
  absentRules?: Prisma.InputJsonValue;
  overtimeRules?: Prisma.InputJsonValue;
  shiftTimings?: Prisma.InputJsonValue;
  breakRules?: Prisma.InputJsonValue;
  weekendWorkRules?: Prisma.InputJsonValue;
  holidayWorkRules?: Prisma.InputJsonValue;
  workFromHomeRules?: Prisma.InputJsonValue;
  regularizationRules?: Prisma.InputJsonValue;
  effectiveFrom?: Date;
  effectiveTo?: Date;
}

export async function createAttendancePolicy(data: AttendancePolicyInput) {
  return prisma.attendancePolicy.create({
    data: {
      ...data,
      workingDays: data.workingDays || 6,
      workingHoursPerDay: data.workingHoursPerDay || 8,
      flexibleTiming: data.flexibleTiming ?? false,
      gracePeriodMinutes: data.gracePeriodMinutes || 15,
      lateThresholdMinutes: data.lateThresholdMinutes || 15,
      latePenalty: data.latePenalty || { type: 'DEDUCTION', value: 0.5 },
      lateCountRules: data.lateCountRules || { count: 3, penalty: 'FULL_DAY' },
      earlyDepartureRules: data.earlyDepartureRules || { minHours: 8, penalty: 0.5 },
      halfDayRules: data.halfDayRules || { minHours: 4, maxPerMonth: 2 },
      absentRules: data.absentRules || { consecutiveAbsentDays: 3, action: 'MARK_ABSENT' },
      overtimeRules: data.overtimeRules || { minHours: 1, rate: 2 },
      shiftTimings: data.shiftTimings || [{ name: 'Morning', start: '09:00', end: '18:00' }],
      breakRules: data.breakRules || { lunchBreak: 60, shortBreaks: 2 },
      weekendWorkRules: data.weekendWorkRules || { rate: 2, compensatoryOff: true },
      holidayWorkRules: data.holidayWorkRules || { rate: 3, compensatoryOff: true },
      workFromHomeRules: data.workFromHomeRules || { allowedDays: 2, approvalRequired: true },
      regularizationRules: data.regularizationRules || { allowedCount: 3, deadline: 5 },
      effectiveFrom: data.effectiveFrom || new Date(),
    },
  });
}

export async function updateAttendancePolicy(id: string, data: Partial<AttendancePolicyInput>) {
  return prisma.attendancePolicy.update({
    where: { id },
    data,
  });
}

export async function getAttendancePolicies(organizationId: string, isActive?: boolean) {
  return prisma.attendancePolicy.findMany({
    where: {
      organizationId,
      ...(isActive !== undefined && { isActive }),
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getAttendancePolicy(id: string) {
  return prisma.attendancePolicy.findUnique({
    where: { id },
  });
}

export async function deleteAttendancePolicy(id: string) {
  return prisma.attendancePolicy.update({
    where: { id },
    data: { isActive: false },
  });
}

// ==================== REIMBURSEMENT POLICY SERVICE ====================

export interface ReimbursementPolicyInput {
  organizationId: string;
  name: string;
  categories?: Prisma.InputJsonValue;
  approvalWorkflow?: Prisma.InputJsonValue;
  autoApproveLimit?: number;
  receiptRequired?: boolean;
  receiptDeadline?: number;
  paymentCycle?: string;
  taxable?: boolean;
  subLimits?: Prisma.InputJsonValue;
  carryForward?: boolean;
  carryForwardLimit?: number;
  eligibleRoles?: string[];
  eligibleDepartments?: string[];
  tenureRequirement?: number;
  effectiveFrom?: Date;
  effectiveTo?: Date;
}

export async function createReimbursementPolicy(data: ReimbursementPolicyInput) {
  return prisma.reimbursementPolicy.create({
    data: {
      ...data,
      categories: data.categories || [],
      approvalWorkflow: data.approvalWorkflow || { levels: 2, approvers: ['MANAGER', 'HR'] },
      autoApproveLimit: data.autoApproveLimit || 0,
      receiptRequired: data.receiptRequired ?? true,
      receiptDeadline: data.receiptDeadline || 30,
      paymentCycle: data.paymentCycle || 'MONTHLY',
      taxable: data.taxable ?? false,
      subLimits: data.subLimits || {},
      carryForward: data.carryForward ?? false,
      carryForwardLimit: data.carryForwardLimit || 0,
      eligibleRoles: data.eligibleRoles || [],
      eligibleDepartments: data.eligibleDepartments || [],
      tenureRequirement: data.tenureRequirement || 0,
      effectiveFrom: data.effectiveFrom || new Date(),
    },
  });
}

export async function updateReimbursementPolicy(id: string, data: Partial<ReimbursementPolicyInput>) {
  return prisma.reimbursementPolicy.update({
    where: { id },
    data,
  });
}

export async function getReimbursementPolicies(organizationId: string, isActive?: boolean) {
  return prisma.reimbursementPolicy.findMany({
    where: {
      organizationId,
      ...(isActive !== undefined && { isActive }),
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getReimbursementPolicy(id: string) {
  return prisma.reimbursementPolicy.findUnique({
    where: { id },
  });
}

export async function deleteReimbursementPolicy(id: string) {
  return prisma.reimbursementPolicy.update({
    where: { id },
    data: { isActive: false },
  });
}

// ==================== GRATUITY POLICY SERVICE ====================

export interface GratuityPolicyInput {
  organizationId: string;
  name: string;
  description?: string;
  enabled?: boolean;
  calculationType?: string;
  percentage?: number;
  formula?: string;
  minTenureYears?: number;
  maxGratuityAmount?: number;
  roundingRules?: string;
  includeDA?: boolean;
  includeAllowances?: boolean;
  proRated?: boolean;
  taxExempt?: boolean;
  paymentOnExit?: boolean;
  paymentOnRetirement?: boolean;
  paymentOnDeath?: boolean;
  nomineeRequired?: boolean;
  effectiveFrom?: Date;
  effectiveTo?: Date;
}

export async function createGratuityPolicy(data: GratuityPolicyInput) {
  return prisma.gratuityPolicy.create({
    data: {
      ...data,
      enabled: data.enabled ?? true,
      calculationType: data.calculationType || 'STATUTORY',
      percentage: data.percentage || 4.81,
      formula: data.formula || '(basic + da) * 15/26 * years',
      minTenureYears: data.minTenureYears || 5,
      roundingRules: data.roundingRules || 'ROUND_DOWN',
      includeDA: data.includeDA ?? true,
      includeAllowances: data.includeAllowances ?? false,
      proRated: data.proRated ?? true,
      taxExempt: data.taxExempt ?? true,
      paymentOnExit: data.paymentOnExit ?? true,
      paymentOnRetirement: data.paymentOnRetirement ?? true,
      paymentOnDeath: data.paymentOnDeath ?? true,
      nomineeRequired: data.nomineeRequired ?? true,
      effectiveFrom: data.effectiveFrom || new Date(),
    },
  });
}

export async function updateGratuityPolicy(id: string, data: Partial<GratuityPolicyInput>) {
  return prisma.gratuityPolicy.update({
    where: { id },
    data,
  });
}

export async function getGratuityPolicies(organizationId: string, isActive?: boolean) {
  return prisma.gratuityPolicy.findMany({
    where: {
      organizationId,
      ...(isActive !== undefined && { isActive }),
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getGratuityPolicy(id: string) {
  return prisma.gratuityPolicy.findUnique({
    where: { id },
  });
}

export async function deleteGratuityPolicy(id: string) {
  return prisma.gratuityPolicy.update({
    where: { id },
    data: { isActive: false },
  });
}

// ==================== PF POLICY SERVICE ====================

export interface ProvidentFundPolicyInput {
  organizationId: string;
  name: string;
  description?: string;
  enabled?: boolean;
  employeeRate?: number;
  employerRate?: number;
  adminCharges?: number;
  edliRate?: number;
  maxSalary?: number;
  minSalary?: number;
  pensionRate?: number;
  voluntaryPF?: boolean;
  pensionScheme?: boolean;
  edliScheme?: boolean;
  uanRequired?: boolean;
  enrollmentDays?: number;
  withdrawalRules?: Prisma.InputJsonValue;
  interestRate?: number;
  taxTreatment?: string;
  effectiveFrom?: Date;
  effectiveTo?: Date;
}

export async function createProvidentFundPolicy(data: ProvidentFundPolicyInput) {
  return prisma.providentFundPolicy.create({
    data: {
      ...data,
      enabled: data.enabled ?? true,
      employeeRate: data.employeeRate || 12,
      employerRate: data.employerRate || 12,
      adminCharges: data.adminCharges || 0.65,
      edliRate: data.edliRate || 0.5,
      maxSalary: data.maxSalary || 15000,
      minSalary: data.minSalary || 0,
      pensionRate: data.pensionRate || 8.33,
      voluntaryPF: data.voluntaryPF ?? false,
      pensionScheme: data.pensionScheme ?? true,
      edliScheme: data.edliScheme ?? true,
      uanRequired: data.uanRequired ?? true,
      enrollmentDays: data.enrollmentDays || 60,
      withdrawalRules: data.withdrawalRules || { partial: true, full: ['retirement', 'unemployment'] },
      interestRate: data.interestRate || 8.15,
      taxTreatment: data.taxTreatment || 'EEE',
      effectiveFrom: data.effectiveFrom || new Date(),
    },
  });
}

export async function updateProvidentFundPolicy(id: string, data: Partial<ProvidentFundPolicyInput>) {
  return prisma.providentFundPolicy.update({
    where: { id },
    data,
  });
}

export async function getProvidentFundPolicies(organizationId: string, isActive?: boolean) {
  return prisma.providentFundPolicy.findMany({
    where: {
      organizationId,
      ...(isActive !== undefined && { isActive }),
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getProvidentFundPolicy(id: string) {
  return prisma.providentFundPolicy.findUnique({
    where: { id },
  });
}

export async function deleteProvidentFundPolicy(id: string) {
  return prisma.providentFundPolicy.update({
    where: { id },
    data: { isActive: false },
  });
}

// ==================== ESI POLICY SERVICE ====================

export interface ESIPolicyInput {
  organizationId: string;
  name: string;
  description?: string;
  enabled?: boolean;
  employeeRate?: number;
  employerRate?: number;
  maxSalary?: number;
  minSalary?: number;
  disabilityBenefit?: boolean;
  dependentBenefit?: boolean;
  medicalBenefit?: boolean;
  maternityBenefit?: boolean;
  funeralExpense?: number;
  ipNumberRequired?: boolean;
  dispensaryRequired?: boolean;
  cashless?: boolean;
  effectiveFrom?: Date;
  effectiveTo?: Date;
}

export async function createESIPolicy(data: ESIPolicyInput) {
  return prisma.eSIPolicy.create({
    data: {
      ...data,
      enabled: data.enabled ?? true,
      employeeRate: data.employeeRate || 0.75,
      employerRate: data.employerRate || 3.25,
      maxSalary: data.maxSalary || 21000,
      minSalary: data.minSalary || 0,
      disabilityBenefit: data.disabilityBenefit ?? true,
      dependentBenefit: data.dependentBenefit ?? true,
      medicalBenefit: data.medicalBenefit ?? true,
      maternityBenefit: data.maternityBenefit ?? true,
      funeralExpense: data.funeralExpense || 15000,
      ipNumberRequired: data.ipNumberRequired ?? true,
      dispensaryRequired: data.dispensaryRequired ?? false,
      cashless: data.cashless ?? true,
      effectiveFrom: data.effectiveFrom || new Date(),
    },
  });
}

export async function updateESIPolicy(id: string, data: Partial<ESIPolicyInput>) {
  return prisma.eSIPolicy.update({
    where: { id },
    data,
  });
}

export async function getESIPolicies(organizationId: string, isActive?: boolean) {
  return prisma.eSIPolicy.findMany({
    where: {
      organizationId,
      ...(isActive !== undefined && { isActive }),
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getESIPolicy(id: string) {
  return prisma.eSIPolicy.findUnique({
    where: { id },
  });
}

export async function deleteESIPolicy(id: string) {
  return prisma.eSIPolicy.update({
    where: { id },
    data: { isActive: false },
  });
}

// ==================== SALARY STRUCTURE TEMPLATE SERVICE ====================

export interface SalaryStructureTemplateInput {
  organizationId: string;
  name: string;
  description?: string;
  role?: string;
  department?: string;
  level?: string;
  location?: string;
  components?: Prisma.InputJsonValue;
  allowances?: Prisma.InputJsonValue;
  deductions?: Prisma.InputJsonValue;
  variablePay?: boolean;
  variablePercentage?: number;
  annualCTC?: number;
  minCTC?: number;
  maxCTC?: number;
  isDefault?: boolean;
  effectiveFrom?: Date;
  effectiveTo?: Date;
}

export async function createSalaryStructureTemplate(data: SalaryStructureTemplateInput) {
  return prisma.salaryStructureTemplate.create({
    data: {
      ...data,
      components: data.components || { basic: 40, hra: 20, special: 40 },
      allowances: data.allowances || {},
      deductions: data.deductions || {},
      variablePay: data.variablePay ?? false,
      variablePercentage: data.variablePercentage || 0,
      isDefault: data.isDefault ?? false,
      effectiveFrom: data.effectiveFrom || new Date(),
    },
  });
}

export async function updateSalaryStructureTemplate(id: string, data: Partial<SalaryStructureTemplateInput>) {
  return prisma.salaryStructureTemplate.update({
    where: { id },
    data,
  });
}

export async function getSalaryStructureTemplates(
  organizationId: string,
  role?: string,
  department?: string,
  isActive?: boolean
) {
  return prisma.salaryStructureTemplate.findMany({
    where: {
      organizationId,
      ...(role && { role }),
      ...(department && { department }),
      ...(isActive !== undefined && { isActive }),
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getSalaryStructureTemplate(id: string) {
  return prisma.salaryStructureTemplate.findUnique({
    where: { id },
  });
}

export async function deleteSalaryStructureTemplate(id: string) {
  return prisma.salaryStructureTemplate.update({
    where: { id },
    data: { isActive: false },
  });
}

// ==================== COMPLIANCE POLICY SERVICE ====================

export interface CompliancePolicyInput {
  organizationId: string;
  name: string;
  complianceType: string;
  country?: string;
  state?: string;
  regulation: string;
  description?: string;
  requirements?: Prisma.InputJsonValue;
  thresholds?: Prisma.InputJsonValue;
  filingFrequency?: string;
  filingDeadlines?: Prisma.InputJsonValue;
  penalties?: Prisma.InputJsonValue;
  documentsRequired?: string[];
  reportsRequired?: string[];
  auditFrequency?: string;
  lastAuditDate?: Date;
  nextAuditDate?: Date;
  complianceOfficer?: string;
  autoCalculation?: boolean;
  integrationRequired?: boolean;
  externalSystem?: string;
  effectiveFrom?: Date;
  effectiveTo?: Date;
}

export async function createCompliancePolicy(data: CompliancePolicyInput) {
  return prisma.compliancePolicy.create({
    data: {
      ...data,
      country: data.country || 'IN',
      filingFrequency: data.filingFrequency || 'MONTHLY',
      auditFrequency: data.auditFrequency || 'ANNUAL',
      autoCalculation: data.autoCalculation ?? true,
      integrationRequired: data.integrationRequired ?? false,
      documentsRequired: data.documentsRequired || [],
      reportsRequired: data.reportsRequired || [],
      requirements: data.requirements || {},
      thresholds: data.thresholds || {},
      filingDeadlines: data.filingDeadlines || {},
      penalties: data.penalties || {},
      effectiveFrom: data.effectiveFrom || new Date(),
    },
  });
}

export async function updateCompliancePolicy(id: string, data: Partial<CompliancePolicyInput>) {
  return prisma.compliancePolicy.update({
    where: { id },
    data,
  });
}

export async function getCompliancePolicies(
  organizationId: string,
  complianceType?: string,
  isActive?: boolean
) {
  return prisma.compliancePolicy.findMany({
    where: {
      organizationId,
      ...(complianceType && { complianceType }),
      ...(isActive !== undefined && { isActive }),
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getCompliancePolicy(id: string) {
  return prisma.compliancePolicy.findUnique({
    where: { id },
  });
}

export async function deleteCompliancePolicy(id: string) {
  return prisma.compliancePolicy.update({
    where: { id },
    data: { isActive: false },
  });
}

// Export prisma for direct access if needed
export { prisma };
