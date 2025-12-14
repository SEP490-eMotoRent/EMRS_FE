import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { emrsFetch } from "@/utils/emrsApi";

// DELETE /api/media/[id]
// Xóa media (ảnh) theo ID
export async function DELETE(
  request: Request,
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

    const beRes = await emrsFetch(`/Media/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const text = await beRes.text();
    let json;
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      // Nếu không parse được JSON nhưng status là 200, vẫn coi là thành công
      if (beRes.ok) {
        return NextResponse.json({ success: true }, { status: beRes.status });
      }
      return new NextResponse(text, { status: beRes.status });
    }

    return NextResponse.json(json, { status: beRes.status });
  } catch (err) {
    console.error("Media delete error:", err);
    return NextResponse.json(
      { success: false, message: "Internal BFF Error" },
      { status: 500 }
    );
  }
}

