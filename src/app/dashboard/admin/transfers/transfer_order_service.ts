import { fetchBackend } from "@/utils/helpers";

const API_PREFIX = "/VehicleTransferOrder";

export interface VehicleTransferOrder {
  id: string;
  status: "Pending" | "InTransit" | "Completed" | "Cancelled";
  receivedDate?: string | null;
  notes?: string;
  vehicleId: string;
  vehicleLicensePlate?: string;
  fromBranchId: string;
  fromBranchName?: string;
  toBranchId: string;
  toBranchName?: string;
  createdAt?: string;
  vehicle?: {
    id: string;
    licensePlate: string;
    color?: string;
    status?: string;
    vehicleModel?: {
      modelName?: string;
      category?: string;
    };
  };
  fromBranch?: {
    id: string;
    branchName: string;
    address?: string;
    phone?: string;
  };
  toBranch?: {
    id: string;
    branchName: string;
    address?: string;
    phone?: string;
  };
}

// Lấy tất cả transfer orders
export async function getTransferOrders(): Promise<VehicleTransferOrder[]> {
  const res = await fetchBackend(API_PREFIX);

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Failed to fetch transfer orders:", res.status, errorText);
    throw new Error(`Failed to fetch transfer orders: ${res.statusText}`);
  }

  const text = await res.text();
  let json: any;

  try {
    json = text ? JSON.parse(text) : {};
  } catch (e) {
    console.error("Failed to parse JSON:", text);
    throw new Error("Invalid JSON response");
  }

  let orders: any[] = [];
  if (json.success && json.data && Array.isArray(json.data)) {
    orders = json.data;
  } else if (Array.isArray(json)) {
    orders = json;
  } else if (Array.isArray(json.data)) {
    orders = json.data;
  }

  return orders;
}

// Lấy chi tiết order
export async function getTransferOrderById(orderId: string): Promise<VehicleTransferOrder> {
  const res = await fetchBackend(`${API_PREFIX}/${orderId}`);

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Failed to fetch transfer order:", res.status, errorText);
    throw new Error(`Failed to fetch transfer order: ${res.statusText}`);
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

// Lấy orders đang vận chuyển
export async function getInTransitOrders(): Promise<VehicleTransferOrder[]> {
  const res = await fetchBackend(`${API_PREFIX}/intransit`);

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Failed to fetch in-transit orders:", res.status, errorText);
    throw new Error(`Failed to fetch in-transit orders: ${res.statusText}`);
  }

  const text = await res.text();
  let json: any;

  try {
    json = text ? JSON.parse(text) : {};
  } catch (e) {
    console.error("Failed to parse JSON:", text);
    throw new Error("Invalid JSON response");
  }

  let orders: any[] = [];
  if (json.success && json.data && Array.isArray(json.data)) {
    orders = json.data;
  } else if (Array.isArray(json)) {
    orders = json;
  } else if (Array.isArray(json.data)) {
    orders = json.data;
  }

  return orders;
}

// Tạo transfer order
export async function createTransferOrder(data: {
  vehicleId: string;
  fromBranchId: string;
  toBranchId: string;
  notes?: string;
}): Promise<VehicleTransferOrder> {
  console.log("[Create Order Service] Request data:", JSON.stringify(data, null, 2));

  const res = await fetchBackend(`${API_PREFIX}/create`, {
    method: "POST",
    body: JSON.stringify(data),
  });

  console.log("[Create Order Service] Response status:", res.status, res.statusText);

  const text = await res.text();
  console.log("[Create Order Service] Response text:", text);
  
  let json: any;

  try {
    json = text ? JSON.parse(text) : {};
    console.log("[Create Order Service] Parsed JSON:", JSON.stringify(json, null, 2));
  } catch (e) {
    console.error("[Create Order Service] Failed to parse JSON:", text, e);
    throw new Error("Invalid JSON response");
  }

  // Kiểm tra nếu backend trả về lỗi (success: false hoặc status không ok)
  if (!res.ok) {
    // Parse error message từ backend
    const errorMessage = json.message || json.error || `Failed to create transfer order: ${res.statusText}`;
    console.error("[Create Order Service] Request failed:", res.status, errorMessage, json);
    throw new Error(errorMessage);
  }

  // Kiểm tra success flag trong response
  if (json.success === false) {
    const errorMessage = json.message || "Failed to create transfer order";
    console.error("[Create Order Service] Backend returned success: false:", json);
    throw new Error(errorMessage);
  }

  // Trả về data từ response (theo format: { success: true, message: "...", data: {...} })
  if (json.data && typeof json.data === 'object') {
    console.log("[Create Order Service] Returning data from json.data:", json.data);
    return json.data as VehicleTransferOrder;
  }

  // Fallback: trả về toàn bộ json nếu không có data field
  console.log("[Create Order Service] No data field, returning full json");
  return json as VehicleTransferOrder;
}

// Hủy transfer order
export async function cancelTransferOrder(orderId: string): Promise<VehicleTransferOrder> {
  const res = await fetchBackend(`${API_PREFIX}/${orderId}/cancel`, {
    method: "PUT",
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Failed to cancel transfer order:", res.status, errorText);
    throw new Error(`Failed to cancel transfer order: ${res.statusText}`);
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

// Manager xác nhận xuất xe (from branch)
export async function dispatchTransferOrder(orderId: string): Promise<VehicleTransferOrder> {
  const res = await fetchBackend(`${API_PREFIX}/${orderId}/dispatch`, {
    method: "PUT",
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Failed to dispatch transfer order:", res.status, errorText);
    let errorMessage = `Failed to dispatch transfer order: ${res.statusText}`;
    try {
      const errorJson = errorText ? JSON.parse(errorText) : null;
      if (errorJson?.message) {
        errorMessage = errorJson.message;
      }
    } catch {
      // ignore parse error
    }
    throw new Error(errorMessage);
  }

  const text = await res.text();
  let json: any;

  try {
    json = text ? JSON.parse(text) : {};
    console.log("[Dispatch Service] Parsed response:", json);
  } catch (e) {
    console.error("Failed to parse JSON:", text);
    throw new Error("Invalid JSON response");
  }

  const result = json.data || json;
  console.log("[Dispatch Service] Returning order data:", result);
  console.log("[Dispatch Service] Order status:", result?.status);
  return result;
}

// Manager xác nhận nhận xe (to branch)
export async function receiveTransferOrder(orderId: string): Promise<VehicleTransferOrder> {
  const res = await fetchBackend(`${API_PREFIX}/${orderId}/receive`, {
    method: "PUT",
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Failed to receive transfer order:", res.status, errorText);
    let errorMessage = `Failed to receive transfer order: ${res.statusText}`;
    try {
      const errorJson = errorText ? JSON.parse(errorText) : null;
      if (errorJson?.message) {
        errorMessage = errorJson.message;
      }
    } catch {
      // ignore parse error
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

  if (json.success === false) {
    const errorMessage =
      json.message || "Không thể xác nhận nhận xe (server trả về success=false)";
    throw new Error(errorMessage);
  }

  // Ensure we return the data from response
  const result = json.data || json;
  console.log("[Receive Service] Parsed response:", result);
  console.log("[Receive Service] Order status:", result?.status);
  return result;
}

// Lấy orders theo branch (Manager)
export async function getTransferOrdersByBranch(branchId: string): Promise<VehicleTransferOrder[]> {
  // Add timestamp to prevent caching
  const res = await fetchBackend(`${API_PREFIX}/branch/${branchId}?t=${Date.now()}`, {
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0"
    }
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
    let errorMessage = json.message || json.error || `Failed to fetch branch transfer orders: ${res.statusText}`;
    
    // Provide more user-friendly message for mapping type errors
    if (errorMessage.includes("Error mapping types") || errorMessage.includes("mapping types")) {
      errorMessage = "Lỗi xử lý dữ liệu từ server. Vui lòng liên hệ quản trị viên để kiểm tra cấu hình AutoMapper.";
      console.error("[Mapping Error] Backend AutoMapper configuration issue:", json.message);
    }
    
    console.error("Failed to fetch branch transfer orders:", res.status, errorMessage, json);
    throw new Error(errorMessage);
  }

  // Check if backend returned error in response body
  if (json.success === false) {
    let errorMessage = json.message || "Failed to fetch branch transfer orders";
    
    // Provide more user-friendly message for mapping type errors
    if (errorMessage.includes("Error mapping types") || errorMessage.includes("mapping types")) {
      errorMessage = "Lỗi xử lý dữ liệu từ server. Vui lòng liên hệ quản trị viên để kiểm tra cấu hình AutoMapper.";
      console.error("[Mapping Error] Backend AutoMapper configuration issue:", json.message);
    }
    
    console.error("Backend returned error:", json);
    throw new Error(errorMessage);
  }

  // Extract orders from response
  let orders: any[] = [];
  if (json.success && json.data && Array.isArray(json.data)) {
    orders = json.data;
  } else if (Array.isArray(json)) {
    orders = json;
  } else if (Array.isArray(json.data)) {
    orders = json.data;
  }

  return orders;
}

// Lấy pending orders theo branch (Manager)
export async function getPendingTransferOrdersByBranch(branchId: string): Promise<VehicleTransferOrder[]> {
  // Add timestamp to prevent caching
  const res = await fetchBackend(`${API_PREFIX}/branch/${branchId}/pending?t=${Date.now()}`, {
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0"
    }
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
    let errorMessage = json.message || json.error || `Failed to fetch pending branch transfer orders: ${res.statusText}`;
    
    // Provide more user-friendly message for mapping type errors
    if (errorMessage.includes("Error mapping types") || errorMessage.includes("mapping types")) {
      errorMessage = "Lỗi xử lý dữ liệu từ server. Vui lòng liên hệ quản trị viên để kiểm tra cấu hình AutoMapper.";
      console.error("[Mapping Error] Backend AutoMapper configuration issue:", json.message);
    }
    
    console.error("Failed to fetch pending branch transfer orders:", res.status, errorMessage, json);
    throw new Error(errorMessage);
  }

  // Check if backend returned error in response body
  if (json.success === false) {
    let errorMessage = json.message || "Failed to fetch pending branch transfer orders";
    
    // Provide more user-friendly message for mapping type errors
    if (errorMessage.includes("Error mapping types") || errorMessage.includes("mapping types")) {
      errorMessage = "Lỗi xử lý dữ liệu từ server. Vui lòng liên hệ quản trị viên để kiểm tra cấu hình AutoMapper.";
      console.error("[Mapping Error] Backend AutoMapper configuration issue:", json.message);
    }
    
    console.error("Backend returned error:", json);
    throw new Error(errorMessage);
  }

  // Extract orders from response
  let orders: any[] = [];
  if (json.success && json.data && Array.isArray(json.data)) {
    orders = json.data;
  } else if (Array.isArray(json)) {
    orders = json;
  } else if (Array.isArray(json.data)) {
    orders = json.data;
  }

  return orders;
}

