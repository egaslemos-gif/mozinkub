import { AdminShell } from "@/components/AdminShell";
import { AdminGalleryMediaItem } from "@/components/AdminGalleryMediaItem";
import { FormWithFeedback } from "@/components/FormWithFeedback";
import { GalleryMediaForm } from "@/components/GalleryMediaForm";
import { createGalleryAlbum, deleteGalleryAlbum } from "@/app/admin/actions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminGaleriaPage() {
  const albums = await prisma.galleryAlbum.findMany({
    include: { media: { orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AdminShell title="Galeria">
      <p className="mb-5 max-w-2xl text-sm text-muted">
        Crie álbuns e carregue fotografias ou vídeos com legenda e informação de contexto (visível
        ao passar o cursor na página pública /galeria).
      </p>

      <FormWithFeedback
        action={createGalleryAlbum}
        className="card-surface mb-6 grid gap-3 p-5"
        successMessage="Álbum criado."
        resetOnSuccess
      >
        <h2 className="font-display text-xl font-semibold">Novo álbum</h2>
        <input className="admin-input" name="title" placeholder="Título do álbum" required />
        <textarea className="admin-input" name="description" placeholder="Descrição (opcional)" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="published" defaultChecked /> Publicado
        </label>
        <button className="btn-primary">Criar álbum</button>
      </FormWithFeedback>

      <div className="space-y-4">
        {albums.length === 0 && (
          <p className="text-sm text-muted">Ainda sem álbuns. Crie o primeiro acima.</p>
        )}
        {albums.map((album) => (
          <article key={album.id} className="card-surface p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{album.title}</p>
                <p className="text-sm text-muted">{album.description || "Sem descrição"}</p>
                <p className="mt-1 text-xs text-ul-blue">
                  {album.media.length} item(ns) · /galeria
                </p>
              </div>
              <FormWithFeedback action={deleteGalleryAlbum} successMessage="Álbum removido.">
                <input type="hidden" name="id" value={album.id} />
                <button className="btn-ghost !py-2 text-sm">Remover álbum</button>
              </FormWithFeedback>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {album.media.map((m) => (
                <AdminGalleryMediaItem
                  key={m.id}
                  albumId={album.id}
                  media={{
                    id: m.id,
                    title: m.title,
                    description: m.description,
                    url: m.url,
                    type: m.type,
                  }}
                />
              ))}
            </div>

            <GalleryMediaForm albumId={album.id} />
          </article>
        ))}
      </div>
    </AdminShell>
  );
}
