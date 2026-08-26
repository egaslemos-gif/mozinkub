import { PrismaClient } from "@prisma/client";
import "server-only";
import fs from "fs";
import path from "path";

/**
 * SQLite MVP:
 * - Local: DATABASE_URL=file:./dev.db
 * - Vercel: copiar a DB do build para /tmp (writable) em runtime.
 */
function resolveDatabaseUrl(): string {
  const configured = process.env.DATABASE_URL || "file:./dev.db";
  if (!process.env.VERCEL) return configured;

  const dest = "/tmp/ieul.db";
  try {
    if (!fs.existsSync(dest)) {
      const candidates = [
        path.join(process.cwd(), "prisma", "dev.db"),
        path.join(process.cwd(), "dev.db"),
      ];
      for (const src of candidates) {
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest);
          break;
        }
      }
    }
    if (fs.existsSync(dest)) return `file:${dest}`;
  } catch (err) {
    console.error("[prisma] /tmp copy failed:", err);
  }
  return configured;
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: { db: { url: resolveDatabaseUrl() } },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
