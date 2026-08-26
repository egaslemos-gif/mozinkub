"use client";

import { FormWithFeedback } from "@/components/FormWithFeedback";
import { ImageUploadField } from "@/components/ImageUploadField";
import { LIFECYCLE_OPTIONS } from "@/lib/funding";
import { MATURITY_OPTIONS, STATUS_OPTIONS } from "@/lib/projects";

export type ProjectFormValues = {
  id?: string;
  name: string;
  area: string;
  tagline?: string | null;
  summary: string;
  description?: string | null;
  offer?: string | null;
  audience?: string | null;
  lookingFor?: string | null;
  city?: string | null;
  leader: string;
  team?: string | null;
  contact?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  website?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  linkedin?: string | null;
  status: string;
  maturity: string;
  lifecycle?: string;
  cohortYear?: number | null;
  fundingEditionId?: string | null;
  featured: boolean;
  published: boolean;
  logoUrl?: string | null;
  coverUrl?: string | null;
  order: number;
};

export function ProjectForm({
  action,
  project,
  submitLabel,
  editions = [],
}: {
  action: (formData: FormData) => Promise<unknown>;
  project?: ProjectFormValues;
  submitLabel: string;
  editions?: { id: string; name: string; year: number }[];
}) {
  return (
    <FormWithFeedback
      action={action}
      className="card-surface grid gap-3 p-5 md:grid-cols-2"
      successMessage="Ficha guardada com sucesso."
    >
      {project?.id && <input type="hidden" name="id" value={project.id} />}

      <h2 className="font-display text-xl font-semibold md:col-span-2">
        {project ? "Ficha do projecto" : "Novo projecto"}
      </h2>

      <input
        className="admin-input"
        name="name"
        placeholder="Nome comercial"
        defaultValue={project?.name}
        required
      />
      <input
        className="admin-input"
        name="area"
        placeholder="Área (ex: Tecnologia Digital)"
        defaultValue={project?.area}
        required
      />
      <input
        className="admin-input md:col-span-2"
        name="tagline"
        placeholder="Frase curta / pitch (aparece nos slides e no mural)"
        defaultValue={project?.tagline || ""}
      />
      <textarea
        className="admin-input md:col-span-2"
        name="summary"
        placeholder="Resumo (1–2 frases)"
        defaultValue={project?.summary}
        required
      />
      <textarea
        className="admin-input min-h-28 md:col-span-2"
        name="description"
        placeholder="História / descrição para a página de detalhe"
        defaultValue={project?.description || ""}
      />
      <textarea
        className="admin-input"
        name="offer"
        placeholder="O que oferece ao mercado"
        defaultValue={project?.offer || ""}
      />
      <textarea
        className="admin-input"
        name="audience"
        placeholder="A quem se destina (clientes)"
        defaultValue={project?.audience || ""}
      />
      <textarea
        className="admin-input md:col-span-2"
        name="lookingFor"
        placeholder="O que procura agora (clientes, parceiros, investimento, fornecedores…)"
        defaultValue={project?.lookingFor || ""}
      />

      <input
        className="admin-input"
        name="leader"
        placeholder="Líder / founder"
        defaultValue={project?.leader}
        required
      />
      <input
        className="admin-input"
        name="team"
        placeholder="Equipa (outros nomes)"
        defaultValue={project?.team || ""}
      />
      <input
        className="admin-input"
        name="city"
        placeholder="Cidade"
        defaultValue={project?.city || "Beira"}
      />
      <input
        className="admin-input"
        name="order"
        type="number"
        placeholder="Ordem no mural"
        defaultValue={project?.order ?? 0}
      />

      <p className="font-display mt-2 text-sm font-semibold md:col-span-2">Contactos do negócio</p>
      <input
        className="admin-input"
        name="contact"
        placeholder="Telefone"
        defaultValue={project?.contact || ""}
      />
      <input
        className="admin-input"
        name="whatsapp"
        placeholder="WhatsApp (só números, ex: 840000000)"
        defaultValue={project?.whatsapp || ""}
      />
      <input
        className="admin-input"
        name="email"
        type="email"
        placeholder="Email comercial"
        defaultValue={project?.email || ""}
      />
      <input
        className="admin-input"
        name="website"
        placeholder="Website (https://…)"
        defaultValue={project?.website || ""}
      />
      <input
        className="admin-input"
        name="facebook"
        placeholder="Facebook"
        defaultValue={project?.facebook || ""}
      />
      <input
        className="admin-input"
        name="instagram"
        placeholder="Instagram"
        defaultValue={project?.instagram || ""}
      />
      <input
        className="admin-input md:col-span-2"
        name="linkedin"
        placeholder="LinkedIn"
        defaultValue={project?.linkedin || ""}
      />

      <select className="admin-input" name="status" defaultValue={project?.status || "EM_INCUBACAO"}>
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <select className="admin-input" name="maturity" defaultValue={project?.maturity || "PROTOTIPO"}>
        {MATURITY_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <select className="admin-input" name="lifecycle" defaultValue={project?.lifecycle || "ATIVO"}>
        {LIFECYCLE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <input
        className="admin-input"
        name="cohortYear"
        type="number"
        placeholder="Ano da coorte (ex: 2026)"
        defaultValue={project?.cohortYear ?? ""}
      />
      <select
        className="admin-input md:col-span-2"
        name="fundingEditionId"
        defaultValue={project?.fundingEditionId || ""}
      >
        <option value="">Sem edição de financiamento</option>
        {editions.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name} ({e.year})
          </option>
        ))}
      </select>

      <ImageUploadField
        name="logoUrl"
        label="Logo"
        defaultUrl={project?.logoUrl}
        hint="Quadrado, fundo limpo. Sem efeitos no site — apresenta-se tal como está."
      />
      <ImageUploadField
        name="coverUrl"
        label="Imagem de capa"
        defaultUrl={project?.coverUrl}
        hint="Usada no mural, nos destaques da landing e nos slides."
      />

      <div className="flex items-center gap-4 text-sm md:col-span-2">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="featured" defaultChecked={project?.featured} /> Destaque
          (landing / slides)
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="published" defaultChecked={project?.published ?? true} />{" "}
          Publicado
        </label>
      </div>
      <button type="submit" className="btn-primary md:col-span-2">
        {submitLabel}
      </button>
    </FormWithFeedback>
  );
}
