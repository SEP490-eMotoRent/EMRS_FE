import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { emrsFetch } from "@/utils/emrsApi";

// BFF: GET /api/manager/dashboard
// Lấy dữ liệu thật cho dashboard Manager từ nhiều endpoint BE
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const branchId = cookieStore.get("branchId")?.value;

    if (!token || !branchId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const authHeader = { Authorization: `Bearer ${token}` };

    const [branchRes, vehiclesRes, bookingsRes] = await Promise.all([
      // Lấy thông tin chi nhánh theo branchId
      emrsFetch(`/Branch/find/${branchId}`, { headers: authHeader }),
      // Danh sách xe theo chi nhánh
      emrsFetch(`/Vehicle/model/list/${branchId}`, { headers: authHeader }),
      // Danh sách booking theo chi nhánh
      emrsFetch(`/Booking/branch/${branchId}`, { headers: authHeader }),
    ]);

    const [branchJson, vehiclesJson, bookingsJson] = await Promise.all([
      branchRes.json(),
      vehiclesRes.json(),
      bookingsRes.json(),
    ]);

    const branch = branchJson.data ?? branchJson;

    const vehiclesRaw = vehiclesJson.data ?? vehiclesJson ?? [];
    const bookingsRaw = bookingsJson.data ?? bookingsJson ?? [];

    const vehicles: any[] = Array.isArray(vehiclesRaw) ? vehiclesRaw : [];
    const bookings: any[] = Array.isArray(bookingsRaw) ? bookingsRaw : [];

    const totalVehicles = vehicles.length;
    const activeVehicles =
      vehicles.filter((v: any) => v.status === "Rented").length ?? 0;
    const maintenanceVehicles =
      vehicles.filter((v: any) => v.status === "Maintenance").length ?? 0;

    const today = new Date().toISOString().slice(0, 10); // yyyy-mm-dd
    const todayBookings = bookings.filter((b: any) => {
      const dateStr =
        b.bookingDate ||
        b.createdAt ||
        b.created_at ||
        b.startDate ||
        b.start_date;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      if (Number.isNaN(d.getTime())) return false;
      return d.toISOString().slice(0, 10) === today;
    });

    const todayRevenue = todayBookings.reduce((sum: number, b: any) => {
      const amount =
        b.totalPrice ||
        b.total_price ||
        b.totalAmount ||
        b.total_amount ||
        0;
      return sum + (typeof amount === "number" ? amount : 0);
    }, 0);

    return NextResponse.json({
      success: true,
      data: {
        branch,
        vehicles,
        bookings,
        kpi: {
          totalVehicles,
          activeVehicles,
          maintenanceVehicles,
          todayBookings: todayBookings.length,
          todayRevenue,
        },
      },
    });
  } catch (err) {
    console.error("Manager dashboard error:", err);
    return NextResponse.json(
      { success: false, message: "Internal BFF Error" },
      { status: 500 }
    );
  }
}


