import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { DocumentUploadField } from "@/components/DocumentUploadField";
import { updateCallApplication, updateFundingCall } from "@/app/admin/actions";
import { prisma } from "@/lib/prisma";
import { APPLICATION_STATUS_OPTIONS, CALL_STATUS_OPTIONS } from "@/lib/funding";
import { statusLabel } from "@/lib/data";

export const dynamic = "force-dynamic";

function toDateInput(value: Date | null | undefined) {
  if (!value) return "";
  return value.toISOString().slice(0, 10);
}

export default async function AdminEditalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [call, editions] = await Promise.all([
    prisma.fundingCall.findUnique({
      where: { id },
      include: {
        edition: true,
        applications: { orderBy: { createdAt: "desc" } },
      },
    }),
    prisma.fundingEdition.findMany({ orderBy: { year: "desc" } }),
  ]);
  if (!call) notFound();

  return (
    <AdminShell title={call.title}>
      <Link href="/admin/editais" className="mb-5 inline-block text-sm font-semibold text-primary">
        ← Todos os editais
      </Link>
      <p className="mb-4 text-xs text-ul-blue">Página pública: /editais/{call.slug}</p>

      <form action={updateFundingCall} className="card-surface mb-8 grid gap-3 p-5 md:grid-cols-2">
        <input type="hidden" name="id" value={call.id} />
        <h2 className="font-display text-xl font-semibold md:col-span-2">Dados do edital</h2>
        <input className="admin-input md:col-span-2" name="title" defaultValue={call.title} required />
        <textarea className="admin-input md:col-span-2" name="summary" defaultValue={call.summary} required />
        <textarea
          className="admin-input min-h-28 md:col-span-2"
          name="description"
          defaultValue={call.description}
        />
        <textarea className="admin-input" name="eligibility" defaultValue={call.eligibility || ""} />
        <input className="admin-input" name="areas" defaultValue={call.areas || ""} />
        <select className="admin-input" name="editionId" defaultValue={call.editionId || ""}>
          <option value="">Sem edição associada</option>
          {editions.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
        <select className="admin-input" name="status" defaultValue={call.status}>
          {CALL_STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <div>
          <label className="admin-label">Abertura</label>
          <input className="admin-input" type="date" name="opensAt" defaultValue={toDateInput(call.opensAt)} />
        </div>
        <div>
          <label className="admin-label">Prazo</label>
          <input
            className="admin-input"
            type="date"
            name="deadline"
            defaultValue={toDateInput(call.deadline)}
          />
        </div>
        <div className="md:col-span-2">
          <DocumentUploadField
            name="documentUrl"
            label="PDF do edital"
            defaultUrl={call.documentUrl}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="acceptApplications" defaultChecked={call.acceptApplications} />{" "}
          Aceitar candidaturas
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="published" defaultChecked={call.published} /> Publicado
        </label>
        <button className="btn-primary md:col-span-2">Guardar edital</button>
      </form>

      <h2 className="font-display text-2xl font-semibold">
        Candidaturas ({call.applications.length})
      </h2>
      <div className="mt-4 space-y-4">
        {call.applications.length === 0 && (
          <p className="text-sm text-muted">Ainda sem candidaturas submetidas.</p>
        )}
        {call.applications.map((a) => (
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
            <form action={updateCallApplication} className="mt-4 grid gap-2 md:grid-cols-[1fr_1fr_auto]">
              <input type="hidden" name="id" value={a.id} />
              <input type="hidden" name="callId" value={call.id} />
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
            </form>
          </article>
        ))}
      </div>
    </AdminShell>
  );
}
