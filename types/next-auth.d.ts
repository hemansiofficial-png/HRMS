import 'next-auth';
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'ADMIN' | 'HR_MANAGER' | 'EMPLOYEE' | 'SUPER_ADMIN' | 'PAYROLL_ADMIN' | 'MANAGER';
      organizationId?: string | null;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    role: 'ADMIN' | 'HR_MANAGER' | 'EMPLOYEE' | 'SUPER_ADMIN' | 'PAYROLL_ADMIN' | 'MANAGER';
    organizationId?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: 'ADMIN' | 'HR_MANAGER' | 'EMPLOYEE' | 'SUPER_ADMIN' | 'PAYROLL_ADMIN' | 'MANAGER';
    organizationId?: string | null;
  }
}
