"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import {
  LayoutDashboard,
  Users,
  UserCog,
  Car,
  Building2,
  Route,
  Wrench,
  ShieldAlert,
  FileText,
  Settings,
  Wallet,
  LogOut,
  Calendar,
} from "lucide-react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    { label: "Dashboard", href: "/dashboard/admin/dashboard", icon: <LayoutDashboard size={18} /> },
    { label: "Quản lí tài khoản", href: "/dashboard/admin/accounts", icon: <Users size={18} /> },
    { label: "Quản lí nhân sự", href: "/dashboard/admin/staffs", icon: <UserCog size={18} /> },
    { label: "Quản lí xe", href: "/dashboard/admin/vehicles", icon: <Car size={18} /> },
    { label: "Quản lí Model xe", href: "/dashboard/admin/vehicle-models", icon: <Car size={18} /> },
    { label: "Quản lí chi nhánh", href: "/dashboard/admin/branches", icon: <Building2 size={18} /> },
    { label: "Quản lí đặt xe", href: "/dashboard/admin/bookings", icon: <Calendar size={18} /> },
    { label: "Quản lí sửa chữa", href: "/dashboard/admin/repair-requests", icon: <Wrench size={18} /> },
    { label: "Điều phối xe", href: "/dashboard/admin/transfers", icon: <Route size={18} /> },
    { label: "Cấu hình hệ thống", href: "/dashboard/admin/configuration", icon: <Settings size={18} /> },
    { label: "Sự cố & bảo hiểm", href: "/dashboard/admin/insurance", icon: <ShieldAlert size={18} /> },
    { label: "Giá & chính sách", href: "/dashboard/admin/policies", icon: <Wallet size={18} /> },
    { label: "Báo cáo", href: "/dashboard/admin/reports", icon: <FileText size={18} /> },
    { label: "Settings", href: "/dashboard/admin/settings", icon: <Settings size={18} /> },
  ];

  const handleLogout = () => {
    Cookies.remove("emoto_token");
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen flex bg-gray-100 text-gray-800">
      {/* Sidebar */}
      <aside className="w-64 bg-[#111827] text-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-5 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">eMotoRent</h2>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-3 mt-2 space-y-1">
          {menuItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-gray-700 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="m-4 flex items-center gap-2 bg-red-600 hover:bg-red-700 text-sm font-medium px-3 py-2 rounded-lg transition"
        >
          <LogOut size={16} /> Đăng xuất
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b shadow-sm h-14 flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-gray-800">
            {getPageTitle(pathname)}
          </h1>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm">
              A
            </div>
            <span className="text-sm text-gray-700 font-medium">Admin</span>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}

function getPageTitle(path: string) {
  if (path.includes("accounts")) return "Quản lí tài khoản";
  if (path.includes("staffs")) return "Quản lí nhân sự";
  if (path.includes("vehicles")) return "Quản lí xe";
  if (path.includes("vehicle-models")) return "Quản lí Model xe";
  if (path.includes("branches")) return "Quản lí chi nhánh";
  if (path.includes("bookings")) return "Quản lí đặt xe";
  if (path.includes("repair-requests")) return "Quản lí sửa chữa";
  if (path.includes("transfers")) return "Điều phối xe";
  if (path.includes("configuration")) return "Quản lý cấu hình hệ thống";
  if (path.includes("insurance")) return "Sự cố & bảo hiểm";
  if (path.includes("policies")) return "Giá & chính sách";
  if (path.includes("reports")) return "Báo cáo";
  if (path.includes("settings")) return "Cài đặt hệ thống";
  return "Dashboard";
}
