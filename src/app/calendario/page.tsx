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
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8 md:px-6">
        <p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">Agenda IEUL</p>
        <h1 className="font-display mt-1 text-2xl font-semibold sm:text-3xl">
          Calendário de actividades e eventos
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Filtre por mês, semana ou dia; clique num registo no painel para detalhes.
        </p>

        <div className="mt-4">
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
