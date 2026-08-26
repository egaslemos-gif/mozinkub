import { PrismaClient } from "@prisma/client";
import "server-only";
import {
  acquireDurableWriteLock,
  ensureDurableSqlite,
  getRuntimeDbPath,
  persistDurableSqlite,
  refreshDurableSqliteFromBlob,
  releaseDurableWriteLock,
} from "@/lib/durable-db";
import { applySqliteSchemaPatches } from "@/lib/schema-patches";

/**
 * SQLite MVP:
 * - Local: DATABASE_URL=file:./dev.db
 * - Vercel: restore durable snapshot from Blob into /tmp (writable), else seed from build.
 *   Writes: lock → refresh latest Blob → mutate → persist (avoids cross-project media loss).
 *   Schema patches run after restore so Blob DBs pick up new columns (e.g. GalleryMedia.description).
 */
await ensureDurableSqlite();

const dbUrl =
  process.env.VERCEL || (process.env.DATABASE_URL || "").startsWith("file:")
    ? `file:${getRuntimeDbPath()}`
    : process.env.DATABASE_URL || `file:${getRuntimeDbPath()}`;

const WRITE_OPS = new Set([
  "create",
  "update",
  "upsert",
  "delete",
  "deleteMany",
  "updateMany",
  "createMany",
]);

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrisma> | undefined;
  prismaBase: PrismaClient | undefined;
  schemaPatched: boolean | undefined;
};

async function patchSchema(base: PrismaClient) {
  const changed = await applySqliteSchemaPatches(base);
  globalForPrisma.schemaPatched = true;
  if (changed && process.env.VERCEL) {
    try {
      await persistDurableSqlite();
      console.info("[durable-db] persisted schema-patched snapshot");
    } catch (err) {
      console.error("[durable-db] persist after schema patch failed:", err);
    }
  }
}

function createPrisma() {
  const base = new PrismaClient({
    datasources: { db: { url: dbUrl } },
  });
  globalForPrisma.prismaBase = base;

  return base.$extends({
    query: {
      async $allOperations({ operation, args, query }) {
        if (!WRITE_OPS.has(operation) || !process.env.VERCEL) {
          const result = await query(args);
          if (WRITE_OPS.has(operation)) {
            try {
              await persistDurableSqlite();
            } catch (err) {
              console.error("[durable-db] persist after write failed:", err);
            }
          }
          return result;
        }

        await acquireDurableWriteLock();
        try {
          await base.$disconnect();
          await refreshDurableSqliteFromBlob();
          await patchSchema(base);
          const result = await query(args);
          try {
            await persistDurableSqlite();
          } catch (err) {
            console.error("[durable-db] persist after write failed:", err);
            throw err;
          }
          return result;
        } finally {
          await releaseDurableWriteLock();
        }
      },
    },
  });
}

const prismaClient = globalForPrisma.prisma || createPrisma();

// Ensure schema matches code before first query (cold start / Blob restore).
if (!globalForPrisma.schemaPatched) {
  await patchSchema(globalForPrisma.prismaBase!);
}

export const prisma = prismaClient;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
