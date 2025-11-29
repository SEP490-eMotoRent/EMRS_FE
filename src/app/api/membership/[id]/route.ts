"use server";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { emrsFetch } from "@/utils/emrsApi";

async function ensureToken() {
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

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { token, response } = await ensureToken();
    if (!token && response) {
      return response;
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Membership id is required" },
        { status: 400 }
      );
    }

    const beRes = await emrsFetch(`/Membership/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const text = await beRes.text();
    return new NextResponse(text, {
      status: beRes.status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Membership detail GET error:", error);
    return NextResponse.json(
      { success: false, message: "Internal BFF Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { token, response } = await ensureToken();
    if (!token && response) {
      return response;
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Membership id is required" },
        { status: 400 }
      );
    }

    const beRes = await emrsFetch(`/Membership/delete/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const text = await beRes.text();
    return new NextResponse(text, {
      status: beRes.status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Membership DELETE error:", error);
    return NextResponse.json(
      { success: false, message: "Internal BFF Error" },
      { status: 500 }
    );
  }
}

