"use client";
import { useEffect, useState } from "react";
import {
  getTransfers,
  createTransfer,
  updateTransfer,
  deleteTransfer,
  getBranches,
} from "./transfer_service";
import {
  Plus,
  Save,
  Trash2,
  Check,
  X,
  FileText,
  Ban,
  ArrowLeftRight,
} from "lucide-react";

// ================= INTERFACES =================
interface Transfer {
  id: string | number;
  code: string;
  status: "pending" | "approved" | "in_transit" | "completed" | "rejected" | "cancelled";
  targetBranchId: string;
  reason: string;
  requestedBy: string;
  requestedAt: string;
  sourceBranchId?: string | null;
  vehicleCount?: number;
  note?: string | null;
  scheduleAt?: string | null;
  pickedAt?: string | null;
  deliveredAt?: string | null;
}

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: "Đang chờ duyệt", color: "bg-amber-100 text-amber-700" },
  approved: { label: "Đã duyệt", color: "bg-blue-100 text-blue-700" },
  in_transit: { label: "Đang vận chuyển", color: "bg-violet-100 text-violet-700" },
  completed: { label: "Hoàn tất", color: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Đã từ chối", color: "bg-rose-100 text-rose-700" },
  cancelled: { label: "Đã hủy", color: "bg-gray-100 text-gray-600" },
};

// ================= PAGE COMPONENT =================
export default function TransferPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Transfer>>({});
  const [selected, setSelected] = useState<Transfer | null>(null);

  // ================= LOAD DATA =================
  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    const [trs, brs] = await Promise.all([getTransfers(), getBranches()]);
    setTransfers(trs);
    setBranches(brs);
  };

  // ================= ACTIONS =================
  const handleCreate = async () => {
    if (!formData.targetBranchId || !formData.reason || !formData.vehicleCount) {
      alert("Vui lòng nhập đầy đủ thông tin (chi nhánh nhận, lý do, số lượng xe)!");
      return;
    }

    const payload = {
      ...formData,
      code: `TR-${new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 10)}`,
      status: "pending",
      requestedBy: "admin@emotorent.vn",
      requestedAt: new Date().toISOString(),
    };

    await createTransfer(payload);
    setShowForm(false);
    setFormData({});
    loadAll();
  };

  const handleUpdateStatus = async (id: string | number, status: string, note?: string) => {
    await updateTransfer(id, { status, note });
    loadAll();
  };

  const handleUpdateSourceBranch = async (id: string | number, sourceBranchId: string) => {
    await updateTransfer(id, { sourceBranchId });
    loadAll();
  };

  // ================= RENDER =================
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
          <ArrowLeftRight className="text-indigo-600" /> Quản lý điều chuyển xe giữa chi nhánh
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition"
        >
          <Plus size={16} /> Tạo điều phối mới
        </button>
      </div>

      {/* ==================== TABLE ==================== */}
      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <div className="flex justify-between items-center px-4 py-3 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-700">Danh sách yêu cầu điều chuyển</h3>
          <span className="text-sm text-gray-500">
            Tổng cộng: {transfers.length} yêu cầu
          </span>
        </div>

        <table className="w-full text-sm text-gray-700 border border-gray-300 rounded-md">
          <thead className="bg-gray-100 text-gray-700 uppercase text-xs border-b border-gray-200">
            <tr>
              <th className="py-3 px-4 text-left">Mã điều phối</th>
              <th className="py-3 px-4 text-left">Chi nhánh nhận</th>
              <th className="py-3 px-4 text-left">Chi nhánh nguồn</th>
              <th className="py-3 px-4 text-center">Trạng thái</th>
              <th className="py-3 px-4 text-center">Số lượng xe</th>
              <th className="py-3 px-4 text-left">Lý do</th>
              <th className="py-3 px-4 text-center">Ngày yêu cầu</th>
              <th className="py-3 px-4 text-center w-[230px]">Hành động</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {transfers.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50 transition-all duration-100">
                <td className="py-3 px-4 font-medium text-blue-600">{t.code}</td>
                <td className="py-3 px-4">{t.targetBranchId}</td>

                {/* Chi nhánh nguồn (có thể chỉnh nếu đã duyệt) */}
                <td className="py-3 px-4">
                  {t.status === "approved" ? (
                    <select
                      className="border rounded p-1 text-sm"
                      value={t.sourceBranchId || ""}
                      onChange={(e) =>
                        handleUpdateSourceBranch(t.id, e.target.value)
                      }
                    >
                      <option value="">Chọn chi nhánh nguồn</option>
                      {branches
                        .filter((b) => b.branchCode !== t.targetBranchId)
                        .map((b) => (
                          <option key={b.branchCode} value={b.branchCode}>
                            {b.branchCode} - {b.branchName}
                          </option>
                        ))}
                    </select>
                  ) : (
                    t.sourceBranchId || "-"
                  )}
                </td>

                <td className="py-3 px-4 text-center">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${statusMap[t.status]?.color}`}
                  >
                    {statusMap[t.status]?.label}
                  </span>
                </td>

                <td className="py-3 px-4 text-center">
                  {typeof t.vehicleCount === "number" ? `${t.vehicleCount} xe` : "-"}
                </td>

                <td className="py-3 px-4">{t.reason}</td>
                <td className="py-3 px-4 text-center">
                  {new Date(t.requestedAt).toLocaleDateString("vi-VN")}
                </td>

                <td className="py-3 px-4 text-center">
                  <div className="flex justify-center gap-2 flex-wrap">
                    {t.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(t.id, "approved")}
                          className="flex items-center gap-1 bg-blue-100 text-blue-600 px-3 py-1 rounded-full hover:bg-blue-200 transition"
                        >
                          <Check size={14} /> Duyệt
                        </button>
                        <button
                          onClick={() =>
                            handleUpdateStatus(
                              t.id,
                              "rejected",
                              prompt("Nhập lý do từ chối:") || "Không xác định"
                            )
                          }
                          className="flex items-center gap-1 bg-gray-100 text-gray-600 px-3 py-1 rounded-full hover:bg-gray-200 transition"
                        >
                          <Ban size={14} /> Từ chối
                        </button>
                      </>
                    )}

                    {["approved", "in_transit", "completed"].includes(t.status) && (
                      <button
                        onClick={() => setSelected(t)}
                        className="flex items-center gap-1 bg-purple-100 text-purple-600 px-3 py-1 rounded-full hover:bg-purple-200 transition"
                      >
                        <FileText size={14} /> Xem chi tiết
                      </button>
                    )}

                    <button
                      onClick={() => deleteTransfer(t.id).then(loadAll)}
                      className="flex items-center gap-1 bg-red-100 text-red-600 px-3 py-1 rounded-full hover:bg-red-200 transition"
                    >
                      <Trash2 size={14} /> Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ==================== MODAL CHI TIẾT ==================== */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-[600px] p-6 relative">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-700">
                <FileText className="text-purple-600" /> Chi tiết điều phối xe
              </h3>
              <button onClick={() => setSelected(null)}>
                <X className="text-gray-500 hover:text-gray-700" />
              </button>
            </div>

            {/* --- Theo dõi trạng thái --- */}
            {["approved", "in_transit", "completed"].includes(selected.status) && (
              <div className="mb-4 border-b pb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  🚗 Theo dõi tình trạng xe
                </h4>
                <div className="flex items-center justify-between relative px-2 mb-3">
                  {[
                    { id: "approved", label: "Chờ xuất xe" },
                    { id: "in_transit", label: "Đang vận chuyển" },
                    { id: "completed", label: "Đã đến nơi" },
                  ].map((step, index, arr) => {
                    const isActive =
                      arr.findIndex((s) => s.id === selected.status) >= index;
                    return (
                      <div key={step.id} className="flex flex-col items-center w-1/3">
                        {index > 0 && (
                          <div
                            className={`absolute top-3 left-0 right-0 h-[3px] ${
                              isActive ? "bg-green-400" : "bg-gray-200"
                            }`}
                            style={{
                              width: `${(index / (arr.length - 1)) * 100}%`,
                              zIndex: 0,
                            }}
                          ></div>
                        )}
                        <div
                          className={`z-10 w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs ${
                            isActive ? "bg-green-500" : "bg-gray-300"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <span
                          className={`text-xs mt-1 ${
                            isActive ? "text-green-600 font-semibold" : "text-gray-500"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-gray-50 border rounded-lg p-3 text-gray-700 text-sm">
                  {selected.status === "approved" && "Xe đang chờ điều phối từ chi nhánh nguồn..."}
                  {selected.status === "in_transit" && "Xe đang di chuyển tới chi nhánh nhận..."}
                  {selected.status === "completed" && "Xe đã đến chi nhánh nhận và hoàn tất điều phối."}
                </div>
              </div>
            )}

            {/* --- Bảng thông tin --- */}
            <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="bg-gray-50 font-medium text-gray-700 px-3 py-2 w-[40%]">Mã điều phối</td>
                  <td className="px-3 py-2">{selected.code}</td>
                </tr>
                <tr>
                  <td className="bg-gray-50 font-medium text-gray-700 px-3 py-2">Trạng thái</td>
                  <td className="px-3 py-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${statusMap[selected.status]?.color}`}
                    >
                      {statusMap[selected.status]?.label}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="bg-gray-50 font-medium text-gray-700 px-3 py-2">Chi nhánh nguồn</td>
                  <td className="px-3 py-2">{selected.sourceBranchId || "-"}</td>
                </tr>
                <tr>
                  <td className="bg-gray-50 font-medium text-gray-700 px-3 py-2">Chi nhánh nhận</td>
                  <td className="px-3 py-2">{selected.targetBranchId}</td>
                </tr>
                <tr>
                  <td className="bg-gray-50 font-medium text-gray-700 px-3 py-2">Số lượng xe</td>
                  <td className="px-3 py-2">
                    {selected.vehicleCount ? `${selected.vehicleCount} xe` : "Chưa có"}
                  </td>
                </tr>
                <tr>
                  <td className="bg-gray-50 font-medium text-gray-700 px-3 py-2">Lý do</td>
                  <td className="px-3 py-2">{selected.reason}</td>
                </tr>
                <tr>
                  <td className="bg-gray-50 font-medium text-gray-700 px-3 py-2">Ghi chú</td>
                  <td className="px-3 py-2">{selected.note || "Không có"}</td>
                </tr>
              </tbody>
            </table>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setSelected(null)}
                className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL TẠO MỚI ==================== */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-[460px]">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-700">
                <Plus className="text-green-600" /> Tạo điều phối mới
              </h3>
              <button onClick={() => setShowForm(false)}>
                <X className="text-gray-500 hover:text-gray-700" />
              </button>
            </div>

            {/* --- Form content --- */}
            <div className="space-y-3">
              {/* Chi nhánh nguồn */}
              <div>
                <label className="text-sm text-gray-600 font-medium mb-1 block">
                  Chi nhánh nguồn
                </label>
                <select
                  className="border rounded-md w-full p-2 focus:ring focus:ring-green-200"
                  value={formData.sourceBranchId ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, sourceBranchId: e.target.value })
                  }
                >
                  <option value="">Chọn chi nhánh nguồn</option>
                  {branches.map((b) => (
                    <option key={b.branchCode} value={b.branchCode}>
                      {b.branchCode} - {b.branchName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Chi nhánh nhận */}
              <div>
                <label className="text-sm text-gray-600 font-medium mb-1 block">
                  Chi nhánh nhận
                </label>
                <select
                  className="border rounded-md w-full p-2 focus:ring focus:ring-green-200"
                  value={formData.targetBranchId ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, targetBranchId: e.target.value })
                  }
                >
                  <option value="">Chọn chi nhánh nhận</option>
                  {branches
                    .filter((b) => b.branchCode !== formData.sourceBranchId)
                    .map((b) => (
                      <option key={b.branchCode} value={b.branchCode}>
                        {b.branchCode} - {b.branchName}
                      </option>
                    ))}
                </select>
              </div>

              {/* Số lượng xe */}
              <div>
                <label className="text-sm text-gray-600 font-medium mb-1 block">
                  Số lượng xe
                </label>
                <input
                  type="number"
                  min={1}
                  className="border rounded-md w-full p-2 focus:ring focus:ring-green-200"
                  placeholder="Nhập số lượng xe cần điều phối"
                  value={formData.vehicleCount ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, vehicleCount: parseInt(e.target.value) })
                  }
                />
              </div>

              {/* Lý do */}
              <div>
                <label className="text-sm text-gray-600 font-medium mb-1 block">
                  Lý do điều phối
                </label>
                <textarea
                  rows={3}
                  className="border rounded-md w-full p-2 focus:ring focus:ring-green-200"
                  placeholder="Nhập lý do điều phối..."
                  value={formData.reason ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700"
              >
                Hủy
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white flex items-center gap-1"
              >
                <Save size={16} /> Tạo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
