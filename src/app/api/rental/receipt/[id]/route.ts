import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { emrsFetch } from "@/utils/emrsApi";

// GET /api/rental/receipt/[id]
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
 
    const { id } = await context.params;
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!id || id.trim() === "") {
      return NextResponse.json(
        { success: false, message: "ID biên bản không hợp lệ" },
        { status: 400 }
      );
    }

    const beRes = await emrsFetch(`/Rental/receipt/by/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const text = await beRes.text();
    let json;

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

    return NextResponse.json(json, { status: beRes.status });
  } catch (err) {
    console.error("Rental receipt detail error:", err);
    return NextResponse.json(
      { success: false, message: "Internal BFF Error" },
      { status: 500 }
    );
  }
}
