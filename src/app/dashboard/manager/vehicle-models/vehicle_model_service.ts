import { fetchBackend } from "@/utils/helpers";

const API_PREFIX = "/VehicleModel";

export interface Vehicle {
  id: string;
  licensePlate: string;
  color: string;
  yearOfManufacture?: string;
  currentOdometerKm?: number;
  batteryHealthPercentage?: number;
  status?: string;
  purchaseDate?: string;
  description?: string;
  mediaResponses?: any[];
}

export interface ManagerVehicleModel {
  vehicleModelId: string;
  id?: string; // Alias for vehicleModelId
  modelName: string;
  category?: string;
  batteryCapacityKwh?: number;
  maxRangeKm?: number;
  maxSpeedKmh?: number;
  description?: string;
  rentalPrice?: number;
  originalRentalPrice?: number;
  imageUrl?: string | null;
  availableColors?: Array<{ colorName: string }>;
  countTotal?: number;
  countAvailable?: number;
  vehicles?: Vehicle[];
  mediaResponses?: any[];
}

export interface ManagerVehicleModelListResponse {
  items: ManagerVehicleModel[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export async function getBranchVehicleModels(params: {
  branchId: string;
  pageNum?: number;
  pageSize?: number;
  descendingOrder?: boolean;
}): Promise<ManagerVehicleModelListResponse> {
  const { branchId, pageNum = 1, pageSize = 10, descendingOrder = false } =
    params;

  const search = new URLSearchParams({
    pageNum: String(pageNum),
    pageSize: String(pageSize),
    descendingOrder: String(descendingOrder),
  });

  // API route: /VehicleModel/branch/{branchId}
  const res = await fetchBackend(`${API_PREFIX}/branch/${branchId}?${search.toString()}`);

  if (!res.ok) {
    const text = await res.text();
    console.error("Failed to fetch branch vehicle models:", res.status, text);
    throw new Error(res.statusText || "Failed to fetch branch vehicle models");
  }

  const text = await res.text();
  const json = text ? JSON.parse(text) : {};

  // API response structure: { success: true, message: "...", data: { items: [...], totalItems: ... } }
  let data = json.data || json;
  
  // Nếu response có structure { success, data }, lấy data
  if (json.success && json.data) {
    data = json.data;
  }

  const items: any[] =
    data.items && Array.isArray(data.items)
      ? data.items
      : Array.isArray(data)
      ? data
      : [];

  const normalize = (m: any): ManagerVehicleModel => ({
    vehicleModelId: m.vehicleModelId,
    id: m.vehicleModelId, // Alias for compatibility
    modelName: m.modelName || m.name || "",
    category: m.category,
    batteryCapacityKwh: m.batteryCapacityKwh,
    maxRangeKm: m.maxRangeKm,
    maxSpeedKmh: m.maxSpeedKmh,
    description: m.description,
    rentalPrice: m.rentalPrice,
    originalRentalPrice: m.originalRentalPrice,
    imageUrl: m.imageUrl,
    availableColors: m.availableColors,
    countTotal: m.countTotal ?? m.totalVehicles ?? 0,
    countAvailable: m.countAvailable ?? m.availableVehicles ?? 0,
    vehicles: m.vehicles || [],
    mediaResponses: m.mediaResponses || [],
  });

  return {
    items: items.map(normalize),
    totalItems: data.totalItems ?? items.length,
    totalPages: data.totalPages ?? 1,
    currentPage: data.currentPage ?? pageNum,
    pageSize: data.pageSize ?? pageSize,
  };
}

export async function getManagerVehicleModelDetail(
  id: string
): Promise<ManagerVehicleModel> {
  const res = await fetchBackend(`${API_PREFIX}/detail/${id}`);

  if (!res.ok) {
    const text = await res.text();
    console.error("Failed to fetch vehicle model detail:", res.status, text);
    throw new Error(res.statusText || "Failed to fetch vehicle model detail");
  }

  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  const data = json.data || json;

  return {
    vehicleModelId: data.vehicleModelId || data.id,
    id: data.vehicleModelId || data.id, // Alias for compatibility
    modelName: data.modelName || data.name || "",
    category: data.category,
    batteryCapacityKwh: data.batteryCapacityKwh,
    maxRangeKm: data.maxRangeKm,
    maxSpeedKmh: data.maxSpeedKmh,
    description: data.description,
    rentalPrice: data.rentalPrice,
    originalRentalPrice: data.originalRentalPrice,
    imageUrl: data.imageUrl,
    availableColors: data.availableColors,
    countTotal: data.countTotal ?? data.totalVehicles ?? 0,
    countAvailable: data.countAvailable ?? data.availableVehicles ?? 0,
    vehicles: data.vehicles || [],
    mediaResponses: data.mediaResponses || [],
  };
}


