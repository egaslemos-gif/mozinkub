import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { FormWithFeedback } from "@/components/FormWithFeedback";
import { ProjectForm } from "@/components/ProjectForm";
import { createProject, deleteProject } from "@/app/admin/actions";
import { auth } from "@/lib/auth";
import {
  can,
  getAccessibleProjectIds,
  sessionToAuthUser,
} from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { statusLabel } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminProjectosPage() {
  const session = await auth();
  const user = sessionToAuthUser(session);
  if (!user || !(await can(user, "projects.read"))) {
    redirect("/admin");
  }

  const accessible = await getAccessibleProjectIds(user, "projects.read");
  const [projects, editions] = await Promise.all([
    prisma.project.findMany({
      where: accessible === "ALL" ? undefined : { id: { in: accessible } },
      orderBy: [{ cohortYear: "desc" }, { order: "asc" }],
    }),
    prisma.fundingEdition.findMany({ orderBy: { year: "desc" } }),
  ]);

  const canCreate = await can(user, "projects.create");
  const canArchive = await can(user, "projects.archive");

  return (
    <AdminShell title="Projectos">
      <p className="mb-5 max-w-2xl text-sm text-muted">
        Lista filtrada pelo escopo do seu papel (INCUBATOR / ASSIGNED / OWN / TEAM).
      </p>
      {canCreate && (
        <ProjectForm
          action={createProject}
          submitLabel="Criar e abrir ficha"
          editions={editions.map((e) => ({ id: e.id, name: e.name, year: e.year }))}
        />
      )}

      <div className="mt-8 space-y-3">
        {projects.length === 0 && (
          <p className="text-sm text-muted">Nenhum projecto no seu escopo.</p>
        )}
        {projects.map((p) => (
          <div key={p.id} className="card-surface flex items-center gap-4 p-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary-soft">
              {p.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.logoUrl} alt="" className="h-12 w-12 object-contain" />
              ) : (
                <span className="text-xs font-bold text-primary">{p.name.slice(0, 2)}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{p.name}</p>
              <p className="text-sm text-muted">
                {p.cohortYear || "—"} · {p.area} · {statusLabel(p.status)} ·{" "}
                {statusLabel(p.lifecycle)}
                {p.featured ? " · Destaque" : ""}
              </p>
            </div>
            <Link href={`/admin/projectos/${p.id}`} className="btn-primary !px-4 !py-2 text-sm">
              Abrir
            </Link>
            {canArchive && (
              <FormWithFeedback action={deleteProject} successMessage="Projecto removido.">
                <input type="hidden" name="id" value={p.id} />
                <button className="btn-ghost !py-2 text-sm">Remover</button>
              </FormWithFeedback>
            )}
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
