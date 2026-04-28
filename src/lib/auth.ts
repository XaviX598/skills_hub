/**
 * Auth.js v5 Configuration
 *
 * GitHub OAuth is used because submitted skills are expected to live in GitHub
 * repositories. The Prisma schema intentionally avoids required custom User
 * fields so the official PrismaAdapter can create users safely.
 */

import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { getPrisma } from './prisma';
import { compare } from 'bcryptjs';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(getPrisma()),
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name,
          email: profile.email,
          image: profile.avatar_url,
        };
      },
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('[AUTH] authorize called with:', credentials?.email);

        if (!credentials?.email || !credentials?.password) {
          console.log('[AUTH] Missing credentials');
          return null;
        }

        const prisma = getPrisma();
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });
        console.log('[AUTH] User found:', user?.email, 'verified:', user?.isVerified);

        if (!user || !user.password) {
          console.log('[AUTH] User or password missing');
          return null;
        }

        const isGitHubUser = await prisma.account.findFirst({
          where: { userId: user.id, provider: 'github' },
        });

        if (!isGitHubUser && !user.isVerified) {
          console.log('[AUTH] User needs verification');
          throw new Error('VERIFY_REQUIRED:' + user.email);
        }

        const isPasswordValid = await compare(
          credentials.password as string,
          user.password
        );
        console.log('[AUTH] Password valid:', isPasswordValid);

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
async session({ session, user, token }) {
      console.log('[AUTH] session callback - token.sub:', token?.sub, 'user.id:', user?.id, 'session:', !!session);
      // If we have a token, use its sub as the user id
      if (token?.sub && session.user) {
        session.user.id = token.sub;
      } else if (user?.id && session.user) {
        session.user.id = user.id;
      }
      console.log('[AUTH] session callback result, user.id:', session.user?.id);
      return session;
    },
    async jwt({ token, user }) {
      console.log('[AUTH] jwt callback - user:', user?.id, 'token.sub:', token?.sub);
      // Add user id to token on initial sign in
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  events: {
    async linkAccount({ user, account }) {
      console.log('[AUTH] linkAccount event:', user.email, account.provider);
      if (account.provider === 'github') {
        // GitHub account linked - mark as verified if user exists with same email
        const prisma = getPrisma();
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email as string },
          select: { id: true, isVerified: true },
        });
        if (existingUser && !existingUser.isVerified) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { isVerified: true },
          });
          console.log('[AUTH] Linked GitHub to existing user, marked verified:', user.email);
        }
      }
    },
    async signIn({ user, account }) {
      console.log('[AUTH] signIn event - user:', user.email, 'account:', account?.provider);
      // When GitHub sign-in succeeds but user already exists with same email,
      // link the GitHub account to the existing user
      if (account?.provider === 'github' && user.email) {
        const prisma = getPrisma();
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { id: true, isVerified: true },
        });
        if (existingUser) {
          // Check if GitHub account is already linked
          const existingAccount = await prisma.account.findFirst({
            where: { userId: existingUser.id, provider: 'github' },
          });
          if (!existingAccount) {
            // Link GitHub account to existing user
            await prisma.account.create({
              data: {
                userId: existingUser.id,
                provider: 'github',
                providerAccountId: account.providerAccountId,
                type: 'oauth',
              },
            });
            // If user was unverified, mark as verified via GitHub
            if (!existingUser.isVerified) {
              await prisma.user.update({
                where: { id: existingUser.id },
                data: { isVerified: true },
              });
            }
            console.log('[AUTH] Linked existing user to GitHub:', user.email);
          }
        }
      }
    },
  },
  logger: {
    error: (message, ...args) => console.error('[AUTH ERROR]', message, ...args),
    warn: (message, ...args) => console.warn('[AUTH WARN]', message, ...args),
    debug: (message, ...args) => console.log('[AUTH DEBUG]', message, ...args),
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'database',
  },
});
