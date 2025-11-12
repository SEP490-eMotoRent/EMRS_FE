import { API_BASE_URL } from "../index";

// 🟢 Lấy tất cả admin
export async function getAdmins() {
  const res = await fetch(`${API_BASE_URL}/admins`);
  if (!res.ok) throw new Error("Failed to fetch admins");
  return res.json();
}

// 🔵 Đăng nhập admin (mock login)
export async function loginAdmin(username: string, password: string) {
  const res = await fetch(
    `${API_BASE_URL}/admins?username=${username}&password=${password}`
  );
  const data = await res.json();
  return data.length > 0 ? data[0] : null;
}

// 🟠 Thêm admin mới
export async function createAdmin(adminData: any) {
  const res = await fetch(`${API_BASE_URL}/admins`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(adminData),
  });
  return res.json();
}
