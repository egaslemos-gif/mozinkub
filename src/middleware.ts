import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isStaffRole, normalizeRole } from "@/lib/rbac/roles";

export async function middleware(req: Request) {
  const session = await auth();
  const url = new URL(req.url);
  const path = url.pathname;

  if (path.startsWith("/admin") && !path.startsWith("/admin/login")) {
    if (!session?.user) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    if (session.user.status && session.user.status !== "ACTIVE") {
      return NextResponse.redirect(new URL("/admin/login?error=inactive", req.url));
    }
    const role = normalizeRole(session.user.role);
    if (!isStaffRole(role)) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  if (path === "/admin/login" && session?.user?.status === "ACTIVE") {
    const role = normalizeRole(session.user.role);
    if (isStaffRole(role)) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
