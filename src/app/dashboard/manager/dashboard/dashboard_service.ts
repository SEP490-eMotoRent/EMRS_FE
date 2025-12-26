// app/dashboard/manager/dashboard/dashboard_service.ts

// Lấy dữ liệu Dashboard thật từ BFF Next.js
export async function getManagerDashboardData() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  const res = await fetch(`${baseUrl}/api/manager/dashboard`, {
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Dashboard API error:", res.status, errorText);
    throw new Error(`Không thể tải dữ liệu dashboard: ${res.status}`);
  }

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.message || "API trả về lỗi");
  }

  return json.data || json;
}
