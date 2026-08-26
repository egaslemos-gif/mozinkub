import { AdminShell } from "@/components/AdminShell";
import { updateSiteConfig } from "@/app/admin/actions";
import { getSiteConfig, parseValues } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function IdentidadePage() {
  const config = await getSiteConfig();
  if (!config) {
    return (
      <AdminShell title="Identidade">
        <p>Execute o seed da base de dados.</p>
      </AdminShell>
    );
  }

  const values = parseValues(config.valuesJson).join("\n");

  return (
    <AdminShell title="Identidade institucional">
      <form action={updateSiteConfig} className="card-surface space-y-4 p-6">
        {(
          [
            ["brandName", "Nome da marca", config.brandName],
            ["slogan", "Slogan", config.slogan],
            ["heroTitle", "Título do hero", config.heroTitle],
            ["heroSubtitle", "Subtítulo do hero", config.heroSubtitle],
            ["campus", "Campus", config.campus],
            ["address", "Morada", config.address],
            ["phone", "Telefone", config.phone],
            ["whatsapp", "WhatsApp (só dígitos, ex: 84305623)", config.whatsapp || ""],
            ["email", "Email", config.email],
          ] as const
        ).map(([name, label, value]) => (
          <div key={name}>
            <label className="admin-label">{label}</label>
            <input className="admin-input" name={name} defaultValue={value} required />
          </div>
        ))}
        <div>
          <label className="admin-label">Missão</label>
          <textarea className="admin-input min-h-24" name="mission" defaultValue={config.mission} />
        </div>
        <div>
          <label className="admin-label">Visão</label>
          <textarea className="admin-input min-h-24" name="vision" defaultValue={config.vision} />
        </div>
        <div>
          <label className="admin-label">Sobre</label>
          <textarea
            className="admin-input min-h-28"
            name="aboutText"
            defaultValue={config.aboutText}
          />
        </div>
        <div>
          <label className="admin-label">Valores (um por linha)</label>
          <textarea className="admin-input min-h-28" name="values" defaultValue={values} />
        </div>
        <button className="btn-primary">Guardar alterações</button>
      </form>
    </AdminShell>
  );
}
