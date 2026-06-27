import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from './providers';
import { validateEnv } from '@/lib/env';

// Validate environment variables on startup
validateEnv();

export const metadata: Metadata = {
  title: 'HRMS Pro - Enterprise HR Management',
  description: 'Complete HRMS platform with attendance, leave, payroll, and performance management'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
