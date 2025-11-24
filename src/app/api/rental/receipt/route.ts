import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { emrsFetch } from "@/utils/emrsApi";

// GET /api/rental/receipt
// Lấy danh sách rental receipts theo chi nhánh
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const beRes = await emrsFetch("/Rental/receipt", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const text = await beRes.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      return NextResponse.json(
        { success: false, message: "Invalid JSON from BE" },
        { status: 500 }
      );
    }

    return NextResponse.json(json, { status: beRes.status });
  } catch (err) {
    console.error("Rental receipt list error:", err);
    return NextResponse.json(
      { success: false, message: "Internal BFF Error" },
      { status: 500 }
    );
  }
}

