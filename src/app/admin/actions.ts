"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  requirePermission,
  sessionToAuthUser,
  writeAuditLog,
  type PermissionCode,
  type ResourceContext,
} from "@/lib/rbac";

async function requireAdmin(
  permission: PermissionCode = "settings.read",
  ctx?: ResourceContext,
) {
  const session = await auth();
  const user = sessionToAuthUser(session);
  return requirePermission(user, permission, ctx);
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function updateSiteConfig(formData: FormData) {
  await requireAdmin("settings.update");
  const values = String(formData.get("values") || "")
    .split("\n")
    .map((v) => v.trim())
    .filter(Boolean);

  await prisma.siteConfig.update({
    where: { id: "main" },
    data: {
      brandName: String(formData.get("brandName") || ""),
      slogan: String(formData.get("slogan") || ""),
      mission: String(formData.get("mission") || ""),
      vision: String(formData.get("vision") || ""),
      valuesJson: JSON.stringify(values),
      address: String(formData.get("address") || ""),
      phone: String(formData.get("phone") || ""),
      whatsapp: String(formData.get("whatsapp") || ""),
      email: String(formData.get("email") || ""),
      campus: String(formData.get("campus") || ""),
      aboutText: String(formData.get("aboutText") || ""),
      heroTitle: String(formData.get("heroTitle") || ""),
      heroSubtitle: String(formData.get("heroSubtitle") || ""),
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/identidade");
}

function optionalField(formData: FormData, key: string) {
  const v = String(formData.get(key) || "").trim();
  return v || null;
}

function projectPayload(formData: FormData) {
  const yearRaw = String(formData.get("cohortYear") || "").trim();
  const editionId = optionalField(formData, "fundingEditionId");
  return {
    name: String(formData.get("name") || "").trim(),
    area: String(formData.get("area") || "").trim(),
    tagline: optionalField(formData, "tagline"),
    summary: String(formData.get("summary") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    offer: optionalField(formData, "offer"),
    audience: optionalField(formData, "audience"),
    lookingFor: optionalField(formData, "lookingFor"),
    city: optionalField(formData, "city") || "Beira",
    leader: String(formData.get("leader") || "").trim(),
    team: optionalField(formData, "team"),
    contact: optionalField(formData, "contact"),
    email: optionalField(formData, "email"),
    whatsapp: optionalField(formData, "whatsapp"),
    website: optionalField(formData, "website"),
    facebook: optionalField(formData, "facebook"),
    instagram: optionalField(formData, "instagram"),
    linkedin: optionalField(formData, "linkedin"),
    status: String(formData.get("status") || "EM_INCUBACAO"),
    maturity: String(formData.get("maturity") || "PROTOTIPO"),
    lifecycle: String(formData.get("lifecycle") || "ATIVO"),
    cohortYear: yearRaw ? Number(yearRaw) : null,
    fundingEditionId: editionId,
    featured: formData.get("featured") === "on",
    published: formData.get("published") === "on",
    logoUrl: optionalField(formData, "logoUrl"),
    coverUrl: optionalField(formData, "coverUrl"),
    order: Number(formData.get("order") || 0),
  };
}

function revalidateProject(slug?: string) {
  revalidatePath("/projectos");
  revalidatePath("/");
  revalidatePath("/admin/projectos");
  if (slug) revalidatePath(`/projectos/${slug}`);
}

export async function createProject(formData: FormData) {
  await requireAdmin("projects.create");
  const data = projectPayload(formData);
  const created = await prisma.project.create({
    data: {
      ...data,
      slug: slugify(data.name) || `projecto-${Date.now()}`,
    },
  });
  revalidateProject(created.slug);
  redirect(`/admin/projectos/${created.id}`);
}

export async function updateProject(formData: FormData) {
  const id = String(formData.get("id") || "");
  await requireAdmin("projects.update", { projectId: id });
  const data = projectPayload(formData);
  const updated = await prisma.project.update({
    where: { id },
    data,
  });
  revalidateProject(updated.slug);
  revalidatePath(`/admin/projectos/${id}`);
}

export async function deleteProject(formData: FormData) {
  const id = String(formData.get("id") || "");
  await requireAdmin("projects.archive", { projectId: id });
  const existing = await prisma.project.findUnique({ where: { id } });
  await prisma.project.delete({ where: { id } });
  revalidateProject(existing?.slug);
}

export async function createProjectMilestone(formData: FormData) {
  const projectId = String(formData.get("projectId") || "");
  await requireAdmin("projects.update", { projectId });
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  await prisma.projectMilestone.create({
    data: {
      projectId,
      title: String(formData.get("title") || "").trim(),
      description: String(formData.get("description") || "").trim(),
      date: new Date(String(formData.get("date") || new Date().toISOString())),
      kind: String(formData.get("kind") || "MARCO"),
    },
  });
  revalidateProject(project?.slug);
  revalidatePath(`/admin/projectos/${projectId}`);
}

export async function deleteProjectMilestone(formData: FormData) {
  const id = String(formData.get("id") || "");
  const item = await prisma.projectMilestone.findUnique({ where: { id } });
  await requireAdmin("projects.update", { projectId: item?.projectId });
  await prisma.projectMilestone.delete({ where: { id } });
  if (item) {
    const project = await prisma.project.findUnique({ where: { id: item.projectId } });
    revalidateProject(project?.slug);
    revalidatePath(`/admin/projectos/${item.projectId}`);
  }
}

export async function createProjectMedia(formData: FormData) {
  const projectId = String(formData.get("projectId") || "");
  await requireAdmin("documents.upload", { projectId });
  const url = String(formData.get("url") || "").trim();
  if (!url) throw new Error("Imagem obrigatória");
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  await prisma.projectMedia.create({
    data: {
      projectId,
      url,
      title: optionalField(formData, "title"),
      type: "IMAGE",
    },
  });
  revalidateProject(project?.slug);
  revalidatePath(`/admin/projectos/${projectId}`);
}

export async function deleteProjectMedia(formData: FormData) {
  const id = String(formData.get("id") || "");
  const item = await prisma.projectMedia.findUnique({ where: { id } });
  await requireAdmin("documents.delete", { projectId: item?.projectId });
  await prisma.projectMedia.delete({ where: { id } });
  if (item) {
    const project = await prisma.project.findUnique({ where: { id: item.projectId } });
    revalidateProject(project?.slug);
    revalidatePath(`/admin/projectos/${item.projectId}`);
  }
}

export async function createEvent(formData: FormData) {
  await requireAdmin("events.create");
  const title = String(formData.get("title") || "");
  const endsRaw = String(formData.get("endsAt") || "").trim();
  await prisma.event.create({
    data: {
      title,
      slug: slugify(title) || `evento-${Date.now()}`,
      summary: String(formData.get("summary") || ""),
      details: String(formData.get("details") || ""),
      category: String(formData.get("category") || "EVENTO"),
      location: optionalField(formData, "location"),
      startsAt: new Date(String(formData.get("startsAt") || new Date().toISOString())),
      endsAt: endsRaw ? new Date(endsRaw) : null,
      coverUrl: optionalField(formData, "coverUrl"),
      published: formData.get("published") === "on",
    },
  });
  revalidatePath("/eventos");
  revalidatePath("/calendario");
  revalidatePath("/");
  revalidatePath("/admin/eventos");
}

export async function updateEvent(formData: FormData) {
  await requireAdmin("events.update");
  const id = String(formData.get("id") || "");
  const endsRaw = String(formData.get("endsAt") || "").trim();
  const updated = await prisma.event.update({
    where: { id },
    data: {
      title: String(formData.get("title") || ""),
      summary: String(formData.get("summary") || ""),
      details: String(formData.get("details") || ""),
      category: String(formData.get("category") || "EVENTO"),
      location: optionalField(formData, "location"),
      startsAt: new Date(String(formData.get("startsAt") || new Date().toISOString())),
      endsAt: endsRaw ? new Date(endsRaw) : null,
      coverUrl: optionalField(formData, "coverUrl"),
      published: formData.get("published") === "on",
    },
  });
  revalidatePath("/eventos");
  revalidatePath(`/eventos/${updated.slug}`);
  revalidatePath("/calendario");
  revalidatePath("/");
  revalidatePath("/admin/eventos");
}

export async function deleteEvent(formData: FormData) {
  await requireAdmin("events.delete");
  const id = String(formData.get("id") || "");
  const existing = await prisma.event.findUnique({ where: { id } });
  await prisma.event.delete({ where: { id } });
  revalidatePath("/eventos");
  if (existing) revalidatePath(`/eventos/${existing.slug}`);
  revalidatePath("/calendario");
  revalidatePath("/");
  revalidatePath("/admin/eventos");
}

export async function createFundingEdition(formData: FormData) {
  await requireAdmin("applications.create");
  const name = String(formData.get("name") || "").trim();
  await prisma.fundingEdition.create({
    data: {
      name,
      slug: slugify(name) || `edicao-${Date.now()}`,
      year: Number(formData.get("year") || new Date().getFullYear()),
      funder: optionalField(formData, "funder"),
      summary: String(formData.get("summary") || "").trim(),
      published: formData.get("published") === "on",
    },
  });
  revalidatePath("/editais");
  revalidatePath("/projectos");
  revalidatePath("/admin/editais");
}

export async function deleteFundingEdition(formData: FormData) {
  await requireAdmin("applications.update");
  await prisma.fundingEdition.delete({ where: { id: String(formData.get("id") || "") } });
  revalidatePath("/editais");
  revalidatePath("/projectos");
  revalidatePath("/admin/editais");
}

export async function createFundingCall(formData: FormData) {
  await requireAdmin("applications.create");
  const title = String(formData.get("title") || "");
  const deadlineRaw = String(formData.get("deadline") || "");
  const opensRaw = String(formData.get("opensAt") || "");
  const created = await prisma.fundingCall.create({
    data: {
      title,
      slug: slugify(title) || `edital-${Date.now()}`,
      summary: String(formData.get("summary") || ""),
      description: String(formData.get("description") || ""),
      eligibility: optionalField(formData, "eligibility"),
      areas: optionalField(formData, "areas"),
      editionId: optionalField(formData, "editionId"),
      status: String(formData.get("status") || "ABERTO"),
      deadline: deadlineRaw ? new Date(deadlineRaw) : null,
      opensAt: opensRaw ? new Date(opensRaw) : null,
      documentUrl: optionalField(formData, "documentUrl"),
      acceptApplications: formData.get("acceptApplications") === "on",
      published: formData.get("published") === "on",
    },
  });
  revalidatePath("/editais");
  revalidatePath("/");
  revalidatePath("/admin/editais");
  revalidatePath("/admin/candidaturas");
  redirect(`/admin/editais/${created.id}`);
}

export async function updateFundingCall(formData: FormData) {
  await requireAdmin("applications.update");
  const id = String(formData.get("id") || "");
  const deadlineRaw = String(formData.get("deadline") || "");
  const opensRaw = String(formData.get("opensAt") || "");
  const updated = await prisma.fundingCall.update({
    where: { id },
    data: {
      title: String(formData.get("title") || ""),
      summary: String(formData.get("summary") || ""),
      description: String(formData.get("description") || ""),
      eligibility: optionalField(formData, "eligibility"),
      areas: optionalField(formData, "areas"),
      editionId: optionalField(formData, "editionId"),
      status: String(formData.get("status") || "ABERTO"),
      deadline: deadlineRaw ? new Date(deadlineRaw) : null,
      opensAt: opensRaw ? new Date(opensRaw) : null,
      documentUrl: optionalField(formData, "documentUrl"),
      acceptApplications: formData.get("acceptApplications") === "on",
      published: formData.get("published") === "on",
    },
  });
  revalidatePath("/editais");
  revalidatePath(`/editais/${updated.slug}`);
  revalidatePath("/");
  revalidatePath("/admin/editais");
  revalidatePath(`/admin/editais/${id}`);
}

export async function deleteFundingCall(formData: FormData) {
  await requireAdmin("applications.update");
  const id = String(formData.get("id") || "");
  const existing = await prisma.fundingCall.findUnique({ where: { id } });
  await prisma.fundingCall.delete({ where: { id } });
  revalidatePath("/editais");
  if (existing) revalidatePath(`/editais/${existing.slug}`);
  revalidatePath("/");
  revalidatePath("/admin/editais");
}

export async function updateCallApplication(formData: FormData) {
  const status = String(formData.get("status") || "RECEBIDA");
  const decisionPerm =
    status === "APROVADA"
      ? "applications.approve"
      : status === "REJEITADA"
        ? "applications.reject"
        : "applications.review";
  const actor = await requireAdmin(decisionPerm);
  const id = String(formData.get("id") || "");
  const callId = String(formData.get("callId") || "");
  await prisma.callApplication.update({
    where: { id },
    data: {
      status,
      adminNotes: optionalField(formData, "adminNotes"),
    },
  });
  await writeAuditLog({
    userId: actor.id,
    action: `applications.${status.toLowerCase()}`,
    resourceType: "CallApplication",
    resourceId: id,
    metadata: { status, callId },
  });
  revalidatePath(`/admin/editais/${callId}`);
  revalidatePath("/admin/editais");
  revalidatePath("/admin/candidaturas");
}

export async function createTimelineItem(formData: FormData) {
  await requireAdmin("resources.manage");
  const title = String(formData.get("title") || "");
  const mediaUrl = String(formData.get("mediaUrl") || "").trim();
  await prisma.timelineItem.create({
    data: {
      title,
      slug: slugify(title) || `actividade-${Date.now()}`,
      description: String(formData.get("description") || ""),
      details: String(formData.get("details") || ""),
      date: new Date(String(formData.get("date") || new Date().toISOString())),
      category: String(formData.get("category") || "ACTIVIDADE"),
      mediaUrl: mediaUrl || null,
      mediaType: mediaUrl ? "IMAGE" : null,
      published: formData.get("published") === "on",
    },
  });
  revalidatePath("/actividades");
  revalidatePath("/calendario");
  revalidatePath("/");
  revalidatePath("/admin/actividades");
}

export async function deleteTimelineItem(formData: FormData) {
  await requireAdmin("resources.manage");
  await prisma.timelineItem.delete({ where: { id: String(formData.get("id") || "") } });
  revalidatePath("/actividades");
  revalidatePath("/calendario");
  revalidatePath("/");
  revalidatePath("/admin/actividades");
}

export async function createGalleryAlbum(formData: FormData) {
  await requireAdmin("resources.manage");
  const title = String(formData.get("title") || "").trim();
  await prisma.galleryAlbum.create({
    data: {
      title,
      slug: slugify(title) || `album-${Date.now()}`,
      description: optionalField(formData, "description"),
      published: formData.get("published") === "on",
    },
  });
  revalidatePath("/galeria");
  revalidatePath("/admin/galeria");
}

export async function deleteGalleryAlbum(formData: FormData) {
  await requireAdmin("resources.manage");
  await prisma.galleryAlbum.delete({ where: { id: String(formData.get("id") || "") } });
  revalidatePath("/galeria");
  revalidatePath("/admin/galeria");
}

export async function createGalleryMedia(formData: FormData) {
  await requireAdmin("documents.upload");
  const albumId = String(formData.get("albumId") || "");
  const url = String(formData.get("url") || "").trim();
  if (!url) throw new Error("Imagem obrigatória");
  await prisma.galleryMedia.create({
    data: {
      albumId,
      url,
      title: optionalField(formData, "title"),
      type: "IMAGE",
    },
  });
  revalidatePath("/galeria");
  revalidatePath("/admin/galeria");
}

export async function deleteGalleryMedia(formData: FormData) {
  await requireAdmin("documents.delete");
  await prisma.galleryMedia.delete({ where: { id: String(formData.get("id") || "") } });
  revalidatePath("/galeria");
  revalidatePath("/admin/galeria");
}

export async function markContactMessageRead(formData: FormData) {
  await requireAdmin("users.read");
  const id = String(formData.get("id") || "");
  const raw = String(formData.get("read") || "");
  const read = raw === "true" || raw === "on";
  await prisma.contactMessage.update({
    where: { id },
    data: { read },
  });
  revalidatePath("/admin/mensagens");
}

export async function createHeroSlide(formData: FormData) {
  await requireAdmin("settings.update");
  const imageUrl = String(formData.get("imageUrl") || "").trim();
  if (!imageUrl) throw new Error("Imagem obrigatória");
  await prisma.heroSlide.create({
    data: {
      title: String(formData.get("title") || ""),
      subtitle: String(formData.get("subtitle") || "") || null,
      imageUrl,
      linkUrl: String(formData.get("linkUrl") || "") || null,
      order: Number(formData.get("order") || 0),
      published: formData.get("published") === "on",
    },
  });
  revalidatePath("/");
  revalidatePath("/admin/destaques");
}

export async function deleteHeroSlide(formData: FormData) {
  await requireAdmin("settings.update");
  await prisma.heroSlide.delete({ where: { id: String(formData.get("id") || "") } });
  revalidatePath("/");
  revalidatePath("/admin/destaques");
}

export async function uploadMedia(formData: FormData) {
  try {
    await requireAdmin("documents.upload");
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return { ok: false as const, error: "Ficheiro inválido" };
    }
    const { storeUploadedFile } = await import("@/lib/upload");
    return storeUploadedFile(file);
  } catch (err) {
    console.error("[uploadMedia]", err);
    const message =
      err instanceof Error ? err.message : "Falha no upload. Tente novamente.";
    return { ok: false as const, error: message };
  }
}

export async function createUserAccount(formData: FormData) {
  const actor = await requireAdmin("users.create");
  const bcrypt = await import("bcryptjs");
  const { ROLE_CODES, normalizeRole } = await import("@/lib/rbac/roles");
  const email = String(formData.get("email") || "")
    .toLowerCase()
    .trim();
  const name = String(formData.get("name") || "").trim();
  const password = String(formData.get("password") || "");
  const role = normalizeRole(String(formData.get("role") || "SECRETARIAT"));
  if (!email || !name || password.length < 6) {
    throw new Error("Dados inválidos (password mín. 6 caracteres)");
  }
  if (!(ROLE_CODES as readonly string[]).includes(role)) {
    throw new Error("Papel inválido");
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role, status: "ACTIVE" },
  });
  const roleRow = await prisma.role.findUnique({ where: { code: role } });
  if (roleRow) {
    await prisma.userRole.create({
      data: { userId: user.id, roleId: roleRow.id },
    });
  }
  await writeAuditLog({
    userId: actor.id,
    action: "users.create",
    resourceType: "User",
    resourceId: user.id,
    metadata: { email, role },
  });
  revalidatePath("/admin/utilizadores");
}

export async function updateUserAccount(formData: FormData) {
  const actor = await requireAdmin("users.update");
  const { normalizeRole, ROLE_CODES } = await import("@/lib/rbac/roles");
  const { can } = await import("@/lib/rbac");
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const role = normalizeRole(String(formData.get("role") || ""));
  const status = String(formData.get("status") || "ACTIVE");
  if (!(ROLE_CODES as readonly string[]).includes(role)) {
    throw new Error("Papel inválido");
  }
  if (!["ACTIVE", "PENDING", "SUSPENDED", "DISABLED"].includes(status)) {
    throw new Error("Estado inválido");
  }
  if (status !== "ACTIVE" && !(await can(actor, "users.disable"))) {
    throw new Error("Sem permissão para desactivar contas");
  }
  const existing = await prisma.user.findUnique({ where: { id } });
  if (existing && existing.role !== role && !(await can(actor, "users.assign_role"))) {
    throw new Error("Sem permissão para alterar papéis");
  }
  await prisma.user.update({
    where: { id },
    data: { name, role, status },
  });
  const roleRow = await prisma.role.findUnique({ where: { code: role } });
  if (roleRow) {
    await prisma.userRole.deleteMany({ where: { userId: id } });
    await prisma.userRole.create({
      data: { userId: id, roleId: roleRow.id },
    });
  }
  await writeAuditLog({
    userId: actor.id,
    action: "users.update",
    resourceType: "User",
    resourceId: id,
    metadata: { role, status },
  });
  revalidatePath("/admin/utilizadores");
}

export async function assignProjectCoach(formData: FormData) {
  const actor = await requireAdmin("projects.assign_coach");
  const projectId = String(formData.get("projectId") || "");
  const coachId = String(formData.get("coachId") || "");
  await prisma.projectCoach.upsert({
    where: { projectId_coachId: { projectId, coachId } },
    update: { status: "ACTIVE", assignedBy: actor.id, assignedAt: new Date() },
    create: {
      projectId,
      coachId,
      assignedBy: actor.id,
      status: "ACTIVE",
    },
  });
  await writeAuditLog({
    userId: actor.id,
    action: "projects.assign_coach",
    resourceType: "Project",
    resourceId: projectId,
    metadata: { coachId },
  });
  revalidatePath(`/admin/projectos/${projectId}`);
  revalidatePath("/admin/projectos");
}

export async function addProjectMember(formData: FormData) {
  const actor = await requireAdmin("users.update");
  const projectId = String(formData.get("projectId") || "");
  const userId = String(formData.get("userId") || "");
  const roleInProject = String(formData.get("roleInProject") || "TEAM_MEMBER");
  // Project managers may manage their own team (OWN/TEAM scope already checked via users.update)
  const allowed = ["PROJECT_MANAGER", "TEAM_MEMBER"].includes(roleInProject);
  if (!allowed) throw new Error("Função de equipa inválida");
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId, userId } },
    update: { roleInProject },
    create: { projectId, userId, roleInProject },
  });
  await writeAuditLog({
    userId: actor.id,
    action: "projects.add_member",
    resourceType: "Project",
    resourceId: projectId,
    metadata: { userId, roleInProject },
  });
  revalidatePath(`/admin/projectos/${projectId}`);
}

export async function createCoachPrivateNote(formData: FormData) {
  const actor = await requireAdmin("coaching.private_notes", {
    projectId: String(formData.get("projectId") || ""),
    confidentiality: "RESTRICTED",
  });
  const projectId = String(formData.get("projectId") || "");
  const content = String(formData.get("content") || "").trim();
  if (!content) throw new Error("Nota vazia");
  await prisma.coachPrivateNote.create({
    data: { projectId, authorId: actor.id, content },
  });
  await writeAuditLog({
    userId: actor.id,
    action: "coaching.private_notes.create",
    resourceType: "Project",
    resourceId: projectId,
  });
  revalidatePath(`/admin/projectos/${projectId}`);
}

