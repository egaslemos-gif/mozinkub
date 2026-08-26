import { PrismaClient } from "@prisma/client";
import { copyFileSync, existsSync, mkdirSync } from "fs";
import path from "path";

/**
 * Na Vercel o filesystem da função é read-only excepto /tmp.
 * Copiamos a base SQLite (seeded no build) para /tmp na primeira execução.
 */
function resolveDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!process.env.VERCEL || !url?.startsWith("file:")) return url;

  const sourceRel = url.replace(/^file:/, "");
  const source = path.isAbsolute(sourceRel)
    ? sourceRel
    : path.join(process.cwd(), sourceRel.startsWith("prisma") ? sourceRel : path.join("prisma", sourceRel));

  const targetDir = "/tmp";
  const target = path.join(targetDir, "ieul-dev.db");

  try {
    if (!existsSync(target) && existsSync(source)) {
      mkdirSync(targetDir, { recursive: true });
      copyFileSync(source, target);
    }
  } catch (err) {
    console.error("[prisma] falha ao preparar SQLite em /tmp:", err);
  }

  return `file:${target}`;
}

const datasourceUrl = resolveDatabaseUrl();

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient(
    datasourceUrl
      ? {
          datasources: {
            db: { url: datasourceUrl },
          },
        }
      : undefined,
  );

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
