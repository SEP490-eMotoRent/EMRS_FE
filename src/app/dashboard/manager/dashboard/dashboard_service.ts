// app/dashboard/manager/dashboard/dashboard_service.ts

// Lấy dữ liệu Dashboard thật từ BFF Next.js
export async function getManagerDashboardData() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/manager/dashboard`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Không thể tải dữ liệu dashboard");
  }

  const json = await res.json();
  return json.data;
}
