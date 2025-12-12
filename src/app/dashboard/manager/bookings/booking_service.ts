import { getInternalApiBase } from "@/utils/helpers";

const API_PREFIX = "/api/booking";

function buildUrl(path: string) {
  return `${getInternalApiBase()}${API_PREFIX}${path}`;
}

export interface BookingFilters {
  VehicleModelId?: string;
  RenterId?: string;
  BookingStatus?: string;
  PageNum?: number;
  PageSize?: number;
}

export async function getBookingsByBranch(
  branchId?: string,
  filters?: { PageNum?: number; PageSize?: number; orderByDescending?: boolean }
) {
  const params = new URLSearchParams();

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
  }

  const queryString = params.toString();
  // Use /branch route if no branchId provided (will use cookie)
  const url = branchId
    ? `${buildUrl(`/branch/${branchId}`)}${queryString ? `?${queryString}` : ""}`
    : `${buildUrl("/branch")}${queryString ? `?${queryString}` : ""}`;

  const res = await fetch(url, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch bookings: ${res.statusText}`);
  }

  const text = await res.text();
  const json = text ? JSON.parse(text) : {};

  if (Array.isArray(json.data)) {
    return json.data;
  }

  if (json.data?.items) {
    return json.data.items;
  }

  if (Array.isArray(json)) {
    return json;
  }

  return [];
}

export async function getBookingById(id: string) {
  const res = await fetch(buildUrl(`/${id}`), { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`Failed to fetch booking: ${res.statusText}`);
  }

  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  return json.data || json;
}

export async function createBooking(data: any) {
  const res = await fetch(buildUrl("/create"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text();
    const json = text ? JSON.parse(text) : {};
    throw new Error(json.message || `Failed to create booking: ${res.statusText}`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

export async function cancelBooking(id: string) {
  const res = await fetch(buildUrl(`/cancel/${id}`), {
    method: "PUT",
  });

  if (!res.ok) {
    const text = await res.text();
    const json = text ? JSON.parse(text) : {};
    throw new Error(json.message || `Failed to cancel booking: ${res.statusText}`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

export async function assignVehicle(bookingId: string, vehicleId: string) {
  const res = await fetch(buildUrl(`/assign/${bookingId}/${vehicleId}`), {
    method: "PUT",
  });

  if (!res.ok) {
    const text = await res.text();
    const json = text ? JSON.parse(text) : {};
    throw new Error(json.message || `Failed to assign vehicle: ${res.statusText}`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

