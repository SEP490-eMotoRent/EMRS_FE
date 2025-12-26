import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { emrsFetch } from "@/utils/emrsApi";

// POST /api/vehicle-transfer-order/create - tạo transfer order
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    );

    // Endpoint theo API documentation: POST /api/VehicleTransferOrder/create
    const endpoint = "/VehicleTransferOrder/create";
    // Headers theo API documentation
    const beRes = await emrsFetch(endpoint, {
      method: "POST",
      headers: { 
        "accept": "*/*",
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const text = await beRes.text();
    let data: any;

    try {
      data = text ? JSON.parse(text) : {};
      );
    } catch (parseErr) {
      console.error("[Create Order Route] Failed to parse JSON:", text, parseErr);
      return NextResponse.json(
        { 
          success: false, 
          message: "Invalid response from server",
          error: "Failed to parse JSON response"
        },
        { status: 500 }
      );
    }

    // Nếu backend trả về lỗi, forward lại với status code và message
    if (!beRes.ok) {
      console.error("[Create Order Route] Backend error:", beRes.status, data);
      return NextResponse.json(
        data || { 
          success: false, 
          message: "Backend error",
          error: `HTTP ${beRes.status}`
        },
        { status: beRes.status }
      );
    }

    // Trả về response thành công từ backend
    return NextResponse.json(data, { status: beRes.status });
  } catch (err) {
    console.error("Transfer order create error:", err);
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

