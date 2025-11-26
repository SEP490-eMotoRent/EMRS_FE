const INTERNAL_BASE =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const API_PREFIX = "/api/booking";

function buildUrl(path: string) {
  return `${INTERNAL_BASE}${API_PREFIX}${path}`;
}

export interface BookingFilters {
  VehicleModelId?: string;
  RenterId?: string;
  BookingStatus?: string;
  PageNum?: number;
  PageSize?: number;
}

export interface BookingListResponse {
  items: Booking[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface Booking {
  id: string;
  bookingCode?: string;
  startDatetime: string;
  endDatetime: string;
  actualReturnDatetime?: string | null;
  baseRentalFee: number;
  depositAmount: number;
  rentalDays: number;
  rentalHours: number;
  lateReturnFee: number;
  averageRentalPrice: number;
  totalRentalFee: number;
  totalAmount: number;
  bookingStatus: string;
  vehicleModelId?: string;
  renterId?: string;
  vehicleId?: string | null;
  renter?: {
    id: string;
    email: string;
    phone: string;
    address?: string;
    dateOfBirth?: string;
    avatarUrl?: string | null;
    account?: {
      id: string;
      username: string;
      role: string;
      fullname: string;
    };
  };
  vehicle?: {
    id: string;
    licensePlate: string;
    color?: string;
    vehicleModel?: {
      id: string;
      modelName: string;
      category?: string;
    };
  } | null;
  vehicleModel?: {
    id: string;
    modelName: string;
    category?: string;
    batteryCapacityKwh?: number;
    maxRangeKm?: number;
    maxSpeedKmh?: number;
    description?: string;
  };
  handoverBranch?: {
    id: string;
    branchName: string;
    address?: string;
    city?: string;
    phone?: string;
    email?: string;
  };
  returnBranch?: {
    id: string;
    branchName: string;
    address?: string;
    city?: string;
  } | null;
  insurancePackage?: {
    id: string;
    packageName: string;
    packageFee: number;
    description?: string;
  };
}

// Lấy danh sách bookings với filters và pagination
export async function getBookings(filters?: BookingFilters): Promise<BookingListResponse> {
  const params = new URLSearchParams();
  
  if (filters?.VehicleModelId) {
    params.append("VehicleModelId", filters.VehicleModelId);
  }
  if (filters?.RenterId) {
    params.append("RenterId", filters.RenterId);
  }
  if (filters?.BookingStatus) {
    params.append("BookingStatus", filters.BookingStatus);
  }
  
  const pageSize = String(filters?.PageSize || 10);
  const pageNum = String(filters?.PageNum || 1);
  params.append("PageSize", pageSize);
  params.append("PageNum", pageNum);

  const url = `${buildUrl("")}?${params.toString()}`;

  const res = await fetch(url, {
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Failed to fetch bookings:", res.status, errorText);
    throw new Error(`Failed to fetch bookings: ${res.statusText}`);
  }

  const text = await res.text();
  let json: any;
  
  try {
    json = text ? JSON.parse(text) : {};
  } catch (e) {
    console.error("Failed to parse JSON:", text);
    throw new Error("Invalid JSON response");
  }

  // Handle response structure: { success: true, data: { totalItems, totalPages, currentPage, pageSize, items: [...] } }
  if (json.success && json.data) {
    if (json.data.items && Array.isArray(json.data.items)) {
      return {
        items: json.data.items,
        totalItems: json.data.totalItems || 0,
        totalPages: json.data.totalPages || 1,
        currentPage: json.data.currentPage || 1,
        pageSize: json.data.pageSize || 10,
      };
    }
    if (Array.isArray(json.data)) {
      return {
        items: json.data,
        totalItems: json.data.length,
        totalPages: 1,
        currentPage: 1,
        pageSize: json.data.length,
      };
    }
  }
  
  // Handle direct array response (fallback)
  if (Array.isArray(json)) {
    return {
      items: json,
      totalItems: json.length,
      totalPages: 1,
      currentPage: 1,
      pageSize: json.length,
    };
  }
  
  // Handle { data: [...] } (fallback)
  if (json.data && Array.isArray(json.data)) {
    return {
      items: json.data,
      totalItems: json.data.length,
      totalPages: 1,
      currentPage: 1,
      pageSize: json.data.length,
    };
  }

  console.warn("No booking data found in response:", json);
  return {
    items: [],
    totalItems: 0,
    totalPages: 0,
    currentPage: 1,
    pageSize: 10,
  };
}

// Lấy chi tiết booking theo ID
export async function getBookingById(bookingId: string): Promise<Booking> {
  const url = buildUrl(`/${bookingId}`);
  
  const res = await fetch(url, {
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Failed to fetch booking:", res.status, errorText);
    throw new Error(`Failed to fetch booking: ${res.statusText}`);
  }

  const text = await res.text();
  let json: any;
  
  try {
    json = text ? JSON.parse(text) : {};
  } catch (e) {
    console.error("Failed to parse JSON:", text);
    throw new Error("Invalid JSON response");
  }

  const booking = json.data || json;
  return booking;
}

// Hủy booking
export async function cancelBooking(bookingId: string) {
  const url = buildUrl(`/cancel/${bookingId}`);
  
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Failed to cancel booking:", res.status, errorText);
    throw new Error(`Failed to cancel booking: ${res.statusText}`);
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

// Assign vehicle cho booking
export async function assignVehicle(bookingId: string, vehicleId: string) {
  const url = buildUrl(`/vehicle/assign/${bookingId}/${vehicleId}`);
  
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Failed to assign vehicle:", res.status, errorText);
    throw new Error(`Failed to assign vehicle: ${res.statusText}`);
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

