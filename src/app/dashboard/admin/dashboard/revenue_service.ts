export interface TotalRevenueResponse {
  success: boolean;
  message: string;
  data: {
    totalRevenue: number;
  };
  code: number;
}

export interface RevenueByYearResponse {
  success: boolean;
  message: string;
  data: {
    monthTotals: Array<{
      month: number;
      totalRevenue: number;
    }>;
  };
  code: number;
}

export interface RevenueByMonthResponse {
  success: boolean;
  message: string;
  data: Array<{
    date: string;
    grossRevenue: number;
    refundAmount: number;
  }>;
  code: number;
}

export interface RevenueByWeekResponse {
  success: boolean;
  message: string;
  data: any; // Adjust based on actual API response
  code: number;
}

export interface RevenueByDayResponse {
  success: boolean;
  message: string;
  data: any; // Adjust based on actual API response
  code: number;
}

/**
 * Lấy tổng doanh thu từ tất cả giao dịch
 */
export async function getTotalRevenue(): Promise<TotalRevenueResponse> {
  const res = await fetch("/api/dashboard/admin/transactions", {
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Total revenue API error:", res.status, errorText);
    throw new Error("Không thể tải tổng doanh thu");
  }

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.message || "API trả về lỗi");
  }

  return json as TotalRevenueResponse;
}

/**
 * Lấy doanh thu theo năm (theo tháng)
 * @param year Năm cần lấy (ví dụ: 2025)
 */
export async function getRevenueByYear(
  year: number
): Promise<RevenueByYearResponse> {
  const res = await fetch(`/api/dashboard/admin/revenue/year/${year}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Revenue by year API error:", res.status, errorText);
    throw new Error("Không thể tải doanh thu theo năm");
  }

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.message || "API trả về lỗi");
  }

  return json as RevenueByYearResponse;
}

/**
 * Lấy doanh thu theo tháng (theo ngày)
 * @param month Tháng (1-12)
 * @param year Năm
 */
export async function getRevenueByMonth(
  month: number,
  year: number
): Promise<RevenueByMonthResponse> {
  const res = await fetch(
    `/api/dashboard/admin/revenue/month/${month}/${year}`,
    {
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Revenue by month API error:", res.status, errorText);
    throw new Error("Không thể tải doanh thu theo tháng");
  }

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.message || "API trả về lỗi");
  }

  return json as RevenueByMonthResponse;
}

/**
 * Lấy doanh thu theo tuần
 * @param fromDate Ngày bắt đầu (YYYY-MM-DD)
 * @param toDate Ngày kết thúc (YYYY-MM-DD)
 */
export async function getRevenueByWeek(
  fromDate: string,
  toDate: string
): Promise<RevenueByWeekResponse> {
  const res = await fetch(
    `/api/dashboard/admin/revenue/week/${fromDate}/${toDate}`,
    {
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Revenue by week API error:", res.status, errorText);
    throw new Error("Không thể tải doanh thu theo tuần");
  }

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.message || "API trả về lỗi");
  }

  return json as RevenueByWeekResponse;
}

/**
 * Lấy doanh thu theo ngày
 * @param day Ngày cần lấy (YYYY-MM-DD)
 */
export async function getRevenueByDay(
  day: string
): Promise<RevenueByDayResponse> {
  const res = await fetch(`/api/dashboard/admin/revenue/day/${day}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Revenue by day API error:", res.status, errorText);
    throw new Error("Không thể tải doanh thu theo ngày");
  }

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.message || "API trả về lỗi");
  }

  return json as RevenueByDayResponse;
}

