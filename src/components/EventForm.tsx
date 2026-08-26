"use client";

import { ImageUploadField } from "@/components/ImageUploadField";
import { EVENT_CATEGORIES } from "@/lib/calendar";

function toLocalInput(value?: Date | string | null) {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export type EventFormValues = {
  id?: string;
  title: string;
  summary: string;
  details?: string;
  category: string;
  location?: string | null;
  startsAt: Date | string;
  endsAt?: Date | string | null;
  coverUrl?: string | null;
  published: boolean;
};

export function EventForm({
  action,
  event,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  event?: EventFormValues;
  submitLabel: string;
}) {
  return (
    <form action={action} className="card-surface grid gap-3 p-5 md:grid-cols-2">
      {event?.id && <input type="hidden" name="id" value={event.id} />}
      <h2 className="font-display text-xl font-semibold md:col-span-2">
        {event ? "Editar evento / agenda" : "Agendar no calendário"}
      </h2>
      <input
        className="admin-input md:col-span-2"
        name="title"
        placeholder="Título (ex: FACIM 2026)"
        defaultValue={event?.title}
        required
      />
      <textarea
        className="admin-input md:col-span-2"
        name="summary"
        placeholder="Resumo breve (aparece no hover do calendário)"
        defaultValue={event?.summary}
        required
      />
      <textarea
        className="admin-input min-h-28 md:col-span-2"
        name="details"
        placeholder="Detalhes completos"
        defaultValue={event?.details || ""}
      />
      <select className="admin-input" name="category" defaultValue={event?.category || "EVENTO"}>
        {EVENT_CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
      <input
        className="admin-input"
        name="location"
        placeholder="Local"
        defaultValue={event?.location || ""}
      />
      <div>
        <label className="admin-label">Início</label>
        <input
          className="admin-input"
          type="datetime-local"
          name="startsAt"
          defaultValue={toLocalInput(event?.startsAt)}
          required
        />
      </div>
      <div>
        <label className="admin-label">Fim (opcional)</label>
        <input
          className="admin-input"
          type="datetime-local"
          name="endsAt"
          defaultValue={toLocalInput(event?.endsAt)}
        />
      </div>
      <div className="md:col-span-2">
        <ImageUploadField
          name="coverUrl"
          label="Imagem / capa"
          defaultUrl={event?.coverUrl}
          hint="Miniatura no hover do calendário e capa na página do evento."
        />
      </div>
      <label className="flex items-center gap-2 text-sm md:col-span-2">
        <input type="checkbox" name="published" defaultChecked={event?.published ?? true} />{" "}
        Publicado no calendário público
      </label>
      <button className="btn-primary md:col-span-2">{submitLabel}</button>
    </form>
  );
}
