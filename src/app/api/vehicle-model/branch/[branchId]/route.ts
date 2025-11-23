import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { emrsFetch } from "@/utils/emrsApi";

// GET /api/vehicle-model/branch/[branchId] - lấy danh sách vehicle models theo branchId
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
    const { searchParams } = new URL(request.url);
    const pageNum = searchParams.get("pageNum") || "1";
    const pageSize = searchParams.get("pageSize") || "10";
    const descendingOrder = searchParams.get("descendingOrder") || "false";

    const beRes = await emrsFetch(
      `/Vehicle/model/${branchId}?pageNum=${pageNum}&pageSize=${pageSize}&descendingOrder=${descendingOrder}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const text = await beRes.text();
    let data: any;

    try {
      data = text ? JSON.parse(text) : {};
    } catch (parseErr) {
      console.error("Failed to parse vehicle model response as JSON:", text);
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
    console.error("Vehicle model by branch API error:", err);
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

