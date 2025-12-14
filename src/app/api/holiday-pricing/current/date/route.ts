"use server";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { emrsFetch } from "@/utils/emrsApi";

const BASE_PATH = "/HolidayPricing/current/date";

async function ensureAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return {
      token: null,
      response: NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  return { token, response: null };
}

export async function GET() {
  const { token, response } = await ensureAuth();
  if (!token) return response!;

  try {
    const beRes = await emrsFetch(BASE_PATH, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const text = await beRes.text();
    return new NextResponse(text, {
      status: beRes.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Holiday pricing current-date error:", error);
    return NextResponse.json(
      { success: false, message: "Internal BFF Error" },
      { status: 500 }
    );
  }
}

