"use client";

import React, { useEffect, useState } from "react";
import { getManagerDashboardReport } from "./dashboard_service";

export default function ManagerDashboardPage() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 🔹 Gọi API JSON-server thật
  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getManagerDashboardReport();
        setReport(data);
      } catch (err) {
        console.error(err);
        setError("Không thể tải dữ liệu từ JSON Server!");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center mt-10 text-gray-500">
        Đang tải dữ liệu dashboard...
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center mt-10 text-red-500">{error}</div>
    );

  if (!report)
    return (
      <div className="flex justify-center mt-10 text-gray-400">
        Không có dữ liệu trong API /reports
      </div>
    );

  // 🔹 Giả sử manager chi nhánh "Quận 1"
  const branchName = "Quận 1";

  // 🔹 Lấy dữ liệu riêng cho chi nhánh của Manager
  const branchData = report.branch_usage.find(
    (b: any) => b.branch === branchName
  );

  // 🔹 Tính KPI riêng chi nhánh
  const revenue = report.top_branches.find(
    (b: any) => b.branch === branchName
  )?.revenue;

  const { month, incident_summary, daily_revenue } = report;

  return (
    <div className="space-y-6">
      {/* ===== KPI Cards (theo chi nhánh) ===== */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-500">Doanh thu chi nhánh {month}</p>
          <h2 className="text-2xl font-semibold mt-1">
            {revenue ? revenue.toLocaleString() + " ₫" : "—"}
          </h2>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-500">Xe đang thuê</p>
          <h2 className="text-2xl font-semibold mt-1">
            {branchData?.rented ?? 0}
          </h2>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-500">Xe sẵn sàng</p>
          <h2 className="text-2xl font-semibold mt-1">
            {branchData?.available ?? 0}
          </h2>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-500">Đang bảo trì</p>
          <h2 className="text-2xl font-semibold mt-1">
            {branchData?.maintenance ?? 0}
          </h2>
        </div>
      </div>

      {/* ===== Tổng hợp sự cố ===== */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h3 className="font-medium mb-3">Tổng hợp loại sự cố tháng {month}</h3>
        <ul className="text-sm grid grid-cols-2 gap-1">
          {incident_summary?.map((item: any, idx: number) => (
            <li key={idx}>
              <span className="font-medium">{item.type}:</span> {item.count}
            </li>
          ))}
        </ul>
      </div>

      {/* ===== Biểu đồ doanh thu (theo ngày) ===== */}
      {daily_revenue && (
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="font-medium mb-3">
            Doanh thu chi nhánh {branchName} theo ngày
          </h3>
          <div className="grid grid-cols-7 gap-2 text-sm text-gray-600">
            {daily_revenue.slice(0, 14).map((d: any, i: number) => (
              <div
                key={i}
                className="flex flex-col items-center justify-center bg-gray-50 rounded-md p-2"
              >
                <span className="text-xs text-gray-400">{d.date}</span>
                <span className="font-semibold">{d.amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-center text-gray-400 text-xs pt-6">
        eMotoRent · Manager Dashboard — dữ liệu chi nhánh {branchName} từ{" "}
        <span className="font-medium text-gray-500">/reports</span>
      </p>
    </div>
  );
}
