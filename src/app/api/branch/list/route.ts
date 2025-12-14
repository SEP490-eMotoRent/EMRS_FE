import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { emrsFetch } from "@/utils/emrsApi";

// GET /api/branch/list
// Lấy danh sách tất cả branches (cho admin)
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Gọi API: GET /Branch (hoặc endpoint tương ứng)
    // TODO: Cần xác nhận endpoint chính xác từ backend
    const beRes = await emrsFetch("/Branch", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const text = await beRes.text();
    let data: any;

    try {
      data = text ? JSON.parse(text) : {};
    } catch (parseErr) {
      console.error("Failed to parse branch response as JSON:", text);
      return NextResponse.json(
        { 
          success: false, 
          message: "Invalid response from server",
          error: "Failed to parse JSON response"
        },
        { status: 500 }
      );
    }

    // Nếu BE trả về lỗi, forward status code
    if (!beRes.ok) {
      return NextResponse.json(
        data || { success: false, message: "Backend error" },
        { status: beRes.status }
      );
    }

    return NextResponse.json(data, { status: beRes.status });
  } catch (err) {
    console.error("Branch list error:", err);
    return NextResponse.json(
      { success: false, message: "Internal BFF Error" },
      { status: 500 }
    );
  }
}

