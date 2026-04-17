/**
 * NextAuth.js v5 Route Handler
 *
 * Handles all NextAuth.js authentication requests.
 * Exports GET and POST handlers for the [...nextauth] catch-all route.
 */

import { handlers } from '@/lib/auth';

export const { GET, POST } = handlers;
