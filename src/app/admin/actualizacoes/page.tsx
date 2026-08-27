import { AdminShell } from "@/components/AdminShell";
import { AnnouncementAdminCard } from "@/components/AnnouncementAdminCard";
import { AnnouncementForm } from "@/components/AnnouncementForm";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminActualizacoesPage() {
  const [items, applications] = await Promise.all([
    prisma.announcement.findMany({
      orderBy: [{ featured: "desc" }, { order: "asc" }, { createdAt: "desc" }],
      include: { _count: { select: { applications: true } } },
    }),
    prisma.announcementApplication.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        announcement: { select: { id: true, title: true, slug: true } },
      },
    }),
  ]);

  return (
    <AdminShell title="Actualizações">
      <p className="mb-4 text-sm text-muted">
        Notícias, avisos e cartazes. Active «Aceitar inscrições» para o formulário público.
        Destino de email: campo da actualização, ou variável{" "}
        <code className="text-xs">REGISTRATION_EMAIL</code>, ou email da Identidade do site.
      </p>
      <AnnouncementForm />
      <div className="space-y-3">
        {items.map((item) => (
          <AnnouncementAdminCard
            key={item.id}
            item={{
              id: item.id,
              slug: item.slug,
              title: item.title,
              summary: item.summary,
              type: item.type,
              imageUrl: item.imageUrl,
              linkUrl: item.linkUrl,
              linkLabel: item.linkLabel,
              featured: item.featured,
              published: item.published,
              acceptRegistrations: item.acceptRegistrations,
              registrationEmail: item.registrationEmail,
              registrationClosesAt: item.registrationClosesAt,
              order: item.order,
              _count: item._count,
            }}
          />
        ))}
        {items.length === 0 && (
          <p className="text-sm text-muted">
            Ainda sem actualizações. Publique a primeira acima (ex.: cartaz do hackathon).
          </p>
        )}
      </div>

      <section className="mt-10">
        <h2 className="font-display text-lg font-semibold">Inscrições recentes</h2>
        <p className="mt-1 text-sm text-muted">
          Guardadas na base de dados. Notificação por email via Web3Forms no browser
          para cycode360@gmail.com (Google Drive / Web3Forms).
        </p>
        <div className="mt-4 overflow-x-auto border border-border bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-[#f3f7f4] text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-3 py-2">Data</th>
                <th className="px-3 py-2">Actualização</th>
                <th className="px-3 py-2">Nome</th>
                <th className="px-3 py-2">Contacto</th>
                <th className="px-3 py-2">Perfil</th>
                <th className="px-3 py-2">Anexos</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((a) => {
                let files: { url: string; name: string }[] = [];
                try {
                  const parsed = JSON.parse(a.attachmentsJson || "[]");
                  if (Array.isArray(parsed)) files = parsed;
                } catch {
                  files = [];
                }
                return (
                <tr key={a.id} className="border-b border-border align-top">
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-muted">
                    {a.createdAt.toLocaleString("pt-MZ")}
                  </td>
                  <td className="px-3 py-2">
                    <a
                      href={`/actualizacoes/${a.announcement.slug}`}
                      className="text-primary hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {a.announcement.title}
                    </a>
                  </td>
                  <td className="px-3 py-2">
                    <p className="font-medium">{a.name}</p>
                    {a.organization && (
                      <p className="text-xs text-muted">{a.organization}</p>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <p>{a.email}</p>
                    {a.phone && <p className="text-xs text-muted">{a.phone}</p>}
                  </td>
                  <td className="px-3 py-2 text-muted">{a.profile || "—"}</td>
                  <td className="px-3 py-2">
                    {files.length === 0 ? (
                      <span className="text-muted">—</span>
                    ) : (
                      <ul className="space-y-1">
                        {files.map((f) => (
                          <li key={f.url}>
                            <a
                              href={f.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:underline"
                            >
                              {f.name || "Anexo"}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                </tr>
                );
              })}
              {applications.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-muted">
                    Ainda sem inscrições.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
