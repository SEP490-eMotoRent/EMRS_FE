import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { emrsFetch } from "@/utils/emrsApi";
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
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Đọc JSON body từ request
    const body = await req.json();

    const id = body.id || body.Id;
    const status = body.status || body.Status;
    const staffId = body.staffId || body.StaffId;
    // Validation với message rõ ràng
    if (!id || !String(id).trim()) {
      console.error("❌ [BFF] Validation failed: id is missing or empty");
      return NextResponse.json({ success: false, message: "id is required" }, { status: 400 });
    }
    if (!status || !String(status).trim()) {
      console.error("❌ [BFF] Validation failed: status is missing or empty");
      return NextResponse.json({ success: false, message: "status is required" }, { status: 400 });
    }
    if (!staffId || !String(staffId).trim()) {
      console.error("❌ [BFF] Validation failed: staffId is missing or empty");
      return NextResponse.json({ success: false, message: "staffId is required" }, { status: 400 });
    }

    // Validate Status values
    const validStatuses = ["Pending", "InProgress", "Resolved"];
    if (!validStatuses.includes(String(status))) {
      console.error(`❌ [BFF] Validation failed: Invalid status '${status}'. Valid values: ${validStatuses.join(", ")}`);
      return NextResponse.json({ 
        success: false, 
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` 
      }, { status: 400 });
    }

    // ⭐⭐ Backend route: PUT /Ticket - Request body là JSON với { id, status, staffId }
    const requestBody = {
      id: String(id).trim(),
      status: String(status).trim(),
      staffId: String(staffId).trim(),
    };

    const base =
      process.env.EMRS_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "https://emrssep490-haevbjfhdkbzhaaj.southeastasia-01.azurewebsites.net/api";

    // ⭐⭐ Backend route: PUT /Ticket (không có id trong URL)
    const url = `${base}/Ticket`;
    const axiosRes = await axios.put(url, requestBody, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      }
    });
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
