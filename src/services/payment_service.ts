import { API_BASE_URL } from "../app/dashboard/admin/index";

export async function getPayments() {
  const res = await fetch(`${API_BASE_URL}/payments`);
  if (!res.ok) throw new Error("Failed to fetch payments");
  return res.json();
}
