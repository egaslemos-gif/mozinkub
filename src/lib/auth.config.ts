import type { NextAuthConfig } from "next-auth";
import { normalizeRole } from "@/lib/rbac/roles";

/**
 * Config Edge-safe (sem Prisma/fs). Usada pelo middleware.
 * O provider Credentials com Prisma fica em auth.ts (Node).
 */
export const authConfig = {
  pages: {
    signIn: "/admin/login",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = normalizeRole((user as { role?: string }).role);
        token.status = (user as { status?: string }).status || "ACTIVE";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = normalizeRole(token.role as string);
        session.user.status = (token.status as string) || "ACTIVE";
      }
      return session;
    },
    authorized({ auth, request }) {
      const path = request.nextUrl.pathname;
      const isLogin = path === "/admin/login";
      const isAdmin = path.startsWith("/admin");

      if (!isAdmin) return true;

      const session = auth;
      const role = normalizeRole(session?.user?.role);
      const status = session?.user?.status || "ACTIVE";
      const isStaff =
        role !== "VISITOR" &&
        [
          "PLATFORM_ADMIN",
          "INCUBATOR_COORDINATOR",
          "SECRETARIAT",
          "COACH",
          "PROJECT_MANAGER",
          "TEAM_MEMBER",
          "EVALUATOR",
        ].includes(role);

      if (isLogin) {
        if (session?.user && status === "ACTIVE" && isStaff) {
          return Response.redirect(new URL("/admin", request.nextUrl));
        }
        return true;
      }

      if (!session?.user) return false;
      if (status !== "ACTIVE") {
        return Response.redirect(new URL("/admin/login?error=inactive", request.nextUrl));
      }
      if (!isStaff) {
        return Response.redirect(new URL("/", request.nextUrl));
      }
      return true;
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
