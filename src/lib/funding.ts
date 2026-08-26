export const LIFECYCLE_OPTIONS = [
  { value: "ATIVO", label: "Em incubação (activo)" },
  { value: "ALUMNI", label: "Alumni / concluído" },
  { value: "ARQUIVADO", label: "Arquivado" },
] as const;

export const CALL_STATUS_OPTIONS = [
  { value: "ABERTO", label: "Aberto a candidaturas" },
  { value: "EM_AVALIACAO", label: "Em avaliação" },
  { value: "ENCERRADO", label: "Encerrado" },
  { value: "RESULTADOS", label: "Resultados publicados" },
] as const;

export const APPLICATION_STATUS_OPTIONS = [
  { value: "RECEBIDA", label: "Recebida" },
  { value: "EM_ANALISE", label: "Em análise" },
  { value: "ACEITE", label: "Aceite / incubada" },
  { value: "REJEITADA", label: "Não seleccionada" },
] as const;

export function lifecycleLabel(value: string) {
  return LIFECYCLE_OPTIONS.find((o) => o.value === value)?.label || value;
}

export function callStatusLabel(value: string) {
  return CALL_STATUS_OPTIONS.find((o) => o.value === value)?.label || value;
}

export function applicationStatusLabel(value: string) {
  return APPLICATION_STATUS_OPTIONS.find((o) => o.value === value)?.label || value;
}

export function isCallOpen(call: {
  status: string;
  acceptApplications: boolean;
  deadline: Date | null;
  opensAt?: Date | null;
}) {
  if (!call.acceptApplications || call.status !== "ABERTO") return false;
  const now = Date.now();
  if (call.opensAt && call.opensAt.getTime() > now) return false;
  if (call.deadline && call.deadline.getTime() < now) return false;
  return true;
}
