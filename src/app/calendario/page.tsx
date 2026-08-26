import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { MonthCalendar } from "@/components/MonthCalendar";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { getCalendarEntries, getSiteConfig } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function CalendarioPage() {
  const [config, entries] = await Promise.all([getSiteConfig(), getCalendarEntries()]);

  return (
    <div className="site-shell min-h-screen">
      <SiteHeader brand={config?.brandName || "IEUL"} />
      <main className="section">
        <div className="section-inner">
          <p className="section-kicker">Agenda IEUL</p>
          <h1 className="section-title">Calendário de actividades e eventos</h1>
          <p className="section-lead">
            Filtre por mês, semana ou dia; clique num registo no painel para detalhes.
          </p>
          <div className="mt-6">
            <MonthCalendar entries={entries} />
          </div>
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
