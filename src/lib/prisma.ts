import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

/**
 * SQLite MVP:
 * - Local: DATABASE_URL=file:./dev.db (prisma/dev.db)
 * - Vercel: a base é criada/seedada no build; em runtime copiamos para /tmp
 *   (writable). Páginas públicas devem ser force-static.
 */
function resolveDatabaseUrl(): string {
  const configured = process.env.DATABASE_URL || "file:./dev.db";
  if (!process.env.VERCEL) return configured;

  const dest = "/tmp/ieul.db";
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
  return fs.existsSync(dest) ? `file:${dest}` : configured;
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: { db: { url: resolveDatabaseUrl() } },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
