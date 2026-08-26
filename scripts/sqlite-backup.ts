import "dotenv/config";
import { createHash } from "crypto";
import { mkdir, readFile, stat, copyFile } from "fs/promises";
import path from "path";

function getDbPathFromUrl(url: string): string {
  const raw = url.replace(/^file:/, "");
  if (path.isAbsolute(raw)) return raw;

  const inPrisma = path.resolve(process.cwd(), "prisma", raw);
  return path.normalize(inPrisma);
}

async function ensureExistingDbPath(candidate: string): Promise<string> {
  try {
    await stat(candidate);
    return candidate;
  } catch {
    const fallback = path.resolve(process.cwd(), "prisma", path.basename(candidate));
    await stat(fallback);
    return fallback;
  }
}

async function sha256(filePath: string): Promise<string> {
  const buf = await readFile(filePath);
  return createHash("sha256").update(buf).digest("hex");
}

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl?.startsWith("file:")) {
    throw new Error("DATABASE_URL deve ser SQLite (file:...)");
  }

  const configured = getDbPathFromUrl(dbUrl);
  const dbPath = await ensureExistingDbPath(configured);
  const dbDir = path.dirname(dbPath);
  const dbBase = path.basename(dbPath);

  const gdriveDir = process.env.GDRIVE_BACKUP_DIR?.trim();
  const backupRoot = gdriveDir
    ? path.resolve(gdriveDir)
    : path.resolve(process.cwd(), "backups", "sqlite");
  await mkdir(backupRoot, { recursive: true });

  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(backupRoot, `backup-${ts}`);
  await mkdir(backupDir, { recursive: true });

  const files = [`${dbBase}`, `${dbBase}-wal`, `${dbBase}-shm`];
  const copied: Array<{ file: string; size: number; sha256: string }> = [];

  for (const file of files) {
    const src = path.join(dbDir, file);
    const dst = path.join(backupDir, file);
    try {
      await copyFile(src, dst);
      const info = await stat(dst);
      copied.push({ file, size: info.size, sha256: await sha256(dst) });
    } catch {
      // wal/shm podem não existir; ignorar
    }
  }

  if (!copied.find((c) => c.file === dbBase)) {
    throw new Error(`Falha ao copiar base principal: ${dbBase}`);
  }

  console.log("Backup SQLite concluído.");
  console.log(`Origem: ${dbPath}`);
  console.log(`Destino: ${backupDir}`);
  for (const item of copied) {
    console.log(`- ${item.file} (${item.size} bytes) sha256=${item.sha256}`);
  }
}

main().catch((err) => {
  console.error("Erro no backup SQLite:", err);
  process.exit(1);
});

