"use client";

import Image from "next/image";

const partners = [
  {
    src: "/logos/mozinkub.png",
    alt: "MozInkub",
    label: "MozInkub N+1",
  },
  {
    src: "/logos/unilicungo.png",
    alt: "Universidade Licungo",
    label: "Universidade Licungo",
  },
  {
    src: "/logos/embaixada-franca.png",
    alt: "Ambassade de France au Mozambique et en Eswatini",
    label: "Embaixada de França",
  },
] as const;

/** No header: só UniLicungo + França (MozInkub já está na marca IEUL) — sem efeitos */
const headerPartners = partners.filter((p) => p.src !== "/logos/mozinkub.png");

export function PartnerMarquee({ className = "" }: { className?: string }) {
  const track = [...partners, ...partners];

  return (
    <div className={`partner-marquee ${className}`} aria-label="Parceria institucional">
      <div className="partner-marquee-track">
        {track.map((p, i) => (
          <div
            key={`${p.src}-${i}`}
            className="partner-marquee-item"
            title={p.label}
            aria-hidden={i >= partners.length}
          >
            <Image
              src={p.src}
              alt={i < partners.length ? p.alt : ""}
              width={140}
              height={64}
              className="partner-logo h-12 w-auto md:h-14"
              unoptimized
            />
            <span className="partner-marquee-label">{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PartnerLogos({
  compact = false,
  className = "",
}: {
  compact?: boolean;
  className?: string;
}) {
  if (!compact) {
    return <PartnerMarquee className={className} />;
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {headerPartners.map((p) => (
        <Image
          key={p.src}
          src={p.src}
          alt={p.alt}
          width={88}
          height={40}
          className="h-8 w-auto object-contain"
          unoptimized
          priority
        />
      ))}
    </div>
  );
}

export function BrandMark() {
  return (
    <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-border bg-white sm:h-10 sm:w-10">
        <Image
          src="/logos/mozinkub.png"
          alt="IEUL / MozInkub"
          width={40}
          height={40}
          className="h-full w-full object-cover"
          unoptimized
          priority
        />
      </div>
      <div className="min-w-0">
        <p className="font-display text-base leading-none font-semibold tracking-tight sm:text-lg">
          IEUL
        </p>
        <p className="mt-0.5 truncate text-[10px] text-muted sm:text-[11px]">
          Incubadora · UniLicungo · Beira
        </p>
      </div>
    </div>
  );
}
