import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";

const API_BASE =
  process.env.EMRS_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://emrssep490-haevbjfhdkbzhaaj.southeastasia-01.azurewebsites.net/api";

async function ensureToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return {
      token: null,
      response: NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  return { token, response: null };
}

// GET /api/repair-request/technician/[technicianId] - Lấy yêu cầu sửa chữa theo technician
export async function GET(
  req: Request,
  context: { params: Promise<{ technicianId: string }> }
) {
  try {
    const { token, response } = await ensureToken();
    if (!token) return response!;

    const { technicianId } = await context.params;
    if (!technicianId) {
      return NextResponse.json(
        { success: false, message: "technicianId is required" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);
    const pageSize = searchParams.get("pageSize") || "10";
    const pageNum = searchParams.get("pageNum") || "1";
    const orderByDesc = searchParams.get("orderByDesc") || "false";

    const queryParams = new URLSearchParams({
      pageSize,
      pageNum,
      orderByDesc,
    });

    const url = `${API_BASE}/RepairRequest/technician/${technicianId}?${queryParams.toString()}`;
    const axiosRes = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return NextResponse.json(axiosRes.data, { status: axiosRes.status });
  } catch (err: any) {
    console.error("GET /api/repair-request/technician/[technicianId] Error:", err);
    if (err.response) {
      return NextResponse.json(err.response.data, { status: err.response.status });
    }
    return NextResponse.json(
      { success: false, message: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/repair-request/technician/[repairRequestId] - Kỹ thuật viên cập nhật yêu cầu
export async function PUT(
  req: Request,
  context: { params: Promise<{ technicianId: string }> }
) {
  try {
    const { token, response } = await ensureToken();
    if (!token) return response!;

    const { technicianId: repairRequestId } = await context.params;
    if (!repairRequestId) {
      return NextResponse.json(
        { success: false, message: "repairRequestId is required" },
        { status: 400 }
      );
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const url = `${API_BASE}/RepairRequest/technician/${repairRequestId}`;
    const axiosRes = await axios.put(url, body, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return NextResponse.json(axiosRes.data, { status: axiosRes.status });
  } catch (err: any) {
    console.error("PUT /api/repair-request/technician/[id] Error:", err);
    if (err.response) {
      return NextResponse.json(err.response.data, {
        status: err.response.status,
      });
    }
    return NextResponse.json(
      { success: false, message: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

