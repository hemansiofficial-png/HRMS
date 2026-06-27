import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export type Role = 'ADMIN' | 'HR_MANAGER' | 'EMPLOYEE' | 'SUPER_ADMIN' | 'PAYROLL_ADMIN' | 'MANAGER';

export const ROLE_HIERARCHY: Record<Role, number> = {
  SUPER_ADMIN: 5,
  ADMIN: 4,
  HR_MANAGER: 3,
  PAYROLL_ADMIN: 2,
  MANAGER: 1,
  EMPLOYEE: 0,
};

/**
 * Check if a role has access to perform an action requiring a minimum role
 */
export function hasRoleAccess(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Middleware wrapper to protect API routes based on role
 * Usage: export const GET = withRoleAuth('ADMIN', async (req, { params }) => { ... });
 */
export function withRoleAuth<T extends NextRequest>(
  requiredRole: Role,
  handler: (req: T, context: { params: Promise<Record<string, string>> }) => Promise<Response>
) {
  return async (req: T, context: { params: Promise<Record<string, string>> }) => {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const userRole = session.user.role as Role;

    if (!hasRoleAccess(userRole, requiredRole)) {
      return NextResponse.json(
        { error: 'Forbidden', message: `Required role: ${requiredRole}. Your role: ${userRole}` },
        { status: 403 }
      );
    }

    return handler(req, context);
  };
}

/**
 * Simplified admin-only auth wrapper
 */
export function withAdminAuth<T extends NextRequest>(
  handler: (req: T) => Promise<Response>
) {
  return withRoleAuth('ADMIN', handler);
}

/**
 * Get current user session with role validation
 */
export async function getCurrentUserSession() {
  const session = await auth();

  if (!session?.user) {
    return { error: 'Unauthorized' as const, session: null };
  }

  return { error: null, session };
}

/**
 * Get session with typed user
 */
export async function getSessionWithUser() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  return {
    ...session,
    user: {
      ...session.user,
      id: session.user.id,
      role: session.user.role as Role,
    },
  };
}
