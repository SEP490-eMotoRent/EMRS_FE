import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { emrsFetch } from "@/utils/emrsApi";

// GET /api/vehicle-transfer-order/branch/[branchId]/pending - Manager xem pending orders của branch
export async function GET(
  request: Request,
  context: { params: Promise<{ branchId: string }> }
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

    const { branchId } = await context.params;

    const beRes = await emrsFetch(`/VehicleTransferOrder/branch/${branchId}/pending`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const text = await beRes.text();
    let data: any;

    try {
      data = text ? JSON.parse(text) : {};
    } catch (parseErr) {
      console.error("Failed to parse transfer order response as JSON:", text);
      return NextResponse.json(
        { 
          success: false, 
          message: "Invalid response from server",
          error: "Failed to parse JSON response"
        },
        { status: 500 }
      );
    }

    if (!beRes.ok) {
      return NextResponse.json(
        data || { success: false, message: "Backend error" },
        { status: beRes.status }
      );
    }

    return NextResponse.json(data, { status: beRes.status });
  } catch (err) {
    console.error("Transfer order branch pending error:", err);
    return NextResponse.json(
      { 
        success: false, 
        message: "Internal BFF Error",
        error: err instanceof Error ? err.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

