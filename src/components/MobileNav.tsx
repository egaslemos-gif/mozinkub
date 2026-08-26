"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { siteNavLinks } from "@/lib/nav";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="relative xl:hidden">
      <button
        type="button"
        className="grid h-10 w-10 place-items-center border border-border bg-white text-foreground"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="relative block h-3.5 w-4" aria-hidden>
          <span
            className={`absolute top-0 left-0 h-0.5 w-4 rounded bg-foreground transition ${
              open ? "top-1.5 rotate-45" : ""
            }`}
          />
          <span
            className={`absolute top-1.5 left-0 h-0.5 w-4 rounded bg-foreground transition ${
              open ? "opacity-0" : ""
            }`}
          />
          <span
            className={`absolute bottom-0 left-0 h-0.5 w-4 rounded bg-foreground transition ${
              open ? "bottom-1.5 -rotate-45" : ""
            }`}
          />
        </span>
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-[#0f1a24]/35"
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
          />
          <nav
            id="mobile-menu"
            className="absolute top-full right-0 z-50 mt-2 w-[min(calc(100vw-1.5rem),18rem)] max-h-[min(70vh,28rem)] overflow-y-auto border border-border bg-white p-3 shadow-xl"
          >
            <ul className="space-y-1">
              {siteNavLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="block px-4 py-3 text-sm font-semibold text-foreground hover:bg-primary-soft hover:text-primary"
                    onClick={() => setOpen(false)}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </>
      )}
    </div>
  );
}
