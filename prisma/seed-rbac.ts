import { PrismaClient } from "@prisma/client";
import { ROLE_PERMISSION_MATRIX } from "../src/lib/rbac/matrix";
import { PERMISSION_CODES, splitPermission } from "../src/lib/rbac/permissions";
import { ROLE_CODES, ROLE_META, normalizeRole } from "../src/lib/rbac/roles";

export async function seedRbac(prisma: PrismaClient) {
  for (const code of PERMISSION_CODES) {
    const { resource, action } = splitPermission(code);
    await prisma.permission.upsert({
      where: { code },
      update: { resource, action },
      create: {
        code,
        resource,
        action,
        description: `${resource}.${action}`,
      },
    });
  }

  for (const code of ROLE_CODES) {
    const meta = ROLE_META[code];
    await prisma.role.upsert({
      where: { code },
      update: { name: meta.name, description: meta.description },
      create: {
        code,
        name: meta.name,
        description: meta.description,
      },
    });
  }

  for (const roleCode of ROLE_CODES) {
    const role = await prisma.role.findUniqueOrThrow({ where: { code: roleCode } });
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    const grants = ROLE_PERMISSION_MATRIX[roleCode];
    for (const grant of grants) {
      const permission = await prisma.permission.findUniqueOrThrow({
        where: { code: grant.permission },
      });
      await prisma.rolePermission.create({
        data: {
          roleId: role.id,
          permissionId: permission.id,
          scope: grant.scope,
        },
      });
    }
  }

  // Migrar utilizadores legados COORDENADOR → INCUBATOR_COORDINATOR
  const users = await prisma.user.findMany();
  for (const user of users) {
    const normalized = normalizeRole(user.role);
    if (user.role !== normalized) {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: normalized },
      });
    }
    const role = await prisma.role.findUnique({ where: { code: normalized } });
    if (role) {
      await prisma.userRole.upsert({
        where: {
          userId_roleId: { userId: user.id, roleId: role.id },
        },
        update: {},
        create: { userId: user.id, roleId: role.id },
      });
    }
  }
}
