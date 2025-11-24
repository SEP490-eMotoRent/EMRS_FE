import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { emrsFetch } from "@/utils/emrsApi";

// GET /api/vehicle-model/[id]
// Lấy chi tiết vehicle model theo ID (không phải "list")
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Nếu id là "list", không xử lý ở đây (để route /list xử lý)
    if (id === "list") {
      return NextResponse.json(
        { success: false, message: "Not Found" },
        { status: 404 }
      );
    }

    console.log("Vehicle model detail API - ID:", id);

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
    console.log("Vehicle model detail API - Backend URL:", backendUrl);

    const beRes = await emrsFetch(backendUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("Vehicle model detail API - Backend status:", beRes.status);

    const text = await beRes.text();
    console.log("Vehicle model detail API - Response:", text.substring(0, 200));

    return new NextResponse(text, { 
      status: beRes.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (err) {
    console.error("Vehicle model detail error:", err);
    return NextResponse.json(
      { success: false, message: "Internal BFF Error", error: String(err) },
      { status: 500 }
    );
  }
}

