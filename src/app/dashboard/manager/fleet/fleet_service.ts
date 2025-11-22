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

  const url = `${buildUrl("/list")}?${queryParams.toString()}`;

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
    
    // Fallback: thử API detail cũ nếu có
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

        if (res.status === 404) {
          continue;
        }

        throw new Error(`Failed to fetch vehicle model: ${res.statusText}`);
      } catch (fetchErr) {
        lastError = {
          status: lastError?.status,
          statusText:
            fetchErr instanceof Error ? fetchErr.message : "Unknown vehicle model error",
        };
      }
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

