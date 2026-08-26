import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { MonthCalendar } from "@/components/MonthCalendar";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { getCalendarEntries, getSiteConfig } from "@/lib/data";

export const dynamic = "force-static";

export default async function CalendarioPage() {
  const [config, entries] = await Promise.all([getSiteConfig(), getCalendarEntries()]);

  return (
    <div className="site-shell min-h-screen">
      <SiteHeader brand={config?.brandName || "IEUL"} />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:py-12 md:px-6">
        <p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">Agenda IEUL</p>
        <h1 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">
          Calendário de actividades e eventos
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted sm:text-base">
          Calendário e painel de resumo lado a lado. Filtre por mês, semana ou dia; passe o cursor
          sobre uma data para pré-visualizar e abra os detalhes no painel.
        </p>

        <div className="mt-8">
          <MonthCalendar entries={entries} />
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
