// import bcrypt from 'bcryptjs';
// import NextAuth, { type DefaultSession } from 'next-auth';
// import Credentials from 'next-auth/providers/credentials';
// import { PrismaAdapter } from '@auth/prisma-adapter';
// import { prisma } from '@/lib/prisma';

// declare module 'next-auth' {
//   interface Session {
//     user: {
//       id: string;
//       role: 'ADMIN' | 'HR_MANAGER' | 'EMPLOYEE' | 'SUPER_ADMIN';
//       organizationId?: string | null;
//     } & DefaultSession['user'];
//   }
// }

// export const { handlers, auth, signIn, signOut } = NextAuth({
//   adapter: PrismaAdapter(prisma),
//   session: { strategy: 'jwt' },
//   trustHost: true,
//   // Explicitly set the base URL for NextAuth v5
//   url: process.env.NEXTAUTH_URL,
//   providers: [
//     Credentials({
//       name: 'credentials',
//       credentials: {
//         email: {},
//         password: {}
//       },
//       async authorize(credentials) {
//         if (!credentials?.email || !credentials?.password) {
//           return null;
//         }
//         const user = await prisma.user.findUnique({
//           where: { email: credentials.email as string },
//           include: { organization: true }
//         });
//         if (!user) {
//           console.log('[NextAuth] User not found:', credentials.email);
//           return null;
//         }
//         const ok = await bcrypt.compare(credentials.password as string, user.password);
//         if (!ok) {
//           console.log('[NextAuth] Invalid password');
//           return null;
//         }
//         console.log('[NextAuth] Login successful for:', user.email);
//         return {
//           id: user.id,
//           name: user.name,
//           email: user.email,
//           role: user.role,
//           organizationId: user.organizationId
//         };
//       }
//     })
//   ],
//   callbacks: {
//     async jwt({ token, user }) {
//       if (user) {
//         token.role = (user as { role: string }).role;
//         token.organizationId = (user as { organizationId?: string }).organizationId;
//       }
//       return token;
//     },
//     async session({ session, token }) {
//       if (session.user) {
//         session.user.id = token.sub || '';
//         session.user.role = (token.role as 'ADMIN' | 'HR_MANAGER' | 'EMPLOYEE' | 'SUPER_ADMIN') || 'EMPLOYEE';
//         session.user.organizationId = token.organizationId as string | undefined;
//       }
//       return session;
//     }
//   },
//   pages: {
//     signIn: '/auth/signin',
//   }
// });


import bcrypt from 'bcryptjs';
import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'ADMIN' | 'HR_MANAGER' | 'EMPLOYEE' | 'SUPER_ADMIN' | 'PAYROLL_ADMIN' | 'MANAGER';
      organizationId?: string | null;
    } & DefaultSession['user'];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: 'jwt',
  },

  trustHost: true,

  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: {},
        password: {}
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { organization: true }
        });

        if (!user) {
          console.log('[NextAuth] User not found:', credentials.email);
          return null;
        }

        const ok = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!ok) {
          console.log('[NextAuth] Invalid password');
          return null;
        }

        console.log('[NextAuth] Login successful for:', user.email);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId
        };
      }
    })
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = (user as { role: string }).role;
        token.organizationId = (user as { organizationId?: string }).organizationId;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || '';
        session.user.role =
          (token.role as 'ADMIN' | 'HR_MANAGER' | 'EMPLOYEE' | 'SUPER_ADMIN' | 'PAYROLL_ADMIN' | 'MANAGER') ||
          'EMPLOYEE';
        session.user.organizationId =
          token.organizationId as string | undefined;
      }
      return session;
    }
  },

  pages: {
    signIn: '/auth/signin',
  }
});


