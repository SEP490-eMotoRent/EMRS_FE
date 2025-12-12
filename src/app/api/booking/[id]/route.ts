import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { emrsFetch } from "@/utils/emrsApi";

// GET /api/booking/[id] - lấy chi tiết booking theo ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Next.js 15 typed routes yêu cầu await cookies()
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id || id.trim() === "") {
      return NextResponse.json(
        { success: false, message: "Booking ID is required" },
        { status: 400 }
      );
    }

    const beRes = await emrsFetch(`/Booking/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const text = await beRes.text();
    let json: any;

    try {
      json = text ? JSON.parse(text) : {};
    } catch (e) {
      console.error("Failed to parse JSON from backend:", text);
      return NextResponse.json(
        { success: false, message: "Invalid JSON from BE", error: text },
        { status: 500 }
      );
    }

    // Nếu backend trả về lỗi, forward lại
    if (!beRes.ok) {
      return NextResponse.json(
        { 
          success: false, 
          message: json.message || `Backend error: ${beRes.statusText}`,
          errors: json.errors 
        },
        { status: beRes.status }
      );
    }

    // Trả về đầy đủ dữ liệu từ backend (bao gồm cả success, message, data, code)
    return NextResponse.json(json, { status: beRes.status });
  } catch (err) {
    console.error("Booking detail error:", err);
    return NextResponse.json(
      { success: false, message: "Internal BFF Error" },
      { status: 500 }
    );
  }
}
