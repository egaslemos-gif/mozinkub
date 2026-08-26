import { Suspense } from "react";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { ProjectosMural } from "@/components/ProjectosMural";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import {
  getProjectFilterOptions,
  getPublishedProjects,
  getSiteConfig,
} from "@/lib/data";

export const dynamic = "force-dynamic";

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
      <main className="section">
        <div className="section-inner">
          <p className="section-kicker">Mural</p>
          <h1 className="section-title">Projectos incubados</h1>
          <p className="section-lead">
            Portefólio activo e histórico das coortes. Filtre por período ou edição.
          </p>

          <Suspense fallback={<p className="mt-8 text-sm text-muted">A carregar mural…</p>}>
            <ProjectosMural
              projects={mural}
              years={filters.years}
              editions={filters.editions.map((e) => ({ id: e.id, slug: e.slug, name: e.name }))}
            />
          </Suspense>
        </div>
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
