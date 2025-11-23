import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// PUT /api/ticket/manager/[id]/assign
// Sử dụng PUT /Ticket/{id} với multipart/form-data: Status, StaffId
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = (await cookies()).get("token")?.value;

    if (!token)
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );

    const { id } = await params;
    const formData = await req.formData();

    const Status = formData.get("Status") as string;
    const StaffId = formData.get("StaffId") as string;

    if (!Status) {
      return NextResponse.json(
        { success: false, message: "Status is required" },
        { status: 400 }
      );
    }

    if (!StaffId) {
      return NextResponse.json(
        { success: false, message: "StaffId is required" },
        { status: 400 }
      );
    }

    const FormDataNode = (await import("form-data")).default;
    const backendFormData = new FormDataNode();

    // ⭐⭐ Backend route: PUT /Ticket/{id} - Id trong URL, KHÔNG trong FormData
    backendFormData.append("Status", Status);
    backendFormData.append("StaffId", StaffId);

    const base =
      process.env.EMRS_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "https://emrssep490-haevbjfhdkbzhaaj.southeastasia-01.azurewebsites.net/api";

    // ⭐⭐ Backend route: PUT /Ticket/{id}
    const url = `${base}/Ticket/${id}`;

    console.log("🔵 [Assign] PUT URL:", url);
    console.log("🔵 [Assign] FormData:", { Status, StaffId, TicketId: id });

    const axios = (await import("axios")).default;

    const axiosRes = await axios.put(url, backendFormData, {
      headers: {
        Authorization: `Bearer ${token}`,
        ...backendFormData.getHeaders(),
      },
    });

    console.log("🟣 [Assign] Backend response:", axiosRes.data);

    return NextResponse.json(axiosRes.data, { status: axiosRes.status });

  } catch (err: any) {
    console.error("Assign ticket error:", err);

    if (err.response)
      return NextResponse.json(err.response.data, { status: err.response.status });

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

