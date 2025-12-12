import { fetchBackend } from "@/utils/helpers";

const VEHICLE_MODEL_PREFIX = "/VehicleModel";
const VEHICLE_PREFIX = "/Vehicle";

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
// Hỗ trợ pagination với pageNum, pageSize, descendingOrder
export async function getVehicleModels(options?: {
  pageNum?: number;
  pageSize?: number;
  descendingOrder?: boolean;
}) {
  const pageNum = options?.pageNum || 1;
  const pageSize = options?.pageSize || 10;
  const descendingOrder = options?.descendingOrder || false;

  const queryParams = new URLSearchParams({
    pageNum: String(pageNum),
    pageSize: String(pageSize),
    descendingOrder: String(descendingOrder),
  });

  // Gọi qua Next.js API route thay vì gọi trực tiếp backend
  const res = await fetch(`/api/vehicle-model/list?${queryParams.toString()}`, {
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
  
  // Handle response structure mới: { success: true, data: { items: [...], totalItems, totalPages, ... } }
  if (json.success && json.data) {
    // Nếu có structure mới với pagination
    if (json.data.items && Array.isArray(json.data.items)) {
      return {
        items: json.data.items,
        totalItems: json.data.totalItems || 0,
        totalPages: json.data.totalPages || 1,
        currentPage: json.data.currentPage || 1,
        pageSize: json.data.pageSize || 10,
      };
    }
    // Fallback: nếu data là array trực tiếp (structure cũ)
    if (Array.isArray(json.data)) {
      return {
        items: json.data,
        totalItems: json.data.length,
        totalPages: 1,
        currentPage: 1,
        pageSize: json.data.length,
      };
    }
  }
  
  // Handle direct array response (structure cũ)
  if (Array.isArray(json.data)) {
    return {
      items: json.data,
      totalItems: json.data.length,
      totalPages: 1,
      currentPage: 1,
      pageSize: json.data.length,
    };
  }
  
  if (Array.isArray(json)) {
    return {
      items: json,
      totalItems: json.length,
      totalPages: 1,
      currentPage: 1,
      pageSize: json.length,
    };
  }
  
  return {
    items: [],
    totalItems: 0,
    totalPages: 0,
    currentPage: 1,
    pageSize: 10,
  };
}

async function parseModelResponse(res: Response) {
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

export async function getVehicleModelById(id: string) {
  // Sử dụng API mới: lấy từ danh sách models với pagination lớn để tìm model theo ID
  try {
    // Lấy tất cả models (pageSize lớn để lấy hết)
    const response = await getVehicleModels({ 
      pageNum: 1, 
      pageSize: 1000, 
      descendingOrder: false 
    });
    
    const items = response.items || [];
    const model = items.find(
      (m: any) => 
        m?.vehicleModelId === id || 
        String(m?.vehicleModelId) === String(id) ||
        m?.id === id ||
        String(m?.id) === String(id)
    );

    if (model) {
      return model;
    }

    // Nếu không tìm thấy trong page đầu, thử các page tiếp theo nếu có
    if (response.totalPages > 1) {
      for (let page = 2; page <= response.totalPages; page++) {
        const nextResponse = await getVehicleModels({ 
          pageNum: page, 
          pageSize: 1000, 
          descendingOrder: false 
        });
        
        const nextModel = nextResponse.items?.find(
          (m: any) => 
            m?.vehicleModelId === id || 
            String(m?.vehicleModelId) === String(id) ||
            m?.id === id ||
            String(m?.id) === String(id)
        );

        if (nextModel) {
          return nextModel;
        }
      }
    }

    throw new Error(`Vehicle model with ID ${id} not found`);
  } catch (err) {
    console.error("Error loading vehicle model by ID:", err);
    
    // Fallback: thử API detail qua Next.js API route
    try {
      const res = await fetch(`/api/vehicle-model/detail/${id}`, {
        cache: "no-store",
      });

      if (res.ok) {
        const json = await parseModelResponse(res);
        return json.data || json;
      }
    } catch (fetchErr) {
      // Ignore fallback errors
    }

    throw new Error(
      `Failed to fetch vehicle model: ${lastError?.status || ""} ${
        lastError?.statusText || err instanceof Error ? err.message : "Unknown error"
      }`
    );
  }
}

export async function updateVehicle(data: any) {
  // API spec: PUT /api/Vehicle với VehicleId trong body
  const form = new FormData();
  Object.entries(data).forEach(([k, v]) => {
    if (v !== undefined && v !== null) {
      form.append(k, v as any);
    }
  });

  const res = await fetchBackend(VEHICLE_PREFIX, {
    method: "PUT",
    body: form,
  });

  if (!res.ok) {
    throw new Error(`Failed to update vehicle: ${res.statusText}`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

export interface ManagerVehicle {
  id?: string;
  vehicleId?: string;
  licensePlate: string;
  color?: string;
  status?: string;
  currentOdometerKm?: number;
  batteryHealthPercentage?: number;
  branchId?: string;
  branchName?: string;
  gpsDeviceIdent?: string;
  flespiDeviceId?: number;
  purchaseDate?: string;
  vehicleModel?: {
    id?: string;
    modelName?: string;
  };
}

export interface ManagerVehicleListResponse {
  items: ManagerVehicle[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

const normalizeVehicle = (vehicle: any): ManagerVehicle => {
  return {
    ...vehicle,
    id: vehicle.id || vehicle.vehicleId,
    vehicleId: vehicle.vehicleId || vehicle.id,
    branchName: vehicle.branch?.branchName || vehicle.branchName,
    branchId: vehicle.branch?.id || vehicle.branchId,
    gpsDeviceIdent: vehicle.gpsDeviceIdent || vehicle.GpsDeviceIdent || undefined,
    flespiDeviceId:
      vehicle.flespiDeviceId || vehicle.FlespiDeviceId || undefined,
    vehicleModel: vehicle.vehicleModel || undefined,
  };
};

export async function getVehiclesByBranch(options: {
  branchId: string;
  licensePlate?: string;
  status?: string;
  pageNum?: number;
  pageSize?: number;
}) {
  const params = new URLSearchParams();

  params.append("BranchId", options.branchId);
  params.append("PageSize", String(options.pageSize || 100));
  params.append("PageNum", String(options.pageNum || 1));

  if (options.licensePlate) {
    params.append("LicensePlate", options.licensePlate);
  }
  if (options.status && options.status !== "all") {
    params.append("Status", options.status);
  }

  const res = await fetchBackend(`${VEHICLE_PREFIX}?${params.toString()}`);

  if (!res.ok) {
    const text = await res.text();
    console.error("Failed to fetch branch vehicles:", res.status, text);
    throw new Error(res.statusText || "Failed to fetch branch vehicles");
  }

  const text = await res.text();
  const json = text ? JSON.parse(text) : {};

  if (json.success && json.data?.items) {
    return {
      items: json.data.items.map(normalizeVehicle),
      totalItems: json.data.totalItems || 0,
      totalPages: json.data.totalPages || 1,
      currentPage: json.data.currentPage || 1,
      pageSize: json.data.pageSize || options.pageSize || 100,
    } as ManagerVehicleListResponse;
  }

  if (Array.isArray(json.data)) {
    return {
      items: json.data.map(normalizeVehicle),
      totalItems: json.data.length,
      totalPages: 1,
      currentPage: 1,
      pageSize: json.data.length,
    } as ManagerVehicleListResponse;
  }

  if (Array.isArray(json)) {
    return {
      items: json.map(normalizeVehicle),
      totalItems: json.length,
      totalPages: 1,
      currentPage: 1,
      pageSize: json.length,
    } as ManagerVehicleListResponse;
  }

  return {
    items: [],
    totalItems: 0,
    totalPages: 0,
    currentPage: 1,
    pageSize: options.pageSize || 100,
  } as ManagerVehicleListResponse;
}

export async function getVehicleById(id: string) {
  const res = await fetchBackend(`${VEHICLE_PREFIX}/${id}`);

  if (!res.ok) {
    const text = await res.text();
    console.error("Failed to fetch vehicle detail:", res.status, text);
    throw new Error(res.statusText || "Failed to fetch vehicle detail");
  }

  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  const data = json.data || json;

  return normalizeVehicle(data);
}

