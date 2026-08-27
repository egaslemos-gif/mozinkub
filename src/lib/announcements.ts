export const ANNOUNCEMENT_TYPES = [
  { code: "NOTICIA", label: "Notícia" },
  { code: "EVENTO", label: "Evento" },
  { code: "AVISO", label: "Aviso" },
  { code: "CONVOCATORIA", label: "Convocatória" },
] as const;

export type AnnouncementTypeCode = (typeof ANNOUNCEMENT_TYPES)[number]["code"];

export function announcementTypeLabel(code: string): string {
  return ANNOUNCEMENT_TYPES.find((t) => t.code === code)?.label || code;
}
