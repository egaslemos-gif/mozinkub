import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { HeroSlider } from "@/components/HeroSlider";
import { ContactForm } from "@/components/ContactForm";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { ProjectMuralCard } from "@/components/ProjectMuralCard";
import { MonthCalendar } from "@/components/MonthCalendar";
import {
  getCalendarEntries,
  getHighlightEvent,
  getPublishedEvents,
  getPublishedFundingCalls,
  getPublishedHeroSlides,
  getPublishedProjects,
  getPublishedTimeline,
  getSiteConfig,
  parseValues,
} from "@/lib/data";
import { whatsappHref } from "@/lib/projects";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [config, projects, events, funding, timeline, slides, calendarEntries, highlightEvent] =
    await Promise.all([
      getSiteConfig(),
      getPublishedProjects({ lifecycle: "ATIVO" }),
      getPublishedEvents(),
      getPublishedFundingCalls(),
      getPublishedTimeline(),
      getPublishedHeroSlides(),
      getCalendarEntries(),
      getHighlightEvent(),
    ]);

  if (!config) {
    return (
      <main className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl">Base de dados sem seed</h1>
        <p className="mt-3 text-muted">
          Execute <code>npx prisma db seed</code> na pasta <code>ieul-web</code>.
        </p>
      </main>
    );
  }

  const values = parseValues(config.valuesJson);
  const featured = projects.filter((p) => p.featured);
  const mural = (featured.length ? featured : projects).slice(0, 3);
  const nextEvent = highlightEvent;
  const openCall = funding.find((f) => f.status === "ABERTO");

  const projectSlides = mural
    .filter((p) => p.coverUrl)
    .map((p) => ({
      id: `proj-${p.id}`,
      title: p.name,
      subtitle: p.tagline || p.summary,
      imageUrl: p.coverUrl as string,
      linkUrl: `/projectos/${p.slug}`,
      kicker: "Projecto incubado",
      logoUrl: p.logoUrl,
    }));

  const heroSlides = [
    ...projectSlides,
    ...slides.map((s) => ({
      id: s.id,
      title: s.title,
      subtitle: s.subtitle,
      imageUrl: s.imageUrl,
      linkUrl: s.linkUrl,
    })),
  ];

  return (
    <div className="site-shell min-h-screen">
      <SiteHeader brand={config.brandName} />

      <main>
        <section className="section bg-white">
          <div className="section-inner grid items-center gap-8 md:grid-cols-2 md:gap-10">
            <div className="fade-up min-w-0">
              <p className="section-kicker">
                IEUL · UniLicungo · MozInkub N+1 · Embaixada de França
              </p>
              <h1 className="font-display mt-3 text-3xl leading-[1.15] font-semibold tracking-tight break-words sm:text-4xl md:text-[2.75rem]">
                {config.heroTitle}
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
                {config.heroSubtitle}
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href="/projectos" className="btn-primary w-full sm:w-auto">
                  Ver projectos incubados
                </Link>
                <Link href="/#calendario" className="btn-ghost w-full sm:w-auto">
                  Ver calendário
                </Link>
              </div>
            </div>

            <HeroSlider
              slides={heroSlides}
              stats={{
                projects: projects.length,
                activities: timeline.length,
                events: events.length,
              }}
            />
          </div>
        </section>

        <section className="section bg-section-alt">
          <div className="section-inner">
            <div className="section-head">
              <div>
                <p className="section-kicker">Destaques</p>
                <h2 className="section-title">Projectos incubados</h2>
              </div>
              <Link href="/projectos" className="section-link">
                Ver mural →
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {mural.map((p) => (
                <ProjectMuralCard key={p.id} project={p} />
              ))}
            </div>
          </div>
        </section>

        <section id="calendario" className="section bg-white">
          <div className="section-inner">
            <div className="section-head">
              <div>
                <p className="section-kicker">Agenda pública</p>
                <h2 className="section-title">Calendário de actividades e eventos</h2>
                <p className="section-lead">
                  Seleccione um dia, semana ou mês. O painel ao lado mostra o resumo.
                </p>
              </div>
              <Link href="/calendario" className="section-link">
                Página completa →
              </Link>
            </div>
            <MonthCalendar entries={calendarEntries} />
          </div>
        </section>

        <section id="sobre" className="section bg-section-alt">
          <div className="section-inner">
            <p className="section-kicker">Sobre</p>
            <h2 className="section-title">Missão, visão e valores</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="card-surface p-5">
                <h3 className="font-display text-lg font-semibold">Missão</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{config.mission}</p>
              </div>
              <div className="card-surface p-5">
                <h3 className="font-display text-lg font-semibold">Visão</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{config.vision}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {values.map((v) => (
                <div
                  key={v}
                  className="border border-border bg-white px-4 py-3 text-sm font-medium"
                >
                  {v}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section bg-white">
          <div className="section-inner">
            <div className="section-head">
              <div>
                <p className="section-kicker">Linha do tempo</p>
                <h2 className="section-title">Actividades recentes</h2>
                <p className="section-lead">
                  Clique numa actividade para ver detalhes e evidências.
                </p>
              </div>
              <Link href="/actividades" className="section-link">
                Ver guia completo →
              </Link>
            </div>
            <ol className="relative space-y-3 border-l-2 border-primary/25 pl-5">
              {timeline.slice(0, 4).map((item) => (
                <li key={item.id} className="relative">
                  <span className="absolute top-3 -left-[1.7rem] h-2.5 w-2.5 bg-primary" />
                  <Link
                    href={`/actividades/${item.slug}`}
                    className="card-surface block p-4 transition hover:border-primary"
                  >
                    <p className="text-xs font-semibold text-primary">
                      {new Date(item.date).toLocaleDateString("pt-MZ")} · {item.category}
                    </p>
                    <h3 className="mt-1 font-semibold">{item.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{item.description}</p>
                    <p className="mt-2 text-xs font-semibold text-primary">Ver detalhes →</p>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="section bg-section-alt">
          <div className="section-inner grid gap-4 md:grid-cols-2">
            <div className="card-surface p-5">
              <p className="section-kicker">Agenda</p>
              <h3 className="font-display mt-2 text-xl font-semibold">
                {nextEvent?.title || "Consulte o calendário"}
              </h3>
              {nextEvent ? (
                <>
                  <p className="mt-2 text-sm text-muted">{nextEvent.summary}</p>
                  <Link href="/#calendario" className="section-link mt-4 inline-block">
                    Ir ao calendário →
                  </Link>
                </>
              ) : (
                <Link href="/#calendario" className="section-link mt-4 inline-block">
                  Ver calendário →
                </Link>
              )}
            </div>
            <div className="card-surface p-5">
              <p className="section-kicker">Editais</p>
              <h3 className="font-display mt-2 text-xl font-semibold">
                {openCall?.title || "Sem editais abertos"}
              </h3>
              {openCall && (
                <>
                  <p className="mt-2 text-sm text-muted">{openCall.summary}</p>
                  <Link href={`/editais/${openCall.slug}`} className="section-link mt-4 inline-block">
                    Ver edital e candidatar-se →
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        <section id="contactos" className="section bg-section-alt">
          <div className="section-inner">
            <p className="section-kicker">Contactos</p>
            <h2 className="section-title">Fale com a Antena da Beira</h2>
            <p className="section-lead">
              Esclareça dúvidas sobre incubação, editais ou projectos — a coordenação responde por
              email, telefone ou WhatsApp.
            </p>

            <div className="mt-8 grid overflow-hidden border border-border bg-white md:grid-cols-2">
              <aside className="border-b border-border p-5 sm:p-6 md:border-r md:border-b-0">
                {config.campus && (
                  <p className="text-sm font-semibold text-ul-blue">{config.campus}</p>
                )}

                <dl className="mt-5 grid gap-4 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
                  <div>
                    <dt className="text-[0.65rem] font-bold tracking-[0.14em] text-primary uppercase">
                      Morada
                    </dt>
                    <dd className="mt-1 text-sm leading-relaxed text-foreground">{config.address}</dd>
                  </div>
                  <div>
                    <dt className="text-[0.65rem] font-bold tracking-[0.14em] text-primary uppercase">
                      Telefone
                    </dt>
                    <dd className="mt-1">
                      <a
                        href={`tel:${config.phone.replace(/[^\d+/]/g, "")}`}
                        className="text-sm font-medium text-foreground underline-offset-2 hover:text-primary hover:underline"
                      >
                        {config.phone}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[0.65rem] font-bold tracking-[0.14em] text-primary uppercase">
                      Email
                    </dt>
                    <dd className="mt-1">
                      <a
                        href={`mailto:${config.email}`}
                        className="break-all text-sm font-medium text-foreground underline-offset-2 hover:text-primary hover:underline"
                      >
                        {config.email}
                      </a>
                    </dd>
                  </div>
                  {config.whatsapp && (
                    <div>
                      <dt className="text-[0.65rem] font-bold tracking-[0.14em] text-primary uppercase">
                        WhatsApp
                      </dt>
                      <dd className="mt-1">
                        <a
                          href={whatsappHref(
                            config.whatsapp,
                            "Olá! Contacto a partir do site MozInkub / IEUL.",
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-medium text-foreground underline-offset-2 hover:text-primary hover:underline"
                        >
                          {config.whatsapp}
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>

                {config.whatsapp && (
                  <a
                    href={whatsappHref(
                      config.whatsapp,
                      "Olá! Contacto a partir do site MozInkub / IEUL.",
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary mt-6 inline-flex w-full justify-center sm:w-auto"
                  >
                    Abrir WhatsApp
                  </a>
                )}
              </aside>

              <div className="min-w-0">
                <ContactForm embedded />
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter
        brand={config.brandName}
        slogan={config.slogan}
        address={config.address}
        phone={config.phone}
        email={config.email}
      />
      <WhatsAppFab phone={config.whatsapp || config.phone} />
    </div>
  );
}
