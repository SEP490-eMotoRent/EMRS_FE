import { getInternalApiBase } from "@/utils/helpers";

// 🔹 Lấy tất cả tài khoản
export async function getAccounts() {
  const res = await fetch(`${getInternalApiBase()}/api/account`);
  if (!res.ok) throw new Error("Failed to fetch accounts");
  return res.json();
}

// 🔹 Thêm tài khoản
export async function createAccount(data: any) {
  const res = await fetch(`${getInternalApiBase()}/api/account/create-account`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to create account" }));
    throw new Error(error.message || "Failed to create account");
  }
  return res.json();
}

// 🔹 Cập nhật tài khoản
export async function updateAccount(id: number, data: any) {
  const res = await fetch(`${getInternalApiBase()}/api/account/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to update account" }));
    throw new Error(error.message || "Failed to update account");
  }
  return res.json();
}

// 🔹 Xóa tài khoản
export async function deleteAccount(id: number) {
  const res = await fetch(`${getInternalApiBase()}/api/account/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to delete account" }));
    throw new Error(error.message || "Failed to delete account");
  }
  return true;
}

// 🔹 Reset mật khẩu
export async function resetPassword(id: number) {
  const newPass = "123456";
  return updateAccount(id, { password: newPass });
}
