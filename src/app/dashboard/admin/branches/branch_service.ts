import { API_BASE_URL } from "../index";

export async function getBranches() {
  const res = await fetch(`${API_BASE_URL}/branches`);
  if (!res.ok) throw new Error("Failed to fetch branches");
  return res.json();
}
