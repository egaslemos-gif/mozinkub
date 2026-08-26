import Image from "next/image";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { getPublishedAlbums, getSiteConfig } from "@/lib/data";

export const dynamic = "force-static";

export default async function GaleriaPage() {
  const [config, albums] = await Promise.all([getSiteConfig(), getPublishedAlbums()]);

  return (
    <div className="site-shell min-h-screen">
      <SiteHeader brand={config?.brandName || "IEUL"} />
      <main className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">Memória visual</p>
        <h1 className="font-display mt-2 text-4xl font-semibold">Galeria</h1>
        <div className="mt-8 space-y-10">
          {albums.length === 0 && (
            <p className="text-sm text-muted">
              Ainda sem álbuns publicados. A coordenação pode carregar fotografias em Admin → Galeria.
            </p>
          )}
          {albums.map((album) => (
            <section key={album.id}>
              <h2 className="font-display text-2xl font-semibold">{album.title}</h2>
              {album.description && (
                <p className="mt-2 text-sm text-muted">{album.description}</p>
              )}
              <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {album.media.map((m) => (
                  <figure key={m.id} className="card-surface overflow-hidden">
                    <div className="relative aspect-[4/3] bg-primary-soft">
                      <Image
                        src={m.url}
                        alt={m.title || album.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    {m.title && (
                      <figcaption className="p-3 text-sm text-muted">{m.title}</figcaption>
                    )}
                  </figure>
                ))}
              </div>
            </section>
          ))}
        </div>
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
