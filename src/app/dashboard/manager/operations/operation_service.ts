// app/dashboard/manager/operations/operation_service.ts

import { fetchBackend } from "@/utils/helpers";

// Lấy danh sách tất cả rental receipts (bao gồm cả giao và trả)
export async function getRentalReceipts() {
  const res = await fetchBackend("/Rental/Receipt");

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
  // Gọi qua Next.js API route thay vì gọi trực tiếp backend
  const res = await fetch(`/api/rental/receipt/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text();
    let errorMessage = "Không thể tải chi tiết biên bản";
    
    try {
      const errorJson = errorText ? JSON.parse(errorText) : {};
      errorMessage = errorJson.message || errorMessage;
    } catch (e) {
      // Nếu không parse được, dùng message mặc định
    }
    
    throw new Error(errorMessage);
  }

  const text = await res.text();
  let json: any;
  
  try {
    json = text ? JSON.parse(text) : {};
  } catch (e) {
    console.error("Failed to parse JSON:", text);
    throw new Error("Invalid JSON response");
  }
  
  // Handle different response structures
  if (json.success === false) {
    throw new Error(json.message || "Không thể tải chi tiết biên bản");
  }

  return json.data || json;
}
