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

export async function GET(request: Request) {
  try {
    const { token, response } = await ensureToken();
    if (!token && response) {
      return response;
    }

    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const path = `/Membership${queryString ? `?${queryString}` : ""}`;

    const beRes = await emrsFetch(path, {
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
    console.error("Membership GET error:", error);
    return NextResponse.json(
      { success: false, message: "Internal BFF Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { token, response } = await ensureToken();
    if (!token && response) {
      return response;
    }

    const body = await request.json();

    const beRes = await emrsFetch("/Membership/create", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await beRes.text();
    return new NextResponse(text, {
      status: beRes.status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Membership POST error:", error);
    return NextResponse.json(
      { success: false, message: "Internal BFF Error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { token, response } = await ensureToken();
    if (!token && response) {
      return response;
    }

    const body = await request.json();

    const beRes = await emrsFetch("/Membership/update", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await beRes.text();
    return new NextResponse(text, {
      status: beRes.status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Membership PUT error:", error);
    return NextResponse.json(
      { success: false, message: "Internal BFF Error" },
      { status: 500 }
    );
  }
}

