// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 🔐 Lấy token (ưu tiên cookie, có thể hỗ trợ header giả lập)
  const token =
    req.cookies.get("emoto_token")?.value || req.headers.get("x-emoto-token");

  // 🧭 Nếu chưa đăng nhập mà vào /admin/*
  if (pathname.startsWith("/admin") && !token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname); // lưu đường dẫn cũ (nếu cần redirect lại sau)
    return NextResponse.redirect(loginUrl);
  }

  // 🔁 Nếu đã đăng nhập mà cố vào /login
  if (pathname === "/login" && token) {
    return NextResponse.redirect(new URL("/admin/dashboard", req.url));
  }

  // ✅ Cho phép đi tiếp
  return NextResponse.next();
}

// ⚙️ Cấu hình route áp dụng middleware
export const config = {
  matcher: ["/admin/:path*", "/login"], // chỉ chạy với 2 nhóm route này
};
