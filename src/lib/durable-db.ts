import "server-only";
import { put, list } from "@vercel/blob";
import fs from "fs";
import path from "path";

/** Single durable SQLite snapshot in Vercel Blob (survives cold starts / new instances). */
export const DURABLE_DB_PATHNAME = "durable/ieul.db";

const TMP_DB = "/tmp/ieul.db";

export function getRuntimeDbPath(): string {
  if (process.env.VERCEL) return TMP_DB;
  // Local: keep SQLite under prisma/ (scoped path for Turbopack tracing).
  return path.join(/*turbopackIgnore: true*/ process.cwd(), "prisma", "dev.db");
}

function seedCandidates(): string[] {
  return [
    path.join(/*turbopackIgnore: true*/ process.cwd(), "prisma", "dev.db"),
    path.join(/*turbopackIgnore: true*/ process.cwd(), "dev.db"),
  ];
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function dbReady(dest: string): boolean {
  try {
    return (
      fs.existsSync(/*turbopackIgnore: true*/ dest) &&
      fs.statSync(/*turbopackIgnore: true*/ dest).size > 0
    );
  } catch {
    return false;
  }
}

function isProductionBuild(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

async function restoreFromBlob(dest: string): Promise<"ok" | "missing" | "error"> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return "missing";

  let lastErr: unknown;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const { blobs } = await list({
        prefix: DURABLE_DB_PATHNAME,
        limit: 5,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      const hit = blobs.find((b) => b.pathname === DURABLE_DB_PATHNAME) || blobs[0];
      if (!hit?.url) return "missing";

      const res = await fetch(hit.url, { cache: "no-store" });
      if (!res.ok) {
        lastErr = new Error(`HTTP ${res.status}`);
        await sleep(200 * attempt);
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length === 0) {
        lastErr = new Error("empty blob");
        await sleep(200 * attempt);
        continue;
      }

      const partial = `${dest}.partial`;
      fs.writeFileSync(/*turbopackIgnore: true*/ partial, buf);
      fs.renameSync(/*turbopackIgnore: true*/ partial, /*turbopackIgnore: true*/ dest);
      console.info("[durable-db] restored from Blob", buf.length, "bytes");
      return "ok";
    } catch (err) {
      lastErr = err;
      await sleep(250 * attempt);
    }
  }

  console.error("[durable-db] Blob restore failed after retries:", lastErr);
  return "error";
}

/**
 * Ensure /tmp (or local) SQLite exists: prefer Blob snapshot, else build seed.
 * Uses a lock so concurrent cold starts cannot race seed-over-Blob.
 */
export async function ensureDurableSqlite(): Promise<string> {
  const dest = getRuntimeDbPath();

  if (!process.env.VERCEL) {
    return dest;
  }

  if (dbReady(dest)) return dest;

  const lockPath = `${dest}.lock`;
  const deadline = Date.now() + 45_000;

  while (Date.now() < deadline) {
    if (dbReady(dest)) return dest;

    let gotLock = false;
    try {
      fs.writeFileSync(/*turbopackIgnore: true*/ lockPath, String(process.pid), {
        flag: "wx",
      });
      gotLock = true;
    } catch {
      await sleep(120);
      continue;
    }

    try {
      if (dbReady(dest)) return dest;

      const status = await restoreFromBlob(dest);
      if (status === "ok") return dest;

      // Blob exists but download failed — do NOT overwrite with seed.
      if (status === "error") {
        console.error(
          "[durable-db] refusing seed fallback while Blob restore is failing",
        );
        throw new Error(
          "Não foi possível restaurar a base de dados persistente (Vercel Blob).",
        );
      }

      // Blob truly missing: first boot → copy build seed (never persist during build).
      for (const src of seedCandidates()) {
        if (fs.existsSync(/*turbopackIgnore: true*/ src)) {
          fs.copyFileSync(
            /*turbopackIgnore: true*/ src,
            /*turbopackIgnore: true*/ dest,
          );
          console.info("[durable-db] seeded from build artifact", src);
          return dest;
        }
      }

      console.warn("[durable-db] no database source found");
      return dest;
    } finally {
      if (gotLock) {
        try {
          fs.unlinkSync(/*turbopackIgnore: true*/ lockPath);
        } catch {
          /* ignore */
        }
      }
    }
  }

  if (dbReady(dest)) return dest;
  throw new Error("[durable-db] timed out waiting for SQLite restore");
}

let persistQueue: Promise<void> = Promise.resolve();

/**
 * Upload current SQLite file to Blob so the next cold start keeps admin edits.
 * Skipped during `next build` so a deploy never clobbers production data with seed.
 */
export async function persistDurableSqlite(): Promise<void> {
  if (!process.env.VERCEL || !process.env.BLOB_READ_WRITE_TOKEN) return;
  if (isProductionBuild()) {
    console.info("[durable-db] skip persist during production build");
    return;
  }

  const run = async () => {
    const dest = getRuntimeDbPath();
    if (!fs.existsSync(/*turbopackIgnore: true*/ dest)) return;
    const bytes = fs.readFileSync(/*turbopackIgnore: true*/ dest);
    if (bytes.length === 0) return;
    await put(DURABLE_DB_PATHNAME, bytes, {
      access: "public",
      contentType: "application/x-sqlite3",
      addRandomSuffix: false,
      allowOverwrite: true,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    console.info("[durable-db] persisted to Blob", bytes.length, "bytes");
  };

  persistQueue = persistQueue.then(run, run);
  await persistQueue;
}
