"use client";

import { useEffect, useState } from "react";
import {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  resetPassword,
} from "@/app/dashboard/admin/accounts/account_service";
import {
  Pencil,
  Trash2,
  Lock,
  Unlock,
  KeyRound,
  Plus,
  X,
} from "lucide-react";

export default function AccountManagerPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  // 🔹 Bộ lọc & tìm kiếm
  const [roleFilter, setRoleFilter] = useState("Tất cả");
  const [branchFilter, setBranchFilter] = useState("Tất cả");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const data = await getAccounts();
    setAccounts(data);
    setLoading(false);
  }

  // ==================================================
  // 🔹 Hành động các nút CRUD
  // ==================================================
  const handleAdd = () => {
    setEditing(null);
    setShowModal(true);
  };

  const handleEdit = (acc: any) => {
    setEditing(acc);
    setShowModal(true);
  };

  const handleReset = async (id: number) => {
    if (confirm("Reset mật khẩu về 123456?")) {
      await resetPassword(id);
      alert("✅ Đã reset mật khẩu về 123456");
    }
  };

  const handleToggleStatus = async (id: number) => {
    const target = accounts.find((a) => a.id === id);
    if (!target) return;
    const newStatus = target.status === "Active" ? "Inactive" : "Active";
    await updateAccount(id, { status: newStatus });
    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    );
  };

  const handleDelete = async (id: number) => {
    if (confirm("Bạn chắc chắn muốn xóa tài khoản này?")) {
      await deleteAccount(id);
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    }
  };

  const handleSave = async (form: any) => {
    if (editing) {
      const updated = await updateAccount(editing.id, form);
      setAccounts((prev) =>
        prev.map((a) => (a.id === editing.id ? updated : a))
      );
    } else {
      const created = await createAccount(form);
      setAccounts((prev) => [...prev, created]);
    }
    setShowModal(false);
  };

  // ==================================================
  // 🔹 Lọc & tìm kiếm
  // ==================================================
  const filtered = accounts.filter((a) => {
    return (
      (roleFilter === "Tất cả" || a.role === roleFilter) &&
      (branchFilter === "Tất cả" || a.branch === branchFilter) &&
      (a.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        a.email?.toLowerCase().includes(search.toLowerCase()) ||
        a.phone?.includes(search))
    );
  });

  if (loading) return <div>Đang tải dữ liệu...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Quản lí tài khoản</h1>

      {/* Bộ lọc & nút thêm */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
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
            <option>Customer</option>
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
            placeholder="Tìm tên / email / SDT"
            className="border rounded-md px-3 py-2 text-sm w-64"
          />
        </div>

        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-sm"
        >
          <Plus size={16} /> Thêm tài khoản
        </button>
      </div>

      {/* Bảng danh sách */}
      <div className="bg-white rounded-2xl border p-4">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">Tên</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">SĐT</th>
              <th className="p-2 text-left">Role</th>
              <th className="p-2 text-left">Chi nhánh</th>
              <th className="p-2 text-left">Trạng thái</th>
              <th className="p-2 text-left">Ngày tạo</th>
              <th className="p-2 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center p-4 text-gray-500 italic">
                  Không có tài khoản phù hợp
                </td>
              </tr>
            ) : (
              filtered.map((a) => (
                <tr key={a.id} className="odd:bg-white even:bg-gray-50">
                  <td className="p-2">{a.fullName}</td>
                  <td className="p-2">{a.email}</td>
                  <td className="p-2">{a.phone}</td>
                  <td className="p-2">{a.role}</td>
                  <td className="p-2">{a.branch}</td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        a.status === "Active"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {a.status === "Active"
                        ? "Đang hoạt động"
                        : "Không hoạt động"}
                    </span>
                  </td>
                  <td className="p-2">
                    {new Date(a.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="p-2 text-center">
                    <div className="flex justify-center gap-2">
                      <ActionButton
                        icon={<Pencil size={14} />}
                        label="Sửa"
                        color="blue"
                        onClick={() => handleEdit(a)}
                      />
                      <ActionButton
                        icon={<KeyRound size={14} />}
                        label="Reset"
                        color="amber"
                        onClick={() => handleReset(a.id)}
                      />
                      <button
                        onClick={() => handleToggleStatus(a.id)}
                        className={`flex items-center gap-1 text-sm px-2 py-1 rounded-md ${
                          a.status === "Active"
                            ? "text-gray-600 hover:bg-gray-100"
                            : "text-green-600 hover:bg-green-50"
                        }`}
                      >
                        {a.status === "Active" ? (
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
                        onClick={() => handleDelete(a.id)}
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
        <AccountModal
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          initialData={editing}
        />
      )}
    </div>
  );
}

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

// ===================================================
// 🧠 Modal Form
// ===================================================
function AccountModal({
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
      email: "",
      phone: "",
      role: "Customer",
      branch: "CN1",
      status: "Active",
      createdAt: new Date().toISOString(),
    }
  );

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl w-[420px] shadow-lg relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
        >
          <X size={20} />
        </button>

        <h2 className="text-lg font-semibold mb-4">
          {initialData ? "Sửa tài khoản" : "Thêm tài khoản"}
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
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Số điện thoại"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full border rounded-md px-3 py-2 text-sm"
          />

          <div className="flex gap-2">
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-1/2 border rounded-md px-3 py-2 text-sm"
            >
              <option>Manager</option>
              <option>Staff</option>
              <option>Technician</option>
              <option>Customer</option>
            </select>

            <select
              value={form.branch}
              onChange={(e) => setForm({ ...form, branch: e.target.value })}
              className="w-1/2 border rounded-md px-3 py-2 text-sm"
            >
              <option>CN1</option>
              <option>CN2</option>
              <option>CN3</option>
            </select>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border rounded-md"
          >
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
