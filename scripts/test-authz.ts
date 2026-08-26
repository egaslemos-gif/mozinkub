/**
 * Testes positivos/negativos de autorização RBAC (8 papéis).
 * Executar: npx tsx scripts/test-authz.ts
 */
import { PrismaClient } from "@prisma/client";
import {
  can,
  getAccessibleProjectIds,
  normalizeRole,
} from "../src/lib/rbac";

const prisma = new PrismaClient();

type Case = {
  email: string;
  permission: Parameters<typeof can>[1];
  ctx?: Parameters<typeof can>[2];
  expect: boolean;
  label: string;
};

async function main() {
  const users = await prisma.user.findMany();
  const byEmail = Object.fromEntries(users.map((u) => [u.email, u]));
  const projects = await prisma.project.findMany({ orderBy: { order: "asc" } });
  const p0 = projects[0];
  const p1 = projects[1];
  if (!p0 || !p1) throw new Error("Precisa de pelo menos 2 projectos no seed");

  const cases: Case[] = [
    {
      email: "coordenacao@ieul.ul.ac.mz",
      permission: "projects.read",
      ctx: { projectId: p1.id },
      expect: true,
      label: "Coordenador lê qualquer projecto",
    },
    {
      email: "coordenacao@ieul.ul.ac.mz",
      permission: "applications.approve",
      expect: true,
      label: "Coordenador aprova candidaturas",
    },
    {
      email: "secretaria@ieul.ul.ac.mz",
      permission: "applications.approve",
      expect: false,
      label: "Secretaria NÃO aprova",
    },
    {
      email: "secretaria@ieul.ul.ac.mz",
      permission: "applications.review",
      expect: true,
      label: "Secretaria revê documentação",
    },
    {
      email: "secretaria@ieul.ul.ac.mz",
      permission: "settings.update",
      expect: false,
      label: "Secretaria NÃO altera settings",
    },
    {
      email: "coach@ieul.ul.ac.mz",
      permission: "projects.read",
      ctx: { projectId: p0.id },
      expect: true,
      label: "Coach lê projecto atribuído",
    },
    {
      email: "coach@ieul.ul.ac.mz",
      permission: "projects.read",
      ctx: { projectId: p1.id },
      expect: false,
      label: "Coach NÃO lê projecto não atribuído",
    },
    {
      email: "coach@ieul.ul.ac.mz",
      permission: "coaching.private_notes",
      ctx: { projectId: p0.id, confidentiality: "RESTRICTED" },
      expect: true,
      label: "Coach cria notas privadas no atribuído",
    },
    {
      email: "gestor@ieul.ul.ac.mz",
      permission: "projects.read",
      ctx: { projectId: p0.id },
      expect: true,
      label: "PM lê próprio projecto",
    },
    {
      email: "gestor@ieul.ul.ac.mz",
      permission: "projects.read",
      ctx: { projectId: p1.id },
      expect: false,
      label: "PM NÃO lê outro projecto",
    },
    {
      email: "gestor@ieul.ul.ac.mz",
      permission: "coaching.private_notes",
      ctx: { projectId: p0.id, confidentiality: "RESTRICTED" },
      expect: false,
      label: "PM NÃO vê notas privadas",
    },
    {
      email: "membro@ieul.ul.ac.mz",
      permission: "projects.read",
      ctx: { projectId: p0.id },
      expect: true,
      label: "Team member lê projecto onde é membro",
    },
    {
      email: "membro@ieul.ul.ac.mz",
      permission: "projects.read",
      ctx: { projectId: p1.id },
      expect: false,
      label: "Team member NÃO lê projecto externo",
    },
    {
      email: "membro@ieul.ul.ac.mz",
      permission: "users.update",
      expect: false,
      label: "Team member NÃO gere utilizadores",
    },
    {
      email: "avaliador@ieul.ul.ac.mz",
      permission: "projects.read",
      ctx: { projectId: p0.id },
      expect: true,
      label: "Avaliador lê projecto atribuído",
    },
    {
      email: "avaliador@ieul.ul.ac.mz",
      permission: "projects.read",
      ctx: { projectId: p1.id },
      expect: false,
      label: "Avaliador NÃO lê projecto não atribuído",
    },
    {
      email: "admin@ieul.ul.ac.mz",
      permission: "users.disable",
      expect: true,
      label: "Platform admin gere utilizadores",
    },
    {
      email: "admin@ieul.ul.ac.mz",
      permission: "coaching.private_notes",
      expect: false,
      label: "Platform admin NÃO tem notas privadas por omissão",
    },
  ];

  let passed = 0;
  let failed = 0;
  const failures: string[] = [];

  for (const c of cases) {
    const u = byEmail[c.email];
    if (!u) {
      failed++;
      failures.push(`MISSING USER ${c.email} — ${c.label}`);
      continue;
    }
    const authUser = {
      id: u.id,
      role: normalizeRole(u.role),
      status: u.status,
    };
    const result = await can(authUser, c.permission, c.ctx);
    if (result === c.expect) {
      passed++;
      console.log(`PASS  ${c.label}`);
    } else {
      failed++;
      failures.push(
        `FAIL  ${c.label} (got ${result}, expected ${c.expect}) [${c.email} / ${c.permission}]`,
      );
      console.log(failures[failures.length - 1]);
    }
  }

  // Visitor anónimo
  const visitorOk = await can(null, "projects.read", { confidentiality: "PUBLIC" });
  const visitorBad = await can(null, "settings.update");
  if (visitorOk && !visitorBad) {
    passed += 2;
    console.log("PASS  Visitante lê público e NÃO settings");
  } else {
    failed += 2;
    failures.push("FAIL  Visitante público");
  }

  const coach = byEmail["coach@ieul.ul.ac.mz"];
  if (coach) {
    const ids = await getAccessibleProjectIds(
      { id: coach.id, role: "COACH", status: "ACTIVE" },
      "projects.read",
    );
    const ok = Array.isArray(ids) && ids.includes(p0.id) && !ids.includes(p1.id);
    if (ok) {
      passed++;
      console.log("PASS  Coach accessible projects filtered");
    } else {
      failed++;
      failures.push(`FAIL  Coach filter got ${JSON.stringify(ids)}`);
    }
  }

  console.log("\n---");
  console.log(`Resultado: ${passed} pass, ${failed} fail`);
  if (failures.length) {
    console.log(failures.join("\n"));
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
