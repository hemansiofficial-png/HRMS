/**
 * Role-based URL routing utilities
 * 
 * This file contains the mapping of user roles to their respective
 * base URL prefixes for role-based navigation.
 */

export const ROLE_URL_PREFIX: Record<string, string> = {
  SUPER_ADMIN: '/admin',
  ADMIN: '/admin',
  HR_MANAGER: '/admin',
  MANAGER: '/manager',
  PAYROLL_ADMIN: '/payroll',
  EMPLOYEE: '/employee',
};

/**
 * Get the base URL prefix for a given role
 */
export function getRoleBasePath(role: string): string {
  return ROLE_URL_PREFIX[role] || '/employee';
}

/**
 * Get allowed path prefixes for a given role
 */
export function getAllowedPrefixes(role: string): string[] {
  switch (role) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
      return ['/admin', '/employee', '/profile', '/devices', '/leave', '/attendance', '/payroll/payslips'];
    case 'HR_MANAGER':
      return ['/admin', '/employee', '/profile', '/devices', '/leave', '/attendance', '/payroll/payslips'];
    case 'MANAGER':
      return ['/manager', '/employee', '/profile', '/devices', '/leave', '/attendance', '/my-team', '/payroll/payslips'];
    case 'PAYROLL_ADMIN':
      return ['/payroll', '/employee', '/profile', '/devices', '/leave', '/attendance', '/payroll/payslips'];
    case 'EMPLOYEE':
    default:
      return ['/employee', '/profile', '/devices', '/leave', '/attendance', '/payroll/payslips'];
  }
}

/**
 * Check if a user with the given role can access a specific path
 */
export function canAccessPath(role: string, pathname: string): boolean {
  const allowedPrefixes = getAllowedPrefixes(role);
  return allowedPrefixes.some(prefix => pathname.startsWith(prefix));
}

/**
 * Get the redirect path if a user tries to access a restricted area
 */
export function getRestrictedRedirectPath(role: string): string {
  return getRoleBasePath(role);
}

/**
 * Path mapping for role-based navigation
 * Maps generic paths to role-specific paths
 * Only includes paths that actually exist in the codebase
 */
const PATH_MAPPING: Record<string, Record<string, string>> = {
  SUPER_ADMIN: {
    '/dashboard': '/admin',
    '/employees': '/admin/employees',
    '/departments': '/departments', // Keep as-is, page exists at /departments
    '/employee-lifecycle': '/admin/employee-lifecycle',
    '/analytics': '/admin/analytics',
    '/devices': '/admin/devices',
    '/team-management': '/admin/team-management',
    '/training': '/admin/training',
    '/onboarding': '/admin/onboarding',
    '/performance-reviews': '/admin/performance-reviews',
    '/resignations': '/resignations', // Keep as-is
    '/recruitment': '/recruitment', // Keep as-is
    '/performance': '/performance', // Keep as-is
    '/attendance': '/attendance', // Keep as-is
    '/leave': '/leave', // Keep as-is
    '/payroll': '/payroll', // Keep as-is
    '/documents': '/documents', // Keep as-is
    '/profile': '/profile', // Keep as-is
    '/settings/organization': '/settings/organization',
    '/settings/subscription': '/settings/subscription',
  },
  ADMIN: {
    '/dashboard': '/admin',
    '/employees': '/admin/employees',
    '/departments': '/departments',
    '/employee-lifecycle': '/admin/employee-lifecycle',
    '/analytics': '/admin/analytics',
    '/devices': '/admin/devices',
    '/team-management': '/admin/team-management',
    '/training': '/admin/training',
    '/onboarding': '/admin/onboarding',
    '/performance-reviews': '/admin/performance-reviews',
    '/resignations': '/resignations',
    '/recruitment': '/recruitment',
    '/performance': '/performance',
    '/attendance': '/attendance',
    '/leave': '/leave',
    '/payroll': '/payroll',
    '/documents': '/documents',
    '/profile': '/profile',
    '/settings/organization': '/settings/organization',
    '/settings/subscription': '/settings/subscription',
  },
  HR_MANAGER: {
    '/dashboard': '/admin',
    '/employees': '/admin/employees',
    '/departments': '/departments',
    '/employee-lifecycle': '/admin/employee-lifecycle',
    '/analytics': '/admin/analytics',
    '/devices': '/admin/devices',
    '/team-management': '/admin/team-management',
    '/training': '/admin/training',
    '/onboarding': '/admin/onboarding',
    '/performance-reviews': '/admin/performance-reviews',
    '/resignations': '/resignations',
    '/recruitment': '/recruitment',
    '/performance': '/performance',
    '/attendance': '/attendance',
    '/leave': '/leave',
    '/payroll': '/payroll',
    '/documents': '/documents',
    '/profile': '/profile',
    '/settings/organization': '/settings/organization',
    '/settings/subscription': '/settings/subscription',
  },
  MANAGER: {
    '/dashboard': '/manager',
    '/employees': '/manager/team',
    '/team': '/manager/team',
    '/approvals': '/manager/approvals',
    '/departments': '/departments',
    '/resignations': '/resignations',
    '/recruitment': '/recruitment',
    '/performance': '/performance',
    '/attendance': '/attendance',
    '/leave': '/leave',
    '/payroll': '/payroll',
    '/documents': '/documents',
    '/profile': '/profile',
    '/settings/organization': '/settings/organization',
  },
  PAYROLL_ADMIN: {
    '/dashboard': '/payroll',
    '/employees': '/admin/employees',
    '/departments': '/departments',
    '/resignations': '/resignations',
    '/recruitment': '/recruitment',
    '/performance': '/performance',
    '/attendance': '/attendance',
    '/leave': '/leave',
    '/payroll': '/payroll',
    '/documents': '/documents',
    '/profile': '/profile',
    '/settings/organization': '/settings/organization',
  },
  EMPLOYEE: {
    '/dashboard': '/employee',
    '/employees': '/employees',
    '/organization': '/employees',
    '/departments': '/departments',
    '/resignations': '/resignations',
    '/recruitment': '/recruitment',
    '/performance': '/performance',
    '/attendance': '/attendance',
    '/leave': '/leave',
    '/payroll': '/payroll/payslips',
    '/documents': '/documents',
    '/profile': '/profile',
    '/devices': '/devices',
  },
};

/**
 * Transform a generic href to a role-specific href
 * This should be used for all navigation links
 */
export function getRoleAwareHref(role: string, href: string): string {
  if (!href || href.startsWith('/api/') || href.startsWith('/auth/')) {
    return href;
  }

  const roleMappings = PATH_MAPPING[role] || PATH_MAPPING.EMPLOYEE;
  return roleMappings[href] || href;
}

/**
 * React hook to get role-aware navigation helper
 * Usage: const { getHref } = useRoleNavigation();
 *        <Link href={getHref('/dashboard')}>Dashboard</Link>
 */
export function useRoleNavigation() {
  const { data: session } = require('next-auth/react') as any;
  const role = session?.user?.role || 'EMPLOYEE';

  const getHref = (href: string): string => {
    return getRoleAwareHref(role, href);
  };

  return { getHref, role };
}
