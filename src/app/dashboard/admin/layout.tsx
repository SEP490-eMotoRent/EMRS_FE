"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import {
  LayoutDashboard,
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
  ClipboardCheck,
  Crown,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { label: "Dashboard", href: "/dashboard/admin/dashboard", icon: <LayoutDashboard size={18} /> },
    { label: "Quản lí nhân sự", href: "/dashboard/admin/staffs", icon: <UserCog size={18} /> },
    { label: "Quản lí xe", href: "/dashboard/admin/vehicles", icon: <Car size={18} /> },
    { label: "Quản lí Model xe", href: "/dashboard/admin/vehicle-models", icon: <Car size={18} /> },
    { label: "Quản lí chi nhánh", href: "/dashboard/admin/branches", icon: <Building2 size={18} /> },
    { label: "Quản lí đặt xe", href: "/dashboard/admin/bookings", icon: <Calendar size={18} /> },
    { label: "Quản lý giao trả xe", href: "/dashboard/admin/operations", icon: <ClipboardCheck size={18} /> },
    { label: "Quản lí sửa chữa", href: "/dashboard/admin/repair-requests", icon: <Wrench size={18} /> },
    { label: "Điều phối xe", href: "/dashboard/admin/transfers", icon: <Route size={18} /> },
    { label: "Cấu hình hệ thống", href: "/dashboard/admin/configuration", icon: <Settings size={18} /> },
    { label: "Sự cố & bảo hiểm", href: "/dashboard/admin/insurance", icon: <ShieldAlert size={18} /> },
    { label: "Giá & chính sách", href: "/dashboard/admin/policies", icon: <Wallet size={18} /> },
    { label: "Giá ngày lễ", href: "/dashboard/admin/holiday-pricing", icon: <Calendar size={18} /> },
    { label: "Membership", href: "/dashboard/admin/memberships", icon: <Crown size={18} /> },
  ];

  const handleLogout = () => {
    // Xóa tất cả cookies
    Cookies.remove("emoto_token");
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "branchId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "branchName=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "fullName=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "username=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "userId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "staffId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    
    // Sử dụng replace thay vì push để không cho phép quay lại
    router.replace("/auth/login");
  };

  return (
    <div className="min-h-screen flex bg-gray-100 text-gray-800">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#111827] text-gray-200 flex flex-col transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo with close button */}
        <div className="p-5 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">eMotoRent</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-3 mt-2 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-gray-700 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                {item.icon}
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="m-4 flex items-center gap-2 bg-red-600 hover:bg-red-700 text-sm font-medium px-3 py-2 rounded-lg transition"
        >
          <LogOut size={16} /> <span className="truncate">Đăng xuất</span>
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b shadow-sm h-14 flex items-center justify-between px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-600 hover:text-gray-900"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-3 ml-auto">
            <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              A
            </div>
            <span className="text-sm text-gray-700 font-medium hidden sm:inline">Admin</span>
          </div>
        </header>

        <div className="flex-1 p-4 lg:p-6 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}

function getPageTitle(path: string) {
  if (path.includes("staffs")) return "Quản lí nhân sự";
  if (path.includes("vehicles")) return "Quản lí xe";
  if (path.includes("vehicle-models")) return "Quản lí Model xe";
  if (path.includes("branches")) return "Quản lí chi nhánh";
  if (path.includes("bookings")) return "Quản lí đặt xe";
  if (path.includes("operations")) return "Quản lý giao trả xe";
  if (path.includes("repair-requests")) return "Quản lí sửa chữa";
  if (path.includes("transfers")) return "Điều phối xe";
  if (path.includes("memberships")) return "Quản lý membership";
  if (path.includes("configuration")) return "Quản lý cấu hình hệ thống";
  if (path.includes("insurance")) return "Sự cố & bảo hiểm";
  if (path.includes("policies")) return "Giá & chính sách";
  if (path.includes("holiday-pricing")) return "Giá ngày lễ";
  // Hidden routes (reports/settings) are removed from menu
  return "Dashboard";
}
