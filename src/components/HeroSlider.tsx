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
      <div className="card-surface relative overflow-hidden">
        <div className="relative min-h-[260px] bg-[#2f4248] sm:min-h-[300px]">
          {current ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={current.imageUrl}
                alt={current.title}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a262b]/92 via-[#2f4248]/45 to-[#2f4248]/12" />

              <div className="relative z-[1] flex min-h-[260px] flex-col justify-end p-5 sm:min-h-[300px] sm:p-6">
                {current.logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={current.logoUrl}
                    alt=""
                    className="mb-3 h-10 w-10 object-contain"
                  />
                )}
                <p className="text-[11px] font-bold tracking-[0.14em] text-[#c5d9d4] uppercase">
                  {current.kicker || "Actualidades · Antena da Beira"}
                </p>
                <h2 className="font-display mt-2 max-w-lg text-xl font-semibold leading-tight break-words text-white sm:text-2xl">
                  {current.title}
                </h2>
                {current.subtitle && (
                  <p className="mt-2 max-w-md line-clamp-2 text-sm leading-relaxed text-white/88">
                    {current.subtitle}
                  </p>
                )}
                {current.linkUrl && (
                  <Link
                    href={current.linkUrl}
                    className="mt-4 inline-flex w-fit items-center bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
                  >
                    Saber mais →
                  </Link>
                )}

                {slides.length > 1 && (
                  <div className="mt-4 flex items-center gap-1.5">
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
            <div className="flex min-h-[260px] items-center justify-center p-6 text-center text-sm text-white/80">
              Ainda sem slides. O coordenador pode carregar fotos em Admin → Destaques.
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 border-t border-border bg-primary-soft">
          <div className="border-r border-border p-3 text-center sm:p-4">
            <p className="font-display text-xl font-semibold text-primary sm:text-2xl">
              {stats.projects}
            </p>
            <p className="text-xs text-muted">Projectos</p>
          </div>
          <div className="border-r border-border p-3 text-center sm:p-4">
            <p className="font-display text-xl font-semibold text-primary sm:text-2xl">
              {stats.activities}
            </p>
            <p className="text-xs text-muted">Actividades</p>
          </div>
          <div className="p-3 text-center sm:p-4">
            <p className="font-display text-xl font-semibold text-primary sm:text-2xl">
              {stats.events}
            </p>
            <p className="text-xs text-muted">Eventos</p>
          </div>
        </div>
      </div>
    </div>
  );
}
