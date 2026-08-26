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
        <div className="relative min-h-[200px] bg-[#2f4248] sm:min-h-[240px] md:min-h-[280px]">
          {current ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={current.imageUrl}
                alt={current.title}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a262b]/92 via-[#2f4248]/45 to-[#2f4248]/12" />

              <div className="relative z-[1] flex min-h-[200px] flex-col justify-end p-3 sm:min-h-[240px] sm:p-4 md:min-h-[280px] md:p-5">
                {current.logoUrl && (
                  <div className="mb-2 grid h-9 w-9 place-items-center border border-white/40 bg-white p-1 sm:h-10 sm:w-10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={current.logoUrl} alt="" className="max-h-7 max-w-7 object-contain sm:max-h-8 sm:max-w-8" />
                  </div>
                )}
                <p className="text-[10px] font-bold tracking-[0.14em] text-[#c5d9d4] uppercase sm:text-[11px]">
                  {current.kicker || "Actualidades · Antena da Beira"}
                </p>
                <h2 className="font-display mt-1.5 max-w-lg text-lg font-semibold leading-tight break-words text-white sm:text-xl md:text-2xl">
                  {current.title}
                </h2>
                {current.subtitle && (
                  <p className="mt-1.5 max-w-md line-clamp-2 text-sm leading-relaxed text-white/88">
                    {current.subtitle}
                  </p>
                )}
                {current.linkUrl && (
                  <Link
                    href={current.linkUrl}
                    className="mt-3 inline-flex w-fit max-w-full items-center bg-[color:var(--primary)] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[color:var(--primary-dark)]"
                  >
                    Saber mais →
                  </Link>
                )}

                {slides.length > 1 && (
                  <div className="mt-3 flex items-center gap-1.5">
                    {slides.map((s, i) => (
                      <button
                        key={s.id}
                        type="button"
                        aria-label={`Slide ${i + 1}`}
                        className={`h-1.5 border border-white/35 ${
                          i === index ? "w-6 bg-white" : "w-2 bg-white/30"
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
                    className="grid h-9 w-9 place-items-center border border-white/25 bg-[#1a262b]/70 text-lg font-bold text-white"
                    onClick={() =>
                      setIndex((i) => (i - 1 + slides.length) % slides.length)
                    }
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    aria-label="Seguinte"
                    className="grid h-9 w-9 place-items-center border border-white/25 bg-[#1a262b]/70 text-lg font-bold text-white"
                    onClick={() => setIndex((i) => (i + 1) % slides.length)}
                  >
                    ›
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex min-h-[200px] items-center justify-center p-4 text-center text-sm text-white/80">
              Ainda sem slides. O coordenador pode carregar fotos em Admin → Destaques.
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-px border-t border-border bg-border">
          <div className="bg-[#f3f6f5] p-2.5 text-center sm:p-3">
            <p className="font-display text-lg font-semibold text-primary sm:text-xl">{stats.projects}</p>
            <p className="text-[10px] text-muted">Projectos</p>
          </div>
          <div className="bg-[#f3f5f7] p-2.5 text-center sm:p-3">
            <p className="font-display text-lg font-semibold text-ul-blue sm:text-xl">{stats.activities}</p>
            <p className="text-[10px] text-muted">Actividades</p>
          </div>
          <div className="bg-[#f5f4f2] p-2.5 text-center sm:p-3">
            <p className="font-display text-lg font-semibold text-ul-brown sm:text-xl">{stats.events}</p>
            <p className="text-[10px] text-muted">Eventos</p>
          </div>
        </div>
      </div>
    </div>
  );
}
