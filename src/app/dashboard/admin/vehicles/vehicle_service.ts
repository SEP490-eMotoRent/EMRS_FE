import { getInternalApiBase } from "@/utils/helpers";

const API_PREFIX = "/api/vehicle";

// Helper build URL tuyệt đối cho fetch phía server
function buildUrl(path: string) {
  return `${getInternalApiBase()}${API_PREFIX}${path}`;
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
  items: any[];
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
    params.append("status", filters.Status);
  }
  // Chỉ append BranchId nếu có giá trị và không phải "all" (admin xem tất cả)
  if (filters?.BranchId && filters.BranchId !== "all") {
    params.append("BranchId", filters.BranchId);
    params.append("branchId", filters.BranchId);
  }
  if (filters?.VehicleModelId) {
    params.append("VehicleModelId", filters.VehicleModelId);
  }
  
  const pageSize = String(filters?.PageSize || 12);
  const pageNum = String(filters?.PageNum || 1);
  params.append("PageSize", pageSize);
  params.append("pageSize", pageSize);
  params.append("PageNum", pageNum);
  params.append("pageNum", pageNum);

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
  // Xử lý ảnh từ nhiều nguồn: medias, fileUrl, imageFiles, mediaResponses
  let imageUrls: string[] = [];
  
  // Ưu tiên medias array (format mới từ API)
  if (vehicle.medias && Array.isArray(vehicle.medias) && vehicle.medias.length > 0) {
    imageUrls = vehicle.medias
      .filter((media: any) => {
        const isValid = media.mediaType === "Image" && (media.fileUrl || media.url);
        return isValid;
      })
      .map((media: any) => media.fileUrl || media.url);
  } else if (vehicle.fileUrl && Array.isArray(vehicle.fileUrl) && vehicle.fileUrl.length > 0) {
    // fileUrl là array trực tiếp từ API
    imageUrls = vehicle.fileUrl.filter((url: any) => url && typeof url === 'string');
  } else if (vehicle.imageFiles && Array.isArray(vehicle.imageFiles) && vehicle.imageFiles.length > 0) {
    imageUrls = vehicle.imageFiles.filter((url: any) => url && typeof url === 'string');
  } else if (vehicle.mediaResponses && Array.isArray(vehicle.mediaResponses)) {
    // Extract URLs từ mediaResponses array
    imageUrls = vehicle.mediaResponses
      .filter((media: any) => media.fileUrl || media.url)
      .map((media: any) => media.fileUrl || media.url)
      .filter((url: any) => url && typeof url === 'string');
  }
  
  const normalized = {
    ...vehicle,
    gpsDeviceIdent: vehicle.gpsDeviceIdent || vehicle.GpsDeviceIdent || vehicle.gpsDeviceId || null,
    flespiDeviceId: vehicle.flespiDeviceId || vehicle.FlespiDeviceId || vehicle.flespiDeviceId || null,
    // Map id -> vehicleId để tương thích
    vehicleId: vehicle.id || vehicle.vehicleId,
    // Map vehicleModel.modelName -> vehicleModelName
    vehicleModelName: vehicle.vehicleModel?.modelName || vehicle.vehicleModelName,
    // Map vehicleModel.id -> vehicleModelId
    vehicleModelId: vehicle.vehicleModel?.id || vehicle.vehicleModelId,
    // Map fileUrl -> imageFiles (ưu tiên medias, sau đó fileUrl, imageFiles, cuối cùng mediaResponses)
    // Nếu imageUrls rỗng nhưng vehicle có fileUrl, dùng fileUrl gốc
    fileUrl: imageUrls.length > 0 ? imageUrls : (vehicle.fileUrl || []),
    imageFiles: imageUrls.length > 0 ? imageUrls : (vehicle.fileUrl || []),
    // Giữ nguyên medias array để có thể truy cập đầy đủ thông tin
    medias: vehicle.medias || undefined,
    // Giữ nguyên branch object nếu có
    branch: vehicle.branch || undefined,
    branchName: vehicle.branch?.branchName || vehicle.branchName,
    // Map branchId từ nhiều nguồn có thể
    branchId: vehicle.branch?.id || vehicle.branchId || vehicle.branchId,
    // Giữ nguyên vehicleModel object với rentalPricing
    vehicleModel: vehicle.vehicleModel ? {
      ...vehicle.vehicleModel,
      rentalPricing: vehicle.vehicleModel.rentalPricing || vehicle.rentalPricing || undefined,
    } : undefined,
  };
  
  console.log("normalizeVehicle - Normalized result:", {
    hasMedias: !!normalized.medias,
    mediasLength: Array.isArray(normalized.medias) ? normalized.medias.length : "N/A",
    medias: normalized.medias,
    fileUrl: normalized.fileUrl,
    imageFiles: normalized.imageFiles,
  });
  
  return normalized;
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

// Xóa vehicle
export async function deleteVehicle(vehicleId: string) {
  const url = buildUrl(`/${vehicleId}`);
  
  console.log("Deleting vehicle:", vehicleId, "URL:", url);

  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const text = await res.text();
  console.log("Delete vehicle response status:", res.status);
  console.log("Delete vehicle response text:", text);

  let json: any;

  try {
    json = text ? JSON.parse(text) : {};
  } catch (e) {
    console.error("Failed to parse JSON:", text);
    // Nếu không parse được JSON nhưng status là 200, vẫn coi là thành công
    if (res.ok) {
      return { success: true, data: true };
    }
    throw new Error("Invalid JSON response");
  }

  // Kiểm tra response structure
  if (!res.ok) {
    console.error("Failed to delete vehicle:", res.status, json);
    const errorMessage = json.message || json.error || `Failed to delete vehicle: ${res.statusText}`;
    throw new Error(errorMessage);
  }

  // Trả về response từ API
  // API trả về: { success: true, message: "Vehicle created successfully.", data: true, code: 200 }
  console.log("Delete vehicle success:", json);
  return json;
}

// Tạo media (ảnh) mới cho vehicle
export async function createMedia(docNo: string, file: File, entityType: string = "Vehicle", mediaType: string = "Image") {
  const url = `${getInternalApiBase()}/api/media`;
  
  const formData = new FormData();
  formData.append("DocNo", docNo);
  formData.append("File", file);
  formData.append("MediaType", mediaType);
  formData.append("EntityType", entityType);
  
  const res = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Failed to create media:", res.status, errorText);
    throw new Error(`Failed to create media: ${res.statusText}`);
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

// Cập nhật media (ảnh) của vehicle
export async function updateMedia(mediaId: string, file: File) {
  const url = `${getInternalApiBase()}/api/media`;
  
  const formData = new FormData();
  formData.append("MediaId", mediaId);
  formData.append("File", file);
  
  const res = await fetch(url, {
    method: "PUT",
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Failed to update media:", res.status, errorText);
    throw new Error(`Failed to update media: ${res.statusText}`);
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

// Xóa media (ảnh) của vehicle
export async function deleteMedia(mediaId: string) {
  const url = `${getInternalApiBase()}/api/media?mediaId=${encodeURIComponent(mediaId)}`;
  
  const res = await fetch(url, {
    method: "DELETE",
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Failed to delete media:", res.status, errorText);
    throw new Error(`Failed to delete media: ${res.statusText}`);
  }

  const text = await res.text();
  let json: any;
  
  try {
    json = text ? JSON.parse(text) : {};
  } catch (e) {
    // Nếu không parse được JSON nhưng status là 200, vẫn coi là thành công
    if (res.ok) {
      return { success: true };
    }
    console.error("Failed to parse JSON:", text);
    throw new Error("Invalid JSON response");
  }

  return json.data || json;
}
