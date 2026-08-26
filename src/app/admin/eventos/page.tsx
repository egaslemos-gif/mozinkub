import Link from "next/link";
import { AdminShell } from "@/components/AdminShell";
import { EventForm } from "@/components/EventForm";
import { FormWithFeedback } from "@/components/FormWithFeedback";
import { createEvent, deleteEvent, updateEvent } from "@/app/admin/actions";
import { prisma } from "@/lib/prisma";
import { eventCategoryLabel } from "@/lib/calendar";

export const dynamic = "force-dynamic";

export default async function AdminEventosPage() {
  const events = await prisma.event.findMany({ orderBy: { startsAt: "desc" } });

  return (
    <AdminShell title="Calendário / Agendas">
      <p className="mb-5 max-w-2xl text-sm text-muted">
        Agende feiras, exposições, visitas e outras actividades. Ficam visíveis no calendário
        mensal público (landing e /calendario).
      </p>
      <p className="mb-4 text-sm">
        <Link href="/calendario" className="font-semibold text-primary">
          Ver calendário público →
        </Link>
      </p>

      <div id="nova-agenda" className="scroll-mt-24">
        <EventForm action={createEvent} submitLabel="Agendar no calendário" />
      </div>
      <div className="mt-8 space-y-4">
        {events.map((e) => (
          <div key={e.id} className="space-y-3">
            <EventForm
              action={updateEvent}
              submitLabel="Guardar"
              event={{
                id: e.id,
                title: e.title,
                summary: e.summary,
                details: e.details,
                category: e.category,
                location: e.location,
                startsAt: e.startsAt,
                endsAt: e.endsAt,
                coverUrl: e.coverUrl,
                published: e.published,
              }}
            />
            <div className="flex items-center justify-between px-1 text-xs text-muted">
              <span>
                {eventCategoryLabel(e.category)} · /eventos/{e.slug}
              </span>
              <FormWithFeedback action={deleteEvent} successMessage="Evento removido.">
                <input type="hidden" name="id" value={e.id} />
                <button className="font-semibold text-red-700">Remover</button>
              </FormWithFeedback>
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
