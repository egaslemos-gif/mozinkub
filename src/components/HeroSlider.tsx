"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export type SlideItem = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  linkUrl: string | null;
  kicker?: string | null;
  logoUrl?: string | null;
};

export function HeroSlider({
  slides,
  stats,
}: {
  slides: SlideItem[];
  stats: { projects: number; activities: number; events: number };
}) {
  const [index, setIndex] = useState(0);
  const hasSlides = slides.length > 0;
  const current = hasSlides ? slides[index] : null;

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 6000);
    return () => clearInterval(t);
  }, [slides.length]);

  return (
    <div className="fade-up relative" style={{ animationDelay: "0.12s" }}>
      <div className="card-surface relative overflow-hidden shadow-md">
        <div className="relative min-h-[260px] bg-[#0f3d45] sm:min-h-[300px] md:min-h-[340px]">
          {current ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={current.imageUrl}
                alt={current.title}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#062428]/95 via-[#0f3d45]/55 to-[#0f3d45]/20" />

              <div className="relative z-[1] flex min-h-[260px] flex-col justify-end p-4 sm:min-h-[300px] sm:p-5 md:min-h-[340px] md:p-6">
                {current.logoUrl && (
                  <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-white p-1 sm:h-12 sm:w-12">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={current.logoUrl} alt="" className="max-h-9 max-w-9 object-contain sm:max-h-10 sm:max-w-10" />
                  </div>
                )}
                <p className="text-[10px] font-bold tracking-[0.14em] text-[#9fd4c8] uppercase sm:text-[11px] sm:tracking-[0.16em]">
                  {current.kicker || "Actualidades · Antena da Beira"}
                </p>
                <h2 className="font-display mt-2 max-w-lg text-xl font-semibold leading-tight break-words text-white sm:text-2xl md:text-3xl">
                  {current.title}
                </h2>
                {current.subtitle && (
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-white/90">
                    {current.subtitle}
                  </p>
                )}
                {current.linkUrl && (
                  <Link
                    href={current.linkUrl}
                    className="mt-4 inline-flex w-fit max-w-full items-center rounded-full bg-[#2f8f4e] px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[#1f6b38] sm:mt-5 sm:px-5"
                  >
                    Saber mais →
                  </Link>
                )}

                {slides.length > 1 && (
                  <div className="mt-5 flex items-center gap-2">
                    {slides.map((s, i) => (
                      <button
                        key={s.id}
                        type="button"
                        aria-label={`Slide ${i + 1}`}
                        className={`h-2.5 rounded-full border border-white/40 ${
                          i === index ? "w-7 bg-white" : "w-2.5 bg-white/35"
                        }`}
                        onClick={() => setIndex(i)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {slides.length > 1 && (
                <div className="absolute top-4 right-4 z-[2] flex gap-2">
                  <button
                    type="button"
                    aria-label="Anterior"
                    className="grid h-9 w-9 place-items-center rounded-full border border-white/30 bg-[#0f3d45]/75 text-lg font-bold text-white"
                    onClick={() =>
                      setIndex((i) => (i - 1 + slides.length) % slides.length)
                    }
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    aria-label="Seguinte"
                    className="grid h-9 w-9 place-items-center rounded-full border border-white/30 bg-[#0f3d45]/75 text-lg font-bold text-white"
                    onClick={() => setIndex((i) => (i + 1) % slides.length)}
                  >
                    ›
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex min-h-[300px] items-center justify-center p-6 text-center text-white/80">
              Ainda sem slides. O coordenador pode carregar fotos em Admin → Destaques.
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 border-t border-border bg-white p-3 sm:gap-3 sm:p-4">
          <div className="rounded-xl bg-primary-soft p-2 text-center sm:rounded-2xl sm:p-3">
            <p className="font-display text-xl font-semibold text-primary sm:text-2xl">{stats.projects}</p>
            <p className="text-[10px] text-muted sm:text-xs">Projectos</p>
          </div>
          <div className="rounded-xl bg-[#e8f4fb] p-2 text-center sm:rounded-2xl sm:p-3">
            <p className="font-display text-xl font-semibold text-ul-blue sm:text-2xl">{stats.activities}</p>
            <p className="text-[10px] text-muted sm:text-xs">Actividades</p>
          </div>
          <div className="rounded-xl bg-[#f4eee6] p-2 text-center sm:rounded-2xl sm:p-3">
            <p className="font-display text-xl font-semibold text-ul-brown sm:text-2xl">{stats.events}</p>
            <p className="text-[10px] text-muted sm:text-xs">Eventos</p>
          </div>
        </div>
      </div>
    </div>
  );
}
