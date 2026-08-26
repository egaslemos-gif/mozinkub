"use client";

import { FormEvent, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { isActionResult, isNextRedirectError } from "@/lib/action-result";

type AdminAction = (formData: FormData) => Promise<unknown>;

export function FormWithFeedback({
  action,
  children,
  className,
  id,
  successMessage = "Operação concluída com sucesso.",
  resetOnSuccess = false,
}: {
  action: AdminAction;
  children: ReactNode;
  className?: string;
  id?: string;
  successMessage?: string;
  resetOnSuccess?: boolean;
}) {
  const router = useRouter();
  const bannerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (status === "ok" || status === "error") {
      bannerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [status]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setStatus("loading");
    setMessage("");
    const fd = new FormData(form);

    try {
      const res = await action(fd);
      if (isActionResult(res) && !res.ok) {
        setStatus("error");
        setMessage(res.error || "A acção falhou.");
        return;
      }
      const okMsg =
        (isActionResult(res) && res.ok && res.message) || successMessage;
      setStatus("ok");
      setMessage(okMsg);
      if (resetOnSuccess) form.reset();
      router.refresh();
    } catch (err) {
      if (isNextRedirectError(err)) {
        setStatus("ok");
        setMessage(successMessage);
        throw err;
      }
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "A acção falhou. Tente novamente.");
    }
  }

  return (
    <form id={id} onSubmit={onSubmit} className={className} aria-busy={status === "loading"}>
      <div ref={bannerRef} className="md:col-span-2 lg:col-span-full">
        {status === "ok" && (
          <div
            role="status"
            className="mb-1 border border-primary/30 bg-primary-soft px-3 py-2 text-sm font-medium text-primary"
          >
            {message}
          </div>
        )}
        {status === "error" && (
          <div
            role="alert"
            className="mb-1 border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
          >
            {message}
          </div>
        )}
        {status === "loading" && (
          <div className="mb-1 border border-border bg-white px-3 py-2 text-sm text-muted">
            A processar… aguarde.
          </div>
        )}
      </div>
      {children}
    </form>
  );
}
