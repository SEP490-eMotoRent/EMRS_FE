import { NextResponse } from "next/server";
import { emrsFetch } from "@/utils/emrsApi";
import { cookies } from "next/headers";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;
    const beRes = await emrsFetch(`/Ticket/${id}`, {
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
    console.error("Ticket detail error:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

