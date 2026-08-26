import { AdminShell } from "@/components/AdminShell";
import { FormWithFeedback } from "@/components/FormWithFeedback";
import { markContactMessageRead } from "@/app/admin/actions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminMensagensPage() {
  const messages = await prisma.contactMessage.findMany({
    orderBy: [{ read: "asc" }, { createdAt: "desc" }],
  });
  const unread = messages.filter((m) => !m.read).length;

  return (
    <AdminShell title="Mensagens / Leads">
      <p className="mb-5 text-sm text-muted">
        Pedidos de contacto do site, incluindo interesse em projectos incubados.
        {unread > 0 ? ` ${unread} por ler.` : ""}
      </p>
      {messages.length === 0 && <p className="text-sm text-muted">Ainda sem mensagens.</p>}
      <div className="space-y-3">
        {messages.map((m) => (
          <article
            key={m.id}
            className={`card-surface p-5 ${m.read ? "opacity-80" : "border-primary/40"}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs text-primary">
                  {new Date(m.createdAt).toLocaleString("pt-MZ")}
                  {m.projectSlug ? ` · Projecto: ${m.projectSlug}` : ""}
                  {m.read ? " · Lida" : " · Nova"}
                </p>
                <h2 className="mt-1 font-semibold">{m.subject}</h2>
                <p className="mt-1 text-sm text-muted">
                  {m.name} · {m.email}
                  {m.phone ? ` · ${m.phone}` : ""}
                </p>
              </div>
              <FormWithFeedback
                action={markContactMessageRead}
                successMessage={m.read ? "Marcada como por ler." : "Marcada como lida."}
              >
                <input type="hidden" name="id" value={m.id} />
                <input type="hidden" name="read" value={m.read ? "false" : "true"} />
                <button className="btn-ghost !py-2 text-sm">
                  {m.read ? "Marcar por ler" : "Marcar como lida"}
                </button>
              </FormWithFeedback>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{m.message}</p>
          </article>
        ))}
      </div>
    </AdminShell>
  );
}
