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
    console.log("[Create Order Route] Request body:", JSON.stringify(body, null, 2));

    // Endpoint theo API documentation: POST /api/VehicleTransferOrder/create
    const endpoint = "/VehicleTransferOrder/create";
    console.log("[Create Order Route] Calling endpoint:", endpoint);
    
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

    console.log("[Create Order Route] Response status:", beRes.status, beRes.statusText);

    const text = await beRes.text();
    console.log("[Create Order Route] Response text:", text);
    
    let data: any;

    try {
      data = text ? JSON.parse(text) : {};
      console.log("[Create Order Route] Parsed data:", JSON.stringify(data, null, 2));
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
    console.log("[Create Order Route] Success, returning data");
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

