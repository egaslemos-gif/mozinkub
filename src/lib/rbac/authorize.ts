import { prisma } from "@/lib/prisma";
import type { PermissionCode } from "./permissions";
import { ROLE_PERMISSION_MATRIX } from "./matrix";
import { isStaffRole, normalizeRole, type RoleCode } from "./roles";
import type { ResourceContext, Scope } from "./scopes";

export type AuthUser = {
  id: string;
  role: string;
  status?: string;
  email?: string;
};

export type PermissionGrant = {
  permission: PermissionCode;
  scope: Scope;
};

export class AuthorizationError extends Error {
  constructor(message = "Sem permissão") {
    super(message);
    this.name = "AuthorizationError";
  }
}

/** Carrega grants do utilizador (matriz em código + UserRoles na BD). */
export async function getUserGrants(user: AuthUser): Promise<PermissionGrant[]> {
  const primary = normalizeRole(user.role);
  const grants = [...ROLE_PERMISSION_MATRIX[primary]];

  const extraRoles = await prisma.userRole.findMany({
    where: { userId: user.id },
    include: { role: true },
  });

  for (const ur of extraRoles) {
    const code = normalizeRole(ur.role.code);
    if (code === primary) continue;
    grants.push(...ROLE_PERMISSION_MATRIX[code]);
  }

  // Deduplicate by permission keeping broadest scope preference
  const byPerm = new Map<PermissionCode, Scope>();
  const rank: Record<Scope, number> = {
    GLOBAL: 6,
    INCUBATOR: 5,
    ASSIGNED: 4,
    OWN: 3,
    TEAM: 2,
    PUBLIC: 1,
  };
  for (const g of grants) {
    const prev = byPerm.get(g.permission);
    if (!prev || rank[g.scope] > rank[prev]) {
      byPerm.set(g.permission, g.scope);
    }
  }
  return [...byPerm.entries()].map(([permission, scope]) => ({
    permission,
    scope,
  }));
}

export async function hasPermission(
  user: AuthUser | null | undefined,
  permission: PermissionCode,
): Promise<boolean> {
  if (!user?.id) return false;
  if (user.status && user.status !== "ACTIVE") return false;
  const grants = await getUserGrants(user);
  return grants.some((g) => g.permission === permission);
}

export async function getPermissionScope(
  user: AuthUser,
  permission: PermissionCode,
): Promise<Scope | null> {
  const grants = await getUserGrants(user);
  return grants.find((g) => g.permission === permission)?.scope ?? null;
}

/**
 * Verifica se o escopo permite aceder ao recurso contextual.
 * Sem contexto (listagens admin), GLOBAL/INCUBATOR passam; ASSIGNED/OWN/TEAM
 * exigem verificação posterior via filterAccessible*.
 */
export async function scopeAllows(
  user: AuthUser,
  scope: Scope,
  ctx?: ResourceContext,
): Promise<boolean> {
  if (scope === "GLOBAL" || scope === "INCUBATOR") return true;
  if (scope === "PUBLIC") {
    return (
      !ctx?.confidentiality ||
      ctx.confidentiality === "PUBLIC" ||
      ctx.confidentiality === "INTERNAL"
    );
  }

  if (!ctx?.projectId && !ctx?.applicationId && !ctx?.evaluationId) {
    // Sem recurso específico: permitir listagem filtrada no caller
    return true;
  }

  if (scope === "ASSIGNED") {
    if (ctx.projectId) {
      const coach = await prisma.projectCoach.findFirst({
        where: {
          projectId: ctx.projectId,
          coachId: user.id,
          status: "ACTIVE",
        },
      });
      if (coach) return true;

      const evalOnProject = await prisma.evaluationAssignment.findFirst({
        where: { evaluatorId: user.id, projectId: ctx.projectId },
      });
      if (evalOnProject) return true;
    }
    if (ctx.applicationId || ctx.evaluationId) {
      const evalAssign = await prisma.evaluationAssignment.findFirst({
        where: {
          evaluatorId: user.id,
          OR: [
            ctx.applicationId ? { callApplicationId: ctx.applicationId } : {},
            ctx.evaluationId ? { id: ctx.evaluationId } : {},
          ].filter((o) => Object.keys(o).length > 0),
        },
      });
      if (evalAssign) return true;
    }
    return false;
  }

  if (scope === "OWN") {
    if (ctx.ownerUserId && ctx.ownerUserId === user.id) return true;
    if (ctx.projectId) {
      const membership = await prisma.projectMember.findFirst({
        where: {
          projectId: ctx.projectId,
          userId: user.id,
          roleInProject: "PROJECT_MANAGER",
        },
      });
      if (membership) return true;
    }
    return false;
  }

  if (scope === "TEAM") {
    if (ctx.projectId) {
      const membership = await prisma.projectMember.findFirst({
        where: { projectId: ctx.projectId, userId: user.id },
      });
      if (membership) return true;
    }
    return false;
  }

  return false;
}

export async function can(
  user: AuthUser | null | undefined,
  permission: PermissionCode,
  ctx?: ResourceContext,
): Promise<boolean> {
  if (!user?.id) {
    // Visitante anónimo: só PUBLIC grants via VISITOR matrix
    const visitorGrants = ROLE_PERMISSION_MATRIX.VISITOR;
    const grant = visitorGrants.find((g) => g.permission === permission);
    if (!grant) return false;
    return scopeAllows({ id: "anonymous", role: "VISITOR" }, grant.scope, ctx);
  }
  if (user.status && user.status !== "ACTIVE") return false;

  const scope = await getPermissionScope(user, permission);
  if (!scope) return false;
  return scopeAllows(user, scope, ctx);
}

export async function requirePermission(
  user: AuthUser | null | undefined,
  permission: PermissionCode,
  ctx?: ResourceContext,
): Promise<AuthUser> {
  if (!user?.id) throw new AuthorizationError("Não autenticado");

  // Revalidar estado na BD. Após redeploy/reseed o JWT.id pode não coincidir —
  // resolver também por email para a sessão continuar válida.
  let dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, role: true, status: true, email: true },
  });

  if (!dbUser && user.email) {
    dbUser = await prisma.user.findUnique({
      where: { email: user.email.toLowerCase().trim() },
      select: { id: true, role: true, status: true, email: true },
    });
  }

  if (!dbUser) {
    throw new AuthorizationError(
      "Sessão desactualizada. Termine a sessão e entre novamente.",
    );
  }
  if (dbUser.status !== "ACTIVE") {
    throw new AuthorizationError("Conta inactiva ou suspensa");
  }

  const fresh: AuthUser = {
    id: dbUser.id,
    role: normalizeRole(dbUser.role),
    status: dbUser.status,
    email: dbUser.email,
  };

  const allowed = await can(fresh, permission, ctx);
  if (!allowed) throw new AuthorizationError(`Sem permissão: ${permission}`);
  return fresh;
}

/** IDs de projectos acessíveis para scopes ASSIGNED/OWN/TEAM. */
export async function getAccessibleProjectIds(
  user: AuthUser,
  permission: PermissionCode = "projects.read",
): Promise<"ALL" | string[]> {
  const scope = await getPermissionScope(user, permission);
  if (!scope) return [];
  if (scope === "GLOBAL" || scope === "INCUBATOR") return "ALL";
  if (scope === "PUBLIC") {
    const pubs = await prisma.project.findMany({
      where: { published: true },
      select: { id: true },
    });
    return pubs.map((p) => p.id);
  }
  if (scope === "ASSIGNED") {
    const [coached, evaluated] = await Promise.all([
      prisma.projectCoach.findMany({
        where: { coachId: user.id, status: "ACTIVE" },
        select: { projectId: true },
      }),
      prisma.evaluationAssignment.findMany({
        where: { evaluatorId: user.id, projectId: { not: null } },
        select: { projectId: true },
      }),
    ]);
    return [
      ...new Set([
        ...coached.map((c) => c.projectId),
        ...evaluated.map((e) => e.projectId!).filter(Boolean),
      ]),
    ];
  }
  if (scope === "OWN") {
    const owned = await prisma.projectMember.findMany({
      where: { userId: user.id, roleInProject: "PROJECT_MANAGER" },
      select: { projectId: true },
    });
    return owned.map((m) => m.projectId);
  }
  if (scope === "TEAM") {
    const memberships = await prisma.projectMember.findMany({
      where: { userId: user.id },
      select: { projectId: true },
    });
    return memberships.map((m) => m.projectId);
  }
  return [];
}

export function sessionToAuthUser(session: {
  user?: { id?: string; role?: string; status?: string; email?: string | null } | null;
} | null): AuthUser | null {
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    role: normalizeRole(session.user.role),
    status: session.user.status || "ACTIVE",
    email: session.user.email || undefined,
  };
}

export function assertStaffAccess(role: string): RoleCode {
  const code = normalizeRole(role);
  if (!isStaffRole(code)) {
    throw new AuthorizationError("Acesso reservado a utilizadores internos");
  }
  return code;
}
