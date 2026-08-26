import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { GalleryMediaCard } from "@/components/GalleryMediaCard";
import { getPublishedAlbums, getSiteConfig } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function GaleriaPage() {
  const [config, albums] = await Promise.all([getSiteConfig(), getPublishedAlbums()]);

  return (
    <div className="site-shell min-h-screen">
      <SiteHeader brand={config?.brandName || "IEUL"} />
      <main className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">Memória visual</p>
        <h1 className="font-display mt-2 text-4xl font-semibold">Galeria</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted">
          Fotografias e vídeos das actividades da incubadora. Passe o cursor sobre cada item para
          ver mais informação.
        </p>
        <div className="mt-8 space-y-10">
          {albums.length === 0 && (
            <p className="text-sm text-muted">
              Ainda sem álbuns publicados. A coordenação pode carregar conteúdos em Admin → Galeria.
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
                  <GalleryMediaCard
                    key={m.id}
                    url={m.url}
                    type={m.type}
                    title={m.title}
                    description={m.description}
                    albumTitle={album.title}
                  />
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
