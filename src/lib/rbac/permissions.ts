/** Permissões granulares RESOURCE.ACTION (spec §14). */
export const PERMISSION_CODES = [
  "users.read",
  "users.create",
  "users.update",
  "users.disable",
  "users.assign_role",

  "applications.read",
  "applications.create",
  "applications.update",
  "applications.review",
  "applications.approve",
  "applications.reject",

  "projects.read",
  "projects.create",
  "projects.update",
  "projects.archive",
  "projects.assign_coach",

  "coaching.read",
  "coaching.create",
  "coaching.update",
  "coaching.evaluate",
  "coaching.private_notes",

  "evaluations.read",
  "evaluations.create",
  "evaluations.update",
  "evaluations.submit",

  "documents.read",
  "documents.upload",
  "documents.update",
  "documents.delete",

  "events.read",
  "events.create",
  "events.update",
  "events.publish",
  "events.delete",

  "resources.read",
  "resources.manage",

  "reports.read",
  "reports.generate",
  "reports.export",

  "settings.read",
  "settings.update",

  "audit.read",
] as const;

export type PermissionCode = (typeof PERMISSION_CODES)[number];

export function splitPermission(code: PermissionCode): {
  resource: string;
  action: string;
} {
  const [resource, action] = code.split(".");
  return { resource, action };
}
