"use client";

import { useEffect, useState } from "react";
import { getBranches } from "@/app/dashboard/admin/branches/branch_service";
import { Plus, Pencil, Trash2, X } from "lucide-react";

export default function BranchesPage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState<any | null>(null);

  const [form, setForm] = useState({
    branchCode: "",
    branchName: "",
    address: "",
    city: "HCM",
    managerName: "",
    phone: "",
    capacity: "",
    openHours: "08:00-21:00",
    totalVehicles: "",
    note: "",
  });

  useEffect(() => {
    async function fetchBranches() {
      try {
        setLoading(true);
        const data = await getBranches();
        setBranches(data || []);
      } catch (err: any) {
        console.error("Lỗi khi tải chi nhánh:", err);
        setError("Không thể tải dữ liệu chi nhánh!");
      } finally {
        setLoading(false);
      }
    }
    fetchBranches();
  }, []);

  // ========== Thêm hoặc cập nhật ==========
  const handleSave = () => {
    if (!form.branchName || !form.address) {
      alert("Vui lòng nhập đầy đủ Tên và Địa chỉ chi nhánh!");
      return;
    }

    const updatedBranch = {
      branchCode: form.branchCode || `CN${branches.length + 1}`,
      branchName: form.branchName,
      address: form.address,
      city: form.city,
      managerName: form.managerName,
      phone: form.phone,
      capacity: Number(form.capacity) || 0,
      openHours: form.openHours,
      totalVehicles: Number(form.totalVehicles) || 0,
      note: form.note,
    };

    if (editingBranch) {
      // Sửa
      setBranches((prev) =>
        prev.map((b) =>
          b.branchCode === editingBranch.branchCode ? updatedBranch : b
        )
      );
    } else {
      // Thêm mới
      setBranches([...branches, updatedBranch]);
    }

    setShowModal(false);
    setEditingBranch(null);
    resetForm();
  };

  const resetForm = () => {
    setForm({
      branchCode: "",
      branchName: "",
      address: "",
      city: "HCM",
      managerName: "",
      phone: "",
      capacity: "",
      openHours: "08:00-21:00",
      totalVehicles: "",
      note: "",
    });
  };

  // ========== Xóa ==========
  const confirmDelete = (branch: any) => {
    setBranchToDelete(branch);
    setShowDeleteModal(true);
  };

  const handleDelete = () => {
    setBranches(branches.filter((b) => b !== branchToDelete));
    setShowDeleteModal(false);
    setBranchToDelete(null);
  };

  // ========== Thống kê ==========
  const totalBranches = branches.length;
  const totalVehicles = branches.reduce(
    (sum, b) => sum + (b.totalVehicles || 0),
    0
  );
  const maxBranch =
    branches.length > 0
      ? branches.reduce((a, b) =>
          (a.totalVehicles || 0) > (b.totalVehicles || 0) ? a : b
        )
      : null;

  return (
    <div className="space-y-6">
      {/* ===== Header ===== */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Quản lí chi nhánh</h1>
        <button
          onClick={() => {
            resetForm();
            setEditingBranch(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-md text-sm"
        >
          <Plus size={16} /> Thêm chi nhánh
        </button>
      </div>

      {/* ===== 3 Cards thống kê ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card title="Tổng chi nhánh" value={totalBranches} />
        <Card title="Tổng số xe" value={totalVehicles} />
        <Card
          title="CN nhiều xe nhất"
          value={maxBranch ? maxBranch.branchName : "—"}
          sub={
            maxBranch
              ? `${maxBranch.totalVehicles} / ${maxBranch.capacity || 0} xe`
              : ""
          }
        />
      </div>

      {/* ===== Bảng danh sách ===== */}
      <div className="bg-white border rounded-2xl p-4 shadow-sm">
        {loading ? (
          <p className="text-gray-500">Đang tải dữ liệu...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : branches.length === 0 ? (
          <p className="text-gray-500">Không có chi nhánh nào.</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="p-2 border-b text-left">Mã</th>
                <th className="p-2 border-b text-left">Tên</th>
                <th className="p-2 border-b text-left">Địa chỉ</th>
                <th className="p-2 border-b text-left">TP</th>
                <th className="p-2 border-b text-left">Quản lý</th>
                <th className="p-2 border-b text-left">Liên hệ</th>
                <th className="p-2 border-b text-left">Sức chứa</th>
                <th className="p-2 border-b text-left">Giờ mở cửa</th>
                <th className="p-2 border-b text-left">Số xe</th>
                <th className="p-2 border-b text-left">Ghi chú</th>
                <th className="p-2 border-b text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((b, idx) => (
                <tr key={idx} className="odd:bg-white even:bg-gray-50">
                  <td className="p-2 border-b">{b.branchCode}</td>
                  <td className="p-2 border-b">{b.branchName}</td>
                  <td className="p-2 border-b">{b.address}</td>
                  <td className="p-2 border-b">{b.city}</td>
                  <td className="p-2 border-b">{b.managerName}</td>
                  <td className="p-2 border-b">{b.phone}</td>
                  <td className="p-2 border-b">{b.capacity}</td>
                  <td className="p-2 border-b">{b.openHours}</td>
                  <td className="p-2 border-b">{b.totalVehicles}</td>
                  <td className="p-2 border-b">{b.note}</td>
                  <td className="p-2 border-b text-center flex justify-center gap-2">
                    <button
                      onClick={() => {
                        setEditingBranch(b);
                        setForm(b);
                        setShowModal(true);
                      }}
                      className="flex items-center gap-1 px-2 py-1 text-blue-600 hover:bg-blue-50 rounded-md"
                    >
                      <Pencil size={14} /> Sửa
                    </button>
                    <button
                      onClick={() => confirmDelete(b)}
                      className="flex items-center gap-1 px-2 py-1 text-red-600 hover:bg-red-50 rounded-md"
                    >
                      <Trash2 size={14} /> Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="text-sm text-gray-500 mt-3">
          Tổng {branches.length} CN
        </div>
      </div>

      {/* ===== Modal Thêm / Sửa ===== */}
{showModal && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-2xl w-[460px] shadow-lg">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          {editingBranch ? "Sửa chi nhánh" : "Thêm chi nhánh mới"}
        </h2>
        <button onClick={() => setShowModal(false)}>
          <X size={20} className="text-gray-400 hover:text-gray-600" />
        </button>
      </div>

      {/* Form */}
      <div className="space-y-3">
        <FormField
          label="Mã chi nhánh"
          value={form.branchCode}
          onChange={(v) => setForm({ ...form, branchCode: v })}
          placeholder="VD: CN6"
        />
        <FormField
          label="Tên chi nhánh"
          value={form.branchName}
          onChange={(v) => setForm({ ...form, branchName: v })}
          placeholder="VD: CN6 - Quận 7"
        />
        <FormField
          label="Địa chỉ"
          value={form.address}
          onChange={(v) => setForm({ ...form, address: v })}
          placeholder="VD: 123 Lý Thường Kiệt, Quận 10, TP.HCM"
        />
        <div className="grid grid-cols-2 gap-3">
          <FormField
            label="Thành phố"
            value={form.city}
            onChange={(v) => setForm({ ...form, city: v })}
            placeholder="VD: HCM"
          />
          <FormField
            label="Quản lý"
            value={form.managerName}
            onChange={(v) => setForm({ ...form, managerName: v })}
            placeholder="VD: Nguyễn Văn A"
          />
        </div>
        <FormField
          label="Số điện thoại"
          value={form.phone}
          onChange={(v) => setForm({ ...form, phone: v })}
          placeholder="VD: 0909123456"
        />
        <div className="grid grid-cols-2 gap-3">
          <FormField
            label="Sức chứa"
            value={form.capacity}
            onChange={(v) => setForm({ ...form, capacity: v })}
            placeholder="VD: 60"
          />
          <FormField
            label="Số xe hiện có"
            value={form.totalVehicles}
            onChange={(v) => setForm({ ...form, totalVehicles: v })}
            placeholder="VD: 25"
          />
        </div>
        <FormField
          label="Ghi chú"
          value={form.note}
          onChange={(v) => setForm({ ...form, note: v })}
          placeholder="VD: CN trung tâm"
        />
      </div>

      {/* Action buttons */}
      <div className="mt-5 flex justify-end gap-3">
        <button
          onClick={() => setShowModal(false)}
          className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50"
        >
          Hủy
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
        >
          Lưu
        </button>
      </div>
    </div>
  </div>
)}


      {/* ===== Modal xác nhận Xóa ===== */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-lg w-[360px] text-center">
            <p className="text-gray-800 mb-4">
              Bạn có chắc muốn xóa{" "}
              <strong>{branchToDelete.branchName}</strong> không?
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== Card component =====
function Card({
  title,
  value,
  sub,
}: {
  title: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="bg-white border rounded-2xl p-4 shadow-sm">
      <p className="text-gray-500 text-sm">{title}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
      {sub && <p className="text-gray-400 text-sm mt-1">{sub}</p>}
    </div>
  );
}
// ===== Input field component có label =====
function FormField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">
        {label}
      </label>
      <input
        type="text"
        className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
