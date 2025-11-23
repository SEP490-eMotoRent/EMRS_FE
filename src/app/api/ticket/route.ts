import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { emrsFetch } from "@/utils/emrsApi";
import FormDataNode from "form-data";
import axios from "axios";

// GET /api/ticket - Lấy danh sách tickets với pagination
export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const pageSize = searchParams.get("pageSize");
    const pageNum = searchParams.get("pageNum");
    const orderByDescending = searchParams.get("orderByDescending");

    const params = new URLSearchParams();
    if (pageSize) params.append("pageSize", pageSize);
    if (pageNum) params.append("pageNum", pageNum);
    if (orderByDescending) params.append("orderByDescending", orderByDescending);

    const queryString = params.toString();
    const url = `/Ticket${queryString ? `?${queryString}` : ""}`;

    const beRes = await emrsFetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const text = await beRes.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      console.error("❌ JSON Parse Error:", e);
      return NextResponse.json(
        { success: false, message: "Invalid JSON from BE" },
        { status: 500 }
      );
    }

    return NextResponse.json(json, { status: beRes.status });

  } catch (err) {
    console.error("🔥 BFF ERROR:", err);
    return NextResponse.json(
      { success: false, message: "Internal BFF Error" },
      { status: 500 }
    );
  }
}

// PUT /api/ticket - Update ticket
export async function PUT(req: Request) {
  console.log("🔵 [BFF] PUT /api/ticket called");
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const incomingFormData = await req.formData();

    const Id = incomingFormData.get("Id") as string;
    const Status = incomingFormData.get("Status") as string;
    const StaffId = incomingFormData.get("StaffId") as string;

    console.log("🔵 [BFF] Incoming FormData:", { 
      Id, 
      Status, 
      StaffId,
      "Id type": typeof Id,
      "Status type": typeof Status,
      "StaffId type": typeof StaffId,
      "Id length": Id?.length,
      "StaffId length": StaffId?.length
    });

    // Validation với message rõ ràng
    if (!Id || !Id.trim()) {
      console.error("❌ [BFF] Validation failed: Id is missing or empty");
      return NextResponse.json({ success: false, message: "Id is required" }, { status: 400 });
    }
    if (!Status || !Status.trim()) {
      console.error("❌ [BFF] Validation failed: Status is missing or empty");
      return NextResponse.json({ success: false, message: "Status is required" }, { status: 400 });
    }
    if (!StaffId || !StaffId.trim()) {
      console.error("❌ [BFF] Validation failed: StaffId is missing or empty");
      return NextResponse.json({ success: false, message: "StaffId is required" }, { status: 400 });
    }

    // Validate Status values
    const validStatuses = ["Pending", "InProgress", "Resolved"];
    if (!validStatuses.includes(Status)) {
      console.error(`❌ [BFF] Validation failed: Invalid Status '${Status}'. Valid values: ${validStatuses.join(", ")}`);
      return NextResponse.json({ 
        success: false, 
        message: `Invalid Status. Must be one of: ${validStatuses.join(", ")}` 
      }, { status: 400 });
    }

    // ⭐⭐ Backend route: PUT /Ticket - Id, Status, StaffId đều trong FormData
    const formData = new FormDataNode();
    // Đảm bảo trim và format đúng
    formData.append("Id", String(Id).trim());
    formData.append("Status", String(Status).trim());
    formData.append("StaffId", String(StaffId).trim());

    const base =
      process.env.EMRS_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "https://emrssep490-haevbjfhdkbzhaaj.southeastasia-01.azurewebsites.net/api";

    // ⭐⭐ Backend route: PUT /Ticket (không có id trong URL)
    const url = `${base}/Ticket`;

    console.log("🔵 [BFF] PUT URL:", url);
    console.log("🔵 [BFF] FormData fields:", { Id, Status, StaffId });

    const axiosRes = await axios.put(url, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        ...formData.getHeaders(),
      }
    });

    console.log("🟣 Backend response:", axiosRes.data);

    return NextResponse.json(axiosRes.data, { status: axiosRes.status });

  } catch (err: any) {
    console.error("❌ PUT /api/ticket Error details:", {
      message: err.message,
      code: err.code,
      response: err.response ? {
        status: err.response.status,
        statusText: err.response.statusText,
        data: err.response.data,
        headers: err.response.headers,
      } : null,
    });

    if (err.response) {
      const errorData = err.response.data;
      console.error("❌ PUT /api/ticket Backend error response:", JSON.stringify(errorData, null, 2));
      return NextResponse.json(errorData, { status: err.response.status });
    }

    return NextResponse.json(
      { success: false, message: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
