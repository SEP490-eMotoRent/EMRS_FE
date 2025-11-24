import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { emrsFetch } from "@/utils/emrsApi";

// GET /api/vehicle/[id]
// Lấy chi tiết vehicle theo ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
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

    const beRes = await emrsFetch(`/Vehicle/${params.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const text = await beRes.text();
    return new NextResponse(text, { status: beRes.status });
  } catch (err) {
    console.error("Vehicle detail error:", err);
    return NextResponse.json(
      { success: false, message: "Internal BFF Error" },
      { status: 500 }
    );
  }
}

