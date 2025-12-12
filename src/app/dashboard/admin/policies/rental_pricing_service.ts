import { getInternalApiBase } from "@/utils/helpers";

const API_PREFIX = "/api/rental/pricing";

function buildUrl(path = "") {
  return `${getInternalApiBase()}${API_PREFIX}${path}`;
}

export interface RentalPricing {
  id: string;
  rentalPrice: number;
  excessKmPrice: number;
}

export async function getRentalPricings(): Promise<RentalPricing[]> {
  const res = await fetch(buildUrl(""), { cache: "no-store" });

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
  const res = await fetch(buildUrl(""), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
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
  const res = await fetch(buildUrl(`/${id}`), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id, ...payload }),
    cache: "no-store",
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
  const res = await fetch(buildUrl(`/${id}`), {
    method: "DELETE",
    cache: "no-store",
  });

  const text = await res.text();
  const json = text ? JSON.parse(text) : {};

  if (!res.ok || json.success === false) {
    const message = json.message || json.error || "Không thể xóa bảng giá";
    throw new Error(message);
  }
}

