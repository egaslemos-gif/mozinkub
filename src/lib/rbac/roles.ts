/** Códigos de papel oficiais (spec v1.0). */
export const ROLE_CODES = [
  "PLATFORM_ADMIN",
  "INCUBATOR_COORDINATOR",
  "SECRETARIAT",
  "COACH",
  "PROJECT_MANAGER",
  "TEAM_MEMBER",
  "EVALUATOR",
  "VISITOR",
] as const;

export type RoleCode = (typeof ROLE_CODES)[number];

/** Valores legados guardados em User.role antes da normalização. */
export const LEGACY_ROLE_MAP: Record<string, RoleCode> = {
  COORDENADOR: "INCUBATOR_COORDINATOR",
  coordenador: "INCUBATOR_COORDINATOR",
  Coordenador: "INCUBATOR_COORDINATOR",
  ADMIN: "PLATFORM_ADMIN",
  admin: "PLATFORM_ADMIN",
};

export function normalizeRole(role: string | null | undefined): RoleCode {
  if (!role) return "VISITOR";
  if (LEGACY_ROLE_MAP[role]) return LEGACY_ROLE_MAP[role];
  if ((ROLE_CODES as readonly string[]).includes(role)) return role as RoleCode;
  return "VISITOR";
}

export const ROLE_META: Record<
  RoleCode,
  { name: string; description: string }
> = {
  PLATFORM_ADMIN: {
    name: "Administrador da Plataforma",
    description: "Administração técnica global da plataforma.",
  },
  INCUBATOR_COORDINATOR: {
    name: "Coordenador",
    description: "Gestão estratégica e operacional da Incubadora.",
  },
  SECRETARIAT: {
    name: "Secretaria / Recepção",
    description: "Gestão administrativa e atendimento.",
  },
  COACH: {
    name: "Coach / Mentor",
    description: "Acompanhamento dos projectos atribuídos.",
  },
  PROJECT_MANAGER: {
    name: "Gestor do Projecto",
    description: "Responsável pelo projecto incubado.",
  },
  TEAM_MEMBER: {
    name: "Membro da Equipa",
    description: "Participante de um projecto.",
  },
  EVALUATOR: {
    name: "Avaliador",
    description: "Avaliação de candidaturas/projectos atribuídos.",
  },
  VISITOR: {
    name: "Visitante",
    description: "Acesso público à plataforma.",
  },
};

/** Papéis com acesso à área /admin (não VISITOR). */
export function isStaffRole(role: RoleCode): boolean {
  return role !== "VISITOR";
}
