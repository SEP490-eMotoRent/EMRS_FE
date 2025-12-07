"use server";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";

const API_BASE =
  process.env.EMRS_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://emrssep490-haevbjfhdkbzhaaj.southeastasia-01.azurewebsites.net/api";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const url = `${API_BASE}/RepairRequest/technician`;
    const axiosRes = await axios.post(url, body, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return NextResponse.json(axiosRes.data, { status: axiosRes.status });
  } catch (err: any) {
    console.error("POST /api/repair-request/technician Error:", err);
    if (err.response) {
      return NextResponse.json(err.response.data, {
        status: err.response.status,
      });
    }
    return NextResponse.json(
      { success: false, message: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const url = `${API_BASE}/RepairRequest/technician`;
    const axiosRes = await axios.put(url, body, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return NextResponse.json(axiosRes.data, { status: axiosRes.status });
  } catch (err: any) {
    console.error("PUT /api/repair-request/technician Error:", err);
    if (err.response) {
      return NextResponse.json(err.response.data, {
        status: err.response.status,
      });
    }
    return NextResponse.json(
      { success: false, message: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

