import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { emrsFetch } from "@/utils/emrsApi";

// PUT /api/vehicle-transfer-order/[orderId]/dispatch - Manager (from branch) xác nhận xuất xe
export async function PUT(
  request: Request,
  context: { params: Promise<{ orderId: string }> }
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

    const { orderId } = await context.params;

    console.log(`[Dispatch API] Calling backend for orderId: ${orderId}`);
    const endpoint = `/VehicleTransferOrder/${orderId}/dispatch`;
    console.log(`[Dispatch API] Endpoint: ${endpoint}`);

    const beRes = await emrsFetch(endpoint, {
      method: "PUT",
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
    });

    console.log(`[Dispatch API] Backend response status: ${beRes.status} ${beRes.statusText}`);
    const text = await beRes.text();
    console.log(`[Dispatch API] Backend response text: ${text.substring(0, 200)}...`);
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

    return NextResponse.json(data, { status: beRes.status });
  } catch (err) {
    console.error("Transfer order dispatch error:", err);
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

