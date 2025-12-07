"use server";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { emrsFetch } from "@/utils/emrsApi";

const ENDPOINTS = {
  vehicleModel: "/Dashboard/admin/vehicle/model",
  vehicle: "/Dashboard/admin/vehicle",
  branch: "/Dashboard/admin/branch",
  accounts: "/Dashboard/admin/accounts",
  transactions: "/Dashboard/admin/transactions",
};

async function fetchSection(
  path: string,
  token: string
): Promise<{ success: boolean; data?: any }> {
  const res = await emrsFetch(path, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const text = await res.text();
  let json: any = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch (err) {
    console.error("Failed to parse dashboard response:", path, text);
    throw new Error("Invalid response from dashboard endpoint");
  }

  if (!res.ok) {
    console.error("Dashboard endpoint error:", path, res.status, json);
    throw new Error(json.message || `Failed to fetch ${path}`);
  }

  return json;
}

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

    const [vehicleModel, vehicle, branch, accounts, transactions] =
      await Promise.all([
        fetchSection(ENDPOINTS.vehicleModel, token),
        fetchSection(ENDPOINTS.vehicle, token),
        fetchSection(ENDPOINTS.branch, token),
        fetchSection(ENDPOINTS.accounts, token),
        fetchSection(ENDPOINTS.transactions, token),
      ]);

    return NextResponse.json({
      success: true,
      data: {
        vehicleModel: vehicleModel.data || vehicleModel,
        vehicle: vehicle.data || vehicle,
        branch: branch.data || branch,
        accounts: accounts.data || accounts,
        transactions: transactions.data || transactions,
      },
    });
  } catch (error) {
    console.error("Admin dashboard API error:", error);
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


