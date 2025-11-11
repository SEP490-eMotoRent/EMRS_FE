"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const username = formData.get("username");
  const password = formData.get("password");

  if (!username || !password) {
    throw new Error("Vui lòng nhập đầy đủ thông tin đăng nhập");
  }

  // 🟢 Gọi API thật thông qua proxy (đã cấu hình trong next.config.ts)
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
    cache: "no-store",
  }).catch((err) => {
    console.error("Fetch error:", err);
    throw new Error("Không thể kết nối đến máy chủ. Vui lòng thử lại sau!");
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Login error:", text);
    throw new Error("Tài khoản hoặc mật khẩu không đúng!");
  }

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.message || "Đăng nhập thất bại");
  }

  // ✅ Dữ liệu user trả về từ API
  const { accessToken, user } = json.data;
  if (!user || !accessToken) {
    throw new Error("Phản hồi từ máy chủ không hợp lệ");
  }

  // 🍪 Lưu thông tin vào cookies (cho FE dùng sau này)
  const cookieStore = cookies();

  cookieStore.set("token", accessToken, { path: "/", httpOnly: false });
  cookieStore.set("role", user.role, { path: "/" });
  cookieStore.set("branchId", user.branchId, { path: "/" });
  cookieStore.set("branchName", user.branchName, { path: "/" });
  cookieStore.set("fullName", user.fullName, { path: "/" });

  // 🚀 Điều hướng dựa theo vai trò
  switch (user.role?.toUpperCase()) {
    case "MANAGER":
      redirect("/manager/dashboard");
      break;
    case "ADMIN":
      redirect("/admin/dashboard");
      break;
    default:
      throw new Error("Tài khoản không có quyền truy cập hệ thống!");
  }
}
