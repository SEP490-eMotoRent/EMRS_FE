import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { emrsFetch } from "@/utils/emrsApi";

// PUT /api/vehicle-transfer-request/[id]/approve
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = cookies().get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const beRes = await emrsFetch(
      `/VehicleTransferRequest/${params.id}/approve`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const text = await beRes.text();
    return new NextResponse(text, { status: beRes.status });
  } catch (err) {
    console.error("VehicleTransferRequest approve error:", err);
    return NextResponse.json(
      { success: false, message: "Internal BFF Error" },
      { status: 500 }
    );
  }
}


