-- CreateTable
CREATE TABLE "DeviceIssue" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "issue" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "reportedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedDate" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolution" TEXT,
    "employeeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceIssue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeviceIssue_deviceId_idx" ON "DeviceIssue"("deviceId");

-- CreateIndex
CREATE INDEX "DeviceIssue_employeeId_idx" ON "DeviceIssue"("employeeId");

-- CreateIndex
CREATE INDEX "DeviceIssue_status_idx" ON "DeviceIssue"("status");

-- AddForeignKey
ALTER TABLE "DeviceIssue" ADD CONSTRAINT "DeviceIssue_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "AssignedAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceIssue" ADD CONSTRAINT "DeviceIssue_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
