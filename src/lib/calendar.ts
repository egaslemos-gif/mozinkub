export const EVENT_CATEGORIES = [
  { value: "FEIRA", label: "Feira" },
  { value: "EXPOSICAO", label: "Exposição" },
  { value: "ACTIVIDADE", label: "Actividade" },
  { value: "REUNIAO", label: "Reunião" },
  { value: "VISITA", label: "Visita" },
  { value: "EVENTO", label: "Evento" },
  { value: "OUTRO", label: "Outro" },
] as const;

export function eventCategoryLabel(value: string) {
  return EVENT_CATEGORIES.find((c) => c.value === value)?.label || value;
}

export type CalendarEntry = {
  id: string;
  kind: "EVENTO" | "ACTIVIDADE";
  title: string;
  slug: string;
  summary: string;
  details: string;
  category: string;
  location: string | null;
  startsAt: string;
  endsAt: string | null;
  coverUrl: string | null;
  href: string;
};

export function dayKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function monthLabel(year: number, monthIndex: number) {
  const raw = new Date(year, monthIndex, 1).toLocaleDateString("pt-MZ", {
    month: "long",
    year: "numeric",
  });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export const WEEKDAYS_PT = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
