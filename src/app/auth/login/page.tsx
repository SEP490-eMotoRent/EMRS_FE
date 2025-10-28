"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { loginAdmin } from "./action";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await loginAdmin(email, password);
      if (res.success) {
        // ✅ Lưu token vào cookie để middleware đọc
        Cookies.set("emoto_token", res.token, { expires: 1 });
        // ✅ Redirect tới dashboard
        router.push("/dashboard/admin/dashboard");
      } else {
        setError(res.message);
      }
    } catch (err) {
      console.error(err);
      setError("Lỗi đăng nhập!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-md p-8 w-full max-w-md"
      >
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Đăng nhập Admin
        </h1>

        {error && (
          <div className="bg-red-100 text-red-600 text-sm p-2 rounded mb-4">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-600">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border rounded-lg p-2 focus:ring focus:ring-blue-200"
            placeholder="admin@gmail.com"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1 text-gray-600">
            Mật khẩu
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border rounded-lg p-2 focus:ring focus:ring-blue-200"
            placeholder="••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>
    </div>
  );
}
