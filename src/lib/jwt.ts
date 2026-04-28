/**
 * JWT Token Management for Custom Auth
 * 
 * This is a simplified JWT implementation used alongside NextAuth.
 * It provides custom token creation/verification for the /api/auth/login route.
 */

import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { getPrisma } from './prisma';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'development-secret-change-in-production';

/**
 * Create a JWT token for a user
 */
export async function createToken(payload: { userId: string; email: string; name?: string | null; isPremium?: boolean }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; name?: string; isPremium?: boolean };
  } catch {
    return null;
  }
}

/**
 * Get session from auth-token cookie
 */
export async function getSessionFromCookie() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  
  if (!token) {
    return null;
  }
  
  const payload = await verifyToken(token);
  if (!payload) {
    return null;
  }
  
  // Get fresh user data from DB
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, name: true, email: true, image: true, isPremium: true },
  });
  
  if (!user) {
    return null;
  }
  
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
    },
    isPremium: user.isPremium,
  };
}