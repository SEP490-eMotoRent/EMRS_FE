import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { emrsFetch } from "@/utils/emrsApi";

// PUT /api/vehicle-transfer-request/[requestId]/cancel - hủy request
export async function PUT(
  request: Request,
  context: { params: Promise<{ requestId: string }> }
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

    const { requestId } = await context.params;
    console.log("[Cancel Route] Cancelling request:", requestId);

    // Endpoint theo API documentation: PUT /api/VehicleTransferRequest/{requestId}/cancel
    const endpoint = `/VehicleTransferRequest/${requestId}/cancel`;
    console.log("[Cancel Route] Calling endpoint:", endpoint);
    console.log("[Cancel Route] Request ID:", requestId);
    
    // Headers theo API documentation: accept: */* và Authorization: Bearer {token}
    const beRes = await emrsFetch(endpoint, {
      method: "PUT",
      headers: { 
        "accept": "*/*",
        "Authorization": `Bearer ${token}` 
      },
    });

    console.log("[Cancel Route] Response status:", beRes.status, beRes.statusText);

    const text = await beRes.text();
    console.log("[Cancel Route] Response text:", text);
    
    let data: any;

    try {
      data = text ? JSON.parse(text) : {};
      console.log("[Cancel Route] Parsed data:", JSON.stringify(data, null, 2));
    } catch (parseErr) {
      console.error("[Cancel Route] Failed to parse JSON:", text, parseErr);
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
      console.error("[Cancel Route] Backend error:", beRes.status, data);
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
    console.log("[Cancel Route] Success, returning data");
    return NextResponse.json(data, { status: beRes.status });
  } catch (err) {
    console.error("Transfer request cancel error:", err);
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

