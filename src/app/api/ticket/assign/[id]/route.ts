import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// PUT /api/ticket/assign/[id]
// Sử dụng PUT /Ticket với multipart/form-data: Id, Status, StaffId
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
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Ticket Id is required" },
        { status: 400 }
      );
    }

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

    // ⭐⭐ Backend route: PUT /Ticket - Id, Status, StaffId đều trong FormData
    // Đảm bảo format đúng: Id phải là UUID string
    backendFormData.append("Id", String(id).trim());
    backendFormData.append("Status", String(Status).trim());
    backendFormData.append("StaffId", String(StaffId).trim());

    const base =
      process.env.EMRS_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "https://emrssep490-haevbjfhdkbzhaaj.southeastasia-01.azurewebsites.net/api";

    // ⭐⭐ Backend route: PUT /Ticket (không có id trong URL)
    const url = `${base}/Ticket`;

    const axios = (await import("axios")).default;

    try {
      const axiosRes = await axios.put(url, backendFormData, {
        headers: {
          Authorization: `Bearer ${token}`,
          ...backendFormData.getHeaders(),
        },
        // Thêm timeout và validate status
        timeout: 30000,
      });

      return NextResponse.json(axiosRes.data, { status: axiosRes.status });
    } catch (axiosError: any) {
      // Log chi tiết lỗi từ axios
      console.error("❌ [Assign] Axios error:", {
        message: axiosError.message,
        code: axiosError.code,
        response: axiosError.response ? {
          status: axiosError.response.status,
          statusText: axiosError.response.statusText,
          data: axiosError.response.data,
          headers: axiosError.response.headers,
        } : null,
        request: axiosError.request ? {
          method: axiosError.request.method,
          url: axiosError.request.url,
          headers: axiosError.request.headers,
        } : null,
      });
      throw axiosError;
    }

  } catch (err: any) {
    console.error("❌ [Assign] Error details:", {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status,
      headers: err.response?.headers,
    });

    if (err.response) {
      const errorData = err.response.data;
      console.error("❌ [Assign] Backend error response:", JSON.stringify(errorData, null, 2));
      return NextResponse.json(errorData, { status: err.response.status });
    }

    return NextResponse.json(
      { success: false, message: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

