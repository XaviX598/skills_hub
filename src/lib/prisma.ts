/**
 * Prisma Client access.
 *
 * Kept behind a getter so modules can import this file without eagerly opening
 * database connections. This matters in Next.js serverless/build contexts.
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export function getPrisma() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }

  return globalForPrisma.prisma;
}
