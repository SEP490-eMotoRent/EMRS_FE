import { API_BASE_URL } from "../index";

// 🟢 Lấy danh sách claims
export async function getInsuranceClaims() {
  const res = await fetch(`${API_BASE_URL}/insurance_claims`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch insurance claims");
  return res.json();
}

// 🟡 Lấy danh sách gói bảo hiểm
export async function getInsurancePackages() {
  const res = await fetch(`${API_BASE_URL}/insurance_packages`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch insurance packages");
  return res.json();
}
