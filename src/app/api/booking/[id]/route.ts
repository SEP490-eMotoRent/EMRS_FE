import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { emrsFetch } from "@/utils/emrsApi";

// GET /api/booking/[id] - lấy chi tiết booking theo ID
export async function GET(req: Request, context: { params: { id: string } }) {
  try {
    // ⛔ BẮT BUỘC: cookies() phải await
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // ⛔ BẮT BUỘC: context.params phải await theo chuẩn Next.js 15
    const { id } = await context.params;

    const beRes = await emrsFetch(`/Booking/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const text = await beRes.text();
    return new NextResponse(text, { status: beRes.status });
  } catch (err) {
    console.error("Booking detail error:", err);
    return NextResponse.json(
      { success: false, message: "Internal BFF Error" },
      { status: 500 }
    );
  }
}
