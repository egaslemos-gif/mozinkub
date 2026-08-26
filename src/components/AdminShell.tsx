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
    <div className="flex h-dvh flex-col overflow-hidden bg-[#f3f7f4] md:flex-row">
      {/* Sidebar fixa — só o conteúdo principal faz scroll */}
      <aside className="z-30 shrink-0 border-b border-border bg-white md:flex md:h-dvh md:w-[240px] md:flex-col md:border-r md:border-b-0">
        <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logos/mozinkub.png"
            alt="MozInkub"
            className="h-9 w-9 object-contain"
          />
          <div className="min-w-0">
            <p className="font-display text-base font-semibold leading-tight">IEUL Admin</p>
            <p className="truncate text-[10px] text-muted">MozInkub · UniLicungo</p>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-2 py-2 text-sm md:flex-1 md:flex-col md:gap-0.5 md:overflow-y-auto md:px-2 md:py-3">
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
            className="block shrink-0 px-3 py-2 whitespace-nowrap text-muted hover:bg-primary-soft hover:text-primary"
          >
            Ver site público
          </Link>
        </nav>

        <div className="hidden border-t border-border p-3 md:block">
          <div className="mb-3 grid grid-cols-2 gap-2 text-center text-xs">
            <div className="bg-primary-soft p-2">
              <p className="font-display text-lg text-primary">{counts.projects}</p>
              Projectos
            </div>
            <div className="bg-primary-soft p-2">
              <p className="font-display text-lg text-primary">{counts.timeline}</p>
              Actividades
            </div>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/admin/login" });
            }}
          >
            <button className="btn-ghost w-full !py-2 text-sm">Sair</button>
          </form>
        </div>

        <div className="border-t border-border px-3 py-2 md:hidden">
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/admin/login" });
            }}
          >
            <button className="btn-ghost w-full !py-1.5 text-xs">Sair</button>
          </form>
        </div>
      </aside>

      {/* Coluna principal: cabeçalho fixo + área com scroll */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="z-20 flex shrink-0 items-center justify-between gap-4 border-b border-border bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
          <h1 className="font-display min-w-0 text-xl font-semibold break-words sm:text-2xl">
            {title}
          </h1>
          <div className="shrink-0 text-right">
            <p className="max-w-[14rem] truncate text-xs text-muted sm:max-w-xs sm:text-sm">
              {session.user?.email}
            </p>
            <p className="mt-0.5 text-[10px] font-semibold tracking-wide text-primary uppercase">
              {roleLabel}
            </p>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
          <div className="mx-auto max-w-5xl pb-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
