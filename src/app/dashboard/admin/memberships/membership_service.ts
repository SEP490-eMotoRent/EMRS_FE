import { getInternalApiBase } from "@/utils/helpers";

const API_PREFIX = "/api/membership";

function buildUrl(path = "") {
  return `${getInternalApiBase()}${API_PREFIX}${path}`;
}

export interface MembershipPayload {
  id?: string;
  tierName: string;
  minBookings: number;
  discountPercentage: number;
  freeChargingPerMonth?: number;
  description?: string;
}

export interface Membership extends MembershipPayload {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

async function parseJsonResponse(res: Response) {
  const text = await res.text();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    console.error("Failed to parse membership response:", text);
    throw new Error("Invalid JSON response from membership API");
  }
}

function extractData(json: any) {
  if (json?.data) {
    return json.data;
  }
  return json;
}

export async function getMemberships(): Promise<Membership[]> {
  const res = await fetch(buildUrl(""), { cache: "no-store" });

  if (!res.ok) {
    const text = await res.text();
    console.error("Failed to fetch memberships:", res.status, text);
    throw new Error("Không thể tải danh sách hạng thành viên");
  }

  const json = await parseJsonResponse(res);
  const data = extractData(json);

  if (Array.isArray(data)) {
    return data;
  }

  if (data?.items && Array.isArray(data.items)) {
    return data.items;
  }

  return Array.isArray(json) ? json : [];
}

export async function getMembershipById(id: string): Promise<Membership> {
  const res = await fetch(buildUrl(`/${id}`), { cache: "no-store" });

  if (!res.ok) {
    const text = await res.text();
    console.error("Failed to fetch membership detail:", res.status, text);
    throw new Error("Không thể tải chi tiết hạng thành viên");
  }

  const json = await parseJsonResponse(res);
  return extractData(json);
}

export async function createMembership(payload: MembershipPayload) {
  const res = await fetch(buildUrl(""), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Failed to create membership:", res.status, text);
    throw new Error("Không thể tạo hạng thành viên");
  }

  const json = await parseJsonResponse(res);
  return extractData(json);
}

export async function updateMembership(id: string, payload: MembershipPayload) {
  const res = await fetch(buildUrl(""), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, id }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Failed to update membership:", res.status, text);
    throw new Error("Không thể cập nhật hạng thành viên");
  }

  const json = await parseJsonResponse(res);
  return extractData(json);
}

export async function deleteMembership(id: string) {
  const res = await fetch(buildUrl(`/${id}`), {
    method: "DELETE",
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Failed to delete membership:", res.status, text);
    throw new Error("Không thể xóa hạng thành viên");
  }

  const json = await parseJsonResponse(res);
  return extractData(json);
}

