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

function getRuntimeDatabaseUrl(): string | undefined {
  const rawDatabaseUrl = process.env.DATABASE_URL;

  if (!rawDatabaseUrl) {
    return undefined;
  }

  try {
    const databaseUrl = new URL(rawDatabaseUrl);

    if (!databaseUrl.searchParams.has('connection_limit')) {
      databaseUrl.searchParams.set('connection_limit', '1');
    }

    if (!databaseUrl.searchParams.has('pool_timeout')) {
      databaseUrl.searchParams.set('pool_timeout', '30');
    }

    return databaseUrl.toString();
  } catch {
    return rawDatabaseUrl;
  }
}

export function getPrisma() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      datasources: {
        db: {
          url: getRuntimeDatabaseUrl(),
        },
      },
    });
  }

  return globalForPrisma.prisma;
}
