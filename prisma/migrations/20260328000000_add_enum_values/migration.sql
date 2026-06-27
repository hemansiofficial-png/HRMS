-- AlterEnum
ALTER TYPE "ApplicationStatus" ADD VALUE IF NOT EXISTS 'PENDING';

-- AlterEnum
ALTER TYPE "AttendanceStatus" ADD VALUE 'OVERTIME';
