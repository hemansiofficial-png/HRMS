-- AlterTable
ALTER TABLE "AuditLog" ALTER COLUMN "module" DROP DEFAULT;

-- AlterTable
ALTER TABLE "BankDetails" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Employee" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "EmployeeDocument" ALTER COLUMN "documentName" DROP DEFAULT,
ALTER COLUMN "documentType" DROP DEFAULT,
ALTER COLUMN "documentUrl" DROP DEFAULT;

-- AlterTable
ALTER TABLE "LeaveRequest" ALTER COLUMN "numberOfDays" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "leaveType" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Payroll" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PerformanceReview" ALTER COLUMN "reviewPeriodEnd" DROP DEFAULT,
ALTER COLUMN "reviewPeriodStart" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PersonalInfo" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "updatedAt" DROP DEFAULT;
