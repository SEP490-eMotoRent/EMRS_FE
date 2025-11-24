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

    const formData = await req.formData();

    const beRes = await emrsFetch(
      `/InsuranceClaim/manager/${params.id}/settlement`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      }
    );

    const text = await beRes.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      return new NextResponse(text, { status: beRes.status });
    }

    return NextResponse.json(json, { status: beRes.status });
  } catch (err) {
    console.error("Settlement error:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

