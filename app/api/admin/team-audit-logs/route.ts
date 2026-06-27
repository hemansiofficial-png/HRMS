import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withAdminAuth } from '@/lib/rbac';

/**
 * GET /api/admin/team-audit-logs
 * Get audit logs for team management actions
 */
export const GET = withAdminAuth(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const action = searchParams.get('action') || undefined;
    const employeeId = searchParams.get('employeeId') || undefined;

    const session = await auth();
    const organizationId = (session?.user as any)?.organizationId || undefined;

    const where: Record<string, unknown> = {
      module: 'TEAM_MANAGEMENT',
    };

    if (organizationId) {
      where.organizationId = organizationId;
    }

    if (action) {
      where.action = action;
    }

    if (employeeId) {
      where.employeeId = employeeId;
    }

    const auditLogs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        employee: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Format the response
    const formattedLogs = auditLogs.map((log) => ({
      id: log.id,
      action: log.action,
      module: log.module,
      createdAt: log.createdAt,
      ipAddress: log.ipAddress,
      employee: log.employee
        ? {
            id: log.employee.id,
            employeeCode: log.employee.employeeCode,
            name: log.employee.user.name,
            email: log.employee.user.email,
          }
        : null,
      metadata: log.metadata ? JSON.parse(log.metadata) : null,
      changes: log.changes ? JSON.parse(log.changes) : null,
    }));

    return NextResponse.json({
      success: true,
      data: formattedLogs,
      meta: {
        total: formattedLogs.length,
        limit,
        filters: {
          action,
          employeeId,
        },
      },
    });
  } catch (error) {
    console.error('[Get Audit Logs] Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
});
