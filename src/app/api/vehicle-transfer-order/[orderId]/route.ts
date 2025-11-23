import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { emrsFetch } from "@/utils/emrsApi";

// GET /api/vehicle-transfer-order/[orderId] - lấy chi tiết order
export async function GET(
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

    const beRes = await emrsFetch(`/VehicleTransferOrder/${orderId}`, {
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
    console.error("Transfer order get error:", err);
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

// PUT /api/vehicle-transfer-order/[orderId]/cancel - hủy order
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
    const url = new URL(request.url);
    const action = url.pathname.split('/').pop(); // 'cancel', 'dispatch', 'receive'

    let endpoint = `/VehicleTransferOrder/${orderId}`;
    if (action === 'cancel') {
      endpoint = `/VehicleTransferOrder/${orderId}/cancel`;
    } else if (action === 'dispatch') {
      endpoint = `/VehicleTransferOrder/${orderId}/dispatch`;
    } else if (action === 'receive') {
      endpoint = `/VehicleTransferOrder/${orderId}/receive`;
    }

    const beRes = await emrsFetch(endpoint, {
      method: "PUT",
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

    return NextResponse.json(data, { status: beRes.status });
  } catch (err) {
    console.error("Transfer order update error:", err);
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

