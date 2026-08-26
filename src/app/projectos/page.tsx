import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { ProjectMuralCard } from "@/components/ProjectMuralCard";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import {
  getProjectFilterOptions,
  getPublishedProjects,
  getSiteConfig,
} from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ProjectosPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string; edicao?: string; ciclo?: string }>;
}) {
  const params = await searchParams;
  const year = params.ano ? Number(params.ano) : undefined;
  const edition = params.edicao || undefined;
  const lifecycle = params.ciclo || "ATIVO";

  const [config, projects, filters] = await Promise.all([
    getSiteConfig(),
    getPublishedProjects({
      year: Number.isFinite(year) ? year : undefined,
      edition,
      lifecycle,
    }),
    getProjectFilterOptions(),
  ]);

  function hrefFor(patch: {
    ano?: string | null;
    edicao?: string | null;
    ciclo?: string | null;
  }) {
    const ano = patch.ano === "" || patch.ano === null ? undefined : (patch.ano ?? params.ano);
    const edicao =
      patch.edicao === "" || patch.edicao === null ? undefined : (patch.edicao ?? params.edicao);
    const ciclo =
      patch.ciclo === "" || patch.ciclo === null ? undefined : (patch.ciclo ?? params.ciclo ?? "ATIVO");
    const q = new URLSearchParams();
    if (ciclo && ciclo !== "ATIVO") q.set("ciclo", ciclo);
    if (ano) q.set("ano", ano);
    if (edicao) q.set("edicao", edicao);
    const s = q.toString();
    return s ? `/projectos?${s}` : "/projectos";
  }

  return (
    <div className="site-shell min-h-screen">
      <SiteHeader brand={config?.brandName || "IEUL"} />
      <main className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">Mural</p>
        <h1 className="font-display mt-2 text-4xl font-semibold">Projectos incubados</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Portefólio activo e histórico das coortes anteriores. Filtre por período ou edição de
          financiamento.
        </p>

        <div className="mt-8 flex flex-wrap gap-2">
          {[
            { ciclo: "ATIVO", label: "Em incubação" },
            { ciclo: "ALUMNI", label: "Histórico / Alumni" },
            { ciclo: "TODOS", label: "Todos" },
          ].map((t) => {
            const active = (params.ciclo || "ATIVO") === t.ciclo;
            return (
              <Link
                key={t.ciclo}
                href={hrefFor({ ciclo: t.ciclo, ano: "", edicao: "" })}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  active ? "bg-primary text-white" : "bg-white text-muted ring-1 ring-border"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={hrefFor({ ano: "", edicao: params.edicao })}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              !params.ano ? "bg-ul-blue text-white" : "bg-white text-muted ring-1 ring-border"
            }`}
          >
            Todos os anos
          </Link>
          {filters.years.map((y) => (
            <Link
              key={y}
              href={hrefFor({ ano: String(y) })}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                params.ano === String(y)
                  ? "bg-ul-blue text-white"
                  : "bg-white text-muted ring-1 ring-border"
              }`}
            >
              {y}
            </Link>
          ))}
        </div>

        {filters.editions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={hrefFor({ edicao: "" })}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                !params.edicao ? "bg-ul-brown text-white" : "bg-white text-muted ring-1 ring-border"
              }`}
            >
              Todas as edições
            </Link>
            {filters.editions.map((e) => (
              <Link
                key={e.id}
                href={hrefFor({ edicao: e.slug })}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  params.edicao === e.slug
                    ? "bg-ul-brown text-white"
                    : "bg-white text-muted ring-1 ring-border"
                }`}
              >
                {e.name}
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {projects.length === 0 && (
            <p className="text-sm text-muted md:col-span-3">
              Nenhum projecto encontrado com estes filtros.
            </p>
          )}
          {projects.map((p) => (
            <ProjectMuralCard key={p.id} project={p} />
          ))}
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
