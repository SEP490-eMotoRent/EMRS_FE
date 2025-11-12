import { API_BASE_URL } from "../index";

// 🔹 Lấy tất cả tài khoản
export async function getAccounts() {
  const res = await fetch(`${API_BASE_URL}/accounts`);
  if (!res.ok) throw new Error("Failed to fetch accounts");
  return res.json();
}

// 🔹 Thêm tài khoản
export async function createAccount(data: any) {
  const res = await fetch(`${API_BASE_URL}/accounts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create account");
  return res.json();
}

// 🔹 Cập nhật tài khoản
export async function updateAccount(id: number, data: any) {
  const res = await fetch(`${API_BASE_URL}/accounts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update account");
  return res.json();
}

// 🔹 Xóa tài khoản
export async function deleteAccount(id: number) {
  const res = await fetch(`${API_BASE_URL}/accounts/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete account");
  return true;
}

// 🔹 Reset mật khẩu
export async function resetPassword(id: number) {
  const newPass = "123456";
  return updateAccount(id, { password: newPass });
}
