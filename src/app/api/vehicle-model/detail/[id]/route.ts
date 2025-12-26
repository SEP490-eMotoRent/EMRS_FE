import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { emrsFetch } from "@/utils/emrsApi";

// GET /api/vehicle-model/detail/[id]
// Lấy chi tiết vehicle model theo ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      console.error("Vehicle model detail API - No token");
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const backendUrl = `/Vehicle/model/detail/${id}`;
    const beRes = await emrsFetch(backendUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const text = await beRes.text();

    return new NextResponse(text, {
      status: beRes.status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.error("Vehicle model detail error:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Internal BFF Error",
        error: String(err),
      },
      { status: 500 }
    );
  }
}
