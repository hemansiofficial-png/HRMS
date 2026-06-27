import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL URL'),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
});

export type Env = z.infer<typeof envSchema>;

let validatedEnv: Env | undefined;

export function validateEnv(): Env {
  if (validatedEnv) {
    return validatedEnv;
  }

  try {
    validatedEnv = envSchema.parse({
      DATABASE_URL: process.env.DATABASE_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    });

    return validatedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e =>
        `${e.path.join('.')}: ${e.message}`
      );

      // Only throw in development and production runtime, not during build
      if (process.env.NEXT_PHASE === 'phase-production-build') {
        console.warn('⚠️  Environment validation warning:', messages.join(', '));
        // Return a default schema for build time
        return {
          DATABASE_URL: process.env.DATABASE_URL || '',
          NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || '',
          NEXTAUTH_URL: process.env.NEXTAUTH_URL || '',
        } as Env;
      }

      throw new Error(
        `❌ Invalid environment variables:\n${messages.join('\n')}\n\n` +
        `Please check your .env.local file and ensure all required variables are set correctly.`
      );
    }
    throw error;
  }
}

// Auto-validate on import in development
if (process.env.NODE_ENV === 'development' && process.env.NEXT_PHASE !== 'phase-production-build') {
  validateEnv();
}
