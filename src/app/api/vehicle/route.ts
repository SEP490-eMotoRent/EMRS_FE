import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { emrsFetch } from "@/utils/emrsApi";

// GET /api/vehicle
// Lấy danh sách vehicles với các query params
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const branchId = cookieStore.get("branchId")?.value;

    console.log("Vehicle API - branchId from cookie:", branchId);

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - No token" },
        { status: 401 }
      );
    }

    if (!branchId) {
      console.error("Vehicle API - No branchId in cookie!");
      return NextResponse.json(
        { success: false, message: "Unauthorized - No branchId" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const params = new URLSearchParams();
    
    // Thêm các query params nếu có
    if (searchParams.get("LicensePlate")) {
      params.append("LicensePlate", searchParams.get("LicensePlate")!);
    }
    if (searchParams.get("Color")) {
      params.append("Color", searchParams.get("Color")!);
    }
    if (searchParams.get("CurrentOdometerKm")) {
      params.append("CurrentOdometerKm", searchParams.get("CurrentOdometerKm")!);
    }
    if (searchParams.get("BatteryHealthPercentage")) {
      params.append("BatteryHealthPercentage", searchParams.get("BatteryHealthPercentage")!);
    }
    if (searchParams.get("Status")) {
      params.append("Status", searchParams.get("Status")!);
    }
    if (searchParams.get("VehicleModelId")) {
      params.append("VehicleModelId", searchParams.get("VehicleModelId")!);
    }
    if (searchParams.get("PageSize")) {
      params.append("PageSize", searchParams.get("PageSize")!);
    } else {
      // Default PageSize nếu không có
      params.append("PageSize", "100");
    }
    if (searchParams.get("PageNum")) {
      params.append("PageNum", searchParams.get("PageNum")!);
    } else {
      // Default PageNum nếu không có
      params.append("PageNum", "1");
    }
    
    // Luôn filter theo BranchId của manager - BẮT BUỘC
    params.append("BranchId", branchId);

    const queryString = params.toString();
    const url = `/Vehicle${queryString ? `?${queryString}` : ""}`;

    console.log("Vehicle API - Final URL:", url);
    console.log("Vehicle API - BranchId filter:", branchId);

    const beRes = await emrsFetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const text = await beRes.text();
    
    // Log for debugging
    console.log("Vehicle API - URL:", url);
    console.log("Vehicle API - Status:", beRes.status);
    console.log("Vehicle API - Response:", text.substring(0, 500));
    
    return new NextResponse(text, { 
      status: beRes.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (err) {
    console.error("Vehicle list error:", err);
    return NextResponse.json(
      { success: false, message: "Internal BFF Error" },
      { status: 500 }
    );
  }
}

// PUT /api/vehicle
// Cập nhật vehicle (VehicleId trong body)
export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const body = Object.fromEntries(formData.entries());

    const beRes = await emrsFetch("/Vehicle", {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const text = await beRes.text();
    return new NextResponse(text, { status: beRes.status });
  } catch (err) {
    console.error("Vehicle update error:", err);
    return NextResponse.json(
      { success: false, message: "Internal BFF Error" },
      { status: 500 }
    );
  }
}

