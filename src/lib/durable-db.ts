import "server-only";
import { put, list, del, get } from "@vercel/blob";
import fs from "fs";
import path from "path";

/** Single durable SQLite snapshot in Vercel Blob (survives cold starts / new instances). */
export const DURABLE_DB_PATHNAME = "durable/ieul.db";
const WRITE_LOCK_PATHNAME = "durable/ieul.write.lock";

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

function unlinkSqliteSidecars(dest: string) {
  for (const suffix of ["-wal", "-shm", "-journal"]) {
    try {
      fs.unlinkSync(/*turbopackIgnore: true*/ `${dest}${suffix}`);
    } catch {
      /* ignore */
    }
  }
}

function writeDbBytes(dest: string, buf: Buffer) {
  unlinkSqliteSidecars(dest);
  const partial = `${dest}.partial`;
  fs.writeFileSync(/*turbopackIgnore: true*/ partial, buf);
  fs.renameSync(/*turbopackIgnore: true*/ partial, /*turbopackIgnore: true*/ dest);
}

async function streamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  return Buffer.from(await new Response(stream).arrayBuffer());
}

/** Set when Blob exists but cannot be downloaded — never persist seed over it. */
let blobDownloadBroken = false;

export function isDurableBlobDownloadBroken(): boolean {
  return blobDownloadBroken;
}

function storeIdFromBlobUrl(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    const host = new URL(url).hostname;
    const m = host.match(/^([a-z0-9]+)\.(public|private)\.blob\.vercel-storage\.com$/i);
    return m?.[1];
  } catch {
    return undefined;
  }
}

function stripDownloadParam(url: string): string {
  try {
    const u = new URL(url);
    u.searchParams.delete("download");
    return u.toString();
  } catch {
    return url;
  }
}

async function tryGetBlob(
  target: string,
  access: "public" | "private",
  opts: { token?: string; storeId?: string } = {},
): Promise<Buffer | null> {
  try {
    const result = await get(target, {
      access,
      useCache: false,
      ...(opts.token ? { token: opts.token } : {}),
      ...(opts.storeId ? { storeId: opts.storeId } : {}),
    });
    if (result?.stream) {
      const buf = await streamToBuffer(result.stream);
      if (buf.length > 0) return buf;
    }
  } catch (err) {
    console.warn(
      "[durable-db] get failed",
      access,
      target.slice(0, 90),
      err instanceof Error ? err.message : err,
    );
  }
  return null;
}

/** Download blob bytes via authenticated SDK/fetch (CDN URLs often 403 without token). */
async function downloadBlobBytes(
  pathname: string,
  fallbackUrl?: string,
): Promise<Buffer | null> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const storeId =
    process.env.BLOB_STORE_ID ||
    storeIdFromBlobUrl(fallbackUrl) ||
    undefined;
  const urls = fallbackUrl
    ? [stripDownloadParam(fallbackUrl), fallbackUrl].filter(
        (v, i, arr) => arr.indexOf(v) === i,
      )
    : [];

  // 1) Pathname + RW token (classic)
  if (token) {
    for (const access of ["public", "private"] as const) {
      const buf = await tryGetBlob(pathname, access, { token });
      if (buf) return buf;
    }
  }

  // 2) OIDC / env defaults (no explicit token) — preferred on Vercel for private stores
  for (const access of ["public", "private"] as const) {
    const buf = await tryGetBlob(pathname, access, storeId ? { storeId } : {});
    if (buf) return buf;
  }

  // 3) Full CDN URLs with RW token
  if (token) {
    for (const url of urls) {
      for (const access of ["public", "private"] as const) {
        const buf = await tryGetBlob(url, access, { token });
        if (buf) return buf;
      }
    }
  }

  // 4) Raw fetch with Bearer (RW token then OIDC)
  const bearers = [
    token,
    process.env.VERCEL_OIDC_TOKEN,
  ].filter(Boolean) as string[];

  for (const url of urls) {
    for (const bearer of bearers) {
      try {
        const res = await fetch(url, {
          cache: "no-store",
          headers: { Authorization: `Bearer ${bearer}` },
        });
        if (res.ok) {
          const buf = Buffer.from(await res.arrayBuffer());
          if (buf.length > 0) return buf;
        } else {
          console.warn(
            "[durable-db] auth fetch failed",
            res.status,
            bearer === token ? "rw" : "oidc",
            url.slice(0, 80),
          );
        }
      } catch (err) {
        console.warn(
          "[durable-db] auth fetch error",
          err instanceof Error ? err.message : err,
        );
      }
    }
  }

  // 5) Anonymous public CDN (legacy public stores)
  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length > 0) return buf;
      } else {
        console.warn("[durable-db] public fetch failed", res.status, url.slice(0, 80));
      }
    } catch (err) {
      console.warn(
        "[durable-db] public fetch error",
        err instanceof Error ? err.message : err,
      );
    }
  }

  return null;
}

async function putBlobFlexible(
  pathname: string,
  body: string | Buffer,
  contentType: string,
): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN!;
  const base = {
    contentType,
    addRandomSuffix: false as const,
    allowOverwrite: true as const,
    token,
  };
  try {
    await put(pathname, body, { ...base, access: "public" });
  } catch (publicErr) {
    console.warn("[durable-db] public put failed, trying private:", publicErr);
    await put(pathname, body, { ...base, access: "private" });
  }
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
      if (!hit) return "missing";

      const buf = await downloadBlobBytes(
        hit.pathname || DURABLE_DB_PATHNAME,
        hit.downloadUrl || hit.url,
      );
      if (!buf) {
        lastErr = new Error("download empty/failed");
        await sleep(200 * attempt);
        continue;
      }

      writeDbBytes(dest, buf);
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
      if (status === "ok") {
        blobDownloadBroken = false;
        return dest;
      }

      // Blob listed but not downloadable (CDN 403). Keep site up with seed,
      // but never persist — that would wipe the durable snapshot.
      if (status === "error") {
        blobDownloadBroken = true;
        console.error(
          "[durable-db] Blob download broken (CDN 403). Serving seed; persist disabled.",
        );
      }

      for (const src of seedCandidates()) {
        if (fs.existsSync(/*turbopackIgnore: true*/ src)) {
          unlinkSqliteSidecars(dest);
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

/**
 * Force re-download of the latest Blob snapshot (caller must disconnect Prisma first).
 * Prevents stale serverless instances from overwriting other projects' media.
 */
export async function refreshDurableSqliteFromBlob(): Promise<void> {
  if (!process.env.VERCEL || !process.env.BLOB_READ_WRITE_TOKEN) return;
  if (isProductionBuild()) return;

  const dest = getRuntimeDbPath();
  const status = await restoreFromBlob(dest);
  if (status === "error") {
    throw new Error("Falha ao sincronizar a base de dados antes de gravar.");
  }
  if (status === "missing" && !dbReady(dest)) {
    await ensureDurableSqlite();
  }
}

const lockOwner = `${process.pid}-${Math.random().toString(36).slice(2, 10)}`;

async function readWriteLock(): Promise<{ owner: string; until: number } | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  try {
    const { blobs } = await list({
      prefix: WRITE_LOCK_PATHNAME,
      limit: 3,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    const hit = blobs.find((b) => b.pathname === WRITE_LOCK_PATHNAME) || blobs[0];
    if (!hit) return null;
    const buf = await downloadBlobBytes(
      hit.pathname || WRITE_LOCK_PATHNAME,
      hit.downloadUrl || hit.url,
    );
    if (!buf) return null;
    const data = JSON.parse(buf.toString("utf8")) as { owner?: string; until?: number };
    if (!data.owner || typeof data.until !== "number") return null;
    return { owner: data.owner, until: data.until };
  } catch {
    return null;
  }
}

/**
 * Cross-instance write lock via Blob so two lambdas cannot clobber each other's DB snapshot.
 */
export async function acquireDurableWriteLock(): Promise<void> {
  if (!process.env.VERCEL || !process.env.BLOB_READ_WRITE_TOKEN) return;
  if (isProductionBuild()) return;

  const deadline = Date.now() + 25_000;
  while (Date.now() < deadline) {
    const existing = await readWriteLock();
    if (existing && existing.until > Date.now() && existing.owner !== lockOwner) {
      await sleep(120);
      continue;
    }

    const until = Date.now() + 20_000;
    await putBlobFlexible(
      WRITE_LOCK_PATHNAME,
      JSON.stringify({ owner: lockOwner, until }),
      "application/json",
    );
    await sleep(60);
    const check = await readWriteLock();
    if (check?.owner === lockOwner && check.until > Date.now()) {
      return;
    }
    await sleep(100);
  }

  throw new Error("Timeout ao obter bloqueio de escrita da base de dados.");
}

export async function releaseDurableWriteLock(): Promise<void> {
  if (!process.env.VERCEL || !process.env.BLOB_READ_WRITE_TOKEN) return;
  try {
    const existing = await readWriteLock();
    if (existing && existing.owner !== lockOwner && existing.until > Date.now()) {
      return;
    }
    await del(WRITE_LOCK_PATHNAME, { token: process.env.BLOB_READ_WRITE_TOKEN });
  } catch (err) {
    console.warn("[durable-db] release write lock failed:", err);
  }
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
  if (blobDownloadBroken) {
    console.error(
      "[durable-db] skip persist — Blob CDN download is broken; refusing to overwrite durable DB",
    );
    return;
  }

  const run = async () => {
    const dest = getRuntimeDbPath();
    if (!fs.existsSync(/*turbopackIgnore: true*/ dest)) return;
    const bytes = fs.readFileSync(/*turbopackIgnore: true*/ dest);
    if (bytes.length === 0) return;
    await putBlobFlexible(DURABLE_DB_PATHNAME, bytes, "application/x-sqlite3");
    console.info("[durable-db] persisted to Blob", bytes.length, "bytes");
  };

  persistQueue = persistQueue.then(run, run);
  await persistQueue;
}
