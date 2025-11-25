import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";

const API_BASE =
  process.env.EMRS_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://emrssep490-haevbjfhdkbzhaaj.southeastasia-01.azurewebsites.net/api";

// GET /api/repair-request/[id] - Lấy chi tiết yêu cầu sửa chữa
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
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

    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: "id is required" },
        { status: 400 }
      );
    }

    const url = `${API_BASE}/RepairRequest/${id}`;
    const axiosRes = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return NextResponse.json(axiosRes.data, { status: axiosRes.status });
  } catch (err: any) {
    console.error("GET /api/repair-request/[id] Error:", err);
    if (err.response) {
      return NextResponse.json(err.response.data, { status: err.response.status });
    }
    return NextResponse.json(
      { success: false, message: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

