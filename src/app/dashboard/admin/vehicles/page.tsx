"use client";

import { useEffect, useState } from "react";
import { getVehicles, deleteVehicle, createVehicle, updateVehicle } from "./vehicle_service";
import { Edit, Trash2, X, Save, Plus } from "lucide-react";

interface Vehicle {
  id: number;
  code: string;
  licensePlate: string;
  model: string;
  type: string;
  year: number;
  batteryPercent: number | null;
  odo: number;
  status: "Sẵn sàng" | "Đang thuê" | "Bảo trì";
  branch: string;
  rentStart?: string | null; // ISO yyyy-mm-dd
  rentEnd?: string | null;   // ISO yyyy-mm-dd
}

export default function VehiclePage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState<Partial<Vehicle>>({});

  // ===== helpers =====
  const parseNumOrNull = (v: string) => (v === "" ? null : Number(v));
  const parseNumOrZero = (v: string) => (v === "" ? 0 : Number(v));
  const formatDate = (date?: string | null) => {
    if (!date) return "-";
    const d = new Date(date);
    return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("vi-VN");
  };

  // ===== data =====
  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    const data = await getVehicles();
    setVehicles(data);
  };

  // ===== actions =====
  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa xe này không?")) return;
    await deleteVehicle(id);
    await loadVehicles();
  };

  const handleAdd = async () => {
    if (!formData.code || !formData.licensePlate || !formData.model) {
      alert("⚠️ Vui lòng nhập Mã xe, Biển số và Model!");
      return;
    }
    // chuẩn hóa dữ liệu gửi
    const payload = {
      ...formData,
      batteryPercent:
        typeof formData.batteryPercent === "string"
          ? parseNumOrNull(formData.batteryPercent)
          : formData.batteryPercent ?? null,
      odo:
        typeof formData.odo === "string"
          ? parseNumOrZero(formData.odo)
          : formData.odo ?? 0,
      year:
        typeof formData.year === "string"
          ? Number(formData.year)
          : formData.year,
      // nếu trạng thái khác "Đang thuê" thì xóa date
      rentStart: formData.status === "Đang thuê" ? formData.rentStart || "" : "",
      rentEnd: formData.status === "Đang thuê" ? formData.rentEnd || "" : "",
    };

    await createVehicle(payload);
    setShowForm(false);
    setFormData({});
    await loadVehicles();
  };

  const handleEdit = (v: Vehicle) => {
    setEditing(v);
    setFormData(v);
    setShowForm(true);
  };

  const handleSaveEdit = async () => {
    if (!editing) return;

    const payload = {
      ...formData,
      batteryPercent:
        typeof formData.batteryPercent === "string"
          ? parseNumOrNull(formData.batteryPercent)
          : formData.batteryPercent ?? null,
      odo:
        typeof formData.odo === "string"
          ? parseNumOrZero(formData.odo)
          : formData.odo ?? 0,
      year:
        typeof formData.year === "string"
          ? Number(formData.year)
          : formData.year,
      rentStart: formData.status === "Đang thuê" ? formData.rentStart || "" : "",
      rentEnd: formData.status === "Đang thuê" ? formData.rentEnd || "" : "",
    };

    await updateVehicle(editing.id, payload);
    setShowForm(false);
    setEditing(null);
    setFormData({});
    await loadVehicles();
  };

  const filtered = vehicles.filter(
    (v) =>
      v.licensePlate.toLowerCase().includes(search.toLowerCase()) ||
      v.model.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Quản lí xe</h2>

      {/* Filters + Add */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <select className="border rounded p-2">
          <option>Trạng thái: Tất cả</option>
          <option>Sẵn sàng</option>
          <option>Đang thuê</option>
          <option>Bảo trì</option>
        </select>
        <select className="border rounded p-2">
          <option>Loại xe: Tất cả</option>
          <option>EV</option>
          <option>Scooter</option>
          <option>Bike</option>
        </select>
        <select className="border rounded p-2">
          <option>Chi nhánh: Tất cả</option>
          <option>CN1</option>
          <option>CN2</option>
          <option>CN3</option>
        </select>

        <input
          type="text"
          placeholder="Tìm biển số / model"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded p-2 ml-auto"
        />

        <button
          className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2"
          onClick={() => {
            setFormData({
              status: "Sẵn sàng",
              rentStart: "",
              rentEnd: "",
            });
            setEditing(null);
            setShowForm(true);
          }}
        >
          <Plus size={16} /> Thêm xe
        </button>
      </div>

      {/* Table */}
      <table className="w-full border-collapse border border-gray-300 text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Mã xe</th>
            <th className="border p-2">Biển số</th>
            <th className="border p-2">Model</th>
            <th className="border p-2">Loại</th>
            <th className="border p-2">Năm</th>
            <th className="border p-2">Pin %</th>
            <th className="border p-2">Odo (km)</th>
            <th className="border p-2">Trạng thái</th>
            <th className="border p-2">Chi nhánh</th>
            <th className="border p-2">Ngày thuê</th>
            <th className="border p-2">Hết hạn thuê</th>
            <th className="border p-2 text-center">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((v) => (
            <tr key={v.id} className="hover:bg-gray-50">
              <td className="border p-2">{v.code}</td>
              <td className="border p-2">{v.licensePlate}</td>
              <td className="border p-2">{v.model}</td>
              <td className="border p-2">{v.type}</td>
              <td className="border p-2">{v.year}</td>
              <td className="border p-2">{v.batteryPercent ?? "-"}</td>
              <td className="border p-2">{v.odo.toLocaleString()}</td>
              <td className="border p-2">
                <span
                  className={`px-2 py-1 rounded ${
                    v.status === "Sẵn sàng"
                      ? "text-green-600 bg-green-100"
                      : v.status === "Đang thuê"
                      ? "text-blue-600 bg-blue-100"
                      : "text-orange-600 bg-orange-100"
                  }`}
                >
                  {v.status}
                </span>
              </td>
              <td className="border p-2">{v.branch}</td>
              <td className="border p-2">{v.status === "Đang thuê" ? formatDate(v.rentStart) : "-"}</td>
              <td className="border p-2">{v.status === "Đang thuê" ? formatDate(v.rentEnd) : "-"}</td>
              <td className="border p-2">
                <div className="flex justify-center gap-2">
                  <button
                    className="flex items-center gap-1 bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200"
                    onClick={() => handleEdit(v)}
                  >
                    <Edit size={14} /> Sửa
                  </button>
                  <button
                    className="flex items-center gap-1 bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200"
                    onClick={() => handleDelete(v.id)}
                  >
                    <Trash2 size={14} /> Xóa
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-2 text-sm text-gray-600">Tổng: {filtered.length} xe</div>

      {/* Modal thêm / sửa */}
      {showForm && (
        <div className="fixed inset-0 bg-[#00000066] backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[560px]">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xl font-semibold">
                {editing ? "Chỉnh sửa xe" : "Thêm xe mới"}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-black">
                <X />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input
                placeholder="Mã xe"
                className="border p-2 rounded"
                value={formData.code ?? ""}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
              <input
                placeholder="Biển số"
                className="border p-2 rounded"
                value={formData.licensePlate ?? ""}
                onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
              />
              <input
                placeholder="Model"
                className="border p-2 rounded"
                value={formData.model ?? ""}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              />
              <input
                placeholder="Loại"
                className="border p-2 rounded"
                value={formData.type ?? ""}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              />
              <input
                type="number"
                placeholder="Năm"
                className="border p-2 rounded"
                value={formData.year ?? ""}
                onChange={(e) => setFormData({ ...formData, year: e.target.value as unknown as number })}
              />
              <input
                type="number"
                placeholder="Pin %"
                className="border p-2 rounded"
                value={formData.batteryPercent ?? ""}
                onChange={(e) => setFormData({ ...formData, batteryPercent: parseNumOrNull(e.target.value) as any })}
              />
              <input
                type="number"
                placeholder="Odo (km)"
                className="border p-2 rounded"
                value={formData.odo ?? ""}
                onChange={(e) => setFormData({ ...formData, odo: parseNumOrZero(e.target.value) as any })}
              />
              <select
                className="border p-2 rounded"
                value={formData.status ?? "Sẵn sàng"}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: e.target.value as Vehicle["status"],
                    // reset ngày nếu đổi sang trạng thái khác
                    rentStart: e.target.value === "Đang thuê" ? prev?.rentStart ?? "" : "",
                    rentEnd: e.target.value === "Đang thuê" ? prev?.rentEnd ?? "" : "",
                  }))
                }
              >
                <option value="Sẵn sàng">Sẵn sàng</option>
                <option value="Đang thuê">Đang thuê</option>
                <option value="Bảo trì">Bảo trì</option>
              </select>

              <input
                placeholder="Chi nhánh"
                className="border p-2 rounded"
                value={formData.branch ?? ""}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
              />

              {/* Hai ô ngày có nhãn rõ ràng */}
              <div className="col-span-2 grid grid-cols-2 gap-3">
                <div className="flex flex-col">
                  <label className="text-sm text-gray-600 mb-1">Ngày thuê</label>
                  <input
                    type="date"
                    disabled={formData.status !== "Đang thuê"}
                    className={`border p-2 rounded ${
                      formData.status !== "Đang thuê" ? "bg-gray-100 cursor-not-allowed" : ""
                    }`}
                    value={formData.rentStart ?? ""}
                    onChange={(e) => setFormData({ ...formData, rentStart: e.target.value })}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm text-gray-600 mb-1">Ngày kết thúc</label>
                  <input
                    type="date"
                    disabled={formData.status !== "Đang thuê"}
                    className={`border p-2 rounded ${
                      formData.status !== "Đang thuê" ? "bg-gray-100 cursor-not-allowed" : ""
                    }`}
                    value={formData.rentEnd ?? ""}
                    onChange={(e) => setFormData({ ...formData, rentEnd: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button className="bg-gray-400 text-white px-4 py-2 rounded" onClick={() => setShowForm(false)}>
                Hủy
              </button>
              <button
                className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-1"
                onClick={editing ? handleSaveEdit : handleAdd}
              >
                <Save size={16} /> {editing ? "Lưu" : "Thêm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
