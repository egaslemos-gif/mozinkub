import Link from "next/link";
import { AdminShell } from "@/components/AdminShell";
import { FormWithFeedback } from "@/components/FormWithFeedback";
import { updateCallApplication } from "@/app/admin/actions";
import { prisma } from "@/lib/prisma";
import { APPLICATION_STATUS_OPTIONS } from "@/lib/funding";
import { statusLabel } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminCandidaturasPage() {
  const [applications, openCalls] = await Promise.all([
    prisma.callApplication.findMany({
      include: { call: { select: { id: true, title: true, slug: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.fundingCall.findMany({
      where: { published: true, status: "ABERTO", acceptApplications: true },
      orderBy: { deadline: "asc" },
    }),
  ]);

  return (
    <AdminShell title="Candidaturas">
      <p className="mb-5 max-w-2xl text-sm text-muted">
        Candidaturas submetidas pelos visitantes nos editais públicos (PDF do projecto). Actualize o
        estado após a apreciação.
      </p>

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <Link href="/admin/editais#novo-edital" className="card-surface p-4 hover:border-primary">
          <p className="text-xs font-bold tracking-wide text-primary uppercase">Criar</p>
          <p className="mt-1 font-semibold">Novo edital / concurso</p>
          <p className="mt-1 text-xs text-muted">Para receber candidaturas online</p>
        </Link>
        <div className="card-surface p-4">
          <p className="text-xs font-bold tracking-wide text-primary uppercase">Editais abertos</p>
          {openCalls.length === 0 ? (
            <p className="mt-2 text-sm text-muted">Nenhum edital a aceitar candidaturas.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {openCalls.map((c) => (
                <li key={c.id}>
                  <Link href={`/editais/${c.slug}`} className="font-semibold text-ul-blue">
                    {c.title} →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <h2 className="font-display text-xl font-semibold">
        Recebidas ({applications.length})
      </h2>

      <div className="mt-4 space-y-4">
        {applications.length === 0 && (
          <p className="text-sm text-muted">
            Ainda sem candidaturas. Publique um edital aberto em{" "}
            <Link href="/admin/editais#novo-edital" className="font-semibold text-primary">
              Editais
            </Link>{" "}
            e partilhe o link público.
          </p>
        )}
        {applications.map((a) => (
          <article key={a.id} className="card-surface p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs text-primary">
                  {new Date(a.createdAt).toLocaleString("pt-MZ")} · {statusLabel(a.status)}
                </p>
                <h3 className="mt-1 text-lg font-semibold">{a.projectTitle}</h3>
                <p className="text-sm text-muted">
                  {a.area} · {a.leaderName} · {a.email}
                  {a.phone ? ` · ${a.phone}` : ""}
                </p>
                <p className="mt-1 text-xs text-ul-blue">
                  Edital:{" "}
                  <Link href={`/admin/editais/${a.call.id}`} className="font-semibold">
                    {a.call.title}
                  </Link>
                </p>
              </div>
              <a
                href={a.documentUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost !py-2 text-sm"
              >
                Abrir PDF
              </a>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">{a.summary}</p>
            {a.team && <p className="mt-2 text-xs text-muted">Equipa: {a.team}</p>}
            <FormWithFeedback
              action={updateCallApplication}
              className="mt-4 grid gap-2 md:grid-cols-[1fr_1fr_auto]"
              successMessage="Candidatura actualizada."
            >
              <input type="hidden" name="id" value={a.id} />
              <input type="hidden" name="callId" value={a.call.id} />
              <select className="admin-input" name="status" defaultValue={a.status}>
                {APPLICATION_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <input
                className="admin-input"
                name="adminNotes"
                placeholder="Notas internas"
                defaultValue={a.adminNotes || ""}
              />
              <button className="btn-primary !py-2 text-sm">Actualizar</button>
            </FormWithFeedback>
          </article>
        ))}
      </div>
    </AdminShell>
  );
}
