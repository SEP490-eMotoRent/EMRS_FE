import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { emrsFetch } from "@/utils/emrsApi";

// GET /api/ticket/manager/branch-tickets
// Sử dụng GET /Ticket với pagination để lấy tickets của branch
export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      console.error("❌ No token in cookies!");
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const pageSize = searchParams.get("pageSize") || "100";
    const pageNum = searchParams.get("pageNum") || "1";
    const orderByDescending = searchParams.get("orderByDescending") || "true";

    const params = new URLSearchParams();
    params.append("pageSize", pageSize);
    params.append("pageNum", pageNum);
    params.append("orderByDescending", orderByDescending);

    const queryString = params.toString();
    const url = `/Ticket?${queryString}`;
    const beRes = await emrsFetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const text = await beRes.text();
    );

    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      console.error("❌ JSON Parse Error:", e);
      return NextResponse.json(
        { success: false, message: "Invalid JSON from BE" },
        { status: 500 }
      );
    }

    return NextResponse.json(json, { status: beRes.status });

  } catch (err) {
    console.error("🔥 BFF ERROR:", err);
    return NextResponse.json(
      { success: false, message: "Internal BFF Error" },
      { status: 500 }
    );
  }
}

