"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // ❗ BẮT BUỘC PHẢI CÓ SLASH "/" ĐẦU TIÊN
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.message || "Sai tên đăng nhập hoặc mật khẩu!");
        setLoading(false);
        return;
      }

      const user = json.data.user;

      if (user.role === "MANAGER") {
        router.push("/dashboard/manager");
      } else if (user.role === "ADMIN") {
        router.push("/dashboard/admin");
      } else {
        setError("Tài khoản không có quyền truy cập!");
      }
    } catch (err) {
      console.error(err);
      setError("Không thể kết nối server!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form onSubmit={handleLogin} className="bg-white p-6 shadow-md rounded-lg w-80 space-y-4">
        <h2 className="text-center font-semibold text-lg">Đăng nhập</h2>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <input
          type="text"
          placeholder="Tên đăng nhập"
          className="w-full border rounded p-2 text-sm"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Mật khẩu"
          className="w-full border rounded p-2 text-sm"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded text-sm disabled:opacity-50"
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>
    </div>
  );
}
