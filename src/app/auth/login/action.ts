"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const username = formData.get("username");
  const password = formData.get("password");

  if (!username || !password) {
    throw new Error("Vui lòng nhập đầy đủ thông tin đăng nhập");
  }

  // Gọi API thật
const res = await fetch("/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username, password }),
});


  if (!res.ok) {
    throw new Error("Sai tài khoản hoặc mật khẩu!");
  }

  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Đăng nhập thất bại!");

  const { accessToken, user } = json.data;

  // Lưu cookie
  const cookieStore = cookies();
  cookieStore.set("token", accessToken, { path: "/" });
  cookieStore.set("role", user.role, { path: "/" });
  cookieStore.set("fullName", user.fullName, { path: "/" });
  cookieStore.set("branchId", user.branchId || "", { path: "/" });
  cookieStore.set("branchName", user.branchName || "", { path: "/" });

  // Điều hướng theo vai trò
  switch (user.role.toUpperCase()) {
    case "ADMIN":
      redirect("/dashboard/admin");
    case "MANAGER":
      redirect("/dashboard/manager");
    default:
      throw new Error("Tài khoản không có quyền truy cập!");
  }
}
