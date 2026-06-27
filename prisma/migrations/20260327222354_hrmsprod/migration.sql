/*
  Warnings:

  - You are about to drop the column `baseSalary` on the `Payroll` table. All the data in the column will be lost.
  - You are about to drop the column `deductions` on the `Payroll` table. All the data in the column will be lost.
  - You are about to drop the column `notice` on the `Resignation` table. All the data in the column will be lost.
  - You are about to drop the column `resgnationDate` on the `Resignation` table. All the data in the column will be lost.
  - Added the required column `noticeDate` to the `Resignation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Resignation` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
DO $$
BEGIN
    CREATE TYPE "NotificationType" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'ERROR');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$
BEGIN
    CREATE TYPE "NotificationCategory" AS ENUM ('GENERAL', 'LEAVE', 'ATTENDANCE', 'PAYROLL', 'PERFORMANCE', 'RESIGNATION', 'TERMINATION', 'PROMOTION', 'TRANSFER', 'TASK', 'ANNOUNCEMENT');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$
BEGIN
    CREATE TYPE "ShiftType" AS ENUM ('MORNING', 'AFTERNOON', 'NIGHT', 'ROTATING', 'FLEXIBLE');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$
BEGIN
    CREATE TYPE "OvertimeType" AS ENUM ('WEEKDAY', 'WEEKEND', 'HOLIDAY', 'NIGHT_SHIFT');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$
BEGIN
    CREATE TYPE "DeviceStatus" AS ENUM ('AVAILABLE', 'ASSIGNED', 'MAINTENANCE', 'DAMAGED', 'LOST', 'RETIRED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$
BEGIN
    CREATE TYPE "ExitType" AS ENUM ('RESIGNATION', 'TERMINATION', 'RETIREMENT', 'ABSCONDING', 'DECEASED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$
BEGIN
    CREATE TYPE "ResignationStatus" AS ENUM ('DRAFT', 'PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'WITHDRAWN', 'ACCEPTED', 'COMPLETED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- DropForeignKey
ALTER TABLE "DeviceIssue" DROP CONSTRAINT "DeviceIssue_deviceId_fkey";

-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "checkInDeviceId" TEXT,
ADD COLUMN     "checkInLocation" JSONB,
ADD COLUMN     "checkOutDeviceId" TEXT,
ADD COLUMN     "checkOutLocation" JSONB,
ADD COLUMN     "isRegularized" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "overtimeApproved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "overtimeHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "shiftId" TEXT;

-- AlterTable
ALTER TABLE "AttendanceCorrection" ADD COLUMN     "rejectionReason" TEXT;

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "shiftId" TEXT;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "geoFenceRadius" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Payroll" DROP COLUMN "baseSalary",
DROP COLUMN "deductions",
ADD COLUMN     "absentDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "advanceDeduction" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "arrears" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "basicSalary" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "conveyanceAllowance" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "duplicateCheck" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "esiDeduction" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "grossSalary" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "halfDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "hra" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "incentive" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "isBulkProcessed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isFinalSettlement" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lateDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "leaveDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "leaveDeduction" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "leaveEncashment" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "loanDeduction" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "medicalAllowance" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "otherAllowances" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "otherDeductions" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "otherEarnings" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "overtimeHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "overtimePay" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentReference" TEXT,
ADD COLUMN     "pfDeduction" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "presentDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "professionalTax" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "specialAllowance" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "taxDeduction" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totalDeductions" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "workingDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "year" INTEGER NOT NULL DEFAULT 2024,
ALTER COLUMN "netSalary" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Resignation" DROP COLUMN "notice",
DROP COLUMN "resgnationDate",
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "discussionSummary" TEXT,
ADD COLUMN     "discussionWithManager" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hrComments" TEXT,
ADD COLUMN     "managerComments" TEXT,
ADD COLUMN     "noticeDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "noticePeriodDays" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "noticePeriodWaiver" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "okToRehire" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "reasonCategory" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "resignationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" "ResignationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "type" "ExitType" NOT NULL DEFAULT 'RESIGNATION',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "waiverReason" TEXT;

-- CreateTable
CREATE TABLE "AttendanceRegularization" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "missingDetails" TEXT[],
    "proposedCheckIn" TIMESTAMP(3),
    "proposedCheckOut" TIMESTAMP(3),
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceRegularization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "breakDuration" INTEGER NOT NULL DEFAULT 30,
    "gracePeriod" INTEGER NOT NULL DEFAULT 15,
    "isFlexible" BOOLEAN NOT NULL DEFAULT false,
    "workingHours" DOUBLE PRECISION NOT NULL DEFAULT 8,
    "overtimeEligible" BOOLEAN NOT NULL DEFAULT true,
    "nightShift" BOOLEAN NOT NULL DEFAULT false,
    "nightShiftStart" TEXT,
    "nightShiftEnd" TEXT,
    "applicableDays" INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5]::INTEGER[],
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryStructure" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "basicSalary" DECIMAL(12,2) NOT NULL,
    "hra" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "specialAllowance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "conveyanceAllowance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "medicalAllowance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "otherAllowances" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "hraPercentage" DOUBLE PRECISION,
    "pfPercentage" DOUBLE PRECISION,
    "esiApplicable" BOOLEAN NOT NULL DEFAULT false,
    "annualCTC" DECIMAL(12,2) NOT NULL,
    "variablePay" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalaryStructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryRevision" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "payrollId" TEXT,
    "revisionType" TEXT NOT NULL,
    "revisionDate" TIMESTAMP(3) NOT NULL,
    "previousSalary" DECIMAL(12,2) NOT NULL,
    "newSalary" DECIMAL(12,2) NOT NULL,
    "revisionAmount" DECIMAL(12,2) NOT NULL,
    "revisionPercentage" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "approvedBy" TEXT,
    "remarks" TEXT,
    "previousStructureId" TEXT NOT NULL,
    "newStructureId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalaryRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollAuditLog" (
    "id" TEXT NOT NULL,
    "payrollId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "performedByName" TEXT NOT NULL,
    "previousValues" TEXT,
    "newValues" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayrollAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxDeclaration" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "financialYear" TEXT NOT NULL,
    "oldRegimeBasic" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "oldRegimeHRA" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "oldRegimeLTA" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "oldRegime80C" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "oldRegime80D" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "oldRegimeNPS" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "oldRegimeOther" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "newRegimeStandard" DECIMAL(12,2) NOT NULL DEFAULT 50000,
    "newRegimeOther" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "selectedRegime" TEXT NOT NULL DEFAULT 'NEW',
    "taxableIncome" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalTax" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "cess" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxDeclaration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollConfiguration" (
    "id" TEXT NOT NULL,
    "workingDaysPerMonth" INTEGER NOT NULL DEFAULT 26,
    "workingDaysPerWeek" INTEGER NOT NULL DEFAULT 6,
    "dailyHours" DOUBLE PRECISION NOT NULL DEFAULT 8,
    "overtimeRate" DOUBLE PRECISION NOT NULL DEFAULT 2,
    "unpaidLeaveDeduction" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "halfDayDeduction" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "lateThreshold" INTEGER NOT NULL DEFAULT 3,
    "lateDeductionDays" INTEGER NOT NULL DEFAULT 1,
    "pfEmployeeRate" DOUBLE PRECISION NOT NULL DEFAULT 12,
    "pfEmployerRate" DOUBLE PRECISION NOT NULL DEFAULT 12,
    "pfMaxSalary" DECIMAL(12,2) NOT NULL DEFAULT 15000,
    "esiEmployeeRate" DOUBLE PRECISION NOT NULL DEFAULT 0.75,
    "esiEmployerRate" DOUBLE PRECISION NOT NULL DEFAULT 3.25,
    "esiMaxSalary" DECIMAL(12,2) NOT NULL DEFAULT 21000,
    "professionalTax" DECIMAL(12,2) NOT NULL DEFAULT 200,
    "tdsBasicExemption" DECIMAL(12,2) NOT NULL DEFAULT 300000,
    "tdsRebateLimit" DECIMAL(12,2) NOT NULL DEFAULT 500000,
    "bonusPercentage" DOUBLE PRECISION NOT NULL DEFAULT 8.33,
    "bonusMinAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "lateFinePerDay" DECIMAL(12,2) NOT NULL DEFAULT 100,
    "requireApproval" BOOLEAN NOT NULL DEFAULT true,
    "autoApproveThreshold" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "noticePeriodDays" INTEGER NOT NULL DEFAULT 30,
    "leaveEncashmentDays" INTEGER NOT NULL DEFAULT 30,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "assetName" TEXT NOT NULL,
    "assetTag" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "description" TEXT,
    "status" "DeviceStatus" NOT NULL DEFAULT 'AVAILABLE',
    "condition" TEXT,
    "assignedTo" TEXT,
    "assignedDate" TIMESTAMP(3),
    "returnDate" TIMESTAMP(3),
    "purchaseDate" TIMESTAMP(3),
    "warrantyExpiry" TIMESTAMP(3),
    "vendor" TEXT,
    "cost" DECIMAL(12,2),
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "category" "NotificationCategory" NOT NULL DEFAULT 'GENERAL',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Overtime" (
    "id" TEXT NOT NULL,
    "attendanceId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "durationHours" DOUBLE PRECISION NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reason" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Overtime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BiometricDevice" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "ipAddress" TEXT,
    "location" TEXT,
    "serialNumber" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "syncStatus" TEXT NOT NULL DEFAULT 'IDLE',
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BiometricDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClearanceTask" (
    "id" TEXT NOT NULL,
    "resignationId" TEXT NOT NULL,
    "taskType" TEXT NOT NULL,
    "taskName" TEXT NOT NULL,
    "description" TEXT,
    "assignedTo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClearanceTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeSkill" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "skillName" TEXT NOT NULL,
    "proficiency" TEXT NOT NULL DEFAULT 'BEGINNER',
    "yearsOfExp" DOUBLE PRECISION,
    "lastUsed" TIMESTAMP(3),
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyVersion" (
    "id" TEXT NOT NULL,
    "policyType" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "changesSummary" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "previousData" JSONB NOT NULL,
    "currentData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "PolicyVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyAssignment" (
    "id" TEXT NOT NULL,
    "policyType" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "PolicyAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollPolicy" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "salaryComponents" JSONB NOT NULL,
    "deductionRules" JSONB NOT NULL,
    "overtimeRules" JSONB NOT NULL,
    "bonusRules" JSONB NOT NULL,
    "leaveEncashmentRules" JSONB NOT NULL,
    "arrearsRules" JSONB NOT NULL,
    "loanDeductionRules" JSONB NOT NULL,
    "advanceSalaryRules" JSONB NOT NULL,
    "gratuityRules" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxPolicy" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'IN',
    "state" TEXT,
    "financialYear" TEXT NOT NULL,
    "taxRegime" TEXT NOT NULL DEFAULT 'NEW',
    "taxSlabs" JSONB NOT NULL,
    "surchargeRules" JSONB NOT NULL,
    "cessRate" DOUBLE PRECISION NOT NULL DEFAULT 4,
    "standardDeduction" DECIMAL(12,2) NOT NULL DEFAULT 50000,
    "rebate87ALimit" DECIMAL(12,2) NOT NULL DEFAULT 500000,
    "basicExemption" DECIMAL(12,2) NOT NULL DEFAULT 300000,
    "deductions" JSONB NOT NULL,
    "exemptions" JSONB NOT NULL,
    "professionalTax" DECIMAL(12,2) NOT NULL DEFAULT 200,
    "ptExemptionMonths" INTEGER[] DEFAULT ARRAY[2]::INTEGER[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OvertimePolicy" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "eligibleRoles" TEXT[],
    "eligibleDepartments" TEXT[],
    "minOtHours" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "otRate" DOUBLE PRECISION NOT NULL DEFAULT 2,
    "otCalculationBase" TEXT NOT NULL DEFAULT 'HOURLY_BASIC',
    "fixedOtRate" DECIMAL(12,2),
    "maxOtHoursPerMonth" DOUBLE PRECISION,
    "maxOtAmountPerMonth" DECIMAL(12,2),
    "approvalRequired" BOOLEAN NOT NULL DEFAULT true,
    "autoApproveThreshold" DOUBLE PRECISION,
    "weekendMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 2,
    "holidayMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 3,
    "nightShiftAllowance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OvertimePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BonusPolicy" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bonusType" TEXT NOT NULL DEFAULT 'STATUTORY',
    "description" TEXT,
    "calculationType" TEXT NOT NULL DEFAULT 'PERCENTAGE',
    "percentage" DOUBLE PRECISION NOT NULL DEFAULT 8.33,
    "fixedAmount" DECIMAL(12,2),
    "formula" TEXT,
    "minEligibleMonths" INTEGER NOT NULL DEFAULT 0,
    "maxBonusAmount" DECIMAL(12,2),
    "minBonusAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "prorated" BOOLEAN NOT NULL DEFAULT true,
    "performanceLinked" BOOLEAN NOT NULL DEFAULT false,
    "performanceCriteria" JSONB,
    "departmentWise" BOOLEAN NOT NULL DEFAULT false,
    "departmentRules" JSONB,
    "roleWise" BOOLEAN NOT NULL DEFAULT false,
    "roleRules" JSONB,
    "paymentMonth" INTEGER NOT NULL DEFAULT 3,
    "paymentFrequency" TEXT NOT NULL DEFAULT 'ANNUAL',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BonusPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncentivePolicy" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "incentiveType" TEXT NOT NULL,
    "description" TEXT,
    "calculationType" TEXT NOT NULL DEFAULT 'PERCENTAGE',
    "percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fixedAmount" DECIMAL(12,2),
    "tieredRules" JSONB,
    "targetBased" BOOLEAN NOT NULL DEFAULT false,
    "targetAmount" DECIMAL(12,2),
    "achievementRules" JSONB,
    "capped" BOOLEAN NOT NULL DEFAULT false,
    "maxIncentiveAmount" DECIMAL(12,2),
    "minIncentiveAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "payoutFrequency" TEXT NOT NULL DEFAULT 'MONTHLY',
    "deferredPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cliffPeriodMonths" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncentivePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendancePolicy" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "workingDays" INTEGER NOT NULL DEFAULT 6,
    "workingHoursPerDay" DOUBLE PRECISION NOT NULL DEFAULT 8,
    "flexibleTiming" BOOLEAN NOT NULL DEFAULT false,
    "gracePeriodMinutes" INTEGER NOT NULL DEFAULT 15,
    "lateThresholdMinutes" INTEGER NOT NULL DEFAULT 15,
    "latePenalty" JSONB NOT NULL,
    "lateCountRules" JSONB NOT NULL,
    "earlyDepartureRules" JSONB NOT NULL,
    "halfDayRules" JSONB NOT NULL,
    "absentRules" JSONB NOT NULL,
    "overtimeRules" JSONB NOT NULL,
    "shiftTimings" JSONB NOT NULL,
    "breakRules" JSONB NOT NULL,
    "weekendWorkRules" JSONB NOT NULL,
    "holidayWorkRules" JSONB NOT NULL,
    "workFromHomeRules" JSONB NOT NULL,
    "regularizationRules" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendancePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReimbursementPolicy" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categories" JSONB NOT NULL,
    "approvalWorkflow" JSONB NOT NULL,
    "autoApproveLimit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "receiptRequired" BOOLEAN NOT NULL DEFAULT true,
    "receiptDeadline" INTEGER NOT NULL DEFAULT 30,
    "paymentCycle" TEXT NOT NULL DEFAULT 'MONTHLY',
    "taxable" BOOLEAN NOT NULL DEFAULT false,
    "subLimits" JSONB NOT NULL,
    "carryForward" BOOLEAN NOT NULL DEFAULT false,
    "carryForwardLimit" INTEGER NOT NULL DEFAULT 0,
    "eligibleRoles" TEXT[],
    "eligibleDepartments" TEXT[],
    "tenureRequirement" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReimbursementPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GratuityPolicy" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "calculationType" TEXT NOT NULL DEFAULT 'STATUTORY',
    "percentage" DOUBLE PRECISION NOT NULL DEFAULT 4.81,
    "formula" TEXT NOT NULL DEFAULT '(basic + da) * 15/26 * years',
    "minTenureYears" INTEGER NOT NULL DEFAULT 5,
    "maxGratuityAmount" DECIMAL(12,2),
    "roundingRules" TEXT NOT NULL DEFAULT 'ROUND_DOWN',
    "includeDA" BOOLEAN NOT NULL DEFAULT true,
    "includeAllowances" BOOLEAN NOT NULL DEFAULT false,
    "proRated" BOOLEAN NOT NULL DEFAULT true,
    "taxExempt" BOOLEAN NOT NULL DEFAULT true,
    "paymentOnExit" BOOLEAN NOT NULL DEFAULT true,
    "paymentOnRetirement" BOOLEAN NOT NULL DEFAULT true,
    "paymentOnDeath" BOOLEAN NOT NULL DEFAULT true,
    "nomineeRequired" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GratuityPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProvidentFundPolicy" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "employeeRate" DOUBLE PRECISION NOT NULL DEFAULT 12,
    "employerRate" DOUBLE PRECISION NOT NULL DEFAULT 12,
    "adminCharges" DECIMAL(5,2) NOT NULL DEFAULT 0.65,
    "edliRate" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "maxSalary" DECIMAL(12,2) NOT NULL DEFAULT 15000,
    "minSalary" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "pensionRate" DOUBLE PRECISION NOT NULL DEFAULT 8.33,
    "voluntaryPF" BOOLEAN NOT NULL DEFAULT false,
    "pensionScheme" BOOLEAN NOT NULL DEFAULT true,
    "edliScheme" BOOLEAN NOT NULL DEFAULT true,
    "uanRequired" BOOLEAN NOT NULL DEFAULT true,
    "enrollmentDays" INTEGER NOT NULL DEFAULT 60,
    "withdrawalRules" JSONB NOT NULL,
    "interestRate" DOUBLE PRECISION NOT NULL DEFAULT 8.15,
    "taxTreatment" TEXT NOT NULL DEFAULT 'EEE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProvidentFundPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ESIPolicy" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "employeeRate" DOUBLE PRECISION NOT NULL DEFAULT 0.75,
    "employerRate" DOUBLE PRECISION NOT NULL DEFAULT 3.25,
    "maxSalary" DECIMAL(12,2) NOT NULL DEFAULT 21000,
    "minSalary" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "disabilityBenefit" BOOLEAN NOT NULL DEFAULT true,
    "dependentBenefit" BOOLEAN NOT NULL DEFAULT true,
    "medicalBenefit" BOOLEAN NOT NULL DEFAULT true,
    "maternityBenefit" BOOLEAN NOT NULL DEFAULT true,
    "funeralExpense" DECIMAL(12,2) NOT NULL DEFAULT 15000,
    "ipNumberRequired" BOOLEAN NOT NULL DEFAULT true,
    "dispensaryRequired" BOOLEAN NOT NULL DEFAULT false,
    "cashless" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ESIPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryStructureTemplate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "role" TEXT,
    "department" TEXT,
    "level" TEXT,
    "location" TEXT,
    "components" JSONB NOT NULL,
    "allowances" JSONB NOT NULL,
    "deductions" JSONB NOT NULL,
    "variablePay" BOOLEAN NOT NULL DEFAULT false,
    "variablePercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "annualCTC" DECIMAL(12,2),
    "minCTC" DECIMAL(12,2),
    "maxCTC" DECIMAL(12,2),
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalaryStructureTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompliancePolicy" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "complianceType" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'IN',
    "state" TEXT,
    "regulation" TEXT NOT NULL,
    "description" TEXT,
    "requirements" JSONB NOT NULL,
    "thresholds" JSONB NOT NULL,
    "filingFrequency" TEXT NOT NULL DEFAULT 'MONTHLY',
    "filingDeadlines" JSONB NOT NULL,
    "penalties" JSONB NOT NULL,
    "documentsRequired" TEXT[],
    "reportsRequired" TEXT[],
    "auditFrequency" TEXT NOT NULL DEFAULT 'ANNUAL',
    "lastAuditDate" TIMESTAMP(3),
    "nextAuditDate" TIMESTAMP(3),
    "complianceOfficer" TEXT,
    "autoCalculation" BOOLEAN NOT NULL DEFAULT true,
    "integrationRequired" BOOLEAN NOT NULL DEFAULT false,
    "externalSystem" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompliancePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AttendanceRegularization_employeeId_idx" ON "AttendanceRegularization"("employeeId");

-- CreateIndex
CREATE INDEX "AttendanceRegularization_status_idx" ON "AttendanceRegularization"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Shift_code_key" ON "Shift"("code");

-- CreateIndex
CREATE INDEX "Shift_organizationId_idx" ON "Shift"("organizationId");

-- CreateIndex
CREATE INDEX "SalaryStructure_employeeId_idx" ON "SalaryStructure"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "SalaryRevision_payrollId_key" ON "SalaryRevision"("payrollId");

-- CreateIndex
CREATE INDEX "SalaryRevision_employeeId_idx" ON "SalaryRevision"("employeeId");

-- CreateIndex
CREATE INDEX "SalaryRevision_revisionDate_idx" ON "SalaryRevision"("revisionDate");

-- CreateIndex
CREATE INDEX "PayrollAuditLog_payrollId_idx" ON "PayrollAuditLog"("payrollId");

-- CreateIndex
CREATE INDEX "PayrollAuditLog_action_idx" ON "PayrollAuditLog"("action");

-- CreateIndex
CREATE INDEX "TaxDeclaration_employeeId_idx" ON "TaxDeclaration"("employeeId");

-- CreateIndex
CREATE INDEX "TaxDeclaration_financialYear_idx" ON "TaxDeclaration"("financialYear");

-- CreateIndex
CREATE UNIQUE INDEX "Device_assetTag_key" ON "Device"("assetTag");

-- CreateIndex
CREATE UNIQUE INDEX "Device_serialNumber_key" ON "Device"("serialNumber");

-- CreateIndex
CREATE INDEX "Device_assignedTo_idx" ON "Device"("assignedTo");

-- CreateIndex
CREATE INDEX "Device_organizationId_idx" ON "Device"("organizationId");

-- CreateIndex
CREATE INDEX "Device_status_idx" ON "Device"("status");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "Overtime_attendanceId_idx" ON "Overtime"("attendanceId");

-- CreateIndex
CREATE INDEX "Overtime_employeeId_idx" ON "Overtime"("employeeId");

-- CreateIndex
CREATE INDEX "Overtime_status_idx" ON "Overtime"("status");

-- CreateIndex
CREATE UNIQUE INDEX "BiometricDevice_deviceId_key" ON "BiometricDevice"("deviceId");

-- CreateIndex
CREATE INDEX "BiometricDevice_organizationId_idx" ON "BiometricDevice"("organizationId");

-- CreateIndex
CREATE INDEX "BiometricDevice_deviceId_idx" ON "BiometricDevice"("deviceId");

-- CreateIndex
CREATE INDEX "ClearanceTask_resignationId_idx" ON "ClearanceTask"("resignationId");

-- CreateIndex
CREATE INDEX "ClearanceTask_status_idx" ON "ClearanceTask"("status");

-- CreateIndex
CREATE INDEX "EmployeeSkill_employeeId_idx" ON "EmployeeSkill"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeSkill_skillName_idx" ON "EmployeeSkill"("skillName");

-- CreateIndex
CREATE INDEX "PolicyVersion_policyType_policyId_idx" ON "PolicyVersion"("policyType", "policyId");

-- CreateIndex
CREATE INDEX "PolicyVersion_organizationId_idx" ON "PolicyVersion"("organizationId");

-- CreateIndex
CREATE INDEX "PolicyVersion_isActive_idx" ON "PolicyVersion"("isActive");

-- CreateIndex
CREATE INDEX "PolicyAssignment_policyType_policyId_idx" ON "PolicyAssignment"("policyType", "policyId");

-- CreateIndex
CREATE INDEX "PolicyAssignment_entityType_entityId_idx" ON "PolicyAssignment"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "PolicyAssignment_organizationId_idx" ON "PolicyAssignment"("organizationId");

-- CreateIndex
CREATE INDEX "PayrollPolicy_organizationId_idx" ON "PayrollPolicy"("organizationId");

-- CreateIndex
CREATE INDEX "PayrollPolicy_isActive_idx" ON "PayrollPolicy"("isActive");

-- CreateIndex
CREATE INDEX "TaxPolicy_organizationId_idx" ON "TaxPolicy"("organizationId");

-- CreateIndex
CREATE INDEX "TaxPolicy_country_idx" ON "TaxPolicy"("country");

-- CreateIndex
CREATE INDEX "TaxPolicy_financialYear_idx" ON "TaxPolicy"("financialYear");

-- CreateIndex
CREATE INDEX "TaxPolicy_isActive_idx" ON "TaxPolicy"("isActive");

-- CreateIndex
CREATE INDEX "OvertimePolicy_organizationId_idx" ON "OvertimePolicy"("organizationId");

-- CreateIndex
CREATE INDEX "OvertimePolicy_isActive_idx" ON "OvertimePolicy"("isActive");

-- CreateIndex
CREATE INDEX "BonusPolicy_organizationId_idx" ON "BonusPolicy"("organizationId");

-- CreateIndex
CREATE INDEX "BonusPolicy_bonusType_idx" ON "BonusPolicy"("bonusType");

-- CreateIndex
CREATE INDEX "BonusPolicy_isActive_idx" ON "BonusPolicy"("isActive");

-- CreateIndex
CREATE INDEX "IncentivePolicy_organizationId_idx" ON "IncentivePolicy"("organizationId");

-- CreateIndex
CREATE INDEX "IncentivePolicy_incentiveType_idx" ON "IncentivePolicy"("incentiveType");

-- CreateIndex
CREATE INDEX "IncentivePolicy_isActive_idx" ON "IncentivePolicy"("isActive");

-- CreateIndex
CREATE INDEX "AttendancePolicy_organizationId_idx" ON "AttendancePolicy"("organizationId");

-- CreateIndex
CREATE INDEX "AttendancePolicy_isActive_idx" ON "AttendancePolicy"("isActive");

-- CreateIndex
CREATE INDEX "ReimbursementPolicy_organizationId_idx" ON "ReimbursementPolicy"("organizationId");

-- CreateIndex
CREATE INDEX "ReimbursementPolicy_isActive_idx" ON "ReimbursementPolicy"("isActive");

-- CreateIndex
CREATE INDEX "GratuityPolicy_organizationId_idx" ON "GratuityPolicy"("organizationId");

-- CreateIndex
CREATE INDEX "GratuityPolicy_isActive_idx" ON "GratuityPolicy"("isActive");

-- CreateIndex
CREATE INDEX "ProvidentFundPolicy_organizationId_idx" ON "ProvidentFundPolicy"("organizationId");

-- CreateIndex
CREATE INDEX "ProvidentFundPolicy_isActive_idx" ON "ProvidentFundPolicy"("isActive");

-- CreateIndex
CREATE INDEX "ESIPolicy_organizationId_idx" ON "ESIPolicy"("organizationId");

-- CreateIndex
CREATE INDEX "ESIPolicy_isActive_idx" ON "ESIPolicy"("isActive");

-- CreateIndex
CREATE INDEX "SalaryStructureTemplate_organizationId_idx" ON "SalaryStructureTemplate"("organizationId");

-- CreateIndex
CREATE INDEX "SalaryStructureTemplate_role_idx" ON "SalaryStructureTemplate"("role");

-- CreateIndex
CREATE INDEX "SalaryStructureTemplate_department_idx" ON "SalaryStructureTemplate"("department");

-- CreateIndex
CREATE INDEX "SalaryStructureTemplate_isActive_idx" ON "SalaryStructureTemplate"("isActive");

-- CreateIndex
CREATE INDEX "CompliancePolicy_organizationId_idx" ON "CompliancePolicy"("organizationId");

-- CreateIndex
CREATE INDEX "CompliancePolicy_complianceType_idx" ON "CompliancePolicy"("complianceType");

-- CreateIndex
CREATE INDEX "CompliancePolicy_isActive_idx" ON "CompliancePolicy"("isActive");

-- CreateIndex
CREATE INDEX "Attendance_shiftId_idx" ON "Attendance"("shiftId");

-- CreateIndex
CREATE INDEX "Employee_shiftId_idx" ON "Employee"("shiftId");

-- CreateIndex
CREATE INDEX "Organization_latitude_longitude_idx" ON "Organization"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "Payroll_employeeId_idx" ON "Payroll"("employeeId");

-- CreateIndex
CREATE INDEX "Payroll_month_idx" ON "Payroll"("month");

-- CreateIndex
CREATE INDEX "Payroll_year_idx" ON "Payroll"("year");

-- CreateIndex
CREATE INDEX "Payroll_status_idx" ON "Payroll"("status");

-- CreateIndex
CREATE INDEX "Resignation_employeeId_idx" ON "Resignation"("employeeId");

-- CreateIndex
CREATE INDEX "Resignation_status_idx" ON "Resignation"("status");

-- CreateIndex
CREATE INDEX "Resignation_type_idx" ON "Resignation"("type");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRegularization" ADD CONSTRAINT "AttendanceRegularization_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryStructure" ADD CONSTRAINT "SalaryStructure_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryRevision" ADD CONSTRAINT "SalaryRevision_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryRevision" ADD CONSTRAINT "SalaryRevision_newStructureId_fkey" FOREIGN KEY ("newStructureId") REFERENCES "SalaryStructure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryRevision" ADD CONSTRAINT "SalaryRevision_payrollId_fkey" FOREIGN KEY ("payrollId") REFERENCES "Payroll"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryRevision" ADD CONSTRAINT "SalaryRevision_previousStructureId_fkey" FOREIGN KEY ("previousStructureId") REFERENCES "SalaryStructure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollAuditLog" ADD CONSTRAINT "PayrollAuditLog_payrollId_fkey" FOREIGN KEY ("payrollId") REFERENCES "Payroll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxDeclaration" ADD CONSTRAINT "TaxDeclaration_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceIssue" ADD CONSTRAINT "DeviceIssue_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Overtime" ADD CONSTRAINT "Overtime_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "Attendance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiometricDevice" ADD CONSTRAINT "BiometricDevice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resignation" ADD CONSTRAINT "Resignation_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClearanceTask" ADD CONSTRAINT "ClearanceTask_resignationId_fkey" FOREIGN KEY ("resignationId") REFERENCES "Resignation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSkill" ADD CONSTRAINT "EmployeeSkill_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollPolicy" ADD CONSTRAINT "PayrollPolicy_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxPolicy" ADD CONSTRAINT "TaxPolicy_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OvertimePolicy" ADD CONSTRAINT "OvertimePolicy_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BonusPolicy" ADD CONSTRAINT "BonusPolicy_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncentivePolicy" ADD CONSTRAINT "IncentivePolicy_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendancePolicy" ADD CONSTRAINT "AttendancePolicy_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReimbursementPolicy" ADD CONSTRAINT "ReimbursementPolicy_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GratuityPolicy" ADD CONSTRAINT "GratuityPolicy_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProvidentFundPolicy" ADD CONSTRAINT "ProvidentFundPolicy_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ESIPolicy" ADD CONSTRAINT "ESIPolicy_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryStructureTemplate" ADD CONSTRAINT "SalaryStructureTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompliancePolicy" ADD CONSTRAINT "CompliancePolicy_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
