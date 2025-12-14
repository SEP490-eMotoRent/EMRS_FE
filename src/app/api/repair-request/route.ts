import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { emrsFetch } from "@/utils/emrsApi";
import axios from "axios";

const API_BASE =
  process.env.EMRS_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://emrssep490-haevbjfhdkbzhaaj.southeastasia-01.azurewebsites.net/api";

// POST /api/repair-request - Tạo yêu cầu sửa chữa
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { issueDescription, vehicleId } = body;

    if (!issueDescription || !vehicleId) {
      return NextResponse.json(
        { success: false, message: "issueDescription and vehicleId are required" },
        { status: 400 }
      );
    }

    const url = `${API_BASE}/RepairRequest`;
    const axiosRes = await axios.post(
      url,
      { issueDescription, vehicleId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return NextResponse.json(axiosRes.data, { status: axiosRes.status });
  } catch (err: any) {
    console.error("POST /api/repair-request Error:", err);
    if (err.response) {
      return NextResponse.json(err.response.data, { status: err.response.status });
    }
    return NextResponse.json(
      { success: false, message: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/repair-request - Lấy danh sách yêu cầu sửa chữa với pagination
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
    const pageSize = searchParams.get("pageSize") || "10";
    const pageNum = searchParams.get("pageNum") || "1";
    const orderByDesc = searchParams.get("orderByDesc") || "false";

    const params = new URLSearchParams({
      pageSize,
      pageNum,
      orderByDesc,
    });

    const url = `${API_BASE}/RepairRequest?${params.toString()}`;
    const axiosRes = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return NextResponse.json(axiosRes.data, { status: axiosRes.status });
  } catch (err: any) {
    console.error("GET /api/repair-request Error:", err);
    if (err.response) {
      return NextResponse.json(err.response.data, { status: err.response.status });
    }
    return NextResponse.json(
      { success: false, message: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/repair-request - Cập nhật yêu cầu sửa chữa
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

    const body = await req.json();
    const { id, priority, status, staffId } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "id is required" },
        { status: 400 }
      );
    }

    const requestBody: any = { id };
    if (priority) requestBody.priority = priority;
    if (status) requestBody.status = status;
    if (staffId) requestBody.staffId = staffId;

    const url = `${API_BASE}/RepairRequest`;
    const axiosRes = await axios.put(url, requestBody, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return NextResponse.json(axiosRes.data, { status: axiosRes.status });
  } catch (err: any) {
    console.error("PUT /api/repair-request Error:", err);
    if (err.response) {
      return NextResponse.json(err.response.data, { status: err.response.status });
    }
    return NextResponse.json(
      { success: false, message: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

