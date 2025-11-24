import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { emrsFetch } from "@/utils/emrsApi";

// PUT /api/booking/assign/[bookingId]/[vehicleId]
// Gán xe cho booking
export async function PUT(
  request: Request,
  { params }: { params: { bookingId: string; vehicleId: string } }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const beRes = await emrsFetch(
      `/Booking/vehicle/assign/${params.bookingId}/${params.vehicleId}`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const text = await beRes.text();
    return new NextResponse(text, { status: beRes.status });
  } catch (err) {
    console.error("Booking assign vehicle error:", err);
    return NextResponse.json(
      { success: false, message: "Internal BFF Error" },
      { status: 500 }
    );
  }
}

