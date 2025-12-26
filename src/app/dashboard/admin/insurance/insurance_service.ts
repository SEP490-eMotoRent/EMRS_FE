// 🟢 Lấy danh sách claims (gọi qua Next.js API route)
export async function getInsuranceClaims() {
  const res = await fetch("/api/insurance-claim/admin/list", { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Failed to fetch insurance claims");
  }
  const json = await res.json();
  // Trả về data từ response
  return json.data || json;
}

// 🟢 Lấy chi tiết claim theo ID
export async function getInsuranceClaimById(id: string) {
  const res = await fetch(`/api/insurance-claim/admin/${id}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Failed to fetch insurance claim details");
  }
  const json = await res.json();
  // Trả về data từ response
  return json.data || json;
}

// 🟡 Lấy danh sách gói bảo hiểm
// TODO: Tạo API route nếu cần
export async function getInsurancePackages() {
  // Tạm thời trả về mảng rỗng vì chưa có API route
  // Có thể tạo API route /api/insurance-package/list nếu cần
  return [];
}
