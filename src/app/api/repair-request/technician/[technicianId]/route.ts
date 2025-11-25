import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";

const API_BASE =
  process.env.EMRS_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://emrssep490-haevbjfhdkbzhaaj.southeastasia-01.azurewebsites.net/api";

// GET /api/repair-request/technician/[technicianId] - Lấy yêu cầu sửa chữa theo technician
export async function GET(
  req: Request,
  { params }: { params: { technicianId: string } }
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

    const { technicianId } = params;
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

