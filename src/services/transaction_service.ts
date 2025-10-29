import { API_BASE_URL } from "../app/dashboard/admin/index";

export async function getTransactions() {
  const res = await fetch(`${API_BASE_URL}/transactions`);
  if (!res.ok) throw new Error("Failed to fetch transactions");
  return res.json();
}
