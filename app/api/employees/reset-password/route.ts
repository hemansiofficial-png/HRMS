import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Hardcoded default password
const DEFAULT_PASSWORD = 'Pass@123';

// Hash password using bcrypt
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function POST(request: NextRequest) {
  try {
    const { employeeId } = await request.json();

    if (!employeeId) {
      return NextResponse.json(
        { message: 'Employee ID is required' },
        { status: 400 }
      );
    }

    // Find the employee to get the userId
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { userId: true }
    });

    if (!employee) {
      return NextResponse.json(
        { message: 'Employee not found' },
        { status: 404 }
      );
    }

    // Hash the default password
    const hashedPassword = await hashPassword(DEFAULT_PASSWORD);

    // Update user's password using the userId from employee record
    await prisma.user.update({
      where: { id: employee.userId },
      data: { password: hashedPassword }
    });

    // Return the new password
    return NextResponse.json({
      data: { password: DEFAULT_PASSWORD },
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { message: 'Failed to reset password', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
