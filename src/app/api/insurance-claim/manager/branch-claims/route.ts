import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { emrsFetch } from "@/utils/emrsApi";
console.log("🟢 THIS IS THE CORRECT ROUTE.TS RUNNING");

export async function GET() {
  try {
    console.log("🔵 [BFF] GET /InsuranceClaim/manager/branch-claims");

    // ❗❗❗ Dòng quan trọng (await cookies())
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      console.error("❌ No token in cookies!");
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("🟦 Token found");

    const beRes = await emrsFetch("/InsuranceClaim/manager/branch-claims", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const text = await beRes.text();
    console.log("🟣 BE Response text:", text);

    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      console.error("❌ JSON Parse Error:", e);
      return NextResponse.json(
        { success: false, message: "Invalid JSON from BE" },
        { status: 500 }
      );
    }

    return NextResponse.json(json, { status: beRes.status });

  } catch (err) {
    console.error("🔥 BFF ERROR:", err);
    return NextResponse.json(
      { success: false, message: "Internal BFF Error" },
      { status: 500 }
    );
  }
}
