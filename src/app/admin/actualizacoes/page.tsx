import { AdminShell } from "@/components/AdminShell";
import { AnnouncementAdminCard } from "@/components/AnnouncementAdminCard";
import { AnnouncementForm } from "@/components/AnnouncementForm";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminActualizacoesPage() {
  const items = await prisma.announcement.findMany({
    orderBy: [{ featured: "desc" }, { order: "asc" }, { createdAt: "desc" }],
  });

  return (
    <AdminShell title="Actualizações">
      <p className="mb-4 text-sm text-muted">
        Notícias, avisos e cartazes (ex.: hackathon) na homepage e em /actualizacoes. Marque
        &quot;Destaque&quot; para o cartão grande na página inicial.
      </p>
      <AnnouncementForm />
      <div className="space-y-3">
        {items.map((item) => (
          <AnnouncementAdminCard
            key={item.id}
            item={{
              id: item.id,
              title: item.title,
              summary: item.summary,
              type: item.type,
              imageUrl: item.imageUrl,
              linkUrl: item.linkUrl,
              linkLabel: item.linkLabel,
              featured: item.featured,
              published: item.published,
              order: item.order,
            }}
          />
        ))}
        {items.length === 0 && (
          <p className="text-sm text-muted">
            Ainda sem actualizações. Publique a primeira acima (ex.: cartaz do hackathon).
          </p>
        )}
      </div>
    </AdminShell>
  );
}
