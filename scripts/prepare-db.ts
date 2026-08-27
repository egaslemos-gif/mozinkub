/**
 * Prepare database for build/runtime:
 * - With Turso env: push schema SQL via libSQL + seed if empty
 * - Without: local prisma db push + seed (existing MVP path)
 */
import { execSync } from "child_process";
import { createClient } from "@libsql/client";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { getTursoConfig } from "../src/lib/turso";

function run(cmd: string) {
  console.info("[prepare-db]", cmd);
  execSync(cmd, { stdio: "inherit", env: process.env });
}

async function applySchemaToTurso(url: string, authToken: string) {
  const sql = execSync(
    "npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script",
    { encoding: "utf8", env: process.env },
  );

  const client = createClient({ url, authToken });
  // Split on statement boundaries; strip Prisma comment lines (e.g. "-- CreateTable").
  const statements = sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((s) => s.replace(/^\s*--[^\r\n]*[\r\n]*/gm, "").trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    try {
      await client.execute(statement.endsWith(";") ? statement : `${statement};`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Idempotent-ish: table/index already exists is OK on redeploy.
      if (
        msg.includes("already exists") ||
        msg.includes("duplicate") ||
        msg.toLowerCase().includes("unique constraint")
      ) {
        continue;
      }
      console.error("[prepare-db] schema statement failed:", statement.slice(0, 120));
      throw err;
    }
  }
  console.info("[prepare-db] Turso schema applied (", statements.length, "statements)");
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
