"use server";

import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const username = formData.get("username")?.toString();
  const password = formData.get("password")?.toString();

  if (!username || !password) {
    throw new Error("Vui lòng nhập đầy đủ thông tin đăng nhập");
  }

  // FE gọi vào BFF
  const res = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
    cache: "no-store",
  });

  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.message || "Sai tài khoản hoặc mật khẩu!");
  }

  const user = json.data.user;

  // CHỈ redirect - KHÔNG tự set cookie
  if (user.role === "ADMIN") redirect("/dashboard/admin");
  if (user.role === "MANAGER") redirect("/dashboard/manager");

  throw new Error("Bạn không có quyền truy cập");
}
