/**
 * Auth.js v5 Configuration
 *
 * GitHub OAuth is used because submitted skills are expected to live in GitHub
 * repositories. The Prisma schema intentionally avoids required custom User
 * fields so the official PrismaAdapter can create users safely.
 */

import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { getPrisma } from './prisma';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(getPrisma()),
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    session: ({ session, user }) => {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'database',
  },
});
