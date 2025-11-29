"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, LogOut, Wrench } from "lucide-react";
import { message } from "antd";
import {
  readBrowserCookies,
  resolveAccountFromSession,
} from "@/utils/sessionAccount";

const NAV_ITEMS = [
  { label: "Quản lý sửa chữa", href: "/dashboard/technician/repair-requests" },
];

export default function TechnicianLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [technicianName, setTechnicianName] = useState("Technician");

  useEffect(() => {
    let mounted = true;
    const bootstrap = async () => {
      const cookies = readBrowserCookies();
      if (cookies.fullName && mounted) setTechnicianName(cookies.fullName);

      const account = await resolveAccountFromSession(cookies);
      if (!mounted || !account) return;

      const staffId = account.staff?.id;
      const fullname =
        account.fullname || account.fullName || account.username || "Technician";

      if (staffId) {
        document.cookie = `staffId=${staffId}; path=/;`;
      }
      document.cookie = `fullName=${encodeURIComponent(fullname)}; path=/;`;

      if (mounted) {
        setTechnicianName(fullname);
      }
    };
    bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = () => {
    if (typeof document === "undefined") return;
    const keys = [
      "token",
      "role",
      "fullName",
      "username",
      "userId",
      "branchId",
      "branchName",
      "staffId",
    ];
    keys.forEach(
      (key) =>
        (document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`)
    );
    message.success("Đã đăng xuất");
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-800">
      <aside className="w-64 bg-white border-r p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
            <Wrench size={20} />
          </div>
          <div>
            <p className="font-semibold text-gray-900">eMotoRent</p>
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Technician
            </p>
          </div>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  active
                    ? "bg-indigo-600 text-white"
                    : "text-gray-600 hover:bg-indigo-50"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 text-sm text-red-600 border border-red-200 rounded-lg py-2 hover:bg-red-50 transition"
        >
          <LogOut size={16} />
          Đăng xuất
        </button>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b px-6 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase text-gray-400">Technician Workspace</p>
            <p className="text-sm font-medium text-gray-700">
              Theo dõi yêu cầu sửa chữa được phân công
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Bell className="w-5 h-5 text-gray-500" />
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold">
                {technicianName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium">{technicianName}</p>
                <p className="text-xs text-gray-500">Technician</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

