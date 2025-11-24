import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { emrsFetch } from "@/utils/emrsApi";

// POST /api/booking/create
// Tạo booking mới
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const beRes = await emrsFetch("/Booking/create", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await beRes.text();
    return new NextResponse(text, { status: beRes.status });
  } catch (err) {
    console.error("Booking create error:", err);
    return NextResponse.json(
      { success: false, message: "Internal BFF Error" },
      { status: 500 }
    );
  }
}

