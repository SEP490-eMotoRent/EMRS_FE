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
  BranchId?: string;
  VehicleModelId?: string;
  PageSize?: number;
  PageNum?: number;
}

// Response type cho pagination
export interface VehicleListResponse {
  items: Vehicle[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

// Lấy danh sách vehicles với filters và pagination
export async function getVehicles(filters?: VehicleFilters): Promise<VehicleListResponse> {
  const params = new URLSearchParams();
  
  if (filters?.LicensePlate) {
    params.append("LicensePlate", filters.LicensePlate);
  }
  if (filters?.Color) {
    params.append("Color", filters.Color);
  }
  if (filters?.CurrentOdometerKm !== undefined) {
    params.append("CurrentOdometerKm", String(filters.CurrentOdometerKm));
  }
  if (filters?.BatteryHealthPercentage !== undefined) {
    params.append("BatteryHealthPercentage", String(filters.BatteryHealthPercentage));
  }
  if (filters?.Status && filters.Status !== "all") {
    params.append("Status", filters.Status);
  }
  // Chỉ append BranchId nếu có giá trị và không phải "all" (admin xem tất cả)
  if (filters?.BranchId && filters.BranchId !== "all") {
    params.append("BranchId", filters.BranchId);
  }
  if (filters?.VehicleModelId) {
    params.append("VehicleModelId", filters.VehicleModelId);
  }
  
  params.append("PageSize", String(filters?.PageSize || 12));
  params.append("PageNum", String(filters?.PageNum || 1));

  const url = `${buildUrl("")}?${params.toString()}`;

  const res = await fetch(url, {
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Failed to fetch vehicles:", res.status, errorText);
    throw new Error(`Failed to fetch vehicles: ${res.statusText}`);
  }

  const text = await res.text();
  let json: any;
  
  try {
    json = text ? JSON.parse(text) : {};
  } catch (e) {
    console.error("Failed to parse JSON:", text);
    throw new Error("Invalid JSON response");
  }

  // Log để debug
  console.log("Vehicle API response:", json);

  // Handle response structure: { success: true, data: { totalItems, totalPages, currentPage, pageSize, items: [...] } }
  if (json.success && json.data) {
    if (json.data.items && Array.isArray(json.data.items)) {
      // Response có pagination info
      return {
        items: json.data.items.map(normalizeVehicle),
        totalItems: json.data.totalItems || 0,
        totalPages: json.data.totalPages || 1,
        currentPage: json.data.currentPage || 1,
        pageSize: json.data.pageSize || 12,
      };
    }
    // Nếu data là array trực tiếp (fallback)
    if (Array.isArray(json.data)) {
      return {
        items: json.data.map(normalizeVehicle),
        totalItems: json.data.length,
        totalPages: 1,
        currentPage: 1,
        pageSize: json.data.length,
      };
    }
  }
  
  // Handle direct array response (fallback)
  if (Array.isArray(json)) {
    return {
      items: json.map(normalizeVehicle),
      totalItems: json.length,
      totalPages: 1,
      currentPage: 1,
      pageSize: json.length,
    };
  }
  
  // Handle { data: [...] } (fallback)
  if (json.data && Array.isArray(json.data)) {
    return {
      items: json.data.map(normalizeVehicle),
      totalItems: json.data.length,
      totalPages: 1,
      currentPage: 1,
      pageSize: json.data.length,
    };
  }

  // Nếu không có dữ liệu, trả về empty response
  console.warn("No vehicle data found in response:", json);
  return {
    items: [],
    totalItems: 0,
    totalPages: 0,
    currentPage: 1,
    pageSize: 12,
  };
}

// Normalize vehicle data từ API response
function normalizeVehicle(vehicle: any) {
  return {
    ...vehicle,
    // Map id -> vehicleId để tương thích
    vehicleId: vehicle.id || vehicle.vehicleId,
    // Map vehicleModel.modelName -> vehicleModelName
    vehicleModelName: vehicle.vehicleModel?.modelName || vehicle.vehicleModelName,
    // Map vehicleModel.id -> vehicleModelId
    vehicleModelId: vehicle.vehicleModel?.id || vehicle.vehicleModelId,
    // Map fileUrl -> imageFiles
    imageFiles: vehicle.fileUrl || vehicle.imageFiles || [],
    // Giữ nguyên branch object nếu có
    branch: vehicle.branch || undefined,
    branchName: vehicle.branch?.branchName || vehicle.branchName,
    // Map branchId từ nhiều nguồn có thể
    branchId: vehicle.branch?.id || vehicle.branchId || vehicle.branchId,
    // Giữ nguyên vehicleModel object với rentalPricing
    vehicleModel: vehicle.vehicleModel ? {
      ...vehicle.vehicleModel,
      rentalPricing: vehicle.vehicleModel.rentalPricing || undefined,
    } : undefined,
  };
}

// Lấy chi tiết vehicle theo ID
export async function getVehicleById(vehicleId: string) {
  const url = buildUrl(`/${vehicleId}`);
  
  const res = await fetch(url, {
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Failed to fetch vehicle:", res.status, errorText);
    throw new Error(`Failed to fetch vehicle: ${res.statusText}`);
  }

  const text = await res.text();
  let json: any;
  
  try {
    json = text ? JSON.parse(text) : {};
  } catch (e) {
    console.error("Failed to parse JSON:", text);
    throw new Error("Invalid JSON response");
  }

  // Normalize dữ liệu từ API response
  const vehicle = json.data || json;
  return normalizeVehicle(vehicle);
}

// Tạo vehicle mới
export async function createVehicle(formData: FormData) {
  const url = buildUrl("/create");
  
  const res = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Failed to create vehicle:", res.status, errorText);
    throw new Error(`Failed to create vehicle: ${res.statusText}`);
  }

  const text = await res.text();
  let json: any;
  
  try {
    json = text ? JSON.parse(text) : {};
  } catch (e) {
    console.error("Failed to parse JSON:", text);
    throw new Error("Invalid JSON response");
  }

  return json.data || json;
}

// Cập nhật vehicle
export async function updateVehicle(formData: FormData) {
  const url = buildUrl("");
  
  const res = await fetch(url, {
    method: "PUT",
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Failed to update vehicle:", res.status, errorText);
    throw new Error(`Failed to update vehicle: ${res.statusText}`);
  }

  const text = await res.text();
  let json: any;
  
  try {
    json = text ? JSON.parse(text) : {};
  } catch (e) {
    console.error("Failed to parse JSON:", text);
    throw new Error("Invalid JSON response");
  }

  return json.data || json;
}
