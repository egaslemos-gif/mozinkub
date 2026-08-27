/**
 * Resolve Turso / libSQL connection from Vercel Marketplace or manual env.
 * Marketplace may inject TURSO_* or LIBSQL_* names depending on product version.
 */
export function getTursoConfig(): { url: string; authToken: string } | null {
  const url =
    process.env.TURSO_DATABASE_URL ||
    process.env.LIBSQL_URL ||
    process.env.TURSO_URL ||
    "";
  const authToken =
    process.env.TURSO_AUTH_TOKEN ||
    process.env.LIBSQL_AUTH_TOKEN ||
    process.env.TURSO_TOKEN ||
    "";

  if (!url.startsWith("libsql://") && !url.startsWith("https://")) {
    return null;
  }
  if (!authToken) return null;
  return { url, authToken };
}

export function isTursoConfigured(): boolean {
  return getTursoConfig() !== null;
}
