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

// MVP on Vercel+SQLite: render no build para evitar leitura de DB em runtime.
export const dynamic = "force-static";

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
        <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 pt-5 pb-12 sm:pt-6 sm:pb-14 md:grid-cols-2 md:gap-10 md:px-6 md:pt-8 md:pb-16">
          <div className="fade-up min-w-0">
            <p className="mb-3 text-[10px] font-bold tracking-[0.12em] text-primary uppercase sm:text-xs sm:tracking-[0.18em]">
              IEUL · UniLicungo · MozInkub N+1 · Embaixada de França
            </p>
            <h1 className="font-display text-[1.85rem] leading-[1.15] font-semibold tracking-tight break-words sm:text-4xl md:text-5xl">
              {config.heroTitle}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted sm:mt-5 sm:text-base md:text-lg">
              {config.heroSubtitle}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
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
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16 md:px-6">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">
                Destaques
              </p>
              <h2 className="font-display mt-2 text-3xl font-semibold">Projectos incubados</h2>
            </div>
            <Link href="/projectos" className="text-sm font-semibold text-primary">
              Ver mural →
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {mural.map((p) => (
              <ProjectMuralCard key={p.id} project={p} />
            ))}
          </div>
        </section>

        <section id="calendario" className="border-b border-border bg-white/80 py-14 md:py-16">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-2xl">
                <p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">
                  Agenda pública
                </p>
                <h2 className="font-display mt-2 text-3xl font-semibold">
                  Calendário de actividades e eventos
                </h2>
                <p className="mt-2 text-sm text-muted">
                  Calendário e resumo lado a lado: seleccione um dia, a semana ou o mês para ver as
                  actividades correspondentes. Hover mostra pré-visualização; clique no resumo para
                  detalhes.
                </p>
              </div>
              <Link href="/calendario" className="text-sm font-semibold text-primary">
                Abrir página completa →
              </Link>
            </div>
            <MonthCalendar entries={calendarEntries} />
          </div>
        </section>

        <section id="sobre" className="bg-white/70 py-16">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">Sobre</p>
            <h2 className="font-display mt-2 max-w-2xl text-3xl font-semibold md:text-4xl">
              Missão, visão e valores
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="card-surface p-6">
                <h3 className="font-display text-xl font-semibold">Missão</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{config.mission}</p>
              </div>
              <div className="card-surface p-6">
                <h3 className="font-display text-xl font-semibold">Visão</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{config.vision}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {values.map((v) => (
                <div
                  key={v}
                  className="rounded-2xl border border-border bg-primary-soft/50 px-4 py-3 text-sm font-medium"
                >
                  {v}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 md:px-6">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">
                Linha do tempo
              </p>
              <h2 className="font-display mt-2 text-3xl font-semibold">Actividades recentes</h2>
              <p className="mt-2 text-sm text-muted">
                Clique numa actividade para ver detalhes e evidências.
              </p>
            </div>
            <Link href="/actividades" className="text-sm font-semibold text-primary">
              Ver guia completo →
            </Link>
          </div>
          <ol className="relative space-y-4 border-l-2 border-primary/30 pl-6">
            {timeline.slice(0, 4).map((item) => (
              <li key={item.id} className="relative">
                <span className="absolute top-1.5 -left-[1.9rem] h-3 w-3 rounded-full bg-primary" />
                <Link
                  href={`/actividades/${item.slug}`}
                  className="card-surface block p-4 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
                >
                  <p className="text-xs font-semibold text-primary">
                    {new Date(item.date).toLocaleDateString("pt-MZ")} · {item.category}
                  </p>
                  <h3 className="mt-1 font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted">{item.description}</p>
                  <p className="mt-3 text-xs font-semibold text-ul-blue">Ver detalhes →</p>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-16 md:grid-cols-2 md:px-6">
          <div className="card-surface p-6">
            <p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">Agenda</p>
            <h3 className="font-display mt-2 text-2xl font-semibold">
              {nextEvent?.title || "Consulte o calendário"}
            </h3>
            {nextEvent ? (
              <>
                <p className="mt-3 text-sm text-muted">{nextEvent.summary}</p>
                <Link
                  href="/#calendario"
                  className="mt-5 inline-block text-sm font-semibold text-primary"
                >
                  Ir ao calendário →
                </Link>
              </>
            ) : (
              <Link
                href="/#calendario"
                className="mt-5 inline-block text-sm font-semibold text-primary"
              >
                Ver calendário →
              </Link>
            )}
          </div>
          <div className="card-surface p-6">
            <p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">Editais</p>
            <h3 className="font-display mt-2 text-2xl font-semibold">
              {openCall?.title || "Sem editais abertos"}
            </h3>
            {openCall && (
              <>
                <p className="mt-3 text-sm text-muted">{openCall.summary}</p>
                <Link
                  href={`/editais/${openCall.slug}`}
                  className="mt-5 inline-block text-sm font-semibold text-primary"
                >
                  Ver edital e candidatar-se →
                </Link>
              </>
            )}
          </div>
        </section>

        <section id="contactos" className="border-t border-border bg-white py-16">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">Contactos</p>
            <h2 className="font-display mt-2 text-3xl font-semibold">Fale com a Antena da Beira</h2>
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="card-surface p-5 text-sm">
                  <p className="font-semibold">Morada</p>
                  <p className="mt-2 text-muted">{config.address}</p>
                </div>
                <div className="card-surface p-5 text-sm">
                  <p className="font-semibold">Telefone</p>
                  <p className="mt-2 text-muted">{config.phone}</p>
                </div>
                <div className="card-surface p-5 text-sm">
                  <p className="font-semibold">Email</p>
                  <p className="mt-2 text-muted">{config.email}</p>
                </div>
                <div className="card-surface p-5 text-sm">
                  <p className="font-semibold">WhatsApp</p>
                  <p className="mt-2 text-muted">{config.whatsapp}</p>
                </div>
              </div>
              <ContactForm />
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
