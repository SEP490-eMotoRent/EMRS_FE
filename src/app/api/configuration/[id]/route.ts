import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { emrsFetch } from "@/utils/emrsApi";

const BASE_PATH = "/Configuration";

async function ensureAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return { token: null, response: NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 }) };
  }

  return { token, response: null };
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { token, response } = await ensureAuth();
  if (!token) return response!;

  try {
    const { id } = await context.params;

    const beRes = await emrsFetch(`${BASE_PATH}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const text = await beRes.text();
    return new NextResponse(text, { status: beRes.status });
  } catch (err) {
    console.error("Configuration detail error:", err);
    return NextResponse.json(
      { success: false, message: "Internal BFF Error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { token, response } = await ensureAuth();
  if (!token) return response!;

  try {
    const { id } = await context.params;
    const body = await request.json();

    const beRes = await emrsFetch(`${BASE_PATH}/${id}`, {
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
    console.error("Update configuration error:", err);
    return NextResponse.json(
      {
        success: false,
        message: err instanceof Error ? err.message : "Internal BFF Error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { token, response } = await ensureAuth();
  if (!token) return response!;

  try {
    const { id } = await context.params;

    const beRes = await emrsFetch(`${BASE_PATH}/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const text = await beRes.text();
    return new NextResponse(text, { status: beRes.status });
  } catch (err) {
    console.error("Delete configuration error:", err);
    return NextResponse.json(
      {
        success: false,
        message: err instanceof Error ? err.message : "Internal BFF Error",
      },
      { status: 500 }
    );
  }
}

