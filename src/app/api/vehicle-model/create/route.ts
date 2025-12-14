import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { emrsFetch } from "@/utils/emrsApi";

// POST /api/vehicle-model/create
// Tạo vehicle model mới
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

    const formData = await request.formData();

    const beRes = await emrsFetch("/Vehicle/model/create", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const text = await beRes.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      return new NextResponse(text, { status: beRes.status });
    }

    return NextResponse.json(json, { status: beRes.status });
  } catch (err) {
    console.error("Vehicle model create error:", err);
    return NextResponse.json(
      { success: false, message: "Internal BFF Error" },
      { status: 500 }
    );
  }
}

