import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { emrsFetch } from "@/utils/emrsApi";

// GET /api/insurance-claim/admin/[id]
// Lấy chi tiết một insurance claim theo ID (cho admin)
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
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

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Claim ID is required" },
        { status: 400 }
      );
    }

    // Gọi endpoint /InsuranceClaim/admin/{id} để lấy chi tiết claim
    const beRes = await emrsFetch(`/InsuranceClaim/admin/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const text = await beRes.text();
    let json;
    
    try {
      json = text ? JSON.parse(text) : {};
    } catch (e) {
      console.error("Failed to parse insurance claim detail response:", e);
      return NextResponse.json(
        { success: false, message: "Invalid JSON from backend" },
        { status: 500 }
      );
    }

    return NextResponse.json(json, { status: beRes.status });
  } catch (err) {
    console.error("Insurance claim detail API error:", err);
    return NextResponse.json(
      { success: false, message: "Internal BFF Error" },
      { status: 500 }
    );
  }
}

