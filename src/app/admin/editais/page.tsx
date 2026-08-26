import Link from "next/link";
import { AdminShell } from "@/components/AdminShell";
import { DocumentUploadField } from "@/components/DocumentUploadField";
import { FormWithFeedback } from "@/components/FormWithFeedback";
import {
  createFundingCall,
  createFundingEdition,
  deleteFundingCall,
  deleteFundingEdition,
} from "@/app/admin/actions";
import { prisma } from "@/lib/prisma";
import { CALL_STATUS_OPTIONS } from "@/lib/funding";
import { statusLabel } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminEditaisPage() {
  const [calls, editions] = await Promise.all([
    prisma.fundingCall.findMany({
      include: { edition: true, _count: { select: { applications: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.fundingEdition.findMany({ orderBy: { year: "desc" } }),
  ]);

  return (
    <AdminShell title="Editais e financiamentos">
      <p className="mb-5 max-w-2xl text-sm text-muted">
        Publique edições de financiamento e editais de concurso. Em cada edital pode anexar o
        ficheiro oficial (PDF ou imagem digitalizada) para download na página pública.
      </p>

      <FormWithFeedback
        action={createFundingEdition}
        className="card-surface mb-6 grid gap-3 p-5 md:grid-cols-2"
        successMessage="Edição criada com sucesso."
        resetOnSuccess
      >
        <h2 className="font-display text-xl font-semibold md:col-span-2">Nova edição de financiamento</h2>
        <input className="admin-input" name="name" placeholder="Nome (ex: MozInkub N+1 — 2026)" required />
        <input className="admin-input" name="year" type="number" placeholder="Ano" defaultValue={2026} required />
        <input className="admin-input" name="funder" placeholder="Financiador (ex: Embaixada de França)" />
        <input className="admin-input" name="summary" placeholder="Resumo curto" required />
        <label className="flex items-center gap-2 text-sm md:col-span-2">
          <input type="checkbox" name="published" defaultChecked /> Publicado
        </label>
        <button className="btn-primary md:col-span-2">Criar edição</button>
      </FormWithFeedback>

      {editions.length > 0 && (
        <div className="mb-8 space-y-2">
          {editions.map((e) => (
            <div key={e.id} className="card-surface flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-semibold">
                  {e.name} · {e.year}
                </p>
                <p className="text-sm text-muted">{e.funder || "—"}</p>
              </div>
              <FormWithFeedback action={deleteFundingEdition} successMessage="Edição removida.">
                <input type="hidden" name="id" value={e.id} />
                <button className="btn-ghost !py-2 text-sm">Remover</button>
              </FormWithFeedback>
            </div>
          ))}
        </div>
      )}

      <FormWithFeedback
        id="novo-edital"
        action={createFundingCall}
        className="card-surface mb-6 scroll-mt-24 grid gap-3 p-5 md:grid-cols-2"
        successMessage="Edital criado. A redireccionar…"
      >
        <h2 className="font-display text-xl font-semibold md:col-span-2">Novo edital / concurso</h2>
        <p className="text-sm text-muted md:col-span-2">
          Anexe o edital oficial (PDF ou scan JPG/PNG). Depois de criar, os candidatos submetem o
          projecto em PDF na página pública.
        </p>
        <input className="admin-input md:col-span-2" name="title" placeholder="Título do edital" required />
        <textarea className="admin-input md:col-span-2" name="summary" placeholder="Resumo" required />
        <textarea
          className="admin-input min-h-28 md:col-span-2"
          name="description"
          placeholder="Informação completa (objectivos, calendário, critérios…)"
        />
        <textarea className="admin-input" name="eligibility" placeholder="Elegibilidade" />
        <input className="admin-input" name="areas" placeholder="Áreas elegíveis" />
        <select className="admin-input" name="editionId" defaultValue="">
          <option value="">Sem edição associada</option>
          {editions.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
        <select className="admin-input" name="status" defaultValue="ABERTO">
          {CALL_STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <div>
          <label className="admin-label">Abertura</label>
          <input className="admin-input" type="date" name="opensAt" />
        </div>
        <div>
          <label className="admin-label">Prazo de submissão</label>
          <input className="admin-input" type="date" name="deadline" />
        </div>
        <div className="md:col-span-2">
          <DocumentUploadField
            name="documentUrl"
            label="Ficheiro oficial do concurso (PDF ou imagem)"
            hint="Ex.: Edital Nº 01/2024 em PDF ou digitalização JPG/PNG. Fica disponível na página pública."
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="acceptApplications" defaultChecked /> Aceitar candidaturas online
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="published" defaultChecked /> Publicado
        </label>
        <button className="btn-primary md:col-span-2">Criar e gerir candidaturas</button>
      </FormWithFeedback>

      <div className="space-y-3">
        {calls.map((c) => (
          <div key={c.id} className="card-surface flex items-start justify-between gap-4 p-4">
            <div>
              <p className="text-xs text-primary">
                {statusLabel(c.status)}
                {c.edition ? ` · ${c.edition.name}` : ""} · {c._count.applications} candidatura(s)
              </p>
              <p className="mt-1 font-semibold">{c.title}</p>
              <p className="mt-1 text-sm text-muted">{c.summary}</p>
              {c.documentUrl ? (
                <a
                  href={c.documentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-xs font-semibold text-primary"
                >
                  Ficheiro oficial anexado →
                </a>
              ) : (
                <p className="mt-2 text-xs text-amber-700">Sem ficheiro oficial — anexe em Gerir.</p>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              <Link href={`/admin/editais/${c.id}`} className="btn-primary !px-3 !py-2 text-sm">
                Gerir
              </Link>
              <FormWithFeedback action={deleteFundingCall} successMessage="Edital removido.">
                <input type="hidden" name="id" value={c.id} />
                <button className="btn-ghost !py-2 text-sm">Remover</button>
              </FormWithFeedback>
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
