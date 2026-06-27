import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

export interface AuditLogEntry {
  employeeId?: string;
  action: string;
  module: string;
  metadata?: Record<string, unknown>;
  changes?: Record<string, unknown>;
  organizationId?: string;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(entry: AuditLogEntry) {
  const headersList = await headers();
  const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || undefined;

  return prisma.auditLog.create({
    data: {
      employeeId: entry.employeeId,
      action: entry.action,
      module: entry.module,
      metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
      changes: entry.changes ? JSON.stringify(entry.changes) : null,
      ipAddress,
      organizationId: entry.organizationId,
    },
  });
}

/**
 * Log manager assignment action
 */
export async function logManagerAssignment(data: {
  adminUserId: string;
  adminName: string;
  managerId: string;
  managerName: string;
  employeeIds: string[];
  employeeNames: string[];
  organizationId?: string;
}) {
  return createAuditLog({
    action: 'MANAGER_ASSIGNED',
    module: 'TEAM_MANAGEMENT',
    metadata: {
      adminUserId: data.adminUserId,
      adminName: data.adminName,
      managerId: data.managerId,
      managerName: data.managerName,
      employeeIds: data.employeeIds,
      employeeNames: data.employeeNames,
      timestamp: new Date().toISOString(),
    },
    changes: {
      action: 'ASSIGN_MANAGER',
      managerId: data.managerId,
      managerName: data.managerName,
      affectedEmployees: data.employeeIds.length,
    },
    organizationId: data.organizationId,
  });
}

/**
 * Log manager removal action
 */
export async function logManagerRemoval(data: {
  adminUserId: string;
  adminName: string;
  employeeIds: string[];
  employeeNames: string[];
  previousManagerId?: string;
  previousManagerName?: string;
  organizationId?: string;
}) {
  return createAuditLog({
    action: 'MANAGER_REMOVED',
    module: 'TEAM_MANAGEMENT',
    metadata: {
      adminUserId: data.adminUserId,
      adminName: data.adminName,
      employeeIds: data.employeeIds,
      employeeNames: data.employeeNames,
      previousManagerId: data.previousManagerId,
      previousManagerName: data.previousManagerName,
      timestamp: new Date().toISOString(),
    },
    changes: {
      action: 'REMOVE_MANAGER',
      previousManagerId: data.previousManagerId,
      previousManagerName: data.previousManagerName,
      affectedEmployees: data.employeeIds.length,
    },
    organizationId: data.organizationId,
  });
}

/**
 * Log manager reassignment action
 */
export async function logManagerReassignment(data: {
  adminUserId: string;
  adminName: string;
  employeeIds: string[];
  employeeNames: string[];
  oldManagerId: string;
  oldManagerName: string;
  newManagerId: string;
  newManagerName: string;
  organizationId?: string;
}) {
  return createAuditLog({
    action: 'MANAGER_REASSIGNED',
    module: 'TEAM_MANAGEMENT',
    metadata: {
      adminUserId: data.adminUserId,
      adminName: data.adminName,
      employeeIds: data.employeeIds,
      employeeNames: data.employeeNames,
      oldManagerId: data.oldManagerId,
      oldManagerName: data.oldManagerName,
      newManagerId: data.newManagerId,
      newManagerName: data.newManagerName,
      timestamp: new Date().toISOString(),
    },
    changes: {
      action: 'REASSIGN_MANAGER',
      fromManager: { id: data.oldManagerId, name: data.oldManagerName },
      toManager: { id: data.newManagerId, name: data.newManagerName },
      affectedEmployees: data.employeeIds.length,
    },
    organizationId: data.organizationId,
  });
}

/**
 * Get audit logs for team management
 */
export async function getTeamManagementAuditLogs(organizationId?: string, limit = 50) {
  return prisma.auditLog.findMany({
    where: {
      module: 'TEAM_MANAGEMENT',
      organizationId,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}
