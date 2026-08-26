import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { FormWithFeedback } from "@/components/FormWithFeedback";
import { ProjectForm } from "@/components/ProjectForm";
import { ProjectGalleryForm } from "@/components/ProjectGalleryForm";
import {
  addProjectMember,
  assignProjectCoach,
  createCoachPrivateNote,
  createProjectMilestone,
  deleteProjectMedia,
  deleteProjectMilestone,
  updateProject,
} from "@/app/admin/actions";
import { auth } from "@/lib/auth";
import { can, sessionToAuthUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { milestoneKindLabel } from "@/lib/projects";

export const dynamic = "force-dynamic";

export default async function AdminProjectoEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const user = sessionToAuthUser(session);
  if (!user) redirect("/admin/login");

  const allowed = await can(user, "projects.read", { projectId: id });
  if (!allowed) redirect("/admin/projectos");

  const [project, editions, coaches, members, allUsers, privateNotes] =
    await Promise.all([
      prisma.project.findUnique({
        where: { id },
        include: {
          milestones: { orderBy: { date: "asc" } },
          gallery: { orderBy: { createdAt: "asc" } },
          coaches: {
            where: { status: "ACTIVE" },
            include: { coach: { select: { id: true, name: true, email: true } } },
          },
          members: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
      }),
      prisma.fundingEdition.findMany({ orderBy: { year: "desc" } }),
      prisma.user.findMany({
        where: { role: "COACH", status: "ACTIVE" },
        orderBy: { name: "asc" },
      }),
      prisma.user.findMany({
        where: {
          role: { in: ["PROJECT_MANAGER", "TEAM_MEMBER"] },
          status: "ACTIVE",
        },
        orderBy: { name: "asc" },
      }),
      prisma.user.findMany({
        where: { status: "ACTIVE" },
        orderBy: { name: "asc" },
        take: 50,
      }),
      can(user, "coaching.private_notes", {
        projectId: id,
        confidentiality: "RESTRICTED",
      }).then((ok) =>
        ok
          ? prisma.coachPrivateNote.findMany({
              where: { projectId: id },
              orderBy: { createdAt: "desc" },
              include: { author: { select: { name: true } } },
            })
          : Promise.resolve([]),
      ),
    ]);
  if (!project) notFound();

  const canUpdate = await can(user, "projects.update", { projectId: id });
  const canAssignCoach = await can(user, "projects.assign_coach");
  const canPrivateNotes = await can(user, "coaching.private_notes", {
    projectId: id,
    confidentiality: "RESTRICTED",
  });
  const canManageTeam = await can(user, "users.update");

  return (
    <AdminShell title={project.name}>
      <Link href="/admin/projectos" className="mb-5 inline-block text-sm font-semibold text-primary">
        ← Todos os projectos
      </Link>
      <p className="mb-4 text-xs text-ul-blue">Página pública: /projectos/{project.slug}</p>

      {canUpdate && (
        <ProjectForm
          action={updateProject}
          submitLabel="Guardar ficha"
          editions={editions.map((e) => ({ id: e.id, name: e.name, year: e.year }))}
          project={{
            id: project.id,
            name: project.name,
            area: project.area,
            tagline: project.tagline,
            summary: project.summary,
            description: project.description,
            offer: project.offer,
            audience: project.audience,
            lookingFor: project.lookingFor,
            city: project.city,
            leader: project.leader,
            team: project.team,
            contact: project.contact,
            email: project.email,
            whatsapp: project.whatsapp,
            website: project.website,
            facebook: project.facebook,
            instagram: project.instagram,
            linkedin: project.linkedin,
            status: project.status,
            maturity: project.maturity,
            lifecycle: project.lifecycle,
            cohortYear: project.cohortYear,
            fundingEditionId: project.fundingEditionId,
            featured: project.featured,
            published: project.published,
            logoUrl: project.logoUrl,
            coverUrl: project.coverUrl,
            order: project.order,
          }}
        />
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card-surface space-y-3 p-5">
          <h2 className="font-display text-xl font-semibold">Coaches atribuídos</h2>
          {project.coaches.length === 0 && (
            <p className="text-sm text-muted">Ainda sem coach atribuído.</p>
          )}
          {project.coaches.map((c) => (
            <p key={c.id} className="text-sm">
              {c.coach.name} · {c.coach.email}
            </p>
          ))}
          {canAssignCoach && (
            <FormWithFeedback
              action={assignProjectCoach}
              className="grid gap-2 border-t border-border pt-3"
              successMessage="Coach atribuído com sucesso."
            >
              <input type="hidden" name="projectId" value={project.id} />
              <select className="admin-input" name="coachId" required>
                <option value="">Seleccionar coach…</option>
                {coaches.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button type="submit" className="btn-primary !py-2 text-sm">
                Atribuir coach
              </button>
            </FormWithFeedback>
          )}
        </div>

        <div className="card-surface space-y-3 p-5">
          <h2 className="font-display text-xl font-semibold">Equipa do projecto</h2>
          {project.members.length === 0 && (
            <p className="text-sm text-muted">Sem memberships registados.</p>
          )}
          {project.members.map((m) => (
            <p key={m.id} className="text-sm">
              {m.user.name} · {m.roleInProject}
            </p>
          ))}
          {canManageTeam && (
            <FormWithFeedback
              action={addProjectMember}
              className="grid gap-2 border-t border-border pt-3"
              successMessage="Membro adicionado à equipa."
            >
              <input type="hidden" name="projectId" value={project.id} />
              <select className="admin-input" name="userId" required>
                <option value="">Seleccionar utilizador…</option>
                {[...members, ...allUsers.filter((u) => !members.some((m) => m.id === u.id))]
                  .filter((u, i, arr) => arr.findIndex((x) => x.id === u.id) === i)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
              </select>
              <select className="admin-input" name="roleInProject" defaultValue="TEAM_MEMBER">
                <option value="PROJECT_MANAGER">PROJECT_MANAGER</option>
                <option value="TEAM_MEMBER">TEAM_MEMBER</option>
              </select>
              <button type="submit" className="btn-primary !py-2 text-sm">
                Adicionar à equipa
              </button>
            </FormWithFeedback>
          )}
        </div>
      </div>

      {canPrivateNotes && (
        <div className="card-surface mt-6 p-5">
          <h2 className="font-display text-xl font-semibold">Notas privadas de coaching</h2>
          <p className="mt-1 text-xs text-muted">
            Visíveis apenas a coaches (escopo) e coordenação — não ao gestor/equipa do projecto.
          </p>
          <FormWithFeedback
            action={createCoachPrivateNote}
            className="mt-3 grid gap-2"
            successMessage="Nota privada guardada."
            resetOnSuccess
          >
            <input type="hidden" name="projectId" value={project.id} />
            <textarea className="admin-input" name="content" placeholder="Nota privada…" required />
            <button type="submit" className="btn-primary !py-2 text-sm">
              Guardar nota privada
            </button>
          </FormWithFeedback>
          <div className="mt-3 space-y-2">
            {privateNotes.map((n) => (
              <div key={n.id} className="rounded-lg bg-primary-soft/40 p-3 text-sm">
                <p className="text-xs text-muted">
                  {n.author.name} · {new Date(n.createdAt).toLocaleString("pt-MZ")}
                </p>
                <p className="mt-1 whitespace-pre-line">{n.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div>
          {canUpdate && (
            <FormWithFeedback
              action={createProjectMilestone}
              className="card-surface grid gap-3 p-5"
              successMessage="Marco adicionado com sucesso."
              resetOnSuccess
            >
              <h2 className="font-display text-xl font-semibold">Linha do tempo</h2>
              <input type="hidden" name="projectId" value={project.id} />
              <input
                className="admin-input"
                name="title"
                placeholder="Marco (ex: Primeiro protótipo)"
                required
              />
              <textarea
                className="admin-input"
                name="description"
                placeholder="O que aconteceu e por que importa"
                required
              />
              <input className="admin-input" type="datetime-local" name="date" required />
              <select className="admin-input" name="kind" defaultValue="MARCO">
                <option value="MARCO">Marco</option>
                <option value="COACHING">Coaching</option>
                <option value="LEGAL">Legalização</option>
                <option value="PRODUTO">Produto</option>
                <option value="PARCERIA">Parceria</option>
              </select>
              <button type="submit" className="btn-primary">
                Adicionar marco
              </button>
            </FormWithFeedback>
          )}
          <div className="mt-3 space-y-2">
            {project.milestones.map((m) => (
              <div key={m.id} className="card-surface flex items-start justify-between gap-3 p-4">
                <div>
                  <p className="text-xs text-primary">
                    {new Date(m.date).toLocaleDateString("pt-MZ")} · {milestoneKindLabel(m.kind)}
                  </p>
                  <p className="mt-1 font-semibold">{m.title}</p>
                  <p className="mt-1 text-sm text-muted">{m.description}</p>
                </div>
                {canUpdate && (
                  <FormWithFeedback action={deleteProjectMilestone} successMessage="Marco removido.">
                    <input type="hidden" name="id" value={m.id} />
                    <button className="btn-ghost !py-2 text-sm">Remover</button>
                  </FormWithFeedback>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          {canUpdate && <ProjectGalleryForm projectId={project.id} />}
          <div className="mt-3 grid grid-cols-2 gap-3">
            {project.gallery.map((g) => (
              <div key={g.id} className="card-surface overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.url} alt={g.title || ""} className="h-28 w-full object-cover" />
                <div className="flex items-center justify-between gap-2 p-3">
                  <p className="truncate text-xs text-muted">{g.title || "Fotografia"}</p>
                  {canUpdate && (
                    <FormWithFeedback action={deleteProjectMedia} successMessage="Fotografia removida.">
                      <input type="hidden" name="id" value={g.id} />
                      <button className="text-xs font-semibold text-red-700">Remover</button>
                    </FormWithFeedback>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
