import { fetchBackend } from "@/utils/helpers";

const API_PREFIX = "/rental/pricing";

export interface RentalPricing {
  id: string;
  rentalPrice: number;
  excessKmPrice: number;
}

export async function getRentalPricings(): Promise<RentalPricing[]> {
  const res = await fetchBackend(API_PREFIX);

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Failed to fetch rental pricing:", res.status, errorText);
    throw new Error("Không thể tải danh sách bảng giá");
  }

  const text = await res.text();
  const json = text ? JSON.parse(text) : {};

  if (json.success && Array.isArray(json.data)) {
    return json.data;
  }

  if (Array.isArray(json)) {
    return json;
  }

  if (Array.isArray(json.data)) {
    return json.data;
  }

  return [];
}

export async function createRentalPricing(payload: {
  rentalPrice: number;
  excessKmPrice: number;
}): Promise<RentalPricing> {
  const res = await fetchBackend(API_PREFIX, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  const json = text ? JSON.parse(text) : {};

  if (!res.ok || json.success === false) {
    const message =
      json.message || json.error || "Không thể tạo bảng giá mới";
    throw new Error(message);
  }

  return json.data || json;
}

export async function updateRentalPricing(
  id: string,
  payload: {
    rentalPrice: number;
    excessKmPrice: number;
  }
): Promise<RentalPricing> {
  const res = await fetchBackend(`${API_PREFIX}/${id}`, {
    method: "PUT",
    body: JSON.stringify({ id, ...payload }),
  });

  const text = await res.text();
  const json = text ? JSON.parse(text) : {};

  if (!res.ok || json.success === false) {
    const message =
      json.message || json.error || "Không thể cập nhật bảng giá";
    throw new Error(message);
  }

  return json.data || json;
}

export async function deleteRentalPricing(id: string): Promise<void> {
  const res = await fetchBackend(`${API_PREFIX}/${id}`, {
    method: "DELETE",
  });

  const text = await res.text();
  const json = text ? JSON.parse(text) : {};

  if (!res.ok || json.success === false) {
    const message = json.message || json.error || "Không thể xóa bảng giá";
    throw new Error(message);
  }
}

