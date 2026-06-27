import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    // Test database connection
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        password: true
      }
    });

    // Check admin user specifically
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@hrms.local' },
      include: { organization: true }
    });

    // Test password hash
    const passwordValid = adminUser 
      ? await bcrypt.compare('Pass@123', adminUser.password)
      : false;

    return NextResponse.json({
      databaseConnected: true,
      totalUsers: users.length,
      adminUser: adminUser ? {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        passwordHash: adminUser.password.substring(0, 20) + '...'
      } : null,
      passwordValid
    });
  } catch (error: any) {
    return NextResponse.json({
      databaseConnected: false,
      error: error.message
    }, { status: 500 });
  }
}
