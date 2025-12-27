"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LabelList,
} from "recharts";
import { getManagerDashboardData } from "./dashboard_service";

export default function ManagerDashboardPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingCounts, setBookingCounts] = useState({
    today: 0,
    week: 0,
    month: 0,
    total: 0,
  });

  useEffect(() => {
    (async () => {
      try {
        const d = await getManagerDashboardData();
        if (d && d.kpi) {
          setBookingCounts({
            today: d.kpi.todayBookings ?? 0,
            week: d.kpi.weekBookings ?? 0,
            month: d.kpi.monthBookings ?? 0,
            total: d.kpi.totalBookings ?? 0,
          });
          setData(d);
        } else {
          console.error("Invalid data structure:", d);
          setError("Dữ liệu không hợp lệ");
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Không thể tải dữ liệu dashboard từ API thật");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Fallback: nếu API không trả today/week/month nhưng có total > 0, tự tính từ danh sách booking theo branch
  useEffect(() => {
    const shouldFetchBookings =
      data &&
      bookingCounts.total > 0 &&
      bookingCounts.today === 0 &&
      bookingCounts.week === 0 &&
      bookingCounts.month === 0;

    if (!shouldFetchBookings) return;

    const fetchBookingsAndCount = async () => {
      try {
        const res = await fetch(
          `/api/booking/branch?PageNum=1&PageSize=1000&orderByDescending=true`,
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const json = await res.json();
        const list =
          Array.isArray(json?.data?.items) ? json.data.items :
          Array.isArray(json?.data) ? json.data :
          Array.isArray(json) ? json :
          json?.items || [];

        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(startOfDay);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // chủ nhật là 0
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        let cToday = 0, cWeek = 0, cMonth = 0;
        list.forEach((b: any) => {
          if (!b?.startDatetime) return;
          const t = new Date(b.startDatetime);
          if (t >= startOfDay) cToday += 1;
          if (t >= startOfWeek) cWeek += 1;
          if (t >= startOfMonth) cMonth += 1;
        });

        setBookingCounts({
          today: cToday,
          week: cWeek,
          month: cMonth,
          total: bookingCounts.total || list.length,
        });
      } catch (err) {
        // giữ nguyên nếu lỗi
      }
    };

    fetchBookingsAndCount();
  }, [data, bookingCounts]);

  if (loading) {
    return (
      <div className="flex justify-center mt-10 text-gray-500">
        Đang tải dữ liệu dashboard...
      </div>
    );
  }

  // Nếu có lỗi nhưng vẫn có data, vẫn hiển thị với data hiện có
  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center mt-10 space-y-4">
        <div className="text-red-500 font-medium">{error}</div>
        <button
          onClick={() => {
            setLoading(true);
            setError(null);
            getManagerDashboardData()
              .then((d) => {
                if (d && d.kpi) {
                  setData(d);
                } else {
                  setError("Dữ liệu không hợp lệ");
                }
              })
              .catch((err) => {
                console.error(err);
                setError("Không thể tải dữ liệu dashboard");
              })
              .finally(() => setLoading(false));
          }}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  // Nếu không có data, tạo data mặc định
  const defaultData = {
    branch: {},
    kpi: {
      totalVehicles: 0,
      activeVehicles: 0,
      maintenanceVehicles: 0,
      availableVehicles: 0,
      unavailableVehicles: 0,
      todayBookings: 0,
      weekBookings: 0,
      monthBookings: 0,
      totalBookings: 0,
      todayRevenue: 0,
      weekRevenue: 0,
      monthRevenue: 0,
      bookingStatusCounts: {},
      totalClaims: 0,
      pendingClaims: 0,
      approvedClaims: 0,
      rejectedClaims: 0,
      totalTransfers: 0,
      pendingTransfers: 0,
      approvedTransfers: 0,
    },
  };

  const { branch, kpi } = data || defaultData;
  const branchName = branch?.branchName || branch?.name || "Chi nhánh";
  const formatCurrency = (amount: number) => {
    return amount ? amount.toLocaleString("vi-VN") + " ₫" : "—";
  };
  const getBookingStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      Pending: "Chờ xử lý",
      PENDING: "Chờ xử lý",
      Renting: "Đang thuê",
      RENTING: "Đang thuê",
      Completed: "Hoàn thành",
      COMPLETED: "Hoàn thành",
      Cancelled: "Đã hủy",
      CANCELLED: "Đã hủy",
      Returned: "Đã trả",
      RETURNED: "Đã trả",
    };
    return statusMap[status] || status;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">Tổng quan</h1>
        <span className="text-sm text-gray-500">{branchName}</span>
      </div>

      {/* Doanh thu cards */}
      <section>
        <h2 className="text-lg font-semibold mb-3 text-gray-700">Doanh thu</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card title="Doanh thu hôm nay" value={formatCurrency(kpi.todayRevenue ?? 0)} icon="💰" />
          <Card title="Doanh thu tuần này" value={formatCurrency(kpi.weekRevenue ?? 0)} icon="📊" />
          <Card title="Doanh thu tháng này" value={formatCurrency(kpi.monthRevenue ?? 0)} icon="📈" />
        </div>
      </section>

      {/* 2 biểu đồ: cột & tròn */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-800">Booking theo tháng</h3>
            <span className="text-xs text-gray-400">Biểu đồ cột</span>
          </div>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={
                  kpi.monthlyBookings
                    ? Object.entries(kpi.monthlyBookings).map(([month, count]) => ({
                        name: month.replace("Tháng ", "T"),
                        value: count as number,
                      }))
                    : []
                }
                barCategoryGap={8}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="name" 
                  stroke="#6B7280" 
                  fontSize={11}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis stroke="#6B7280" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                  }}
                  formatter={(value: any) => [value, "Số booking"]}
                  labelFormatter={(label) => `Tháng ${label.replace("T", "")}`}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]}>
                  <LabelList dataKey="value" position="top" fontSize={11} fill="#0F172A" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-800">Tỷ trọng trạng thái xe</h3>
            <span className="text-xs text-gray-400">Biểu đồ tròn</span>
          </div>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: "Đang thuê", value: kpi.activeVehicles ?? 0 },
                    { name: "Sẵn sàng", value: kpi.availableVehicles ?? 0 },
                    { name: "Sửa chữa", value: kpi.maintenanceVehicles ?? 0 },
                    { name: "Không khả dụng", value: kpi.unavailableVehicles ?? 0 },
                  ]}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {["#3b82f6", "#10b981", "#f59e0b", "#ef4444"].map((c, idx) => (
                    <Cell key={idx} fill={c} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip
                  formatter={(val: number, n) => [`${val}`, n]}
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Booking status detail */}
      {kpi.bookingStatusCounts && Object.keys(kpi.bookingStatusCounts).length > 0 && (
        <section className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="font-semibold text-lg mb-4 text-gray-800">Thống kê Booking theo trạng thái</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(kpi.bookingStatusCounts).map(([status, count]) => (
              <div key={status} className="text-center p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">{getBookingStatusLabel(status)}</p>
                <p className="text-xl font-semibold mt-1">{count as number}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Transfer requests */}
      <section className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="font-semibold text-lg mb-4 text-gray-800">Yêu cầu điều chuyển xe</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Tổng số yêu cầu" value={kpi?.totalTransfers || 0} icon="🚚" />
          <StatCard title="Chờ duyệt" value={kpi?.pendingTransfers || 0} icon="⏳" color="orange" />
          <StatCard title="Đã duyệt" value={kpi?.approvedTransfers || 0} icon="✅" color="green" />
        </div>
      </section>

      {/* Claims */}
      {(kpi.totalClaims ?? 0) > 0 && (
        <section className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="font-semibold text-lg mb-4 text-gray-800">Sự cố & Bảo hiểm</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard title="Tổng số hồ sơ" value={kpi.totalClaims ?? 0} icon="📄" />
            <StatCard title="Chờ xử lý" value={kpi.pendingClaims ?? 0} icon="⏳" color="orange" />
            <StatCard title="Đã duyệt" value={kpi.approvedClaims ?? 0} icon="✅" color="green" />
            <StatCard title="Đã từ chối" value={kpi.rejectedClaims ?? 0} icon="❌" color="red" />
          </div>
        </section>
      )}

      <p className="text-center text-gray-400 text-xs pt-2">
        eMotoRent · Manager Dashboard — dữ liệu thật từ API Backend
      </p>
    </div>
  );
}

function Card({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon?: string;
  color?: "blue" | "green" | "orange" | "red";
}) {
  const colorClasses = {
    blue: "border-l-blue-500",
    green: "border-l-green-500",
    orange: "border-l-orange-500",
    red: "border-l-red-500",
  };

  return (
    <div
      className={`bg-white p-4 rounded-lg shadow-sm border border-gray-100 border-l-4 ${
        color ? colorClasses[color] : "border-l-purple-500"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <h2 className="text-2xl font-semibold mt-1">{value}</h2>
        </div>
        {icon && <span className="text-3xl">{icon}</span>}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number | string;
  icon?: string;
  color?: "blue" | "green" | "orange" | "red";
}) {
  const colorClasses = {
    blue: "text-blue-600",
    green: "text-green-600",
    orange: "text-orange-600",
    red: "text-red-600",
  };
  const displayValue = value !== null && value !== undefined ? value : 0;

  return (
    <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-100">
      {icon && (
        <span className={`text-2xl ${color ? colorClasses[color] : ""}`}>{icon}</span>
      )}
      <p className="text-sm text-gray-600 mt-2">{title}</p>
      <p className={`text-2xl font-semibold mt-1 ${color ? colorClasses[color] : ""}`}>
        {displayValue}
      </p>
    </div>
  );
}


function VerticalBarChart({
  title,
  data,
  valueFormatter,
}: {
  title: string;
  data: { label: string; value: number; color?: string }[];
  valueFormatter?: (v: number) => string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const chartWidth = 260;
  const chartHeight = 160;
  const barGap = 10;
  const barWidth = Math.max(
    20,
    Math.min(40, (chartWidth - barGap * (data.length + 1)) / data.length)
  );

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        <span className="text-xs text-gray-400">Biểu đồ cột dọc</span>
      </div>
      <div className="flex items-center justify-center">
        <svg
          width="100%"
          viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`}
          role="img"
          aria-label={title}
        >
          {data.map((item, idx) => {
            const barHeight = (item.value / max) * chartHeight;
            const x = barGap + idx * (barWidth + barGap);
            const y = chartHeight - barHeight;
            const color = item.color || "#6366f1";
            const labelY = chartHeight + 14;
            const valueY = y - 6;

            return (
              <g key={item.label}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={6}
                  fill={color}
                >
                  <title>
                    {item.label}:{" "}
                    {valueFormatter ? valueFormatter(item.value) : item.value}
                  </title>
                </rect>
                <text
                  x={x + barWidth / 2}
                  y={valueY}
                  textAnchor="middle"
                  className="text-[10px] fill-gray-800 font-semibold"
                >
                  {valueFormatter ? valueFormatter(item.value) : item.value}
                </text>
                <text
                  x={x + barWidth / 2}
                  y={labelY}
                  textAnchor="middle"
                  className="text-[10px] fill-gray-600"
                >
                  {item.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
