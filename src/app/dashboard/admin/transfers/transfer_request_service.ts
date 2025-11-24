const INTERNAL_BASE =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const API_PREFIX = "/api/vehicle-transfer-request";

function buildUrl(path: string) {
  return `${INTERNAL_BASE}${API_PREFIX}${path}`;
}

export interface VehicleTransferRequest {
  id: string;
  description: string;
  quantityRequested: number;
  requestedAt?: string;
  status: "Pending" | "Approved" | "Cancelled";
  reviewedAt?: string | null;
  vehicleModelId: string;
  vehicleModelName?: string;
  staffId?: string;
  staffName?: string;
  branchName?: string;
  createdAt?: string;
  vehicleModel?: {
    id: string;
    modelName: string;
    category?: string;
    maxRangeKm?: number;
    maxSpeedKmh?: number;
  };
  staff?: {
    id: string;
    fullname: string;
    email?: string;
  };
  vehicleTransferOrder?: {
    id: string;
    status: string;
    vehicleLicensePlate?: string;
    fromBranchName?: string;
    toBranchName?: string;
  };
}

// Lấy tất cả transfer requests
export async function getTransferRequests(): Promise<VehicleTransferRequest[]> {
  const url = buildUrl("");

  const res = await fetch(url, {
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Failed to fetch transfer requests:", res.status, errorText);
    throw new Error(`Failed to fetch transfer requests: ${res.statusText}`);
  }

  const text = await res.text();
  let json: any;

  try {
    json = text ? JSON.parse(text) : {};
  } catch (e) {
    console.error("Failed to parse JSON:", text);
    throw new Error("Invalid JSON response");
  }

  let requests: any[] = [];
  if (json.success && json.data && Array.isArray(json.data)) {
    requests = json.data;
  } else if (Array.isArray(json)) {
    requests = json;
  } else if (Array.isArray(json.data)) {
    requests = json.data;
  }

  return requests;
}

// Lấy pending requests (Admin only)
export async function getPendingRequests(): Promise<VehicleTransferRequest[]> {
  const url = buildUrl("/pending");

  const res = await fetch(url, {
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Failed to fetch pending requests:", res.status, errorText);
    throw new Error(`Failed to fetch pending requests: ${res.statusText}`);
  }

  const text = await res.text();
  let json: any;

  try {
    json = text ? JSON.parse(text) : {};
  } catch (e) {
    console.error("Failed to parse JSON:", text);
    throw new Error("Invalid JSON response");
  }

  let requests: any[] = [];
  if (json.success && json.data && Array.isArray(json.data)) {
    requests = json.data;
  } else if (Array.isArray(json)) {
    requests = json;
  } else if (Array.isArray(json.data)) {
    requests = json.data;
  }

  return requests;
}

// Lấy chi tiết request
export async function getTransferRequestById(requestId: string): Promise<VehicleTransferRequest> {
  const url = buildUrl(`/${requestId}`);

  const res = await fetch(url, {
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Failed to fetch transfer request:", res.status, errorText);
    
    // Parse error response để lấy message chi tiết từ backend
    let errorMessage = `Failed to fetch transfer request: ${res.statusText}`;
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.message) {
        errorMessage = errorJson.message;
      }
    } catch (e) {
      // Nếu không parse được, dùng message mặc định
    }
    
    throw new Error(errorMessage);
  }

  const text = await res.text();
  let json: any;

  try {
    json = text ? JSON.parse(text) : {};
  } catch (e) {
    console.error("Failed to parse JSON:", text);
    throw new Error("Invalid JSON response");
  }

  // Nếu backend trả về lỗi trong response body (success: false)
  if (json.success === false) {
    throw new Error(json.message || "Failed to fetch transfer request");
  }

  return json.data || json;
}

// Duyệt request (Admin only)
export async function approveTransferRequest(requestId: string): Promise<VehicleTransferRequest> {
  const url = buildUrl(`/${requestId}/approve`);
  console.log("[Approve Service] Calling URL:", url);

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store", // Đảm bảo không cache response
  });

  console.log("[Approve Service] Response status:", res.status, res.statusText);

  const text = await res.text();
  console.log("[Approve Service] Response text:", text);
  
  let json: any;

  try {
    json = text ? JSON.parse(text) : {};
    console.log("[Approve Service] Parsed JSON:", JSON.stringify(json, null, 2));
  } catch (e) {
    console.error("[Approve Service] Failed to parse JSON:", text, e);
    throw new Error("Invalid JSON response");
  }

  // Kiểm tra nếu backend trả về lỗi (success: false hoặc status không ok)
  if (!res.ok) {
    const errorMessage = json.message || json.error || `Failed to approve transfer request: ${res.statusText}`;
    console.error("[Approve Service] Request failed:", res.status, errorMessage, json);
    throw new Error(errorMessage);
  }

  // Kiểm tra success flag trong response (theo format API: { success: true, message: "...", data: {...}, code: 200 })
  if (json.success === false) {
    const errorMessage = json.message || "Failed to approve transfer request";
    console.error("[Approve Service] Backend returned success: false:", json);
    throw new Error(errorMessage);
  }

  // Trả về data từ response (theo format: { success: true, message: "...", data: {...} })
  if (json.data && typeof json.data === 'object') {
    console.log("[Approve Service] Returning data from json.data:", json.data);
    return json.data as VehicleTransferRequest;
  }

  // Nếu không có data field nhưng có success: true, có thể data chính là response
  if (json.success === true && json.id) {
    console.log("[Approve Service] Response has success:true and id, returning full json as data");
    return json as VehicleTransferRequest;
  }

  // Fallback: trả về toàn bộ json nếu không có data field
  console.log("[Approve Service] No data field, returning full json");
  return json as VehicleTransferRequest;
}

// Hủy request
export async function cancelTransferRequest(requestId: string): Promise<VehicleTransferRequest> {
  const url = buildUrl(`/${requestId}/cancel`);
  console.log("[Cancel Service] Calling URL:", url);

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store", // Đảm bảo không cache response
  });

  console.log("[Cancel Service] Response status:", res.status, res.statusText);

  const text = await res.text();
  console.log("[Cancel Service] Response text:", text);
  
  let json: any;

  try {
    json = text ? JSON.parse(text) : {};
    console.log("[Cancel Service] Parsed JSON:", JSON.stringify(json, null, 2));
  } catch (e) {
    console.error("[Cancel Service] Failed to parse JSON:", text, e);
    throw new Error("Invalid JSON response");
  }

  // Kiểm tra nếu backend trả về lỗi (success: false hoặc status không ok)
  if (!res.ok) {
    const errorMessage = json.message || json.error || `Failed to cancel transfer request: ${res.statusText}`;
    console.error("[Cancel Service] Request failed:", res.status, errorMessage, json);
    throw new Error(errorMessage);
  }

  // Kiểm tra success flag trong response (theo format API: { success: true, message: "...", data: {...}, code: 200 })
  if (json.success === false) {
    const errorMessage = json.message || "Failed to cancel transfer request";
    console.error("[Cancel Service] Backend returned success: false:", json);
    throw new Error(errorMessage);
  }

  // Trả về data từ response (theo format: { success: true, message: "...", data: {...} })
  if (json.data && typeof json.data === 'object') {
    console.log("[Cancel Service] Returning data from json.data:", json.data);
    return json.data as VehicleTransferRequest;
  }

  // Nếu không có data field nhưng có success: true, có thể data chính là response
  if (json.success === true && json.id) {
    console.log("[Cancel Service] Response has success:true and id, returning full json as data");
    return json as VehicleTransferRequest;
  }

  // Fallback: trả về toàn bộ json nếu không có data field
  console.log("[Cancel Service] No data field, returning full json");
  return json as VehicleTransferRequest;
}

// Tạo transfer request (Manager only)
export async function createTransferRequest(data: {
  vehicleModelId: string;
  quantityRequested: number;
  description: string;
}): Promise<VehicleTransferRequest> {
  const url = buildUrl("/create");
  console.log("[Create Request Service] Calling URL:", url);
  console.log("[Create Request Service] Request data:", JSON.stringify(data, null, 2));

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const text = await res.text();
  let json: any;

  try {
    json = text ? JSON.parse(text) : {};
  } catch (e) {
    console.error("Failed to parse JSON:", text);
    throw new Error("Invalid JSON response from server");
  }

  // Handle error responses
  if (!res.ok) {
    const errorMessage = json.message || json.error || `Failed to create transfer request: ${res.statusText}`;
    console.error("Failed to create transfer request:", res.status, errorMessage, json);
    throw new Error(errorMessage);
  }

  // Check if backend returned error in response body
  if (json.success === false) {
    const errorMessage = json.message || "Failed to create transfer request";
    console.error("Backend returned error:", json);
    throw new Error(errorMessage);
  }

  // Return data from response (theo format: { success: true, message: "...", data: {...} })
  if (json.data && typeof json.data === 'object') {
    console.log("[Create Request Service] Request created successfully:", json.data);
    return json.data as VehicleTransferRequest;
  }

  // Fallback: trả về toàn bộ json nếu không có data field
  console.log("[Create Request Service] No data field, returning full json");
  return json as VehicleTransferRequest;
}

// Lấy requests theo branch (Manager)
export async function getTransferRequestsByBranch(branchId: string): Promise<VehicleTransferRequest[]> {
  const url = buildUrl(`/branch/${branchId}`);

  const res = await fetch(url, {
    cache: "no-store",
  });

  const text = await res.text();
  let json: any;

  try {
    json = text ? JSON.parse(text) : {};
  } catch (e) {
    console.error("Failed to parse JSON:", text);
    throw new Error("Invalid JSON response from server");
  }

  // Handle error responses
  if (!res.ok) {
    const errorMessage = json.message || json.error || `Failed to fetch branch transfer requests: ${res.statusText}`;
    console.error("Failed to fetch branch transfer requests:", res.status, errorMessage, json);
    throw new Error(errorMessage);
  }

  // Check if backend returned error in response body
  if (json.success === false) {
    const errorMessage = json.message || "Failed to fetch branch transfer requests";
    console.error("Backend returned error:", json);
    throw new Error(errorMessage);
  }

  // Extract requests from response
  let requests: any[] = [];
  if (json.success && json.data && Array.isArray(json.data)) {
    requests = json.data;
  } else if (Array.isArray(json)) {
    requests = json;
  } else if (Array.isArray(json.data)) {
    requests = json.data;
  }

  return requests;
}

