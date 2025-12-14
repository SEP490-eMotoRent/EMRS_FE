"use server";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { emrsFetch } from "@/utils/emrsApi";

const BASE_PATH = "/Configuration/media";

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

export async function POST(request: Request) {
  const { token, response } = await ensureAuth();
  if (!token) return response!;

  try {
    const formData = await request.formData();

    const beRes = await emrsFetch(BASE_PATH, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const text = await beRes.text();
    return new NextResponse(text, {
      status: beRes.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Create configuration media error:", err);
    return NextResponse.json(
      { success: false, message: "Internal BFF Error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const { token, response } = await ensureAuth();
  if (!token) return response!;

  try {
    const formData = await request.formData();

    const beRes = await emrsFetch(BASE_PATH, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const text = await beRes.text();
    return new NextResponse(text, {
      status: beRes.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Update configuration media error:", err);
    return NextResponse.json(
      { success: false, message: "Internal BFF Error" },
      { status: 500 }
    );
  }
}

