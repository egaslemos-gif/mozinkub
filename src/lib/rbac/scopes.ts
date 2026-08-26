export const SCOPES = [
  "GLOBAL",
  "INCUBATOR",
  "ASSIGNED",
  "OWN",
  "TEAM",
  "PUBLIC",
] as const;

export type Scope = (typeof SCOPES)[number];

export type ResourceContext = {
  projectId?: string | null;
  applicationId?: string | null;
  evaluationId?: string | null;
  ownerUserId?: string | null;
  confidentiality?: "PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "RESTRICTED";
};
