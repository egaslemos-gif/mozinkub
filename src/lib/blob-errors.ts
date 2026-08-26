/** Map Vercel Blob / network errors to a clear PT message for admins. */
export function blobUploadErrorMessage(err: unknown, fallback?: string): string {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : fallback || "";
  const text = raw.toLowerCase();

  if (
    text.includes("limit") ||
    text.includes("quota") ||
    text.includes("exceed") ||
    text.includes("billing") ||
    text.includes("402") ||
    text.includes("403") ||
    text.includes("payment") ||
    text.includes("hobby")
  ) {
    return "Limite do Vercel Blob (plano Hobby) atingido. Libertar espaço no Storage ou fazer upgrade a Pro; depois tente novamente.";
  }

  if (fallback) return fallback;
  if (raw.trim()) return raw;
  return "Falha no armazenamento de imagens (Vercel Blob). Tente novamente.";
}
