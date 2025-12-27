"use server";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { emrsFetch } from "@/utils/emrsApi";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ fromDate: string; toDate: string }> }
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

    const { fromDate, toDate } = await params;

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!fromDate || !dateRegex.test(fromDate)) {
      return NextResponse.json(
        { success: false, message: "Invalid fromDate parameter (format: YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    if (!toDate || !dateRegex.test(toDate)) {
      return NextResponse.json(
        { success: false, message: "Invalid toDate parameter (format: YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const res = await emrsFetch(
      `/Dashboard/admin/revenue/week/${fromDate}/${toDate}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const text = await res.text();
    let json: any = {};
    try {
      json = text ? JSON.parse(text) : {};
    } catch (err) {
      console.error("Failed to parse revenue by week response:", text);
      throw new Error("Invalid response from revenue endpoint");
    }

    if (!res.ok) {
      console.error("Revenue by week endpoint error:", res.status, json);
      return NextResponse.json(
        {
          success: false,
          message: json.message || "Failed to fetch revenue by week",
        },
        { status: res.status }
      );
    }

    return NextResponse.json(json);
  } catch (error) {
    console.error("Admin revenue by week API error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal BFF Error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

