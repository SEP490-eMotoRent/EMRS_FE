import { fetchBackend } from "@/utils/helpers";

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
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const res = await fetchBackend("/dashboard/admin");

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


