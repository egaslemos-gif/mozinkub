import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { getPublishedTimeline, getSiteConfig } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ActividadesPage() {
  const [config, timeline] = await Promise.all([getSiteConfig(), getPublishedTimeline()]);

  return (
    <div className="site-shell min-h-screen">
      <SiteHeader brand={config?.brandName || "IEUL"} />
      <main className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">Guia temporal</p>
        <h1 className="font-display mt-2 text-4xl font-semibold">Actividades e evidências</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Clique numa actividade para abrir os detalhes e evidências disponíveis.
        </p>
        <ol className="relative mt-10 space-y-5 border-l-2 border-primary/30 pl-6">
          {timeline.map((item) => (
            <li key={item.id} className="relative">
              <span className="absolute top-6 -left-[1.9rem] h-3 w-3 rounded-full bg-primary" />
              <Link
                href={`/actividades/${item.slug}`}
                className="card-surface block p-5 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
              >
                <p className="text-xs font-semibold text-primary">
                  {new Date(item.date).toLocaleDateString("pt-MZ", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}{" "}
                  · {item.category}
                </p>
                <h2 className="mt-1 text-xl font-semibold">{item.title}</h2>
                <p className="mt-2 text-sm text-muted">{item.description}</p>
                <p className="mt-3 text-xs font-semibold text-ul-blue">Abrir detalhes →</p>
              </Link>
            </li>
          ))}
        </ol>
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
