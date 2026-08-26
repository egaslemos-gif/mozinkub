import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import {
  getEventBySlug,
  getSiteConfig,
} from "@/lib/data";
import { eventCategoryLabel } from "@/lib/calendar";
import { toAppMediaUrl } from "@/lib/media-url";

export const dynamic = "force-dynamic";

export default async function EventoDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [config, event] = await Promise.all([getSiteConfig(), getEventBySlug(slug)]);
  if (!event) notFound();

  return (
    <div className="site-shell min-h-screen">
      <SiteHeader brand={config?.brandName || "IEUL"} />
      <main className="mx-auto max-w-3xl px-4 py-12 md:px-6">
        <Link href="/calendario" className="text-sm font-semibold text-primary">
          ← Voltar ao calendário
        </Link>
        {event.coverUrl && (
          <div className="mt-6 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={toAppMediaUrl(event.coverUrl)}
              alt=""
              className="max-h-[360px] w-full object-cover"
            />
          </div>
        )}
        <p className="mt-6 text-xs font-semibold tracking-wide text-primary uppercase">
          {eventCategoryLabel(event.category)} ·{" "}
          {new Date(event.startsAt).toLocaleDateString("pt-MZ", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </p>
        <h1 className="font-display mt-2 text-4xl font-semibold">{event.title}</h1>
        {event.location && <p className="mt-2 text-muted">Local: {event.location}</p>}
        <p className="mt-5 text-lg text-muted">{event.summary}</p>
        {event.details && (
          <div className="card-surface mt-8 p-6">
            <h2 className="font-display text-xl font-semibold">Detalhes</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted">
              {event.details}
            </p>
          </div>
        )}
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
