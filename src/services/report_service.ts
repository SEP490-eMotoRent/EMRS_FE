import { API_BASE_URL } from "../app/dashboard/admin/index";

export async function getReports() {
  const res = await fetch(`${API_BASE_URL}/reports`);
  if (!res.ok) throw new Error("Failed to fetch reports");
  return res.json();
}
