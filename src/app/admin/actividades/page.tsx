import { AdminShell } from "@/components/AdminShell";
import { createTimelineItem, deleteTimelineItem } from "@/app/admin/actions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminActividadesPage() {
  const items = await prisma.timelineItem.findMany({ orderBy: { date: "desc" } });

  return (
    <AdminShell title="Actividades / Timeline">
      <form action={createTimelineItem} className="card-surface mb-6 grid gap-3 p-5">
        <h2 className="font-display text-xl font-semibold">Nova actividade</h2>
        <input className="admin-input" name="title" placeholder="Título" required />
        <textarea className="admin-input" name="description" placeholder="Resumo curto" required />
        <textarea
          className="admin-input min-h-28"
          name="details"
          placeholder="Detalhes completos (página pública)"
        />
        <input className="admin-input" type="datetime-local" name="date" required />
        <input
          className="admin-input"
          name="category"
          placeholder="Categoria"
          defaultValue="ACTIVIDADE"
        />
        <input
          className="admin-input"
          name="mediaUrl"
          placeholder="URL da evidência (ex: /uploads/foto.jpg)"
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="published" defaultChecked /> Publicado
        </label>
        <button className="btn-primary">Adicionar</button>
      </form>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="card-surface flex items-start justify-between gap-4 p-4">
            <div>
              <p className="text-xs text-primary">
                {new Date(item.date).toLocaleString("pt-MZ")} · {item.category}
              </p>
              <p className="mt-1 font-semibold">{item.title}</p>
              <p className="mt-1 text-sm text-muted">{item.description}</p>
              <p className="mt-1 text-xs text-ul-blue">/{`actividades/${item.slug}`}</p>
            </div>
            <form action={deleteTimelineItem}>
              <input type="hidden" name="id" value={item.id} />
              <button className="btn-ghost !py-2 text-sm">Remover</button>
            </form>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
