import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { emrsFetch } from "@/utils/emrsApi";

// GET /api/account - lấy thông tin tài khoản hiện tại từ BE
export async function GET() {
  try {
    const token = cookies().get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const beRes = await emrsFetch("/account", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const json = await beRes.json();

    return NextResponse.json(json, { status: beRes.status });
  } catch (err) {
    console.error("Account API error:", err);
    return NextResponse.json(
      { success: false, message: "Internal BFF Error" },
      { status: 500 }
    );
  }
}


