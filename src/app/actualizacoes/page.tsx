import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { AnnouncementCard } from "@/components/AnnouncementCard";
import { getPublishedAnnouncements, getSiteConfig } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ActualizacoesPage() {
  const [config, items] = await Promise.all([
    getSiteConfig(),
    getPublishedAnnouncements(),
  ]);

  const featured = items.find((a) => a.featured) || items[0];
  const rest = items.filter((a) => a.id !== featured?.id);

  return (
    <div className="site-shell min-h-screen">
      <SiteHeader brand={config?.brandName || "IEUL"} />
      <main>
        <section className="section bg-white">
          <div className="section-inner">
            <p className="section-kicker">Informação pública</p>
            <h1 className="section-title">Actualizações</h1>
            <p className="section-lead mt-3 max-w-2xl">
              Notícias, avisos e cartazes das actividades da incubadora — para a comunidade
              acompanhar o que está a acontecer.
            </p>

            {items.length === 0 && (
              <p className="mt-8 text-sm text-muted">
                Ainda sem actualizações publicadas. A coordenação pode adicionar conteúdos em
                Admin → Actualizações.
              </p>
            )}

            {featured && (
              <div className="mt-8">
                <AnnouncementCard item={featured} large />
              </div>
            )}

            {rest.length > 0 && (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((item) => (
                  <AnnouncementCard key={item.id} item={item} />
                ))}
              </div>
            )}

            <p className="mt-10">
              <Link href="/" className="section-link">
                ← Voltar à página inicial
              </Link>
            </p>
          </div>
        </section>
      </main>
      {config && (
        <SiteFooter
          brand={config.brandName}
          slogan={config.slogan}
          address={config.address}
          phone={config.phone}
          email={config.email}
        />
      )}
    </div>
  );
}
