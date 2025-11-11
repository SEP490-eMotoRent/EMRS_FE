// app/dashboard/manager/dashboard/dashboard_service.ts

export const API_BASE_URL = "http://localhost:4000"; // port chính bạn đang dùng

// 🟢 Lấy dữ liệu báo cáo (KPI, chi nhánh, doanh thu)
export async function getManagerDashboardReport() {
  try {
    const res = await fetch(`${API_BASE_URL}/reports`, { cache: "no-store" });
    if (!res.ok) throw new Error("Không thể tải dữ liệu báo cáo");
    const data = await res.json();
    return data[0]; // JSON chỉ có 1 phần tử report
  } catch (error) {
    console.error("Lỗi khi fetch reports:", error);
    throw error;
  }
}
