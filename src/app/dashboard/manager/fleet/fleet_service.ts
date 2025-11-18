const INTERNAL_BASE =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const API_PREFIX = "/api/vehicle";

// Helper build URL tuyệt đối cho fetch phía server
function buildUrl(path: string) {
  return `${INTERNAL_BASE}${API_PREFIX}${path}`;
}

export interface VehicleFilters {
  LicensePlate?: string;
  Color?: string;
  CurrentOdometerKm?: number;
  BatteryHealthPercentage?: number;
  Status?: string;
  VehicleModelId?: string;
  PageSize?: number;
  PageNum?: number;
}

export async function getVehicles(filters?: VehicleFilters) {
  const params = new URLSearchParams();
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, String(value));
      }
    });
  }

  const queryString = params.toString();
  const url = queryString ? `${buildUrl("")}?${queryString}` : buildUrl("");

  const res = await fetch(url, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch vehicles: ${res.statusText}`);
  }

  const json = await res.json();
  return json.data || json || [];
}

export async function getVehicleById(id: string) {
  const res = await fetch(buildUrl(`/${id}`), { cache: "no-store" });
  
  if (!res.ok) {
    throw new Error(`Failed to fetch vehicle: ${res.statusText}`);
  }

  const json = await res.json();
  return json.data || json;
}

export async function updateVehicle(data: any) {
  // API spec: PUT /api/Vehicle với VehicleId trong body
  const form = new FormData();
  Object.entries(data).forEach(([k, v]) => {
    if (v !== undefined && v !== null) {
      form.append(k, v as any);
    }
  });

  const res = await fetch(buildUrl(""), {
    method: "PUT",
    body: form,
  });

  if (!res.ok) {
    throw new Error(`Failed to update vehicle: ${res.statusText}`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

