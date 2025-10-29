"use client";

import { useEffect, useState } from "react";
import {
  getStaffs,
  createStaff,
  updateStaff,
  deleteStaff,
} from "@/app/dashboard/admin/staffs/staff_service";
import { Pencil, Trash2, Lock, Unlock, Plus, X, NotebookPen } from "lucide-react";

export default function StaffPage() {
  const [staffs, setStaffs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);

  // 🔹 Bộ lọc + tìm kiếm
  const [roleFilter, setRoleFilter] = useState("Tất cả");
  const [deptFilter, setDeptFilter] = useState("Tất cả");
  const [branchFilter, setBranchFilter] = useState("Tất cả");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const data = await getStaffs();
    setStaffs(data);
    setLoading(false);
  }

  // ============================
  // 🔹 CRUD Actions
  // ============================
  const handleAdd = () => {
    setEditing(null);
    setShowModal(true);
  };

  const handleEdit = (staff: any) => {
    setEditing(staff);
    setShowModal(true);
  };

  const handleToggleStatus = async (id: number) => {
    const target = staffs.find((s) => s.id === id);
    if (!target) return;
    const newStatus = target.status === "Active" ? "Inactive" : "Active";
    await updateStaff(id, { status: newStatus });
    setStaffs((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
    );
  };

  const handleDelete = async (id: number) => {
    if (confirm("Bạn có chắc muốn xóa nhân sự này?")) {
      await deleteStaff(id);
      setStaffs((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const handleSave = async (form: any) => {
    if (editing) {
      const updated = await updateStaff(editing.id, form);
      setStaffs((prev) =>
        prev.map((s) => (s.id === editing.id ? updated : s))
      );
    } else {
      const created = await createStaff(form);
      setStaffs((prev) => [...prev, created]);
    }
    setShowModal(false);
  };

  // ============================
  // 🔹 Lọc + tìm kiếm
  // ============================
  const filtered = staffs.filter((s) => {
    return (
      (roleFilter === "Tất cả" || s.role === roleFilter) &&
      (deptFilter === "Tất cả" || s.department === deptFilter) &&
      (branchFilter === "Tất cả" || s.branch === branchFilter) &&
      (s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        s.username?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase()) ||
        s.phone?.includes(search))
    );
  });

  if (loading) return <div>Đang tải dữ liệu...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Quản lí nhân sự</h1>

      {/* Bộ lọc */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option>Tất cả</option>
            <option>Manager</option>
            <option>Staff</option>
            <option>Technician</option>
          </select>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option>Tất cả</option>
            <option>Lễ tân</option>
            <option>Vận hành</option>
            <option>Kỹ thuật</option>
          </select>

          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option>Tất cả</option>
            <option>CN1</option>
            <option>CN2</option>
            <option>CN3</option>
          </select>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm tên / username / SDT / email"
            className="border rounded-md px-3 py-2 text-sm w-64"
          />
        </div>

        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-sm"
        >
          <Plus size={16} /> Thêm nhân sự
        </button>
      </div>

      {/* Bảng dữ liệu */}
      <div className="bg-white border rounded-2xl p-4">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">Tên</th>
              <th className="p-2 text-left">Username</th>
              <th className="p-2 text-left">SĐT</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Role</th>
              <th className="p-2 text-left">Phòng ban</th>
              <th className="p-2 text-left">Chi nhánh</th>
              <th className="p-2 text-left">Trạng thái</th>
              <th className="p-2 text-left">Bắt đầu</th>
              <th className="p-2 text-left">Ngày tạo</th>
              <th className="p-2 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={11} className="p-3 text-center text-gray-500 italic">
                  Không có nhân sự phù hợp
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.id} className="odd:bg-white even:bg-gray-50">
                  <td className="p-2">{s.fullName}</td>
                  <td className="p-2">{s.username}</td>
                  <td className="p-2">{s.phone}</td>
                  <td className="p-2">{s.email}</td>
                  <td className="p-2">{s.role}</td>
                  <td className="p-2">{s.department}</td>
                  <td className="p-2">{s.branch}</td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        s.status === "Active"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {s.status === "Active"
                        ? "Đang hoạt động"
                        : "Không hoạt động"}
                    </span>
                  </td>
                  <td className="p-2">{s.startDate}</td>
                  <td className="p-2">
                    {new Date(s.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="p-2 text-center">
                    <div className="flex justify-center gap-2">
                      <ActionButton
                        icon={<Pencil size={14} />}
                        label="Sửa"
                        color="blue"
                        onClick={() => handleEdit(s)}
                      />
                      <ActionButton
                        icon={<NotebookPen size={14} />}
                        label="Nhật ký"
                        color="amber"
                        onClick={() =>
                          alert(`📝 Nhật ký hoạt động của ${s.fullName}`)
                        }
                      />
                      <button
                        onClick={() => handleToggleStatus(s.id)}
                        className={`flex items-center gap-1 text-sm px-2 py-1 rounded-md ${
                          s.status === "Active"
                            ? "text-gray-600 hover:bg-gray-100"
                            : "text-green-600 hover:bg-green-50"
                        }`}
                      >
                        {s.status === "Active" ? (
                          <>
                            <Lock size={14} /> Khóa
                          </>
                        ) : (
                          <>
                            <Unlock size={14} /> Mở
                          </>
                        )}
                      </button>
                      <ActionButton
                        icon={<Trash2 size={14} />}
                        label="Xóa"
                        color="red"
                        onClick={() => handleDelete(s.id)}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal thêm/sửa */}
      {showModal && (
        <StaffModal
          initialData={editing}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

// Nút hành động
function ActionButton({
  icon,
  label,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  color: "blue" | "red" | "amber";
  onClick?: () => void;
}) {
  const colors = {
    blue: "text-blue-600 hover:bg-blue-50",
    red: "text-red-600 hover:bg-red-50",
    amber: "text-amber-600 hover:bg-amber-50",
  };
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 text-sm px-2 py-1 rounded-md transition ${colors[color]}`}
    >
      {icon} {label}
    </button>
  );
}

// Modal thêm/sửa nhân sự
function StaffModal({
  initialData,
  onClose,
  onSave,
}: {
  initialData?: any;
  onClose: () => void;
  onSave: (form: any) => void;
}) {
  const [form, setForm] = useState(
    initialData || {
      fullName: "",
      username: "",
      phone: "",
      email: "",
      role: "Staff",
      department: "Lễ tân",
      branch: "CN1",
      startDate: new Date().toISOString().split("T")[0],
      status: "Active",
      createdAt: new Date().toISOString(),
    }
  );

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl w-[450px] shadow-lg relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
        >
          <X size={20} />
        </button>

        <h2 className="text-lg font-semibold mb-4">
          {initialData ? "Sửa nhân sự" : "Thêm nhân sự"}
        </h2>

        <div className="space-y-3">
          <input
            type="text"
            placeholder="Họ tên"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Số điện thoại"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border rounded-md px-3 py-2 text-sm"
          />

          <div className="flex gap-2">
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="border rounded-md px-3 py-2 text-sm w-1/2"
            >
              <option>Manager</option>
              <option>Staff</option>
              <option>Technician</option>
            </select>
            <select
              value={form.department}
              onChange={(e) =>
                setForm({ ...form, department: e.target.value })
              }
              className="border rounded-md px-3 py-2 text-sm w-1/2"
            >
              <option>Lễ tân</option>
              <option>Vận hành</option>
              <option>Kỹ thuật</option>
            </select>
          </div>

          <div className="flex gap-2">
            <select
              value={form.branch}
              onChange={(e) => setForm({ ...form, branch: e.target.value })}
              className="border rounded-md px-3 py-2 text-sm w-1/2"
            >
              <option>CN1</option>
              <option>CN2</option>
              <option>CN3</option>
            </select>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="border rounded-md px-3 py-2 text-sm w-1/2"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm border rounded-md">
            Hủy
          </button>
          <button
            onClick={() => onSave(form)}
            className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-md"
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}
