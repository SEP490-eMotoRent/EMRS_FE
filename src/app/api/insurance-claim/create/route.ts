import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { emrsFetch } from "@/utils/emrsApi";

// BFF: POST /api/insurance-claim/create
// Gửi multipart/form-data lên BE /InsuranceClaim/create
export async function POST(req: Request) {
  try {
    // ⛔ BẮT BUỘC: cookies() phải await theo chuẩn Next.js 15
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await req.formData();

    console.log("Insurance claim form data:", {
      BookingId: formData.get("BookingId"),
      IncidentDate: formData.get("IncidentDate"),
      IncidentLocation: formData.get("IncidentLocation"),
      Description: formData.get("Description"),
      filesCount: Array.from(formData.getAll("IncidentImageFiles")).length,
    });

    const beRes = await emrsFetch("/InsuranceClaim/create", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        // Không set Content-Type cho FormData, browser sẽ tự set với boundary
      },
      body: formData,
    });

    const text = await beRes.text();
    console.log("Insurance claim API response status:", beRes.status);
    console.log("Insurance claim API response:", text.substring(0, 500));

    return new NextResponse(text, { 
      status: beRes.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (err) {
    console.error("Create Insurance Claim error:", err);
    return NextResponse.json(
      { success: false, message: "Internal BFF Error", error: String(err) },
      { status: 500 }
    );
  }
}


