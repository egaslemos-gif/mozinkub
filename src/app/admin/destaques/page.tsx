import { AdminShell } from "@/components/AdminShell";
import { DestaqueSlideCard } from "@/components/DestaqueSlideCard";
import { SlideUploadForm } from "@/components/SlideUploadForm";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDestaquesPage() {
  const slides = await prisma.heroSlide.findMany({ orderBy: { order: "asc" } });

  return (
    <AdminShell title="Destaques / Slider">
      <p className="mb-4 text-sm text-muted">
        Fotos e actualidades no cartão principal da página inicial. Os projectos marcados
        como &quot;Destaque&quot; também entram neste slider (edite a capa em Projectos).
      </p>
      <SlideUploadForm />
      <div className="space-y-3">
        {slides.map((s) => (
          <DestaqueSlideCard
            key={s.id}
            slide={{
              id: s.id,
              title: s.title,
              subtitle: s.subtitle,
              imageUrl: s.imageUrl,
              linkUrl: s.linkUrl,
              order: s.order,
              published: s.published,
            }}
          />
        ))}
        {slides.length === 0 && (
          <p className="text-sm text-muted">Ainda sem slides manuais. Publique o primeiro acima.</p>
        )}
      </div>
    </AdminShell>
  );
}
