import { auth } from '@/lib/auth';

export async function getOptionalSession() {
  try {
    return await auth();
  } catch (error) {
    console.warn('Auth session unavailable:', error);
    return null;
  }
}
