import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { emrsFetch } from "@/utils/emrsApi";

// GET /api/vehicle-transfer-order/branch/[branchId]/pending - Manager xem pending orders của branch
export async function GET(
  request: Request,
  context: { params: Promise<{ branchId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { branchId } = await context.params;

    // Endpoint theo API documentation: GET /api/VehicleTransferOrder/branch/{branchId}/pending
    console.log(`[Transfer Order Branch Pending] Fetching pending orders for branch: ${branchId}`);
    const beRes = await emrsFetch(`/VehicleTransferOrder/branch/${branchId}/pending`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    console.log(`[Transfer Order Branch Pending] Response status: ${beRes.status} ${beRes.statusText}`);

    const text = await beRes.text();
    let data: any;

    try {
      data = text ? JSON.parse(text) : {};
    } catch (parseErr) {
      console.error("Failed to parse transfer order response as JSON:", text);
      return NextResponse.json(
        { 
          success: false, 
          message: "Invalid response from server",
          error: "Failed to parse JSON response"
        },
        { status: 500 }
      );
    }

    if (!beRes.ok) {
      // Forward backend error response with proper format
      console.error(`[Transfer Order Branch Pending] Backend error (${beRes.status}):`, data);
      
      const errorResponse = data || { 
        success: false, 
        message: "Backend error",
        code: beRes.status 
      };
      
      // If backend returns error message, preserve it
      if (data?.message) {
        errorResponse.message = data.message;
      }
      
      // Log mapping type errors for debugging
      if (data?.message?.includes("Error mapping types")) {
        console.error(`[Transfer Order Branch Pending] Mapping type error detected. This is a backend AutoMapper issue.`);
        console.error(`[Transfer Order Branch Pending] Full error message:`, data.message);
      }
      
      return NextResponse.json(errorResponse, { status: beRes.status });
    }

    // Ensure response follows standard format: { success: true, data: [...], code: 200 }
    if (data && !data.success && Array.isArray(data.data)) {
      // Backend might return { data: [...] } without success flag
      return NextResponse.json({
        success: true,
        message: "Pending branch transfer orders retrieved successfully",
        data: data.data || data,
        code: 200
      });
    }

    return NextResponse.json(data, { status: beRes.status });
  } catch (err) {
    console.error("Transfer order branch pending error:", err);
    
    // Better error handling for fetch failures
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    
    // Check if it's a fetch error (network issue)
    if (errorMessage.includes("fetch failed") || errorMessage.includes("ECONNREFUSED")) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Cannot connect to backend server. Please check if the backend is running.",
          error: errorMessage,
          code: 500
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Internal BFF Error",
        error: errorMessage,
        code: 500
      },
      { status: 500 }
    );
  }
}

