import { API_BASE_URL } from "../index";

// 🔹 Lấy danh sách nhân sự
export async function getStaffs() {
  const res = await fetch(`${API_BASE_URL}/staffs`);
  if (!res.ok) throw new Error("Failed to fetch staffs");
  return res.json();
}

// 🔹 Thêm nhân sự
export async function createStaff(data: any) {
  const res = await fetch(`${API_BASE_URL}/staffs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create staff");
  return res.json();
}

// 🔹 Cập nhật nhân sự
export async function updateStaff(id: number, data: any) {
  const res = await fetch(`${API_BASE_URL}/staffs/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update staff");
  return res.json();
}

// 🔹 Xóa nhân sự
export async function deleteStaff(id: number) {
  const res = await fetch(`${API_BASE_URL}/staffs/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete staff");
  return true;
}
