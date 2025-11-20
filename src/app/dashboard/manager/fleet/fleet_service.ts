const INTERNAL_BASE =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const API_PREFIX = "/api/vehicle-model";

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

// Lấy danh sách vehicle models theo branch (branchId từ cookie)
export async function getVehicleModels() {
  const url = buildUrl("/list");

  const res = await fetch(url, {
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Failed to fetch vehicle models:", res.status, errorText);
    throw new Error(`Failed to fetch vehicle models: ${res.statusText}`);
  }

  const text = await res.text();
  let json: any;
  
  try {
    json = text ? JSON.parse(text) : {};
  } catch (e) {
    console.error("Failed to parse JSON:", text);
    throw new Error("Invalid JSON response");
  }

  console.log("Vehicle Model API response:", json);
  
  // Handle response structure: { success: true, data: [...] }
  if (json.success && json.data) {
    if (Array.isArray(json.data)) {
      return json.data;
    }
  }
  
  // Handle direct array response
  if (Array.isArray(json.data)) {
    return json.data;
  }
  
  if (Array.isArray(json)) {
    return json;
  }
  
  return [];
}

async function parseModelResponse(res: Response) {
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

export async function getVehicleModelById(id: string) {
  const pathsToTry = [`/detail/${id}`, `/${id}`];
  let lastError: { status?: number; statusText?: string } | null = null;

  for (const path of pathsToTry) {
    try {
      const res = await fetch(buildUrl(path), { cache: "no-store" });

      if (res.ok) {
        const json = await parseModelResponse(res);
        return json.data || json;
      }

      lastError = { status: res.status, statusText: res.statusText };

      // Nếu backend trả 404, thử path khác hoặc fallback sang danh sách
      if (res.status === 404) {
        continue;
      }

      throw new Error(`Failed to fetch vehicle model: ${res.statusText}`);
    } catch (err) {
      lastError = {
        status: lastError?.status,
        statusText:
          err instanceof Error ? err.message : "Unknown vehicle model error",
      };
    }
  }

  // Fallback: lấy từ danh sách model hiện có
  try {
    const allModels = await getVehicleModels();
    const model =
      allModels.find(
        (m) => m?.vehicleModelId === id || String(m?.id) === String(id)
      ) || null;

    if (model) {
      return model;
    }
  } catch (err) {
    console.error("Fallback load vehicle models failed:", err);
  }

  throw new Error(
    `Failed to fetch vehicle model: ${lastError?.status || ""} ${
      lastError?.statusText || "Unknown error"
    }`
  );
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

