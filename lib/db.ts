/**
 * Prisma Client Singleton
 *
 * Prevents connection pool exhaustion caused by multiple PrismaClient
 * instances during Next.js development (HMR / Fast Refresh).
 *
 * In production, a single module-level instance is used.
 * In development, the instance is cached on `globalThis` so that
 * hot-reloads reuse the same connection pool instead of opening new ones.
 *
 * @see https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices
 * @module db
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * The singleton PrismaClient instance.
 * Import this wherever you need database access instead of `new PrismaClient()`.
 *
 * @example
 * ```typescript
 * import { prisma } from "@/lib/db";
 *
 * const courses = await prisma.course.findMany();
 * ```
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
