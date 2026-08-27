import Link from "next/link";
import { BrandMark, PartnerLogos } from "@/components/PartnerLogos";
import { MobileNav } from "@/components/MobileNav";
import { CYBERCODE } from "@/lib/credits";
import { siteNavLinks } from "@/lib/nav";

export function SiteHeader({ brand }: { brand: string }) {
  void brand;

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-white/90 backdrop-blur-md">
      <div className="brand-stripe" />
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2.5 sm:gap-3 md:px-6">
        <Link href="/" className="min-w-0 shrink">
          <BrandMark />
        </Link>

        <nav className="ml-auto hidden items-center gap-4 text-sm font-medium text-muted xl:flex">
          {siteNavLinks.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-primary">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center border-l border-border pl-3 lg:flex xl:ml-0">
          <PartnerLogos compact />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2 xl:ml-0">
          <Link
            href="/admin"
            className="btn-primary !px-3 !py-2 text-xs whitespace-nowrap sm:text-sm md:!px-4"
          >
            <span className="sm:hidden">Admin</span>
            <span className="hidden sm:inline">Área coordenação</span>
          </Link>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}

export function SiteFooter({
  brand,
  slogan,
  address,
  phone,
  email,
}: {
  brand: string;
  slogan: string;
  address: string;
  phone: string;
  email: string;
}) {
  return (
    <footer className="mt-16 border-t border-border bg-white md:mt-20">
      <div className="brand-stripe" />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:py-12 md:grid-cols-3 md:px-6">
        <div>
          <div className="mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logos/mozinkub.png"
              alt="MozInkub"
              className="h-14 w-14 object-contain"
            />
          </div>
          <p className="font-display text-xl font-semibold">{brand}</p>
          <p className="mt-2 text-sm text-muted">{slogan}</p>
        </div>
        <div className="text-sm text-muted">
          <p className="font-semibold text-foreground">Contactos</p>
          <p className="mt-2 break-words">{address}</p>
          <p className="mt-1">Tel: {phone}</p>
          <p className="mt-1 break-all">{email}</p>
        </div>
        <div className="text-sm text-muted">
          <p className="font-semibold text-foreground">Parceiros</p>
          <p className="mt-2">Universidade Licungo</p>
          <p>Projecto MozInkub N+1</p>
          <p>Embaixada de França em Moçambique e Eswatini</p>
        </div>
      </div>
      <div className="border-t border-border bg-[#f8fbfd]">
        <div className="mx-auto max-w-6xl overflow-hidden px-4 py-5 md:px-6">
          <p className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">
            Parceria institucional
          </p>
          <PartnerLogos />
        </div>
      </div>

      {/* Crédito de desenvolvimento — CyberCode360 */}
      <div className="border-t border-[#1e3a36] bg-[#1a2f2c]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between md:px-6">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-[#8eb8b2] uppercase">
              Engenharia digital
            </p>
            <p className="mt-1 text-sm leading-snug text-white/90">
              Plataforma desenvolvida por{" "}
              <span className="font-semibold text-white">{CYBERCODE.name}</span>
            </p>
            <p className="mt-0.5 text-xs text-white/55">{CYBERCODE.tagline}</p>
          </div>
          <a
            href={CYBERCODE.url}
            target="_blank"
            rel="noopener noreferrer"
            className="developer-cta group inline-flex shrink-0 items-center justify-center gap-2 border border-[#4a8f88] bg-[#3f7872] px-5 py-2.5 text-sm font-semibold text-white transition hover:border-[#6ab0a8] hover:bg-[#4a8f88]"
            title={`${CYBERCODE.cta} — ${CYBERCODE.name}`}
          >
            <span>{CYBERCODE.cta}</span>
            <span
              aria-hidden
              className="transition-transform group-hover:translate-x-0.5"
            >
              →
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
}
