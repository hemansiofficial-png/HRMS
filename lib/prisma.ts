import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Prisma client with optimized settings
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Connection pooling settings
    errorFormat: 'minimal',
    // Logging in development
    log:
      process.env.NODE_ENV === 'production'
        ? ['error', 'warn']
        : ['error', 'warn', 'info']
  });

// Ensure proper connection handling
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
