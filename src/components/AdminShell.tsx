import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  can,
  normalizeRole,
  ROLE_META,
  sessionToAuthUser,
  type PermissionCode,
} from "@/lib/rbac";

export const dynamic = "force-dynamic";

const nav: { href: string; label: string; permission?: PermissionCode }[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/utilizadores", label: "Utilizadores", permission: "users.read" },
  { href: "/admin/identidade", label: "Identidade", permission: "settings.read" },
  { href: "/admin/destaques", label: "Destaques / Slider", permission: "settings.update" },
  { href: "/admin/projectos", label: "Projectos", permission: "projects.read" },
  { href: "/admin/eventos", label: "Agendas / Calendário", permission: "events.read" },
  { href: "/admin/editais", label: "Editais", permission: "applications.read" },
  { href: "/admin/candidaturas", label: "Candidaturas", permission: "applications.read" },
  { href: "/admin/galeria", label: "Galeria", permission: "resources.read" },
  { href: "/admin/mensagens", label: "Mensagens / Leads", permission: "users.read" },
  { href: "/admin/actividades", label: "Actividades", permission: "resources.manage" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

export async function AdminShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  const session = await auth();
  if (!session) redirect("/admin/login");
  const user = sessionToAuthUser(session);
  if (!user) redirect("/admin/login");

  const visibleNav: typeof nav = [];
  for (const item of nav) {
    if (!item.permission || (await can(user, item.permission))) {
      visibleNav.push(item);
    }
  }

  const roleLabel =
    ROLE_META[normalizeRole(user.role)]?.name || normalizeRole(user.role);

  const counts = {
    projects: await prisma.project.count(),
    timeline: await prisma.timelineItem.count(),
  };

  return (
    <div className="min-h-screen bg-[#f3f7f4]">
      <div className="mx-auto grid max-w-6xl gap-4 px-3 py-4 sm:gap-6 sm:px-4 sm:py-6 md:grid-cols-[220px_1fr] md:items-start md:px-6">
        <aside className="card-surface z-20 p-3 sm:p-4 md:sticky md:top-4 md:max-h-[calc(100vh-2rem)] md:overflow-y-auto">
          <div className="mb-3 flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logos/mozinkub.png"
              alt="MozInkub"
              className="h-10 w-10 object-contain"
            />
            <div>
              <p className="font-display text-lg font-semibold">IEUL Admin</p>
              <p className="text-[10px] text-muted">MozInkub · UniLicungo</p>
            </div>
          </div>
          <p className="mt-1 truncate text-xs text-muted">{session.user?.email}</p>
          <p className="mt-0.5 text-[10px] font-semibold tracking-wide text-primary uppercase">
            {roleLabel}
          </p>
          <nav className="mt-4 -mx-1 flex gap-1 overflow-x-auto pb-1 text-sm md:mx-0 md:mt-5 md:block md:max-h-none md:space-y-1 md:overflow-visible md:pb-0">
            {visibleNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block shrink-0 px-3 py-2 whitespace-nowrap hover:bg-primary-soft hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/"
              className="block shrink-0 px-3 py-2 whitespace-nowrap text-muted hover:bg-white"
            >
              Ver site público
            </Link>
          </nav>
          <form
            className="mt-4"
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/admin/login" });
            }}
          >
            <button className="btn-ghost w-full !py-2 text-sm">Sair</button>
          </form>
          <div className="mt-5 hidden grid-cols-2 gap-2 text-center text-xs md:grid">
            <div className="bg-primary-soft p-2">
              <p className="font-display text-lg text-primary">{counts.projects}</p>
              Projectos
            </div>
            <div className="bg-primary-soft p-2">
              <p className="font-display text-lg text-primary">{counts.timeline}</p>
              Actividades
            </div>
          </div>
        </aside>
        <section className="min-w-0 pb-8">
          <h1 className="font-display text-2xl font-semibold break-words sm:text-3xl">{title}</h1>
          <div className="mt-4 sm:mt-5">{children}</div>
        </section>
      </div>
    </div>
  );
}
