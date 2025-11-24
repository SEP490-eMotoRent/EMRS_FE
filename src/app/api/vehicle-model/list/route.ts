import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { emrsFetch } from "@/utils/emrsApi";

// GET /api/vehicle-model/list
// Lấy danh sách Vehicle Model theo chi nhánh hiện tại
// Query params: pageNum, pageSize, descendingOrder
export async function GET(request: Request) {
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

    // Lấy query params từ request
    const { searchParams } = new URL(request.url);
    const pageNum = searchParams.get("pageNum") || "1";
    const pageSize = searchParams.get("pageSize") || "10";
    const descendingOrder = searchParams.get("descendingOrder") || "false";

    // Gọi API mới: GET /Vehicle/model/{branchId}?pageNum=1&pageSize=10&descendingOrder=false
    const queryString = `?pageNum=${pageNum}&pageSize=${pageSize}&descendingOrder=${descendingOrder}`;
    const beRes = await emrsFetch(`/Vehicle/model/${branchId}${queryString}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const text = await beRes.text();
    return new NextResponse(text, { status: beRes.status });
  } catch (err) {
    console.error("Vehicle model list error:", err);
    return NextResponse.json(
      { success: false, message: "Internal BFF Error" },
      { status: 500 }
    );
  }
}


