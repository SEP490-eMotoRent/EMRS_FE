"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

import { getBranches } from "@/app/dashboard/admin/branches/branch_service";
import { getVehicles } from "@/services/vehicle_service";
import { getBookings } from "@/services/booking_service";
import { getPayments } from "@/services/payment_service";

export default function Dashboard() {
  const [data, setData] = useState<any>({
    branches: [],
    vehicles: [],
    bookings: [],
    payments: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [branches, vehicles, bookings, payments] = await Promise.all([
          getBranches(),
          getVehicles(),
          getBookings(),
          getPayments(),
        ]);
        setData({ branches, vehicles, bookings, payments });
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  if (loading) return <div>Đang tải dữ liệu...</div>;

  const activeVehicles =
    data.vehicles?.filter((v: any) => v.status === "rented")?.length ?? 0;

  const maintenanceVehicles =
    data.vehicles?.filter((v: any) => v.status === "maintenance")?.length ?? 0;

  const totalRevenue =
    data.payments?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) ?? 0;

  const todayBookings =
    data.bookings?.filter(
      (b: any) =>
        new Date(b.created_at).toDateString() === new Date().toDateString()
    )?.length ?? 0;

  const chartRevenue = [
    { day: "T2", value: 22 },
    { day: "T3", value: 28 },
    { day: "T4", value: 25 },
    { day: "T5", value: 30 },
    { day: "T6", value: 27 },
    { day: "T7", value: 35 },
    { day: "CN", value: 40 },
  ];

  const branchStats = data.branches?.map((b: any, i: number) => ({
    name: b.branch_name || `CN${i + 1}`,
    count: Math.floor(Math.random() * 100) + 20, // demo
  }));

  const activeRatio = Math.round(
    (activeVehicles / (data.vehicles?.length || 1)) * 100
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card title="Tổng khách thuê (hôm nay)" value={todayBookings} />
        <Card title="Xe đang được thuê" value={activeVehicles} />
        <Card title="Doanh thu (hôm nay)" value="78.5 triệu" />
        <Card title="Xe bảo trì" value={maintenanceVehicles} />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart */}
        <div className="bg-white border rounded-2xl p-4">
          <h2 className="font-semibold mb-2">Doanh thu 7 ngày gần nhất</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#4F46E5" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-gray-400 text-xs mt-1">Đơn vị: triệu VND</p>
        </div>

        {/* Bar Chart */}
        <div className="bg-white border rounded-2xl p-4">
          <h2 className="font-semibold mb-2">Xe theo chi nhánh</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={branchStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#6366F1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white border rounded-2xl p-4 flex flex-col items-center justify-center">
          <h2 className="font-semibold mb-2">Tỉ lệ xe hoạt động</h2>
          <ResponsiveContainer width="80%" height={180}>
            <PieChart>
              <Pie
                data={[
                  { name: "Hoạt động", value: activeRatio },
                  { name: "Không hoạt động", value: 100 - activeRatio },
                ]}
                dataKey="value"
                innerRadius={60}
                outerRadius={80}
                startAngle={90}
                endAngle={450}
              >
                <Cell fill="#F59E0B" />
                <Cell fill="#E5E7EB" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <p className="text-2xl font-bold text-yellow-500">{activeRatio}%</p>
          <p className="text-sm text-gray-500 mt-1">
            Đang hoạt động ({activeVehicles}/{data.vehicles?.length})
          </p>
        </div>
      </div>
    </div>
  );
}

// ===================
// Card component
// ===================
function Card({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-white border rounded-2xl p-4 shadow-sm">
      <p className="text-gray-500 text-sm">{title}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </div>
  );
}
