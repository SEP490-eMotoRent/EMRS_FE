"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);
    const username = formData.get("username");
    const password = formData.get("password");

    if (!username || !password) {
      setErrorMsg("Vui lòng nhập đầy đủ thông tin đăng nhập");
      setLoading(false);
      return;
    }

    try {
      // Gọi thẳng vào BE (giống Swagger)
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "https://emrssep490-haevbjfhdkbzhaaj.southeastasia-01.azurewebsites.net/api";

      const res = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setErrorMsg(json.message || "Sai tài khoản hoặc mật khẩu");
        setLoading(false);
        return;
      }

      const { accessToken, user } = json.data;

      // Tự set cookie phía client để middleware đọc được
      const expires = new Date();
      expires.setDate(expires.getDate() + 7); // 7 ngày
      document.cookie = `token=${accessToken}; path=/; expires=${expires.toUTCString()}`;
      document.cookie = `role=${user.role ?? ""}; path=/; expires=${expires.toUTCString()}`;
      document.cookie = `fullName=${encodeURIComponent(
        user.fullName ?? ""
      )}; path=/; expires=${expires.toUTCString()}`;
      document.cookie = `branchId=${user.branchId ?? ""}; path=/; expires=${expires.toUTCString()}`;
      document.cookie = `branchName=${encodeURIComponent(
        user.branchName ?? ""
      )}; path=/; expires=${expires.toUTCString()}`;

      const role = (user.role ?? "").toUpperCase();

      if (role === "ADMIN") {
        router.push("/dashboard/admin");
      } else if (role === "MANAGER") {
        router.push("/dashboard/manager");
      } else {
        setErrorMsg("Tài khoản không có quyền truy cập");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Đã xảy ra lỗi, thử lại sau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white shadow-lg p-8 rounded-xl w-[350px] flex flex-col gap-4"
      >
        <h2 className="text-2xl font-semibold text-center">Đăng nhập</h2>

        <input
          name="username"
          placeholder="Tên đăng nhập"
          className="border p-2 rounded w-full"
          autoComplete="username"
        />

        <input
          name="password"
          type="password"
          placeholder="Mật khẩu"
          className="border p-2 rounded w-full"
          autoComplete="current-password"
        />

        {errorMsg && (
          <p className="text-red-500 text-sm text-center">{errorMsg}</p>
        )}

        <button
          disabled={loading}
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded transition disabled:opacity-50"
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>
    </div>
  );
}
