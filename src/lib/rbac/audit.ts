import { prisma } from "@/lib/prisma";

type AuditInput = {
  userId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  ipAddress?: string | null;
  metadata?: Record<string, unknown> | string | null;
};

export async function writeAuditLog(input: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId || null,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId || null,
        ipAddress: input.ipAddress || null,
        metadata:
          typeof input.metadata === "string"
            ? input.metadata
            : input.metadata
              ? JSON.stringify(input.metadata)
              : null,
      },
    });
  } catch (err) {
    console.error("[audit]", err);
  }
}
