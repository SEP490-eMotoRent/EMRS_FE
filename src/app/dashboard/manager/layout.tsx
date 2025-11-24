"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Menu, LogOut } from "lucide-react";
import { message } from "antd";

const menuItems = [
  { name: "Tổng quan", path: "/dashboard/manager" },
  { name: "Vận hành (Giao/Trả)", path: "/dashboard/manager/operations" },
  { name: "Quản lý Fleet", path: "/dashboard/manager/fleet" },
  { name: "Bookings", path: "/dashboard/manager/bookings" },
  { name: "Điều chuyển xe", path: "/dashboard/manager/transfers" },
  { name: "Tickets - Hỗ trợ kỹ thuật", path: "/dashboard/manager/tickets" },
  { name: "Sự cố & Bảo hiểm", path: "/dashboard/manager/insurance" },
  { name: "IoT Realtime", path: "/dashboard/manager/iot" },
  { name: "Cài đặt", path: "/dashboard/manager/settings" },
];

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [branchName, setBranchName] = useState<string>("...");
  const [managerName, setManagerName] = useState<string>("Manager");
  const [managerEmail, setManagerEmail] = useState<string>("");

  const handleLogout = async () => {
    try {
      // Xóa tất cả cookies
      document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "branchId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "branchName=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "fullName=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "username=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "userId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      
      message.success("Đã đăng xuất thành công");
      // Chuyển về trang login đúng route
      router.push("/auth/login");
    } catch (err) {
      console.error("Logout error:", err);
      message.error("Đăng xuất thất bại");
    }
  };

  useEffect(() => {
    (async () => {
      try {
        // Ưu tiên đọc từ cookie (đã set khi login)
        let username: string | null = null;
        if (typeof document !== "undefined") {
          const cookieStr = document.cookie || "";
          const cookies: Record<string, string> = {};
          cookieStr.split(";").forEach((c) => {
            const [key, value] = c.trim().split("=");
            if (key && value) {
              cookies[key] = decodeURIComponent(value);
            }
          });

          // Đọc từ cookie trước
          if (cookies.branchName) {
            setBranchName(cookies.branchName);
          }
          if (cookies.fullName) {
            setManagerName(cookies.fullName);
          }
          if (cookies.username) {
            setManagerEmail(cookies.username);
            username = cookies.username;
          }
        }

        // Nếu có username, gọi API để lấy đầy đủ thông tin
        if (username) {
          try {
            // Bước 1: Gọi GET /api/account để lấy tất cả accounts
            const allAccountsRes = await fetch("/api/account", { cache: "no-store" });
            if (!allAccountsRes.ok) {
              console.warn("Failed to fetch accounts:", allAccountsRes.status);
              return;
            }
            
            const allAccountsJson = await allAccountsRes.json();
            const accountsData = allAccountsJson.data || [];
            
            // Bước 2: Tìm account theo username
            let targetAccount = null;
            if (Array.isArray(accountsData)) {
              targetAccount = accountsData.find((acc: any) => acc.username === username);
            }
            
            // Nếu không tìm thấy theo username, tìm theo role MANAGER
            if (!targetAccount && Array.isArray(accountsData)) {
              targetAccount = accountsData.find((acc: any) => acc.role === "MANAGER");
            }
            
            if (!targetAccount) {
              console.warn("No account found for username:", username);
              return;
            }
            
            // Bước 3: Lấy account.id (KHÔNG phải staff.id)
            const accountId = targetAccount.id;
            if (!accountId) {
              console.warn("Account ID not found");
              return;
            }
            
            // Bước 4: Gọi GET /api/account/{accountId} để lấy đầy đủ thông tin
            const accountRes = await fetch(`/api/account/${accountId}`, { cache: "no-store" });
            if (!accountRes.ok) {
              console.warn("Failed to fetch account details:", accountRes.status);
              return;
            }
            
            const accountJson = await accountRes.json();
            const accountData = accountJson.data || accountJson;
            
            // Cập nhật tên manager (hỗ trợ cả fullname và fullName)
            const fullName = accountData.fullname || accountData.fullName;
            if (fullName) {
              setManagerName(fullName);
            }
            
            // Cập nhật username/email
            if (accountData.username) {
              setManagerEmail(accountData.username);
            }
            
            // Lấy tên chi nhánh từ staff.branch
            const staff = accountData.staff;
            if (staff && staff.branch) {
              const branchNameFromApi = staff.branch.branchName || "";
              if (branchNameFromApi) {
                setBranchName(branchNameFromApi);
              }
            }
          } catch (e) {
            console.error("Error fetching account details:", e);
          }
        }
      } catch (e) {
        console.error("Fetch account failed", e);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-800">
      {/* ===== Sidebar ===== */}
      <aside className="w-64 bg-white border-r p-4 flex flex-col">
        <div className="text-lg font-semibold mb-6">
          eMotoRent · <span className="text-indigo-600">Manager</span>
        </div>

        <nav className="flex flex-col gap-1">
          {menuItems.map((item) => {
            let isActive = false;

            if (item.path === "/dashboard/manager") {
              // Tổng quan: active cho /dashboard/manager và /dashboard/manager/dashboard
              isActive =
                pathname === "/dashboard/manager" ||
                pathname === "/dashboard/manager/dashboard";
            } else {
              isActive = pathname.startsWith(item.path);
            }

            return (
              <Link
                key={item.path}
                href={item.path}
                className={`px-3 py-2 rounded-lg text-sm ${
                  isActive
                    ? "bg-indigo-600 text-white font-semibold"
                    : "text-gray-700 hover:bg-indigo-50 font-medium"
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
              Chi nhánh:{" "}
              <span className="font-medium">{branchName || "Đang tải..."}</span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Bell className="w-5 h-5 text-gray-600 cursor-pointer hover:text-gray-800" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center font-semibold text-sm">
                {(managerName || "M").charAt(0).toUpperCase()}
              </div>
              <div className="text-sm">
                <p className="font-medium">{managerName}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
