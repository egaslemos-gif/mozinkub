import { AdminShell } from "@/components/AdminShell";
import { createUserAccount, updateUserAccount } from "@/app/admin/actions";
import { auth } from "@/lib/auth";
import { can, ROLE_CODES, ROLE_META, sessionToAuthUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminUtilizadoresPage() {
  const session = await auth();
  const user = sessionToAuthUser(session);
  if (!user || !(await can(user, "users.read"))) {
    redirect("/admin");
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { userRoles: { include: { role: true } } },
  });

  const canCreate = await can(user, "users.create");
  const canUpdate = await can(user, "users.update");

  return (
    <AdminShell title="Utilizadores e papéis">
      <p className="mb-5 max-w-2xl text-sm text-muted">
        Gestão de contas, estados (ACTIVE / PENDING / SUSPENDED / DISABLED) e papéis RBAC.
        A autorização real é validada no servidor por permissão e escopo.
      </p>

      {canCreate && (
        <form action={createUserAccount} className="card-surface mb-6 grid gap-3 p-5 md:grid-cols-2">
          <h2 className="font-display text-xl font-semibold md:col-span-2">Novo utilizador</h2>
          <input className="admin-input" name="name" placeholder="Nome" required />
          <input className="admin-input" name="email" type="email" placeholder="Email" required />
          <input
            className="admin-input"
            name="password"
            type="password"
            placeholder="Password (mín. 6)"
            required
            minLength={6}
          />
          <select className="admin-input" name="role" defaultValue="SECRETARIAT">
            {ROLE_CODES.filter((c) => c !== "VISITOR").map((code) => (
              <option key={code} value={code}>
                {ROLE_META[code].name}
              </option>
            ))}
          </select>
          <button className="btn-primary md:col-span-2">Criar utilizador</button>
        </form>
      )}

      <div className="space-y-3">
        {users.map((u) => (
          <article key={u.id} className="card-surface p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{u.name}</p>
                <p className="text-sm text-muted">{u.email}</p>
                <p className="mt-1 text-xs text-ul-blue">
                  {ROLE_META[u.role as keyof typeof ROLE_META]?.name || u.role} · {u.status}
                </p>
              </div>
            </div>
            {canUpdate && (
              <form action={updateUserAccount} className="mt-4 grid gap-2 border-t border-border pt-3 md:grid-cols-4">
                <input type="hidden" name="id" value={u.id} />
                <input className="admin-input" name="name" defaultValue={u.name} required />
                <select className="admin-input" name="role" defaultValue={u.role}>
                  {ROLE_CODES.filter((c) => c !== "VISITOR").map((code) => (
                    <option key={code} value={code}>
                      {ROLE_META[code].name}
                    </option>
                  ))}
                </select>
                <select className="admin-input" name="status" defaultValue={u.status}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PENDING">PENDING</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="DISABLED">DISABLED</option>
                </select>
                <button className="btn-primary !py-2 text-sm">Guardar</button>
              </form>
            )}
          </article>
        ))}
      </div>
    </AdminShell>
  );
}
