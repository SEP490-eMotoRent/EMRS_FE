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

export async function GET() {
  const { token, response } = await ensureAuth();
  if (!token) return response!;

  try {
    const beRes = await emrsFetch(BASE_PATH, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const text = await beRes.text();
    return new NextResponse(text, { status: beRes.status });
  } catch (err) {
    console.error("Configuration list error:", err);
    return NextResponse.json(
      { success: false, message: "Internal BFF Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { token, response } = await ensureAuth();
  if (!token) return response!;

  try {
    const body = await request.json();

    const beRes = await emrsFetch(BASE_PATH, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await beRes.text();
    return new NextResponse(text, { status: beRes.status });
  } catch (err) {
    console.error("Create configuration error:", err);
    return NextResponse.json(
      {
        success: false,
        message: err instanceof Error ? err.message : "Internal BFF Error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const { token, response } = await ensureAuth();
  if (!token) return response!;

  try {
    const body = await request.json();

    const beRes = await emrsFetch(BASE_PATH, {
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

