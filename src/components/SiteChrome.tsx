import Link from "next/link";
import { BrandMark, PartnerLogos } from "@/components/PartnerLogos";
import { MobileNav } from "@/components/MobileNav";
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
    </footer>
  );
}
