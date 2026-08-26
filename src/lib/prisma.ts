import { PrismaClient } from "@prisma/client";
import "server-only";
import {
  ensureDurableSqlite,
  getRuntimeDbPath,
  persistDurableSqlite,
} from "@/lib/durable-db";

/**
 * SQLite MVP:
 * - Local: DATABASE_URL=file:./dev.db
 * - Vercel: restore durable snapshot from Blob into /tmp (writable), else seed from build.
 *   Writes are persisted back to Blob (never during `next build`) so deploys keep admin edits.
 */
await ensureDurableSqlite();

const dbUrl =
  process.env.VERCEL || (process.env.DATABASE_URL || "").startsWith("file:")
    ? `file:${getRuntimeDbPath()}`
    : process.env.DATABASE_URL || `file:${getRuntimeDbPath()}`;

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrisma> | undefined;
};

function createPrisma() {
  const base = new PrismaClient({
    datasources: { db: { url: dbUrl } },
  });

  return base.$extends({
    query: {
      async $allOperations({ operation, args, query }) {
        const result = await query(args);
        if (
          operation === "create" ||
          operation === "update" ||
          operation === "upsert" ||
          operation === "delete" ||
          operation === "deleteMany" ||
          operation === "updateMany" ||
          operation === "createMany"
        ) {
          try {
            await persistDurableSqlite();
          } catch (err) {
            console.error("[durable-db] persist after write failed:", err);
          }
        }
        return result;
      },
    },
  });
}

export const prisma = globalForPrisma.prisma || createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
