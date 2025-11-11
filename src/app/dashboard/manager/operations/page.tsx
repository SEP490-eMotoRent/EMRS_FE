"use client";
import React, { useEffect, useState } from "react";
import { getHandoverRecords, getReturnRecords } from "./operation_service";

export default function OperationPage() {
  const [tab, setTab] = useState<"handover" | "return">("handover");
  const [records, setRecords] = useState<any[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setSelectedRecord(null);
      try {
        const data =
          tab === "handover"
            ? await getHandoverRecords()
            : await getReturnRecords();
        setRecords(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [tab]);

  const renderStatus = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
            Hoàn tất
          </span>
        );
      case "processing":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">
            Đang xử lý
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
            -
          </span>
        );
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="font-semibold text-lg mb-4">
        Vận hành (Biên bản giao xe / trả xe)
      </h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          className={`px-3 py-1 rounded-lg text-sm ${
            tab === "handover"
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-700"
          }`}
          onClick={() => setTab("handover")}
        >
          Biên bản giao xe
        </button>
        <button
          className={`px-3 py-1 rounded-lg text-sm ${
            tab === "return"
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-700"
          }`}
          onClick={() => setTab("return")}
        >
          Biên bản trả xe
        </button>
      </div>

      {/* Danh sách */}
      {loading ? (
        <p className="text-gray-400 text-sm">Đang tải dữ liệu...</p>
      ) : records.length === 0 ? (
        <p className="text-gray-400 text-sm">Không có biên bản nào.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600 border-b">
                <th className="text-left py-2 px-3">Mã biên bản</th>
                <th className="text-left py-2 px-3">Biển số xe</th>
                <th className="text-left py-2 px-3">Khách thuê</th>
                <th className="text-left py-2 px-3">Nhân viên lập</th>
                <th className="text-left py-2 px-3">Thời gian</th>
                <th className="text-left py-2 px-3">Trạng thái</th>
                <th className="text-center py-2 px-3">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr
                  key={r.id}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="py-2 px-3 font-medium">{r.code}</td>
                  <td className="py-2 px-3">{r.vehiclePlate}</td>
                  <td className="py-2 px-3">{r.renterName}</td>
                  <td className="py-2 px-3">{r.staffName}</td>
                  <td className="py-2 px-3 text-gray-500">
                    {new Date(r.createdAt).toLocaleString("vi-VN")}
                  </td>
                  <td className="py-2 px-3">{renderStatus(r.status)}</td>
                  <td className="py-2 px-3 text-center">
                    <button
                      onClick={() => setSelectedRecord(r)}
                      className="text-indigo-600 text-sm font-medium hover:underline"
                    >
                      Xem chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== Modal chi tiết ===== */}
      {selectedRecord && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl p-6 relative animate-fadeIn">
            {/* Nút đóng */}
            <button
              onClick={() => setSelectedRecord(null)}
              className="absolute top-3 right-4 text-gray-500 hover:text-gray-700 text-xl"
            >
              ×
            </button>

            <h3 className="font-semibold text-lg mb-4 text-gray-800">
              Chi tiết biên bản: {selectedRecord.code}
            </h3>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-gray-500">Mã Booking</p>
                <p className="font-medium">{selectedRecord.bookingId}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-gray-500">Khách thuê</p>
                <p className="font-medium">{selectedRecord.renterName}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-gray-500">Xe</p>
                <p className="font-medium">{selectedRecord.vehiclePlate}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-gray-500">Nhân viên lập</p>
                <p className="font-medium">{selectedRecord.staffName}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg col-span-2">
                <p className="text-gray-500 mb-1">Thời gian lập biên bản</p>
                <p className="font-medium">
                  {new Date(selectedRecord.createdAt).toLocaleString("vi-VN")}
                </p>
              </div>
            </div>

            <div className="text-right mt-5">
              <button
                onClick={() => setSelectedRecord(null)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
