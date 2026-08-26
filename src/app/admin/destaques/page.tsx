import { AdminShell } from "@/components/AdminShell";
import { SlideUploadForm } from "@/components/SlideUploadForm";
import { deleteHeroSlide } from "@/app/admin/actions";
import { prisma } from "@/lib/prisma";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function AdminDestaquesPage() {
  const slides = await prisma.heroSlide.findMany({ orderBy: { order: "asc" } });

  return (
    <AdminShell title="Destaques / Slider">
      <p className="mb-4 text-sm text-muted">
        Fotos e actualidades apresentadas no cartão principal da página inicial.
      </p>
      <SlideUploadForm />
      <div className="space-y-3">
        {slides.map((s) => (
          <div key={s.id} className="card-surface flex gap-4 p-4">
            <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-primary-soft">
              <Image src={s.imageUrl} alt={s.title} fill className="object-cover" unoptimized />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{s.title}</p>
              {s.subtitle && <p className="mt-1 text-sm text-muted">{s.subtitle}</p>}
              <p className="mt-1 text-xs text-primary">Ordem {s.order}</p>
            </div>
            <form action={deleteHeroSlide}>
              <input type="hidden" name="id" value={s.id} />
              <button className="btn-ghost !py-2 text-sm">Remover</button>
            </form>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
