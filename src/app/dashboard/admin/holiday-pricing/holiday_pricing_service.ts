const API_PREFIX = "/api/holiday-pricing";

export interface HolidayPricing {
  id: string;
  holidayName: string;
  holidayDate: string;
  priceMultiplier: number;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

async function handleResponse(res: Response) {
  const text = await res.text();
  let json: any = {};
  if (text) {
    try {
      json = JSON.parse(text);
    } catch (err) {
      console.error("HolidayPricing JSON parse error:", err, text);
      throw new Error("Invalid response from server");
    }
  }

  if (!res.ok || json.success === false) {
    throw new Error(json.message || json.error || "Có lỗi xảy ra");
  }

  return json.data ?? json;
}

export async function getHolidayPricings(): Promise<HolidayPricing[]> {
  const res = await fetch(API_PREFIX, { cache: "no-store" });
  return handleResponse(res);
}

export async function getHolidayPricingById(
  id: string
): Promise<HolidayPricing> {
  const res = await fetch(`${API_PREFIX}/${id}`, { cache: "no-store" });
  return handleResponse(res);
}

export async function getCurrentHolidayPricing() {
  const res = await fetch(`${API_PREFIX}/current/date`, { cache: "no-store" });
  return handleResponse(res);
}

export async function createHolidayPricing(
  payload: Omit<HolidayPricing, "id" | "createdAt" | "updatedAt">
) {
  const res = await fetch(API_PREFIX, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function updateHolidayPricing(
  id: string,
  payload: Omit<HolidayPricing, "id" | "createdAt" | "updatedAt">
) {
  const res = await fetch(API_PREFIX, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...payload }),
  });
  return handleResponse(res);
}

export async function deleteHolidayPricing(id: string) {
  const res = await fetch(`${API_PREFIX}/${id}`, { method: "DELETE" });
  return handleResponse(res);
}

