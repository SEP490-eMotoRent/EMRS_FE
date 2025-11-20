import { NextResponse } from "next/server";
import { emrsFetch } from "@/utils/emrsApi";
import { cookies } from "next/headers";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = cookies().get("token")?.value;

    const beRes = await emrsFetch(`/InsuranceClaim/manager/${params.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const json = await beRes.json();
    return NextResponse.json(json, { status: beRes.status });
  } catch (err) {
    console.error("Claim detail error:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = cookies().get("token")?.value;
    const formData = await req.formData();

    const beRes = await emrsFetch(`/InsuranceClaim/manager/${params.id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const text = await beRes.text();

    return new NextResponse(text, { status: beRes.status });
  } catch (err) {
    console.error("Update Claim error:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
