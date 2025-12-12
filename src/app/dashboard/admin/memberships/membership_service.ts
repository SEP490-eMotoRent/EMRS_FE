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
  // Gọi qua Next.js API route thay vì gọi trực tiếp backend
  const res = await fetch("/api/membership", {
    cache: "no-store",
  });

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
  // Gọi qua Next.js API route thay vì gọi trực tiếp backend
  const res = await fetch(`/api/membership/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Failed to fetch membership detail:", res.status, text);
    throw new Error("Không thể tải chi tiết hạng thành viên");
  }

  const json = await parseJsonResponse(res);
  return extractData(json);
}

export async function createMembership(payload: MembershipPayload) {
  // Gọi qua Next.js API route thay vì gọi trực tiếp backend
  const res = await fetch("/api/membership", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Failed to create membership:", res.status, text);
    
    let errorMessage = "Không thể tạo hạng thành viên";
    try {
      const errorJson = text ? JSON.parse(text) : {};
      errorMessage = errorJson.message || errorMessage;
    } catch (e) {
      // Nếu không parse được, dùng message mặc định
    }
    
    throw new Error(errorMessage);
  }

  const json = await parseJsonResponse(res);
  return extractData(json);
}

export async function updateMembership(id: string, payload: MembershipPayload) {
  // Gọi qua Next.js API route thay vì gọi trực tiếp backend
  const res = await fetch("/api/membership", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...payload, id }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Failed to update membership:", res.status, text);
    
    let errorMessage = "Không thể cập nhật hạng thành viên";
    try {
      const errorJson = text ? JSON.parse(text) : {};
      errorMessage = errorJson.message || errorMessage;
    } catch (e) {
      // Nếu không parse được, dùng message mặc định
    }
    
    throw new Error(errorMessage);
  }

  const json = await parseJsonResponse(res);
  return extractData(json);
}

export async function deleteMembership(id: string) {
  // Gọi qua Next.js API route thay vì gọi trực tiếp backend
  const res = await fetch(`/api/membership/${id}`, {
    method: "DELETE",
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Failed to delete membership:", res.status, text);
    
    let errorMessage = "Không thể xóa hạng thành viên";
    try {
      const errorJson = text ? JSON.parse(text) : {};
      errorMessage = errorJson.message || errorMessage;
    } catch (e) {
      // Nếu không parse được, dùng message mặc định
    }
    
    throw new Error(errorMessage);
  }

  const json = await parseJsonResponse(res);
  return extractData(json);
}

