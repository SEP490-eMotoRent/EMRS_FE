import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { emrsFetch } from "@/utils/emrsApi";

// GET /api/vehicle-transfer-request/branch
// Lấy danh sách yêu cầu điều chuyển xe theo chi nhánh hiện tại
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

    const beRes = await emrsFetch(`/VehicleTransferRequest/branch/${branchId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const text = await beRes.text();

    return new NextResponse(text, { status: beRes.status });
  } catch (err) {
    console.error("VehicleTransferRequest branch error:", err);
    return NextResponse.json(
      { success: false, message: "Internal BFF Error" },
      { status: 500 }
    );
  }
}


