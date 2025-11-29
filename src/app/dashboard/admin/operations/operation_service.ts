// app/dashboard/admin/operations/operation_service.ts

// Lấy danh sách tất cả rental receipts (bao gồm cả giao và trả)
export async function getRentalReceipts() {
  const res = await fetch("/api/rental/receipt", {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Không thể tải danh sách biên bản");
  }

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.message || "Không thể tải danh sách biên bản");
  }

  return json.data || [];
}

// Lấy chi tiết một rental receipt
export async function getRentalReceiptById(id: string) {
  const res = await fetch(`/api/rental/receipt/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Không thể tải chi tiết biên bản");
  }

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.message || "Không thể tải chi tiết biên bản");
  }

  return json.data;
}

