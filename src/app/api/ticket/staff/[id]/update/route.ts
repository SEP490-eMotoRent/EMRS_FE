import { NextResponse } from "next/server";
import { emrsFetch } from "@/utils/emrsApi";
import { cookies } from "next/headers";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
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

    const body = await req.json();
    const { Status, ResolutionNote } = body;

    if (!Status) {
      return NextResponse.json(
        { success: false, message: "Status is required" },
        { status: 400 }
      );
    }

    const beRes = await emrsFetch(`/Ticket/staff/${params.id}/update`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ Status, ResolutionNote }),
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
    console.error("Update ticket error:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

