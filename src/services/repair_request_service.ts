const API_PREFIX = "/api/repair-request";
const VEHICLE_API = "/api/vehicle";

export interface PaginationResponse<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface RepairRequestPayload {
  issueDescription: string;
  vehicleId: string;
}

export interface UpdateRepairRequestPayload {
  id: string;
  priority?: string;
  status?: string;
  staffId?: string;
}

export interface TechnicianRepairRequestPayload extends RepairRequestPayload {
  priority?: string;
  status?: string;
  approvedAt?: string;
  technicianId: string;
}

export interface TechnicianUpdatePayload {
  priority?: string;
  status?: string;
  staffId?: string;
}

async function parseJson(res: Response) {
  const text = await res.text();
  if (!text) {
    return {};
  }
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("[repair_request_service] Failed to parse JSON:", err, text);
    throw new Error("Invalid JSON response from server");
  }
}

function normalizeListResponse<T = any>(raw: any): PaginationResponse<T> {
  const data = raw?.data ?? raw;

  if (data?.items && Array.isArray(data.items)) {
    return {
      items: data.items,
      totalItems: data.totalItems ?? data.items.length,
      totalPages: data.totalPages ?? 1,
      currentPage: data.currentPage ?? 1,
      pageSize: data.pageSize ?? data.items.length,
    };
  }

  if (Array.isArray(data)) {
    return {
      items: data,
      totalItems: data.length,
      totalPages: 1,
      currentPage: 1,
      pageSize: data.length,
    };
  }

  if (Array.isArray(raw)) {
    return {
      items: raw,
      totalItems: raw.length,
      totalPages: 1,
      currentPage: 1,
      pageSize: raw.length,
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

function buildQuery(params?: Record<string, string | number | boolean | undefined>) {
  if (!params) return "";
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    search.append(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export async function createRepairRequest(payload: RepairRequestPayload) {
  const res = await fetch(API_PREFIX, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await parseJson(res);
  if (!res.ok) {
    throw new Error(json?.message || "Không thể tạo yêu cầu sửa chữa");
  }
  return json?.data ?? json;
}

export async function updateRepairRequest(payload: UpdateRepairRequestPayload) {
  const res = await fetch(API_PREFIX, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await parseJson(res);
  if (!res.ok) {
    throw new Error(json?.message || "Không thể cập nhật yêu cầu sửa chữa");
  }
  return json?.data ?? json;
}

export async function getRepairRequests(options?: {
  pageNum?: number;
  pageSize?: number;
  orderByDesc?: boolean;
}) {
  const query = buildQuery({
    pageNum: options?.pageNum ?? 1,
    pageSize: options?.pageSize ?? 10,
    orderByDesc: options?.orderByDesc ?? true,
  });

  const res = await fetch(`${API_PREFIX}${query}`, { cache: "no-store" });
  const json = await parseJson(res);
  if (!res.ok) {
    throw new Error(json?.message || "Không thể tải yêu cầu sửa chữa");
  }
  return normalizeListResponse(json);
}

export async function getBranchRepairRequests(options?: {
  pageNum?: number;
  pageSize?: number;
  orderByDesc?: boolean;
}) {
  const query = buildQuery({
    pageNum: options?.pageNum ?? 1,
    pageSize: options?.pageSize ?? 10,
    orderByDesc: options?.orderByDesc ?? true,
  });
  const res = await fetch(`${API_PREFIX}/branch${query}`, { cache: "no-store" });
  const json = await parseJson(res);
  if (!res.ok) {
    throw new Error(json?.message || "Không thể tải yêu cầu sửa chữa của chi nhánh");
  }
  return normalizeListResponse(json);
}

export async function getTechnicianRepairRequests(
  technicianId: string,
  options?: { pageNum?: number; pageSize?: number; orderByDesc?: boolean }
) {
  if (!technicianId) {
    throw new Error("Thiếu technicianId");
  }

  const query = buildQuery({
    pageNum: options?.pageNum ?? 1,
    pageSize: options?.pageSize ?? 10,
    orderByDesc: options?.orderByDesc ?? true,
  });

  const res = await fetch(
    `${API_PREFIX}/technician/${technicianId}${query}`,
    { cache: "no-store" }
  );

  const json = await parseJson(res);
  if (!res.ok) {
    throw new Error(json?.message || "Không thể tải yêu cầu sửa chữa của kỹ thuật viên");
  }
  return normalizeListResponse(json);
}

export async function getRepairRequestById(id: string) {
  if (!id) throw new Error("Thiếu id yêu cầu sửa chữa");
  const res = await fetch(`${API_PREFIX}/${id}`, { cache: "no-store" });
  const json = await parseJson(res);
  if (!res.ok) {
    throw new Error(json?.message || "Không thể lấy chi tiết yêu cầu sửa chữa");
  }
  return json?.data ?? json;
}

export async function getBranchVehicles(options?: {
  pageNum?: number;
  pageSize?: number;
}) {
  const query = buildQuery({
    PageNum: options?.pageNum ?? 1,
    PageSize: options?.pageSize ?? 200,
  });

  const res = await fetch(`${VEHICLE_API}${query}`, { cache: "no-store" });
  const json = await parseJson(res);
  if (!res.ok) {
    throw new Error(json?.message || "Không thể tải danh sách xe");
  }
  const normalized = normalizeListResponse(json);
  return normalized.items;
}

export async function createTechnicianRepairRequest(
  payload: TechnicianRepairRequestPayload
) {
  const res = await fetch(`${API_PREFIX}/technician`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await parseJson(res);
  if (!res.ok) {
    throw new Error(json?.message || "Không thể tạo yêu cầu cho kỹ thuật viên");
  }
  return json?.data ?? json;
}

export async function updateTechnicianRepairRequest(
  repairRequestId: string,
  payload: TechnicianUpdatePayload
) {
  if (!repairRequestId) throw new Error("Thiếu repairRequestId");

  const res = await fetch(`${API_PREFIX}/technician/${repairRequestId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await parseJson(res);
  if (!res.ok) {
    throw new Error(json?.message || "Không thể cập nhật yêu cầu (technician)");
  }

  return json?.data ?? json;
}

