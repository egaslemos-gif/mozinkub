import { Suspense } from "react";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { ProjectosMural } from "@/components/ProjectosMural";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import {
  getProjectFilterOptions,
  getPublishedProjects,
  getSiteConfig,
} from "@/lib/data";

export const dynamic = "force-static";

export default async function ProjectosPage() {
  const [config, projects, filters] = await Promise.all([
    getSiteConfig(),
    getPublishedProjects({ lifecycle: "TODOS" }),
    getProjectFilterOptions(),
  ]);

  const mural = projects.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    area: p.area,
    tagline: p.tagline,
    summary: p.summary,
    status: p.status,
    maturity: p.maturity,
    lifecycle: p.lifecycle,
    cohortYear: p.cohortYear,
    logoUrl: p.logoUrl,
    coverUrl: p.coverUrl,
    lookingFor: p.lookingFor,
    fundingEdition: p.fundingEdition
      ? { name: p.fundingEdition.name, year: p.fundingEdition.year, slug: p.fundingEdition.slug }
      : null,
  }));

  return (
    <div className="site-shell min-h-screen">
      <SiteHeader brand={config?.brandName || "IEUL"} />
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">Mural</p>
        <h1 className="font-display mt-1 text-2xl font-semibold sm:text-3xl">Projectos incubados</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Portefólio activo e histórico das coortes. Filtre por período ou edição.
        </p>

        <Suspense fallback={<p className="mt-8 text-sm text-muted">A carregar mural…</p>}>
          <ProjectosMural
            projects={mural}
            years={filters.years}
            editions={filters.editions.map((e) => ({ id: e.id, slug: e.slug, name: e.name }))}
          />
        </Suspense>
      </main>
      {config && (
        <>
          <SiteFooter
            brand={config.brandName}
            slogan={config.slogan}
            address={config.address}
            phone={config.phone}
            email={config.email}
          />
          <WhatsAppFab phone={config.whatsapp || config.phone} />
        </>
      )}
    </div>
  );
}
