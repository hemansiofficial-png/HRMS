import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Hardcoded default password
const DEFAULT_PASSWORD = 'Pass@123';

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user has admin/HR privileges
  const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'];
  const userRole = session.user.role;
  
  if (!allowedRoles.includes(userRole as string)) {
    return NextResponse.json(
      { error: 'Insufficient permissions. Only admins can reset passwords.' },
      { status: 403 }
    );
  }

  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Prevent admins from resetting their own password via this endpoint
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot reset your own password using this endpoint. Use the change password feature instead.' },
        { status: 400 }
      );
    }

    // Find the user to reset
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        employee: {
          select: {
            employeeCode: true,
            designation: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent resetting passwords of users with higher or equal role
    const roleHierarchy: Record<string, number> = {
      EMPLOYEE: 0,
      MANAGER: 1,
      PAYROLL_ADMIN: 2,
      HR_MANAGER: 3,
      ADMIN: 4,
      SUPER_ADMIN: 5
    };

    const currentUserLevel = roleHierarchy[userRole as string] || 0;
    const targetUserLevel = roleHierarchy[user.role as string] || 0;

    if (targetUserLevel >= currentUserLevel && userRole !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Cannot reset password for users with equal or higher role' },
        { status: 403 }
      );
    }

    // Hash the default password
    const hashedPassword = await hashPassword(DEFAULT_PASSWORD);

    // Update user's password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    return NextResponse.json({
      data: { 
        password: DEFAULT_PASSWORD,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          employeeCode: user.employee?.employeeCode,
          designation: user.employee?.designation
        }
      },
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { error: 'Failed to reset password', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
