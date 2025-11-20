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
        setData(d);
      } catch (err) {
        console.error(err);
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

  if (error || !data) {
    return (
      <div className="flex justify-center mt-10 text-red-500">
        {error ?? "Không có dữ liệu dashboard"}
      </div>
    );
  }

  const { branch, kpi } = data;

  const branchName = branch?.branchName || branch?.name || "Chi nhánh";

  return (
    <div className="space-y-6">
      {/* ===== KPI Cards (dữ liệu thật từ BE) ===== */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card
          title={`Doanh thu hôm nay`}
          value={
            kpi.todayRevenue
              ? kpi.todayRevenue.toLocaleString("vi-VN") + " ₫"
              : "—"
          }
        />
        <Card title="Số booking hôm nay" value={kpi.todayBookings ?? 0} />
        <Card title="Xe đang thuê" value={kpi.activeVehicles ?? 0} />
        <Card title="Xe đang bảo trì" value={kpi.maintenanceVehicles ?? 0} />
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h3 className="font-medium mb-2">
          Thông tin chi nhánh: {branchName}
        </h3>
        <p className="text-sm text-gray-600">
          Tổng số xe: <span className="font-semibold">{kpi.totalVehicles}</span>
        </p>
        <p className="text-sm text-gray-600 mt-1">
          Xe đang thuê:{" "}
          <span className="font-semibold">{kpi.activeVehicles}</span> · Xe
          bảo trì:{" "}
          <span className="font-semibold">{kpi.maintenanceVehicles}</span>
        </p>
      </div>

      <p className="text-center text-gray-400 text-xs pt-6">
        eMotoRent · Manager Dashboard — dữ liệu thật từ API Backend
      </p>
    </div>
  );
}

function Card({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <h2 className="text-2xl font-semibold mt-1">{value}</h2>
    </div>
  );
}
