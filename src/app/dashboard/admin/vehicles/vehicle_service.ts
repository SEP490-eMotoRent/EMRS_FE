import { API_BASE_URL } from "../index";

// 🟢 Lấy danh sách xe
export async function getVehicles() {
  const res = await fetch(`${API_BASE_URL}/vehicles`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch vehicles");
  return res.json();
}

// 🟡 Thêm xe
export async function createVehicle(vehicleData: any) {
  const res = await fetch(`${API_BASE_URL}/vehicles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(vehicleData),
  });
  return res.json();
}

// 🔵 Cập nhật xe
export async function updateVehicle(id: number, vehicleData: any) {
  const res = await fetch(`${API_BASE_URL}/vehicles/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(vehicleData),
  });
  return res.json();
}

// 🔴 Xóa xe
export async function deleteVehicle(id: number) {
  await fetch(`${API_BASE_URL}/vehicles/${id}`, { method: "DELETE" });
}
