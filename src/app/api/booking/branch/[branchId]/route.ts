import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { emrsFetch } from "@/utils/emrsApi";

// GET /api/booking/branch/[branchId]
// Lấy danh sách bookings theo branch
export async function GET(
  request: Request,
  { params }: { params: { branchId: string } }
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

    const { searchParams } = new URL(request.url);
    const queryParams = new URLSearchParams();

    if (searchParams.get("PageNum")) {
      queryParams.append("PageNum", searchParams.get("PageNum")!);
    }
    if (searchParams.get("PageSize")) {
      queryParams.append("PageSize", searchParams.get("PageSize")!);
    }
    if (searchParams.get("orderByDescending")) {
      queryParams.append("orderByDescending", searchParams.get("orderByDescending")!);
    }

    const queryString = queryParams.toString();
    const url = `/Booking/branch/${params.branchId}${queryString ? `?${queryString}` : ""}`;

    const beRes = await emrsFetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const text = await beRes.text();
    return new NextResponse(text, { status: beRes.status });
  } catch (err) {
    console.error("Booking branch list error:", err);
    return NextResponse.json(
      { success: false, message: "Internal BFF Error" },
      { status: 500 }
    );
  }
}

