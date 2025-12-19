const API_PREFIX = "/api/ticket";

export interface TicketListResponse {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  items: any[];
}

export async function getBranchTickets(
  pageSize: number = 100,
  pageNum: number = 1
): Promise<TicketListResponse> {
  const params = new URLSearchParams({
    pageSize: pageSize.toString(),
    pageNum: pageNum.toString(),
    orderByDescending: "true",
  });

  const res = await fetch(`${API_PREFIX}/manager/branch-tickets?${params}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch tickets");
  }

  const json = await res.json();
  
  // Xử lý response structure: { success, message, data: { totalItems, items, ... }, code }
  if (json.success && json.data) {
    return {
      totalItems: json.data.totalItems || 0,
      totalPages: json.data.totalPages || 1,
      currentPage: json.data.currentPage || 1,
      pageSize: json.data.pageSize || pageSize,
      items: json.data.items || [],
    };
  }
  
  // Fallback cho các format khác
  if (json.data) {
    if (Array.isArray(json.data)) {
      return {
        totalItems: json.data.length,
        totalPages: 1,
        currentPage: 1,
        pageSize: json.data.length,
        items: json.data,
      };
    }
    if (json.data.items) {
      return {
        totalItems: json.data.totalItems || json.data.items.length,
        totalPages: json.data.totalPages || 1,
        currentPage: json.data.currentPage || 1,
        pageSize: json.data.pageSize || pageSize,
        items: json.data.items,
      };
    }
  }
  
  if (Array.isArray(json)) {
    return {
      totalItems: json.length,
      totalPages: 1,
      currentPage: 1,
      pageSize: json.length,
      items: json,
    };
  }
  
  return {
    totalItems: 0,
    totalPages: 0,
    currentPage: 1,
    pageSize: pageSize,
    items: [],
  };
}

export async function getTicketById(id: string) {
  const res = await fetch(`${API_PREFIX}/manager/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch ticket details");
  }

  const json = await res.json();
  
  // Xử lý response linh hoạt
  if (json.data) {
    return json.data;
  }
  if (json.success === false) {
    throw new Error(json.message || "Failed to fetch ticket details");
  }
  
  return json;
}

export async function assignStaff(ticketId: string, staffId: string, status: string) {
  if (!ticketId || !staffId || !status) {
    throw new Error("TicketId, StaffId, and Status are required");
  }

  // Tạo JSON body - Gửi { id, status, staffId } (đúng format backend yêu cầu)
  const requestBody = {
    id: ticketId,
    status: status,
    staffId: staffId,
  };

  console.log("🔵 [Client] Request body:", requestBody);

  // Sử dụng route /api/ticket (PUT) - route đã có sẵn và ổn định
  const res = await fetch(`${API_PREFIX}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch (e) {
    console.error("Failed to parse response:", text);
    throw new Error(text || "Failed to assign staff - Invalid response");
  }

  if (!res.ok) {
    // Lấy message từ response
    const errorMessage = json.message || json.error || `Server returned ${res.status}`;
    console.error("Assign staff error:", {
      status: res.status,
      message: errorMessage,
      response: json
    });
    throw new Error(errorMessage);
  }

  return json;
}

// Get booking by ID
export async function getBookingById(bookingId: string) {
  if (!bookingId) {
    return null;
  }
  
  try {
    const res = await fetch(`/api/booking/${bookingId}`, {
      cache: "no-store",
    });
    
    if (!res.ok) {
      console.warn(`Failed to fetch booking ${bookingId}:`, res.status);
      return null;
    }
    
    const text = await res.text();
    let json;
    try {
      json = text ? JSON.parse(text) : {};
    } catch (e) {
      console.warn(`Failed to parse booking response for ${bookingId}`);
      return null;
    }
    
    return json.data || json;
  } catch (err) {
    console.warn(`Error fetching booking ${bookingId}:`, err);
    return null;
  }
}

// Get staff/account by ID (dùng để lấy tên nhân viên từ staffId)
export async function getStaffById(staffId: string) {
  if (!staffId) {
    return null;
  }
  
  try {
    const { fetchBackend } = await import("@/utils/helpers");
    
    // Lấy tất cả accounts để tìm account có staff.id = staffId
    const res = await fetchBackend("/account");
    
    if (!res.ok) {
      console.warn(`Failed to fetch accounts for staff ${staffId}:`, res.status);
      return null;
    }
    
    const json = await res.json();
    const raw = json.data ?? json;
    const accArray = Array.isArray(raw) ? raw : [raw];
    
    // Tìm account có staff.id = staffId
    const account = accArray.find((acc: any) => acc.staff?.id === staffId);
    
    if (!account) {
      return null;
    }
    
    // Nếu có account.id, gọi GET /api/account/{id} để lấy đầy đủ thông tin
    if (account.id) {
        try {
          const detailRes = await fetchBackend(`/account/${account.id}`);
        
        if (detailRes.ok) {
          const detailJson = await detailRes.json();
          return detailJson.data || detailJson;
        }
      } catch (err) {
        console.warn(`Failed to fetch account details for ${account.id}:`, err);
      }
    }
    
    return account;
  } catch (err) {
    console.warn(`Error fetching staff ${staffId}:`, err);
    return null;
  }
}

// Get list of staff in the branch for assignment
export async function getBranchStaff(branchName?: string, branchId?: string) {
  try {
    const { fetchBackend } = await import("@/utils/helpers");
    
    // Bước 1: Gọi GET /account để lấy tất cả accounts
    const res = await fetchBackend("/account");

    if (!res.ok) {
      throw new Error("Failed to fetch accounts");
    }

    const json = await res.json();
    const raw = json.data ?? json;
    const accArray = Array.isArray(raw) ? raw : [raw];
    
    // Filter staff accounts
    const staffAccounts = accArray.filter((acc: any) => acc.role === "STAFF");
    
    // Bước 2: Với mỗi staff account, gọi GET /api/account/{id} để lấy đầy đủ thông tin (bao gồm staff.id)
    const staffWithDetails = await Promise.all(
      staffAccounts.map(async (account: any) => {
        if (!account.id) return null;
        
        try {
          const detailRes = await fetchBackend(`/account/${account.id}`);
          
          if (detailRes.ok) {
            const detailJson = await detailRes.json();
            return detailJson.data || detailJson;
          }
          
          // Nếu không lấy được detail, trả về account ban đầu
          return account;
        } catch (err) {
          console.warn(`Failed to fetch details for account ${account.id}:`, err);
          return account;
        }
      })
    );
    
    // Filter out null values
    let filteredStaff = staffWithDetails.filter((staff: any) => staff !== null);
    
    // Bước 3: Lọc staff theo chi nhánh nếu có thông tin chi nhánh
    if (branchName || branchId) {
      filteredStaff = filteredStaff.filter((staff: any) => {
        const staffBranchName = staff.staff?.branch?.branchName || staff.branch?.branchName;
        const staffBranchId = staff.staff?.branch?.id || staff.branch?.id;
        
        // So sánh theo branchName hoặc branchId
        if (branchName && staffBranchName) {
          return staffBranchName === branchName;
        }
        if (branchId && staffBranchId) {
          return staffBranchId === branchId;
        }
        
        // Nếu không có thông tin branch của staff, loại bỏ
        return false;
      });
    }
    
    return filteredStaff;
  } catch (err) {
    console.error("Error fetching branch staff:", err);
    throw err;
  }
}

