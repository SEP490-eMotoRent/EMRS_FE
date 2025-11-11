"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Menu } from "lucide-react";

const menuItems = [
  { name: "Tổng quan", path: "/dashboard/manager" },
  { name: "Vận hành (Giao/Trả)", path: "/dashboard/manager/operations" },
  { name: "Quản lý Fleet", path: "/dashboard/manager/fleet" },
  { name: "Bookings", path: "/dashboard/manager/bookings" },
  { name: "Điều chuyển xe", path: "/dashboard/manager/transfers" },
  { name: "Sự cố & Bảo hiểm", path: "/dashboard/manager/insurance" },
  { name: "Sửa chữa", path: "/dashboard/manager/repair" },
  { name: "Nhân sự", path: "/dashboard/manager/staffs" },
  { name: "IoT Realtime", path: "/dashboard/manager/iot" },
  { name: "Báo cáo", path: "/dashboard/manager/reports" },
  { name: "Cài đặt", path: "/dashboard/manager/settings" },
];

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-800">
      {/* ===== Sidebar ===== */}
      <aside className="w-64 bg-white border-r p-4 flex flex-col">
        <div className="text-lg font-semibold mb-6">
          eMotoRent · <span className="text-indigo-600">Manager</span>
        </div>

        <nav className="flex flex-col gap-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : "text-gray-700 hover:bg-indigo-50"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ===== Main Content ===== */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex justify-between items-center bg-white border-b px-6 py-3">
          <div className="flex items-center gap-3">
            <Menu className="w-5 h-5 text-gray-600 md:hidden" />
            <p className="text-sm text-gray-600">
              Chi nhánh: <span className="font-medium">An Tịnh</span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Bell className="w-5 h-5 text-gray-600" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center font-semibold text-sm">
                M
              </div>
              <div className="text-sm">
                <p className="font-medium">Manager</p>
                <p className="text-gray-500 text-xs">manager@emoto</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
