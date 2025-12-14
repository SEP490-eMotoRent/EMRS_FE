import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { emrsFetch } from "@/utils/emrsApi";

// GET /api/insurance-claim/admin/list
// Lấy danh sách tất cả insurance claims (cho admin)
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

    // Gọi endpoint /InsuranceClaim/admin để lấy danh sách claims cho admin
    const beRes = await emrsFetch("/InsuranceClaim/admin", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const text = await beRes.text();
    let json;
    
    try {
      json = text ? JSON.parse(text) : {};
    } catch (e) {
      console.error("Failed to parse insurance claims response:", e);
      return NextResponse.json(
        { success: false, message: "Invalid JSON from backend" },
        { status: 500 }
      );
    }

    return NextResponse.json(json, { status: beRes.status });
  } catch (err) {
    console.error("Insurance claims API error:", err);
    return NextResponse.json(
      { success: false, message: "Internal BFF Error" },
      { status: 500 }
    );
  }
}

