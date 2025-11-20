import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { emrsFetch } from "@/utils/emrsApi";

// BFF: POST /api/insurance-claim/create
// Gửi multipart/form-data lên BE /InsuranceClaim/create
export async function POST(req: Request) {
  try {
    const token = cookies().get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await req.formData();

    const beRes = await emrsFetch("/InsuranceClaim/create", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const text = await beRes.text();

    return new NextResponse(text, { status: beRes.status });
  } catch (err) {
    console.error("Create Insurance Claim error:", err);
    return NextResponse.json(
      { success: false, message: "Internal BFF Error" },
      { status: 500 }
    );
  }
}


