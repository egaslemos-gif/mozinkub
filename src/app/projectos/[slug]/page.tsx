import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { ContactForm } from "@/components/ContactForm";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { getProjectBySlug, getPublishedProjectSlugs, getSiteConfig, statusLabel } from "@/lib/data";
import { maturityLabel, milestoneKindLabel, whatsappHref } from "@/lib/projects";

export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateStaticParams() {
  const slugs = await getPublishedProjectSlugs();
  return slugs.map((slug) => ({ slug }));
}
export default async function ProjectoDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [config, project] = await Promise.all([getSiteConfig(), getProjectBySlug(slug)]);
  if (!project) notFound();

  const phone = project.whatsapp || project.contact || config?.whatsapp || "";
  const wa = phone
    ? whatsappHref(phone, `Olá, vi o projecto ${project.name} no mural da IEUL e gostaria de falar.`)
    : null;

  return (
    <div className="site-shell min-h-screen">
      <SiteHeader brand={config?.brandName || "IEUL"} />
      <main>
        <section className="relative min-h-[340px] overflow-hidden bg-[#2f4248] text-white">
          {project.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={project.coverUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a262b] via-[#1a262b]/70 to-[#1a262b]/20" />
          <div className="relative z-[1] mx-auto flex min-h-[340px] max-w-6xl flex-col justify-end px-4 py-10 md:px-6">
            <Link href="/projectos" className="text-sm font-semibold text-[#c5d4cf]">
              ← Mural de projectos
            </Link>
            <div className="mt-6 flex items-end gap-4">
              {project.logoUrl && (
                <div className="grid h-16 w-16 shrink-0 place-items-center border border-white/30 bg-white p-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={project.logoUrl} alt="" className="max-h-12 max-w-12 object-contain" />
                </div>
              )}
              <div>
                <p className="text-[11px] font-bold tracking-[0.16em] text-[#c5d4cf] uppercase">
                  {project.area} · {project.city}
                </p>
                <h1 className="font-display mt-1 text-4xl font-semibold md:text-5xl">{project.name}</h1>
              </div>
            </div>
            {project.tagline && <p className="mt-4 max-w-2xl text-lg text-white/90">{project.tagline}</p>}
          </div>
        </section>

        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-[1.15fr_0.85fr] md:px-6">
          <div>
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="border border-border bg-[#f3f6f5] px-3 py-1 text-primary">
                {statusLabel(project.status)}
              </span>
              <span className="border border-border bg-[#f3f5f7] px-3 py-1 text-ul-blue">
                {maturityLabel(project.maturity)}
              </span>
              {project.cohortYear && (
                <span className="border border-border bg-[#f5f4f2] px-3 py-1 text-ul-brown">
                  Coorte {project.cohortYear}
                </span>
              )}
              {project.lifecycle === "ALUMNI" && (
                <span className="border border-border bg-white px-3 py-1 text-muted">Alumni</span>
              )}
            </div>
            {project.fundingEdition && (
              <p className="mt-3 text-sm text-muted">
                Financiamento: <span className="font-semibold text-foreground">{project.fundingEdition.name}</span>
              </p>
            )}
            <p className="mt-5 text-lg leading-relaxed text-muted">{project.summary}</p>
            {project.description && (
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted">
                {project.description}
              </p>
            )}

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {project.offer && (
                <div>
                  <h2 className="font-display text-lg font-semibold">O que oferece</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{project.offer}</p>
                </div>
              )}
              {project.audience && (
                <div>
                  <h2 className="font-display text-lg font-semibold">A quem se destina</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{project.audience}</p>
                </div>
              )}
            </div>
            {project.lookingFor && (
              <div className="mt-6 rounded-2xl border border-primary/25 bg-primary-soft/60 p-5">
                <h2 className="font-display text-lg font-semibold">Procura agora</h2>
                <p className="mt-2 text-sm leading-relaxed">{project.lookingFor}</p>
              </div>
            )}

            {project.milestones.length > 0 && (
              <section className="mt-12">
                <p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">
                  Maturidade
                </p>
                <h2 className="font-display mt-2 text-2xl font-semibold">Linha do tempo</h2>
                <ol className="relative mt-6 space-y-4 border-l-2 border-primary/30 pl-6">
                  {project.milestones.map((m) => (
                    <li key={m.id} className="relative">
                      <span className="absolute top-1.5 -left-[1.9rem] h-3 w-3 rounded-full bg-primary" />
                      <p className="text-xs font-semibold text-primary">
                        {new Date(m.date).toLocaleDateString("pt-MZ")} · {milestoneKindLabel(m.kind)}
                      </p>
                      <h3 className="mt-1 font-semibold">{m.title}</h3>
                      <p className="mt-1 text-sm text-muted">{m.description}</p>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {project.gallery.length > 0 && (
              <section className="mt-12">
                <p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">Galeria</p>
                <h2 className="font-display mt-2 text-2xl font-semibold">Evidências do percurso</h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {project.gallery.map((g) => (
                    <figure key={g.id} className="overflow-hidden border border-border bg-[#2f4248]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={g.url} alt={g.title || project.name} className="h-48 w-full object-cover" />
                      {g.title && (
                        <figcaption className="px-3 py-2 text-xs text-white/80">{g.title}</figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-4">
            <div className="card-surface p-5">
              <h2 className="font-display text-xl font-semibold">Equipa</h2>
              <p className="mt-3 text-sm">
                <span className="text-muted">Líder: </span>
                {project.leader}
              </p>
              {project.team && <p className="mt-1 text-sm text-muted">{project.team}</p>}
              <p className="mt-2 text-sm text-muted">{project.city}</p>
            </div>
            <div className="card-surface p-5 text-sm">
              <h2 className="font-display text-xl font-semibold">Falar com o negócio</h2>
              <div className="mt-4 flex flex-col gap-2">
                {wa && (
                  <a
                    href={wa}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary !bg-[color:var(--wa)] hover:!bg-[color:var(--wa-dark)] !py-2.5 text-center text-sm"
                  >
                    WhatsApp
                  </a>
                )}
                {project.contact && (
                  <a href={`tel:${project.contact.replace(/\s/g, "")}`} className="btn-ghost !py-2.5 text-center">
                    Ligar {project.contact}
                  </a>
                )}
                {project.email && (
                  <a href={`mailto:${project.email}`} className="btn-ghost !py-2.5 text-center">
                    {project.email}
                  </a>
                )}
                {project.website && (
                  <a href={project.website} target="_blank" rel="noreferrer" className="btn-ghost !py-2.5 text-center">
                    Website
                  </a>
                )}
              </div>
              {(project.facebook || project.instagram || project.linkedin) && (
                <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-primary">
                  {project.facebook && (
                    <a href={project.facebook} target="_blank" rel="noreferrer">
                      Facebook
                    </a>
                  )}
                  {project.instagram && (
                    <a href={project.instagram} target="_blank" rel="noreferrer">
                      Instagram
                    </a>
                  )}
                  {project.linkedin && (
                    <a href={project.linkedin} target="_blank" rel="noreferrer">
                      LinkedIn
                    </a>
                  )}
                </div>
              )}
            </div>
            <ContactForm projectSlug={project.slug} projectName={project.name} />
          </aside>
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
