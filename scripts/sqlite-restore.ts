import "dotenv/config";
import { copyFile, mkdir, stat, unlink } from "fs/promises";
import path from "path";

function argValue(name: string): string | null {
  const idx = process.argv.indexOf(name);
  if (idx < 0) return null;
  return process.argv[idx + 1] || null;
}

function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

function getDbPathFromUrl(url: string): string {
  const raw = url.replace(/^file:/, "");
  if (path.isAbsolute(raw)) return raw;
  return path.resolve(process.cwd(), "prisma", raw);
}

async function safeUnlink(filePath: string) {
  try {
    await unlink(filePath);
  } catch {
    // ignore
  }
}

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl?.startsWith("file:")) {
    throw new Error("DATABASE_URL deve ser SQLite (file:...)");
  }

  const source = argValue("--file");
  if (!source) {
    throw new Error("Uso: npm run db:restore -- --file <caminho-do-backup.db> [--force]");
  }

  const target = getDbPathFromUrl(dbUrl);
  const force = hasFlag("--force");

  try {
    await stat(target);
    if (!force) {
      throw new Error(
        `Base destino já existe (${target}). Use --force para sobrescrever.`,
      );
    }
  } catch {
    // destination may not exist
  }

  const backupDir = path.resolve(process.cwd(), "backups", "restore-precheck");
  await mkdir(backupDir, { recursive: true });

  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const pre = path.join(backupDir, `pre-restore-${ts}.db`);
  try {
    await copyFile(target, pre);
    console.log(`Backup pré-restore criado: ${pre}`);
  } catch {
    // ignore if current db does not exist
  }

  await mkdir(path.dirname(target), { recursive: true });
  await copyFile(path.resolve(source), target);
  await safeUnlink(`${target}-wal`);
  await safeUnlink(`${target}-shm`);

  console.log("Restore SQLite concluído.");
  console.log(`Origem: ${path.resolve(source)}`);
  console.log(`Destino: ${target}`);
}

main().catch((err) => {
  console.error("Erro no restore SQLite:", err);
  process.exit(1);
});

