export interface CashFlowData {
  month: string;
  thu: number; // Thu nhập (Income)
  chi: number; // Chi phí (Expenses)
  revenue?: number; // Doanh thu (Revenue) - optional
}

export interface AdminDashboardData {
  vehicleModel: {
    totalVehicleModels: number;
  };
  vehicle: {
    totalVehicles: number;
    totalAvailable: number;
    totalBooked: number;
    totalHold: number;
    totalTransfering: number;
    totalRented: number;
    totalUnavailable: number;
    totalRepaired: number;
    totalTracked: number;
  };
  branch: {
    totalBranches: number;
  };
  accounts: {
    totalAccounts: number;
    totalAdmin: number;
    totalStaff: number;
    totalManager: number;
    totalRenter: number;
    totalTechnician: number;
  };
  transactions: {
    totalRevenue: number;
  };
  cashflow?: CashFlowData[] | null;
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  // Gọi qua Next.js API route (tổng hợp nhiều backend endpoints)
  const res = await fetch("/api/dashboard/admin", {
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Admin dashboard API error:", res.status, errorText);
    throw new Error("Không thể tải dữ liệu dashboard");
  }

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.message || "Dashboard API trả về lỗi");
  }

  return json.data as AdminDashboardData;
}


