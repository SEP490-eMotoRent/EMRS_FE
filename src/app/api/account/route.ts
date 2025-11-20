import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { emrsFetch } from "@/utils/emrsApi";

// GET /api/account - lấy thông tin tài khoản hiện tại từ BE
export async function GET() {
  try {
    // ⛔ cookies() phải await theo chuẩn Next.js 15
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const beRes = await emrsFetch("/account", {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Xử lý response linh hoạt: có thể là JSON hoặc text
    const text = await beRes.text();
    let data: any;

    try {
      data = text ? JSON.parse(text) : {};
    } catch (parseErr) {
      console.error("Failed to parse account response as JSON:", text);
      // Nếu không parse được JSON, trả về lỗi
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
    console.error("Account API error:", err);
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