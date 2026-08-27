import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";
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
import { getTursoConfig, isTursoConfigured } from "@/lib/turso";

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

const useTurso = isTursoConfigured();

/**
 * Prefer Turso (persistent libSQL) when env is present.
 * Fallback: local SQLite / Vercel Blob durable snapshot (legacy Hobby workaround).
 */
async function prepareLocalSqliteIfNeeded() {
  if (useTurso) return;
  await ensureDurableSqlite();
}

await prepareLocalSqliteIfNeeded();

const localDbUrl =
  process.env.VERCEL || (process.env.DATABASE_URL || "").startsWith("file:")
    ? `file:${getRuntimeDbPath()}`
    : process.env.DATABASE_URL || `file:${getRuntimeDbPath()}`;

async function patchSchema(base: PrismaClient) {
  const changed = await applySqliteSchemaPatches(base);
  globalForPrisma.schemaPatched = true;
  if (changed && process.env.VERCEL && !useTurso) {
    try {
      await persistDurableSqlite();
      console.info("[durable-db] persisted schema-patched snapshot");
    } catch (err) {
      console.error("[durable-db] persist after schema patch failed:", err);
    }
  }
}

function createBaseClient(): PrismaClient {
  if (useTurso) {
    const cfg = getTursoConfig()!;
    const libsql = createClient({
      url: cfg.url,
      authToken: cfg.authToken,
    });
    const adapter = new PrismaLibSQL(libsql);
    console.info("[prisma] using Turso libSQL", cfg.url.replace(/\/\/.*@/, "//***@"));
    return new PrismaClient({ adapter });
  }

  return new PrismaClient({
    datasources: { db: { url: localDbUrl } },
  });
}

function createPrisma() {
  const base = createBaseClient();
  globalForPrisma.prismaBase = base;

  // Turso is already durable — no Blob lock/persist middleware.
  if (useTurso) {
    return base;
  }

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

if (!globalForPrisma.schemaPatched) {
  await patchSchema(globalForPrisma.prismaBase!);
}

export const prisma = prismaClient;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
