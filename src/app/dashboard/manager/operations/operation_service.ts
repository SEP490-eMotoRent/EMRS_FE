// app/dashboard/manager/operations/operation_service.ts
export const API_BASE_URL = "http://localhost:4000";

// 🟢 Biên bản giao xe
export async function getHandoverRecords() {
  const res = await fetch(`${API_BASE_URL}/handover_records`, { cache: "no-store" });
  if (!res.ok) throw new Error("Không thể tải biên bản giao xe");
  return res.json();
}

// 🔵 Biên bản trả xe
export async function getReturnRecords() {
  const res = await fetch(`${API_BASE_URL}/return_records`, { cache: "no-store" });
  if (!res.ok) throw new Error("Không thể tải biên bản trả xe");
  return res.json();
}
