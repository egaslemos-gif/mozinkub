export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

export function isActionResult(value: unknown): value is ActionResult {
  return (
    typeof value === "object" &&
    value !== null &&
    "ok" in value &&
    typeof (value as { ok: unknown }).ok === "boolean"
  );
}

export function isNextRedirectError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "digest" in err &&
    typeof (err as { digest?: unknown }).digest === "string" &&
    String((err as { digest: string }).digest).includes("NEXT_REDIRECT")
  );
}
