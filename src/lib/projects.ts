export function whatsappHref(phone: string, text?: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "#";
  const intl = digits.startsWith("258") ? digits : `258${digits.replace(/^0+/, "")}`;
  const q = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${intl}${q}`;
}

export function maturityLabel(maturity: string) {
  const map: Record<string, string> = {
    IDEACAO: "Ideação",
    PROTOTIPO: "Protótipo",
    VALIDACAO: "Validação no mercado",
    PRE_OPERACIONAL: "Pré-operacional",
    OPERACIONAL: "Operacional",
  };
  return map[maturity] || maturity;
}

export function milestoneKindLabel(kind: string) {
  const map: Record<string, string> = {
    MARCO: "Marco",
    COACHING: "Coaching",
    LEGAL: "Legalização",
    PRODUTO: "Produto",
    PARCERIA: "Parceria",
  };
  return map[kind] || kind;
}

export const MATURITY_OPTIONS = [
  { value: "IDEACAO", label: "Ideação" },
  { value: "PROTOTIPO", label: "Protótipo" },
  { value: "VALIDACAO", label: "Validação no mercado" },
  { value: "PRE_OPERACIONAL", label: "Pré-operacional" },
  { value: "OPERACIONAL", label: "Operacional" },
] as const;

export const STATUS_OPTIONS = [
  { value: "EM_INCUBACAO", label: "Em incubação" },
  { value: "PRE_OPERACIONAL", label: "Pré-operacional" },
  { value: "OPERACIONAL", label: "Operacional" },
] as const;
