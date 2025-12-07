"use client";

import { useEffect, useState } from "react";
import { message } from "antd";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

import {
  AdminDashboardData,
  getAdminDashboardData,
} from "./admin_dashboard_service";

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const dashboard = await getAdminDashboardData();
        setData(dashboard);
      } catch (err: any) {
        console.error("Failed to load admin dashboard:", err);
        message.error(err?.message || "Không thể tải dữ liệu dashboard");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-gray-500">
        Đang tải dữ liệu...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-red-500">
        Không thể tải dữ liệu dashboard
      </div>
    );
  }

  const vehicleTotals = data.vehicle || ({} as AdminDashboardData["vehicle"]);
  const accountTotals = data.accounts || ({} as AdminDashboardData["accounts"]);
  const trackedPercent = vehicleTotals.totalVehicles
    ? Math.round(
        (vehicleTotals.totalTracked / vehicleTotals.totalVehicles) * 100
      )
    : 0;

  const vehicleStatusData = [
    { name: "Sẵn sàng", value: vehicleTotals.totalAvailable || 0 },
    { name: "Đã đặt", value: vehicleTotals.totalBooked || 0 },
    { name: "Giữ chỗ", value: vehicleTotals.totalHold || 0 },
    { name: "Đang điều chuyển", value: vehicleTotals.totalTransfering || 0 },
    { name: "Đang thuê", value: vehicleTotals.totalRented || 0 },
    { name: "Không khả dụng", value: vehicleTotals.totalUnavailable || 0 },
    { name: "Đang sửa", value: vehicleTotals.totalRepaired || 0 },
  ];

  const accountRoleData = [
    { name: "Admin", value: accountTotals.totalAdmin || 0 },
    { name: "Manager", value: accountTotals.totalManager || 0 },
    { name: "Staff", value: accountTotals.totalStaff || 0 },
    { name: "Technician", value: accountTotals.totalTechnician || 0 },
    { name: "Khách thuê", value: accountTotals.totalRenter || 0 },
  ];

  const revenueInMillions = (data.transactions?.totalRevenue || 0) / 1_000_000;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard
          title="Tổng model"
          value={data.vehicleModel?.totalVehicleModels ?? 0}
        />
        <SummaryCard
          title="Tổng xe"
          value={vehicleTotals.totalVehicles ?? 0}
          subText={`${vehicleTotals.totalAvailable ?? 0} đang sẵn sàng`}
        />
        <SummaryCard
          title="Tổng chi nhánh"
          value={data.branch?.totalBranches ?? 0}
        />
        <SummaryCard
          title="Tổng tài khoản"
          value={accountTotals.totalAccounts ?? 0}
          subText={`${accountTotals.totalManager ?? 0} manager`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border rounded-2xl p-4">
          <h2 className="font-semibold mb-2">Trạng thái đội xe</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={vehicleStatusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#6366F1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white border rounded-2xl p-4">
          <h2 className="font-semibold mb-4">Phân bổ tài khoản</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={accountRoleData}
                dataKey="value"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
              >
                {accountRoleData.map((_, idx) => (
                  <Cell
                    key={idx}
                    fill={["#4F46E5", "#EC4899", "#10B981", "#F59E0B", "#94A3B8"][idx % 5]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <DetailCard
          title="Xe có tracking"
          value={`${vehicleTotals.totalTracked ?? 0}/${vehicleTotals.totalVehicles ?? 0}`}
          extra={`${trackedPercent}% đội xe`}
        />
        <DetailCard
          title="Xe đang sửa chữa"
          value={vehicleTotals.totalRepaired ?? 0}
          extra={`${vehicleTotals.totalUnavailable ?? 0} xe không khả dụng`}
        />
        <DetailCard
          title="Tổng doanh thu"
          value={`${revenueInMillions.toFixed(1)} triệu`}
          extra="Từ tất cả giao dịch"
        />
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  subText,
}: {
  title: string;
  value: number | string;
  subText?: string;
}) {
  return (
    <div className="bg-white border rounded-2xl p-4 shadow-sm">
      <p className="text-gray-500 text-sm">{title}</p>
      <p className="text-3xl font-semibold mt-2">{value}</p>
      {subText && <p className="text-xs text-gray-400 mt-1">{subText}</p>}
    </div>
  );
}

function DetailCard({
  title,
  value,
  extra,
}: {
  title: string;
  value: string | number;
  extra?: string;
}) {
  return (
    <div className="bg-white border rounded-2xl p-4 shadow-sm">
      <p className="text-gray-500 text-sm">{title}</p>
      <p className="text-2xl font-semibold mt-2">{value}</p>
      {extra && <p className="text-xs text-gray-400 mt-1">{extra}</p>}
    </div>
  );
}