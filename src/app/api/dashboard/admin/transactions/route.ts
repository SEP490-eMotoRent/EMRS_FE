"use server";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { emrsFetch } from "@/utils/emrsApi";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const res = await emrsFetch("/Dashboard/admin/transactions", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const text = await res.text();
    let json: any = {};
    try {
      json = text ? JSON.parse(text) : {};
    } catch (err) {
      console.error("Failed to parse transactions response:", text);
      throw new Error("Invalid response from transactions endpoint");
    }

    if (!res.ok) {
      console.error("Transactions endpoint error:", res.status, json);
      return NextResponse.json(
        {
          success: false,
          message: json.message || "Failed to fetch transactions",
        },
        { status: res.status }
      );
    }

    return NextResponse.json(json);
  } catch (error) {
    console.error("Admin transactions API error:", error);
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

