import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { emrsFetch } from "@/utils/emrsApi";

// GET /api/booking
// Lấy danh sách bookings với các query params
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const params = new URLSearchParams();

    // Thêm các query params nếu có
    if (searchParams.get("VehicleModelId")) {
      params.append("VehicleModelId", searchParams.get("VehicleModelId")!);
    }
    if (searchParams.get("RenterId")) {
      params.append("RenterId", searchParams.get("RenterId")!);
    }
    if (searchParams.get("BookingStatus")) {
      params.append("BookingStatus", searchParams.get("BookingStatus")!);
    }
    if (searchParams.get("PageNum")) {
      params.append("PageNum", searchParams.get("PageNum")!);
    }
    if (searchParams.get("PageSize")) {
      params.append("PageSize", searchParams.get("PageSize")!);
    }

    const queryString = params.toString();
    const url = `/Booking${queryString ? `?${queryString}` : ""}`;

    const beRes = await emrsFetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const text = await beRes.text();
    return new NextResponse(text, { status: beRes.status });
  } catch (err) {
    console.error("Booking list error:", err);
    return NextResponse.json(
      { success: false, message: "Internal BFF Error" },
      { status: 500 }
    );
  }
}

