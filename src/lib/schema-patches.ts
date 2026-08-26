import "server-only";
import type { PrismaClient } from "@prisma/client";

type ColumnRow = { name: string };

async function tableColumns(
  db: PrismaClient,
  table: string,
): Promise<Set<string>> {
  const rows = await db.$queryRawUnsafe<ColumnRow[]>(
    `PRAGMA table_info("${table}")`,
  );
  return new Set(rows.map((r) => r.name));
}

/**
 * Durable Blob SQLite is restored at runtime and may lag behind prisma schema.
 * `db push` only runs on the build artifact — apply safe ALTER patches here.
 * Returns true if any change was applied (caller should persist to Blob).
 */
export async function applySqliteSchemaPatches(db: PrismaClient): Promise<boolean> {
  let changed = false;

  try {
    const tables = await db.$queryRawUnsafe<{ name: string }[]>(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='GalleryMedia'`,
    );
    if (tables.length === 0) return false;

    const galleryCols = await tableColumns(db, "GalleryMedia");
    if (!galleryCols.has("description")) {
      await db.$executeRawUnsafe(
        `ALTER TABLE "GalleryMedia" ADD COLUMN "description" TEXT`,
      );
      console.info("[schema-patches] added GalleryMedia.description");
      changed = true;
    }
  } catch (err) {
    console.error("[schema-patches] GalleryMedia patch failed:", err);
    throw err;
  }

  return changed;
}
