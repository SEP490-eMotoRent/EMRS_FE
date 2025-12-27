"use server";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { emrsFetch } from "@/utils/emrsApi";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ month: string; year: string }> }
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

    const { month, year } = await params;

    if (!month || isNaN(Number(month)) || Number(month) < 1 || Number(month) > 12) {
      return NextResponse.json(
        { success: false, message: "Invalid month parameter (must be 1-12)" },
        { status: 400 }
      );
    }

    if (!year || isNaN(Number(year))) {
      return NextResponse.json(
        { success: false, message: "Invalid year parameter" },
        { status: 400 }
      );
    }

    const res = await emrsFetch(
      `/Dashboard/admin/revenue/month/${month}/${year}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const text = await res.text();
    let json: any = {};
    try {
      json = text ? JSON.parse(text) : {};
    } catch (err) {
      console.error("Failed to parse revenue by month response:", text);
      throw new Error("Invalid response from revenue endpoint");
    }

    if (!res.ok) {
      console.error("Revenue by month endpoint error:", res.status, json);
      return NextResponse.json(
        {
          success: false,
          message: json.message || "Failed to fetch revenue by month",
        },
        { status: res.status }
      );
    }

    return NextResponse.json(json);
  } catch (error) {
    console.error("Admin revenue by month API error:", error);
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

