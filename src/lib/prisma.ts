import { PrismaClient } from "@prisma/client";
import "server-only";

/**
 * SQLite MVP:
 * - Local: DATABASE_URL=file:./dev.db (prisma/dev.db)
 * - Vercel: a base é criada/seedada no build; páginas públicas são force-static.
 */
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
