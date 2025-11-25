import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const role = req.cookies.get("role")?.value;
  const normalizedRole = role?.toUpperCase();

  const path = req.nextUrl.pathname;

  // Chưa login mà vào dashboard
  if (!token && path.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  if (path.startsWith("/dashboard/admin") && normalizedRole !== "ADMIN") {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  if (path.startsWith("/dashboard/manager") && normalizedRole !== "MANAGER") {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  if (path.startsWith("/dashboard/technician") && normalizedRole !== "TECHNICIAN") {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
