/**
 * Prepare database for build/runtime:
 * - With Turso env: push schema SQL via libSQL + seed if empty
 * - Without: local prisma db push + seed (existing MVP path)
 */
import { execSync } from "child_process";
import { createClient, type Client } from "@libsql/client";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { getTursoConfig } from "../src/lib/turso";

function run(cmd: string) {
  console.info("[prepare-db]", cmd);
  execSync(cmd, { stdio: "inherit", env: process.env });
}

function isIgnorableSchemaError(msg: string) {
  const m = msg.toLowerCase();
  return (
    m.includes("already exists") ||
    m.includes("duplicate") ||
    m.includes("unique constraint") ||
    // Index before ALTER on existing tables — patched next.
    m.includes("no such column") ||
    m.includes("no such table")
  );
}

async function executeStatements(client: Client, statements: string[], label: string) {
  let ok = 0;
  let skipped = 0;
  for (const statement of statements) {
    try {
      await client.execute(statement.endsWith(";") ? statement : `${statement};`);
      ok += 1;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (isIgnorableSchemaError(msg)) {
        skipped += 1;
        continue;
      }
      console.error(`[prepare-db] ${label} failed:`, statement.slice(0, 120));
      throw err;
    }
  }
  console.info(`[prepare-db] ${label}: ${ok} applied, ${skipped} skipped`);
}

async function applySchemaToTurso(url: string, authToken: string) {
  const sql = execSync(
    "npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script",
    { encoding: "utf8", env: process.env },
  );

  const client = createClient({ url, authToken });
  const statements = sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((s) => s.replace(/^\s*--[^\r\n]*[\r\n]*/gm, "").trim())
    .filter((s) => s.length > 0);

  const tables = statements.filter((s) => !/^\s*CREATE\s+(UNIQUE\s+)?INDEX\b/i.test(s));
  const indexes = statements.filter((s) => /^\s*CREATE\s+(UNIQUE\s+)?INDEX\b/i.test(s));

  // 1) CREATE TABLE (skip if already exists)
  await executeStatements(client, tables, "tables");
  // 2) ALTER existing tables for new columns
  await patchTursoSchema(client);
  // 3) CREATE INDEX (now columns exist)
  await executeStatements(client, indexes, "indexes");
}

/** Idempotent ALTERs when table already existed from an older schema. */
async function patchTursoSchema(client: Client) {
  const patches = [
    `ALTER TABLE "Announcement" ADD COLUMN "slug" TEXT`,
    `ALTER TABLE "Announcement" ADD COLUMN "acceptRegistrations" BOOLEAN NOT NULL DEFAULT 0`,
    `ALTER TABLE "Announcement" ADD COLUMN "registrationEmail" TEXT`,
    `ALTER TABLE "Announcement" ADD COLUMN "registrationClosesAt" DATETIME`,
    `ALTER TABLE "AnnouncementApplication" ADD COLUMN "attachmentsJson" TEXT NOT NULL DEFAULT '[]'`,
  ];
  for (const statement of patches) {
    try {
      await client.execute(statement);
      console.info("[prepare-db] patch ok:", statement.slice(0, 60));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (isIgnorableSchemaError(msg) || /duplicate column/i.test(msg)) {
        continue;
      }
      console.warn("[prepare-db] patch skipped:", msg);
    }
  }

  try {
    await client.execute(
      `UPDATE "Announcement" SET "slug" = "id" WHERE "slug" IS NULL OR "slug" = ''`,
    );
  } catch {
    /* ignore */
  }
}

async function seedTurso(url: string, authToken: string) {
  const libsql = createClient({ url, authToken });
  const adapter = new PrismaLibSQL(libsql);
  const prisma = new PrismaClient({ adapter });
  try {
    const users = await prisma.user.count();
    if (users > 0) {
      console.info("[prepare-db] Turso already has", users, "users — skip seed");
      return;
    }
  } catch {
    // tables may be brand new; continue to seed
  } finally {
    await prisma.$disconnect();
  }

  // Seed uses Turso adapter when TURSO_* env is present (see prisma/seed.ts).
  run("npx tsx prisma/seed.ts");
}

async function main() {
  const turso = getTursoConfig();

  if (turso) {
    console.info("[prepare-db] Turso detected — syncing remote database");
    run("npx prisma generate");
    await applySchemaToTurso(turso.url, turso.authToken);
    await seedTurso(turso.url, turso.authToken);
    return;
  }

  console.info("[prepare-db] local SQLite path");
  run("npx prisma generate");
  run("npx prisma db push");
  run("npx tsx prisma/seed.ts");
}

main().catch((err) => {
  console.error("[prepare-db] failed:", err);
  process.exit(1);
});
