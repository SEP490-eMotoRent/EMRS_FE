const INTERNAL_BASE =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const API_PREFIX = "/api/vehicle-model";

function buildUrl(path: string) {
  return `${INTERNAL_BASE}${API_PREFIX}${path}`;
}

export interface VehicleModel {
  vehicleModelId?: string;
  id?: string;
  modelName: string;
  category?: string;
  batteryCapacityKwh?: number;
  maxRangeKm?: number;
  maxSpeedKmh?: number;
  description?: string;
  rentalPrice?: number;
  imageUrl?: string | null;
  images?: string[]; // Array of image URLs
  availableColors?: Array<{ colorName: string }>;
  countTotal?: number;
  countAvailable?: number;
  rentalPricingId?: string;
  rentalPricing?: {
    id: string;
    rentalPrice: number;
    excessKmPrice: number;
  };
  depositAmount?: number;
  originalPrice?: number;
}

// Lấy danh sách tất cả vehicle models (cho admin)
export async function getVehicleModels(): Promise<VehicleModel[]> {
  const url = buildUrl("/list-all");

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

  // Handle response structure: { success: true, data: [...] }
  if (json.success && json.data && Array.isArray(json.data)) {
    return json.data.map(normalizeVehicleModel);
  }

  if (Array.isArray(json)) {
    return json.map(normalizeVehicleModel);
  }

  if (Array.isArray(json.data)) {
    return json.data.map(normalizeVehicleModel);
  }

  console.warn("No vehicle model data found in response:", json);
  return [];
}

// Lấy chi tiết vehicle model theo ID
export async function getVehicleModelById(modelId: string): Promise<VehicleModel> {
  const url = buildUrl(`/${modelId}`);

  const res = await fetch(url, {
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Failed to fetch vehicle model:", res.status, errorText);
    throw new Error(`Failed to fetch vehicle model: ${res.statusText}`);
  }

  const text = await res.text();
  let json: any;

  try {
    json = text ? JSON.parse(text) : {};
  } catch (e) {
    console.error("Failed to parse JSON:", text);
    throw new Error("Invalid JSON response");
  }

  const model = json.data || json;
  return normalizeVehicleModel(model);
}

// Tạo vehicle model mới
export async function createVehicleModel(formData: FormData): Promise<any> {
  const url = buildUrl("/create");

  const res = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Failed to create vehicle model:", res.status, errorText);
    throw new Error(`Failed to create vehicle model: ${res.statusText}`);
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

// Cập nhật vehicle model
export async function updateVehicleModel(modelId: string, data: Partial<VehicleModel>): Promise<any> {
  const url = buildUrl(`/${modelId}`);

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: modelId,
      modelName: data.modelName,
      category: data.category,
      batteryCapacityKwh: data.batteryCapacityKwh,
      maxRangeKm: data.maxRangeKm,
      maxSpeedKmh: data.maxSpeedKmh,
      description: data.description,
      rentalPricingId: data.rentalPricingId,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Failed to update vehicle model:", res.status, errorText);
    throw new Error(`Failed to update vehicle model: ${res.statusText}`);
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

// Xóa vehicle model
export async function deleteVehicleModel(modelId: string): Promise<any> {
  const url = buildUrl(`/${modelId}`);

  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Failed to delete vehicle model:", res.status, errorText);
    throw new Error(`Failed to delete vehicle model: ${res.statusText}`);
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

// Normalize vehicle model data từ API response
function normalizeVehicleModel(model: any): VehicleModel {
  // Xử lý images: có thể là array hoặc single URL
  let imageUrls: string[] = [];
  let imageUrl: string | null = null;
  
  if (model.images && Array.isArray(model.images)) {
    imageUrls = model.images;
    imageUrl = model.images[0] || null; // Lấy ảnh đầu tiên làm imageUrl chính
  } else if (model.imageUrl) {
    imageUrl = model.imageUrl;
    imageUrls = [model.imageUrl];
  }

  return {
    vehicleModelId: model.vehicleModelId || model.id,
    id: model.id || model.vehicleModelId,
    modelName: model.modelName || "",
    category: model.category,
    batteryCapacityKwh: model.batteryCapacityKwh,
    maxRangeKm: model.maxRangeKm,
    maxSpeedKmh: model.maxSpeedKmh,
    description: model.description,
    rentalPrice: model.rentalPrice || model.rentalPricing?.rentalPrice,
    imageUrl: imageUrl,
    images: imageUrls,
    availableColors: model.availableColors || [],
    countTotal: model.countTotal,
    countAvailable: model.countAvailable,
    rentalPricingId: model.rentalPricingId || model.rentalPricing?.id,
    rentalPricing: model.rentalPricing,
    depositAmount: model.depositAmount,
    originalPrice: model.originalPrice,
  };
}

