
import { fetchBackend } from "@/utils/helpers";

const API_PREFIX = "/Branch";

export interface Branch {
  id: string;
  branchId: string;
  branchName: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  openingTime?: string;
  closingTime?: string;
  vehicleCount?: number;
}

// Đếm số xe trong branch từ API /api/vehicle-model/branch/{branchId}
async function getVehicleCountForBranch(branchId: string): Promise<number> {
  try {
    // Gọi qua Next.js API route thay vì gọi trực tiếp backend
    // Sử dụng absolute URL nếu đang ở server-side, relative nếu ở client-side
    const baseUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');
    const url = `${baseUrl}/api/vehicle-model/branch/${branchId}?pageNum=1&pageSize=1000&descendingOrder=false`;
    
    const res = await fetch(url, {
      cache: "no-store",
    });

    if (!res.ok) {
      // Chỉ log warning, không throw error để không làm gián đoạn việc load branches
      if (res.status !== 404) {
        console.warn(`Failed to fetch vehicles for branch ${branchId}:`, res.status);
      }
      return 0;
    }

    const text = await res.text();
    let json: any;

    try {
      json = text ? JSON.parse(text) : {};
    } catch (e) {
      console.warn(`Failed to parse vehicle count response for branch ${branchId}`);
      return 0;
    }

    // Extract items from response
    let items: any[] = [];
    if (json.success && json.data && json.data.items && Array.isArray(json.data.items)) {
      items = json.data.items;
    } else if (json.data && Array.isArray(json.data)) {
      items = json.data;
    } else if (Array.isArray(json)) {
      items = json;
    }

    // Sum up countTotal from all vehicle models
    const totalCount = items.reduce((sum: number, model: any) => {
      return sum + (model.countTotal || 0);
    }, 0);

    return totalCount;
  } catch (error) {
    // Chỉ log warning, không throw error
    console.warn(`Error counting vehicles for branch ${branchId}:`, error);
    return 0;
  }
}

// Lấy danh sách tất cả branches
export async function getBranches(): Promise<Branch[]> {
  const res = await fetchBackend(API_PREFIX);

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Failed to fetch branches:", res.status, errorText);
    throw new Error(`Failed to fetch branches: ${res.statusText}`);
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
  let branchesData: any[] = [];
  if (json.success && json.data && Array.isArray(json.data)) {
    branchesData = json.data;
  } else if (Array.isArray(json)) {
    branchesData = json;
  } else if (Array.isArray(json.data)) {
    branchesData = json.data;
  }

  // Normalize branch data và đếm số xe cho mỗi branch
  const normalizedBranches = await Promise.all(
    branchesData.map(async (branch: any) => {
      const branchId = branch.id || branch.branchId;
      // Đếm số xe từ API Vehicle/model/{branchId}
      const vehicleCount = await getVehicleCountForBranch(branchId);
      
      return {
        id: branchId,
        branchId: branchId,
        branchName: branch.branchName || branch.name || "",
        address: branch.address,
        city: branch.city,
        phone: branch.phone,
        email: branch.email,
        latitude: branch.latitude,
        longitude: branch.longitude,
        openingTime: branch.openingTime,
        closingTime: branch.closingTime,
        vehicleCount: vehicleCount || branch.vehicleCount || 0, // Ưu tiên số đếm từ API
      };
    })
  );

  return normalizedBranches;
}

// Lấy chi tiết branch theo ID
export async function getBranchById(branchId: string): Promise<Branch> {
  const res = await fetchBackend(`${API_PREFIX}/${branchId}`);

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Failed to fetch branch:", res.status, errorText);
    throw new Error(`Failed to fetch branch: ${res.statusText}`);
  }

  const text = await res.text();
  let json: any;

  try {
    json = text ? JSON.parse(text) : {};
  } catch (e) {
    console.error("Failed to parse JSON:", text);
    throw new Error("Invalid JSON response");
  }

  const branch = json.data || json;
  return {
    id: branch.id || branch.branchId,
    branchId: branch.id || branch.branchId,
    branchName: branch.branchName || branch.name || "",
    address: branch.address,
    city: branch.city,
    phone: branch.phone,
    email: branch.email,
    latitude: branch.latitude,
    longitude: branch.longitude,
    openingTime: branch.openingTime,
    closingTime: branch.closingTime,
    vehicleCount: branch.vehicleCount,
  };
}

// Tạo branch mới
export async function createBranch(data: {
  branchName: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  latitude: number;
  longitude: number;
  openingTime: string;
  closingTime: string;
}): Promise<Branch> {

  const res = await fetchBackend(`${API_PREFIX}/create`, {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Failed to create branch:", res.status, errorText);
    throw new Error(`Failed to create branch: ${res.statusText}`);
  }

  const text = await res.text();
  let json: any;

  try {
    json = text ? JSON.parse(text) : {};
  } catch (e) {
    console.error("Failed to parse JSON:", text);
    throw new Error("Invalid JSON response");
  }

  const branch = json.data || json;
  return {
    id: branch.id || branch.branchId,
    branchId: branch.id || branch.branchId,
    branchName: branch.branchName || branch.name || "",
    address: branch.address,
    city: branch.city,
    phone: branch.phone,
    email: branch.email,
    latitude: branch.latitude,
    longitude: branch.longitude,
    openingTime: branch.openingTime,
    closingTime: branch.closingTime,
  };
}

// Cập nhật branch
export async function updateBranch(
  branchId: string,
  data: {
    branchName: string;
    address: string;
    city: string;
    phone: string;
    email: string;
    latitude: number;
    longitude: number;
    openingTime: string;
    closingTime: string;
  }
): Promise<Branch> {
  const res = await fetchBackend(`${API_PREFIX}/${branchId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Failed to update branch:", res.status, errorText);
    throw new Error(`Failed to update branch: ${res.statusText}`);
  }

  const text = await res.text();
  let json: any;

  try {
    json = text ? JSON.parse(text) : {};
  } catch (e) {
    console.error("Failed to parse JSON:", text);
    throw new Error("Invalid JSON response");
  }

  const branch = json.data || json;
  return {
    id: branch.id || branch.branchId,
    branchId: branch.id || branch.branchId,
    branchName: branch.branchName || branch.name || "",
    address: branch.address,
    city: branch.city,
    phone: branch.phone,
    email: branch.email,
    latitude: branch.latitude,
    longitude: branch.longitude,
    openingTime: branch.openingTime,
    closingTime: branch.closingTime,
  };
}

// Xóa branch
export async function deleteBranch(branchId: string): Promise<any> {
  console.log("Deleting branch:", branchId);

  const res = await fetchBackend(`${API_PREFIX}/${branchId}`, {
    method: "DELETE",
  });

  const text = await res.text();
  console.log("Delete branch response status:", res.status);
  console.log("Delete branch response text:", text);

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
    console.error("Failed to delete branch:", res.status, json);
    const errorMessage = json.message || json.error || `Failed to delete branch: ${res.statusText}`;
    throw new Error(errorMessage);
  }

  // Trả về response từ API
  // API trả về: { success: true, message: "Branch deleted successfully", data: true, code: 200 }
  console.log("Delete branch success:", json);
  return json;
}
