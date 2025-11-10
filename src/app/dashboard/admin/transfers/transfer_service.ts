import { API_BASE_URL } from "../index";

// ===============================
// 🟢 INTERFACES
// ===============================
export type TransferStatus =
  | "pending"
  | "approved"
  | "in_transit"
  | "completed"
  | "rejected"
  | "cancelled";

export interface Transfer {
  id: number;
  code: string;
  status: TransferStatus;
  targetBranchId: string;
  reason: string;
  requestedBy: string;
  requestedAt: string;
  sourceBranchId?: string | null;
  vehicleId?: number | null;
  driverId?: number | null;
  scheduleAt?: string | null;
  pickedAt?: string | null;
  deliveredAt?: string | null;
  note?: string | null;
}

// ===============================
// 🔹 TRANSFER APIs
// ===============================

// 🟢 Lấy tất cả yêu cầu điều phối
export async function getTransfers() {
  const res = await fetch(`${API_BASE_URL}/transfers`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch transfers");
  return res.json();
}

// 🟡 Lấy chi tiết điều phối
export async function getTransfer(id: number) {
  const res = await fetch(`${API_BASE_URL}/transfers/${id}`);
  if (!res.ok) throw new Error("Failed to fetch transfer");
  return res.json();
}

// 🟢 Tạo yêu cầu điều phối mới
export async function createTransfer(data: Partial<Transfer>) {
  const res = await fetch(`${API_BASE_URL}/transfers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create transfer");
  return res.json();
}

// ✅ Cập nhật điều phối
export async function updateTransfer(id: string | number, data: any) {
  const res = await fetch(`${API_BASE_URL}/transfers/${id}`, {
    method: "PATCH", // ✅ PATCH chỉ ghi đè các field cần thiết
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to update transfer");
  return res.json();
}


// 🔴 Xóa điều phối
export async function deleteTransfer(id: number) {
  const res = await fetch(`${API_BASE_URL}/transfers/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete transfer");
}

// ===============================
// 🔹 ACTION APIs (Các hành động điều phối)
// ===============================

// ✅ Duyệt điều phối
export async function approveTransfer(id: number, data: any) {
  return updateTransfer(id, { ...data, status: "approved" });
}

// 🚚 Xuất xe (đang vận chuyển)
export async function pickupTransfer(id: number) {
  return updateTransfer(id, {
    status: "in_transit",
    pickedAt: new Date().toISOString(),
  });
}

// 🏁 Hoàn tất điều phối
export async function completeTransfer(id: number) {
  return updateTransfer(id, {
    status: "completed",
    deliveredAt: new Date().toISOString(),
  });
}

// ❌ Từ chối điều phối
export async function rejectTransfer(id: number, note: string) {
  return updateTransfer(id, { status: "rejected", note });
}

// 🛑 Hủy điều phối
export async function cancelTransfer(id: number, note: string) {
  return updateTransfer(id, { status: "cancelled", note });
}

// ===============================
// 🔹 LIÊN QUAN: CHI NHÁNH / XE / NHÂN VIÊN
// ===============================

// 📍 Lấy danh sách chi nhánh
export async function getBranches() {
  const res = await fetch(`${API_BASE_URL}/branches`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch branches");
  return res.json();
}

// 🚗 Lấy danh sách xe theo chi nhánh
export async function getVehiclesByBranch(branchCode: string) {
  const res = await fetch(`${API_BASE_URL}/vehicles?branch=${branchCode}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch vehicles by branch");
  return res.json();
}

// 👨‍🔧 Lấy danh sách nhân viên theo chi nhánh
export async function getStaffsByBranch(branchCode: string) {
  const res = await fetch(`${API_BASE_URL}/staffs?branch=${branchCode}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch staffs by branch");
  return res.json();
}
