import { API_BASE_URL } from "../app/dashboard/admin/index";

// Lấy danh sách xe
export async function getVehicles() {
  const res = await fetch(`${API_BASE_URL}/vehicles`);
  if (!res.ok) throw new Error("Failed to fetch vehicles");
  return res.json();
}

// Lấy danh sách mẫu xe
export async function getVehicleModels() {
  const res = await fetch(`${API_BASE_URL}/vehicle_models`);
  if (!res.ok) throw new Error("Failed to fetch vehicle models");
  return res.json();
}
