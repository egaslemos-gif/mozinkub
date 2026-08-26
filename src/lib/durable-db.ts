import "server-only";
import { put, list } from "@vercel/blob";
import fs from "fs";
import path from "path";

/** Single durable SQLite snapshot in Vercel Blob (survives cold starts / new instances). */
export const DURABLE_DB_PATHNAME = "durable/ieul.db";

const TMP_DB = "/tmp/ieul.db";

export function getRuntimeDbPath(): string {
  if (process.env.VERCEL) return TMP_DB;
  const configured = process.env.DATABASE_URL || "file:./dev.db";
  if (configured.startsWith("file:")) {
    const rel = configured.replace(/^file:/, "");
    return path.isAbsolute(rel) ? rel : path.join(process.cwd(), rel);
  }
  return TMP_DB;
}

function seedCandidates(): string[] {
  return [
    path.join(process.cwd(), "prisma", "dev.db"),
    path.join(process.cwd(), "dev.db"),
  ];
}

/**
 * Ensure /tmp (or local) SQLite exists: prefer Blob snapshot, else build seed.
 */
export async function ensureDurableSqlite(): Promise<string> {
  const dest = getRuntimeDbPath();

  if (!process.env.VERCEL) {
    return dest;
  }

  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
    return dest;
  }

  // 1) Restore from Blob if available
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { blobs } = await list({
        prefix: DURABLE_DB_PATHNAME,
        limit: 5,
      });
      const hit = blobs.find((b) => b.pathname === DURABLE_DB_PATHNAME) || blobs[0];
      if (hit?.url) {
        const res = await fetch(hit.url, { cache: "no-store" });
        if (res.ok) {
          const buf = Buffer.from(await res.arrayBuffer());
          if (buf.length > 0) {
            fs.writeFileSync(dest, buf);
            console.info("[durable-db] restored from Blob", buf.length, "bytes");
            return dest;
          }
        }
      }
    } catch (err) {
      console.error("[durable-db] Blob restore failed:", err);
    }
  }

  // 2) Fall back to build-time seed copy
  for (const src of seedCandidates()) {
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.info("[durable-db] seeded from build artifact", src);
      return dest;
    }
  }

  console.warn("[durable-db] no database source found");
  return dest;
}

let persistQueue: Promise<void> = Promise.resolve();

/**
 * Upload current SQLite file to Blob so the next cold start keeps admin edits.
 */
export async function persistDurableSqlite(): Promise<void> {
  if (!process.env.VERCEL || !process.env.BLOB_READ_WRITE_TOKEN) return;

  const run = async () => {
    const dest = getRuntimeDbPath();
    if (!fs.existsSync(dest)) return;
    const bytes = fs.readFileSync(dest);
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
