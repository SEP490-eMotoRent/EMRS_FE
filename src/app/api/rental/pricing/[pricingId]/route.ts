import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { emrsFetch } from "@/utils/emrsApi";

// PUT /api/rental/pricing/[pricingId] - cập nhật rental pricing
export async function PUT(
  request: Request,
  context: { params: Promise<{ pricingId: string }> }
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

    const { pricingId } = await context.params;
    const body = await request.json();

    const beRes = await emrsFetch(`/rental/pricing/${pricingId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await beRes.text();
    return new NextResponse(text, { status: beRes.status });
  } catch (err) {
    console.error("Update rental pricing error:", err);
    return NextResponse.json(
      {
        success: false,
        message: err instanceof Error ? err.message : "Internal BFF Error",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/rental/pricing/[pricingId] - xóa rental pricing
export async function DELETE(
  request: Request,
  context: { params: Promise<{ pricingId: string }> }
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

    const { pricingId } = await context.params;

    const beRes = await emrsFetch(`/rental/pricing/${pricingId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const text = await beRes.text();
    return new NextResponse(text, { status: beRes.status });
  } catch (err) {
    console.error("Delete rental pricing error:", err);
    return NextResponse.json(
      {
        success: false,
        message: err instanceof Error ? err.message : "Internal BFF Error",
      },
      { status: 500 }
    );
  }
}

