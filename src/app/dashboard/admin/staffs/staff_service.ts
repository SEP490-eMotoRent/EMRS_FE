const INTERNAL_BASE =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const API_PREFIX = "/api/account";

function buildUrl(path: string) {
  return `${INTERNAL_BASE}${API_PREFIX}${path}`;
}

export interface Account {
  id: string;
  username: string;
  role: string;
  fullname: string;
  staff?: {
    id: string;
    branch?: {
      id: string;
      branchName: string;
      address?: string;
      city?: string;
      phone?: string;
      email?: string;
    };
  };
  renter?: {
    id: string;
    email?: string;
    phone?: string;
    address?: string;
    dateOfBirth?: string;
    isVerified?: boolean;
  };
}

// Lấy danh sách tất cả accounts (chỉ ADMIN, MANAGER, STAFF - không lấy RENTER)
export async function getStaffs(): Promise<Account[]> {
  const url = buildUrl("");

  const res = await fetch(url, {
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Failed to fetch accounts:", res.status, errorText);
    throw new Error(`Failed to fetch accounts: ${res.statusText}`);
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
  let accounts: any[] = [];
  if (json.success && json.data && Array.isArray(json.data)) {
    accounts = json.data;
  } else if (Array.isArray(json)) {
    accounts = json;
  } else if (Array.isArray(json.data)) {
    accounts = json.data;
  }

  // Lọc chỉ lấy ADMIN, MANAGER, STAFF, TECHNICIAN (không lấy RENTER)
  const staffAccounts = accounts.filter(
    (account) => account.role && ["ADMIN", "MANAGER", "STAFF", "TECHNICIAN"].includes(account.role.toUpperCase())
  );

  return staffAccounts;
}

// Lấy chi tiết account theo ID
export async function getAccountById(accountId: string): Promise<Account> {
  const url = buildUrl(`/${accountId}`);

  const res = await fetch(url, {
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Failed to fetch account:", res.status, errorText);
    throw new Error(`Failed to fetch account: ${res.statusText}`);
  }

  const text = await res.text();
  let json: any;

  try {
    json = text ? JSON.parse(text) : {};
  } catch (e) {
    console.error("Failed to parse JSON:", text);
    throw new Error("Invalid JSON response");
  }

  const account = json.data || json;
  return account;
}

// Cập nhật role của account
export async function updateAccountRole(accountId: string, role: string): Promise<any> {
  const url = buildUrl("");

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: accountId,
      role: role,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Failed to update account role:", res.status, errorText);
    throw new Error(`Failed to update account role: ${res.statusText}`);
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

// Xóa account (soft delete)
export async function deleteAccount(accountId: string): Promise<any> {
  const url = buildUrl("");

  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: accountId,
      isDeleted: true,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Failed to delete account:", res.status, errorText);
    throw new Error(`Failed to delete account: ${res.statusText}`);
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

// Tạo account mới
export async function createAccount(data: {
  username: string;
  password: string;
  role: string;
  fullname?: string;
  email?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  branchId?: string;
}): Promise<Account> {
  const url = buildUrl("/create");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Failed to create account:", res.status, errorText);
    throw new Error(`Failed to create account: ${res.statusText}`);
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

// Legacy functions để tương thích với code cũ
export async function createStaff(data: any) {
  return await createAccount(data);
}

export async function updateStaff(id: string, data: any) {
  // Nếu có role trong data, dùng updateAccountRole
  if (data.role) {
    return await updateAccountRole(id, data.role);
  }
  // TODO: Implement update staff API nếu có các field khác
  throw new Error("Update staff API chưa được implement đầy đủ");
}

export async function deleteStaff(id: string) {
  return await deleteAccount(id);
}
