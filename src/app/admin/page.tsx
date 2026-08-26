import Link from "next/link";
import { AdminShell } from "@/components/AdminShell";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [projects, events, funding, timeline, applications, albums, unread, users] =
    await Promise.all([
      prisma.project.count(),
      prisma.event.count(),
      prisma.fundingCall.count(),
      prisma.timelineItem.count(),
      prisma.callApplication.count(),
      prisma.galleryAlbum.count(),
      prisma.contactMessage.count({ where: { read: false } }),
      prisma.user.count(),
    ]);

  const createHub = [
    {
      title: "Editais / concursos",
      description: "Criar edição de financiamento e publicar edital com PDF e prazo.",
      href: "/admin/editais#novo-edital",
      cta: "Criar edital",
      count: funding,
    },
    {
      title: "Candidaturas",
      description: "Apreciar projectos submetidos online (PDF) pelos candidatos.",
      href: "/admin/candidaturas",
      cta: "Gerir candidaturas",
      count: applications,
    },
    {
      title: "Agendas / calendário",
      description: "Agendar feiras, exposições, visitas e outras actividades públicas.",
      href: "/admin/eventos#nova-agenda",
      cta: "Agendar no calendário",
      count: events,
    },
  ];

  const cards = [
    { label: "Utilizadores", value: users, href: "/admin/utilizadores" },
    { label: "Projectos", value: projects, href: "/admin/projectos" },
    { label: "Agendas", value: events, href: "/admin/eventos" },
    { label: "Editais", value: funding, href: "/admin/editais" },
    { label: "Candidaturas", value: applications, href: "/admin/candidaturas" },
    { label: "Galeria", value: albums, href: "/admin/galeria" },
    { label: "Mensagens por ler", value: unread, href: "/admin/mensagens" },
    { label: "Actividades", value: timeline, href: "/admin/actividades" },
  ];

  return (
    <AdminShell title="Dashboard">
      <p className="text-muted">
        Gestão de conteúdos do site institucional da IEUL — Antena da Beira.
      </p>

      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold">Criação e gestão principal</h2>
        <p className="mt-1 text-sm text-muted">
          Atalhos para as secções pedidas: editais, candidaturas e agendas.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {createHub.map((item) => (
            <article key={item.href} className="card-surface flex flex-col p-5">
              <p className="text-xs font-bold tracking-wide text-primary uppercase">
                {item.count} registo(s)
              </p>
              <h3 className="font-display mt-2 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 flex-1 text-sm text-muted">{item.description}</p>
              <Link href={item.href} className="btn-primary mt-5 !py-2.5 text-center text-sm">
                {item.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="card-surface p-5 hover:border-primary">
            <p className="text-sm text-muted">{c.label}</p>
            <p className="font-display mt-2 text-3xl font-semibold text-primary">{c.value}</p>
          </Link>
        ))}
      </div>
    </AdminShell>
  );
}
