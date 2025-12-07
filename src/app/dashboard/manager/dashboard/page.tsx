"use client";

import React, { useEffect, useState } from "react";
import { getManagerDashboardData } from "./dashboard_service";

export default function ManagerDashboardPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const d = await getManagerDashboardData();
        console.log("Dashboard data received:", d);
        console.log("KPI data:", d?.kpi);
        console.log("Total transfers:", d?.kpi?.totalTransfers, typeof d?.kpi?.totalTransfers);
        console.log("Pending transfers:", d?.kpi?.pendingTransfers, typeof d?.kpi?.pendingTransfers);
        console.log("Approved transfers:", d?.kpi?.approvedTransfers, typeof d?.kpi?.approvedTransfers);
        if (d && d.kpi) {
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

  // Format currency
  const formatCurrency = (amount: number) => {
    return amount ? amount.toLocaleString("vi-VN") + " ₫" : "—";
  };

  // Map booking status to Vietnamese
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
    <div className="space-y-4">
      {/* Header */}
      <h1 className="text-xl font-semibold text-gray-800">Tổng quan</h1>

      {/* ===== KPI Cards - Doanh thu ===== */}
      <div>
        <h2 className="text-lg font-semibold mb-3 text-gray-700">Doanh thu</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            title="Doanh thu hôm nay"
            value={formatCurrency(kpi.todayRevenue ?? 0)}
            icon="💰"
          />
          <Card
            title="Doanh thu tuần này"
            value={formatCurrency(kpi.weekRevenue ?? 0)}
            icon="📊"
          />
          <Card
            title="Doanh thu tháng này"
            value={formatCurrency(kpi.monthRevenue ?? 0)}
            icon="📈"
          />
        </div>
      </div>

      {/* ===== KPI Cards - Bookings ===== */}
      <div>
        <h2 className="text-lg font-semibold mb-3 text-gray-700">Bookings</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card
            title="Booking hôm nay"
            value={kpi.todayBookings ?? 0}
            icon="📅"
          />
          <Card
            title="Booking tuần này"
            value={kpi.weekBookings ?? 0}
            icon="📆"
          />
          <Card
            title="Booking tháng này"
            value={kpi.monthBookings ?? 0}
            icon="🗓️"
          />
          <Card
            title="Tổng số booking"
            value={kpi.totalBookings ?? 0}
            icon="📋"
          />
        </div>
      </div>

      {/* ===== KPI Cards - Xe ===== */}
      <div>
        <h2 className="text-lg font-semibold mb-3 text-gray-700">
          Quản lý Fleet
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card
            title="Tổng số xe"
            value={kpi.totalVehicles ?? 0}
            icon="🚗"
          />
          <Card
            title="Xe đang thuê"
            value={kpi.activeVehicles ?? 0}
            icon="✅"
            color="blue"
          />
          <Card
            title="Xe sẵn sàng"
            value={kpi.availableVehicles ?? 0}
            icon="🟢"
            color="green"
          />
          <Card
            title="Xe đang sửa chữa"
            value={kpi.maintenanceVehicles ?? 0}
            icon="🔧"
            color="orange"
          />
          <Card
            title="Xe không khả dụng"
            value={kpi.unavailableVehicles ?? 0}
            icon="🔴"
            color="red"
          />
        </div>
      </div>

      {/* ===== Thông tin chi nhánh ===== */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="font-semibold text-lg mb-4 text-gray-800">
          Thông tin chi nhánh: {branchName}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              <span className="font-semibold">Tổng số xe:</span>{" "}
              {kpi.totalVehicles ?? 0}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Xe đang thuê:</span>{" "}
              {kpi.activeVehicles ?? 0} · <span className="font-semibold">Xe sửa chữa:</span>{" "}
              {kpi.maintenanceVehicles ?? 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">
              <span className="font-semibold">Xe sẵn sàng:</span>{" "}
              {kpi.availableVehicles ?? 0}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Xe không khả dụng:</span>{" "}
              {kpi.unavailableVehicles ?? 0}
            </p>
          </div>
        </div>
      </div>

      {/* ===== Thống kê Booking theo Status ===== */}
      {kpi.bookingStatusCounts && Object.keys(kpi.bookingStatusCounts).length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="font-semibold text-lg mb-4 text-gray-800">
            Thống kê Booking theo trạng thái
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(kpi.bookingStatusCounts).map(([status, count]) => (
              <div key={status} className="text-center p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">
                  {getBookingStatusLabel(status)}
                </p>
                <p className="text-xl font-semibold mt-1">{count as number}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== Insurance Claims ===== */}
      {(kpi.totalClaims ?? 0) > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="font-semibold text-lg mb-4 text-gray-800">
            Sự cố & Bảo hiểm
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              title="Tổng số hồ sơ"
              value={kpi.totalClaims ?? 0}
              icon="📄"
            />
            <StatCard
              title="Chờ xử lý"
              value={kpi.pendingClaims ?? 0}
              icon="⏳"
              color="orange"
            />
            <StatCard
              title="Đã duyệt"
              value={kpi.approvedClaims ?? 0}
              icon="✅"
              color="green"
            />
            <StatCard
              title="Đã từ chối"
              value={kpi.rejectedClaims ?? 0}
              icon="❌"
              color="red"
            />
          </div>
        </div>
      )}

      {/* ===== Vehicle Transfer Requests ===== */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="font-semibold text-lg mb-4 text-gray-800">
          Yêu cầu điều chuyển xe
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Tổng số yêu cầu"
            value={kpi?.totalTransfers || 0}
            icon="🚚"
          />
          <StatCard
            title="Chờ duyệt"
            value={kpi?.pendingTransfers || 0}
            icon="⏳"
            color="orange"
          />
          <StatCard
            title="Đã duyệt"
            value={kpi?.approvedTransfers || 0}
            icon="✅"
            color="green"
          />
        </div>
      </div>

      <p className="text-center text-gray-400 text-xs pt-6">
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
      className={`bg-white p-4 rounded-lg shadow-sm border-l-4 ${
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

  // Đảm bảo value luôn hiển thị - đơn giản như fleet page
  const displayValue = value !== null && value !== undefined ? value : 0;

  return (
    <div className="text-center p-4 bg-gray-50 rounded-lg">
      {icon && (
        <span className={`text-2xl ${color ? colorClasses[color] : ""}`}>
          {icon}
        </span>
      )}
      <p className="text-sm text-gray-600 mt-2">{title}</p>
      <p className={`text-2xl font-semibold mt-1 ${color ? colorClasses[color] : ""}`}>
        {displayValue}
      </p>
    </div>
  );
}
