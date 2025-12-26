import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { emrsFetch } from "@/utils/emrsApi";

// BFF: GET /api/manager/dashboard
// Lấy dữ liệu thật cho dashboard Manager từ nhiều endpoint BE
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const branchId = cookieStore.get("branchId")?.value;

    if (!token || !branchId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const authHeader = { Authorization: `Bearer ${token}` };

    // Helper function để parse response
    const parseResponse = async (res: Response | null, name: string) => {
      if (!res) {
        return null;
      }
      if (!res.ok) {
        return null;
      }
      try {
        const text = await res.text();
        if (!text || text.trim() === '') {
          return null;
        }
        try {
          const json = JSON.parse(text);
          return json;
        } catch (parseErr) {
          return null;
        }
      } catch (err) {
        return null;
      }
    };

    // Gọi tất cả các API có sẵn trong manager
    const [
      branchRes,
      vehiclesRes,
      bookingsRes,
      insuranceClaimsRes,
      transferRequestsRes,
    ] = await Promise.all([
      // Lấy thông tin chi nhánh theo branchId
      emrsFetch(`/Branch/find/${branchId}`, { headers: authHeader }).catch((e) => {
        console.error("[Dashboard] Branch API error:", e);
        return null;
      }),
      // Danh sách xe theo chi nhánh - API mới với pagination
      emrsFetch(`/Vehicle/model/${branchId}?pageNum=1&pageSize=100&descendingOrder=false`, { headers: authHeader }).catch((e) => {
        console.error("[Dashboard] Vehicles API error:", e);
        return null;
      }),
      // Danh sách booking theo chi nhánh - thêm pagination để lấy tất cả
      emrsFetch(`/Booking/branch/${branchId}?PageNum=1&PageSize=1000&orderByDescending=false`, { headers: authHeader }).catch((e) => {
        console.error("[Dashboard] Bookings API error:", e);
        return null;
      }),
      // Danh sách insurance claims theo chi nhánh
      emrsFetch(`/InsuranceClaim/manager/branch-claims`, { headers: authHeader }).catch((e) => {
        console.error("[Dashboard] Insurance Claims API error:", e);
        return null;
      }),
      // Danh sách vehicle transfer requests theo chi nhánh
      emrsFetch(`/VehicleTransferRequest/branch/${branchId}`, { headers: authHeader }).catch((e) => {
        console.error("[Dashboard] Transfer Requests API error:", e);
        return null;
      }),
    ]);

    // Parse responses
    const [branchJson, vehiclesJson, bookingsJson, insuranceClaimsJson, transferRequestsJson] = await Promise.all([
      parseResponse(branchRes, "Branch"),
      parseResponse(vehiclesRes, "Vehicles"),
      parseResponse(bookingsRes, "Bookings"),
      parseResponse(insuranceClaimsRes, "Insurance Claims"),
      parseResponse(transferRequestsRes, "Transfer Requests"),
    ]);

    const branch = branchJson?.data ?? branchJson ?? {};

    // Xử lý vehicles
    let vehiclesRaw: any[] = [];
    if (vehiclesJson?.success && vehiclesJson?.data) {
      if (vehiclesJson.data.items && Array.isArray(vehiclesJson.data.items)) {
        vehiclesRaw = vehiclesJson.data.items;
      } else if (Array.isArray(vehiclesJson.data)) {
        vehiclesRaw = vehiclesJson.data;
      }
    } else if (Array.isArray(vehiclesJson?.data)) {
      vehiclesRaw = vehiclesJson.data;
    } else if (Array.isArray(vehiclesJson)) {
      vehiclesRaw = vehiclesJson;
    }

    // Xử lý bookings - tương tự như vehicles, có thể có pagination
    let bookings: any[] = [];
    if (bookingsJson?.success && bookingsJson?.data) {
      if (bookingsJson.data.items && Array.isArray(bookingsJson.data.items)) {
        bookings = bookingsJson.data.items;
      } else if (Array.isArray(bookingsJson.data)) {
        bookings = bookingsJson.data;
      }
    } else if (Array.isArray(bookingsJson?.data)) {
      bookings = bookingsJson.data;
    } else if (Array.isArray(bookingsJson)) {
      bookings = bookingsJson;
    } else {
      // Thử lấy từ data trực tiếp
      const bookingsRaw = bookingsJson?.data ?? bookingsJson ?? [];
      bookings = Array.isArray(bookingsRaw) ? bookingsRaw : [];
    }
    );
    ,
      dataHasItems: !!bookingsJson?.data?.items,
      itemsIsArray: Array.isArray(bookingsJson?.data?.items),
    });

    // Xử lý insurance claims
    const claimsRaw = insuranceClaimsJson?.data ?? insuranceClaimsJson ?? [];
    const insuranceClaims: any[] = Array.isArray(claimsRaw) ? claimsRaw : [];

    // Xử lý transfer requests - giống như transfers page
    let transferRequests: any[] = [];
    if (transferRequestsJson) {
      // Xử lý giống transfers page: kiểm tra cả json.data và json trực tiếp
      const raw = transferRequestsJson.data ?? transferRequestsJson;
      if (Array.isArray(raw)) {
        transferRequests = raw;
      } else if (raw && Array.isArray(raw.items)) {
        transferRequests = raw.items;
      }
    }
    );

    // Flatten vehicles từ vehicle models
    // API trả về vehicle models, mỗi model có mảng vehicles bên trong
    let allVehicles: any[] = [];
    if (Array.isArray(vehiclesRaw)) {
      vehiclesRaw.forEach((model: any) => {
        // Mỗi model có thể có mảng vehicles bên trong
        if (model.vehicles && Array.isArray(model.vehicles)) {
          allVehicles = allVehicles.concat(model.vehicles);
        }
        // Hoặc nếu model chính là vehicle (không có nested vehicles)
        else if (model.id && (model.status || model.vehicleStatus)) {
          allVehicles.push(model);
        }
      });
    }
    // Tính toán KPI cho vehicles - đếm từ dữ liệu thực tế
    const totalVehicles = allVehicles.length;
    
    // Đếm vehicles theo status - kiểm tra nhiều field có thể có
    const activeVehicles = allVehicles.filter((v: any) => {
      const status = (v.status || v.vehicleStatus || v.state || "").toString().toUpperCase();
      return status === "RENTED" || status === "RENTING" || status === "ACTIVE";
    }).length;
    
    const maintenanceVehicles = allVehicles.filter((v: any) => {
      const status = (v.status || v.vehicleStatus || v.state || "").toString().toUpperCase();
      return status === "MAINTENANCE" || status === "MAINTAINING" || status === "REPAIR";
    }).length;
    
    const availableVehicles = allVehicles.filter((v: any) => {
      const status = (v.status || v.vehicleStatus || v.state || "").toString().toUpperCase();
      return status === "AVAILABLE" || status === "READY" || status === "IDLE";
    }).length;
    
    const unavailableVehicles = allVehicles.filter((v: any) => {
      const status = (v.status || v.vehicleStatus || v.state || "").toString().toUpperCase();
      return status === "UNAVAILABLE" || status === "OUT_OF_SERVICE" || status === "DISABLED";
    }).length;
    // Tính toán KPI cho bookings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().slice(0, 10);

    // Tính toán cho tuần này (Monday to Sunday)
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)); // Monday
    weekStart.setHours(0, 0, 0, 0);
    const weekStartStr = weekStart.toISOString().slice(0, 10);

    // Tính toán cho tháng này
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);
    const monthStartStr = monthStart.toISOString().slice(0, 10);

    const getBookingDate = (b: any) => {
      // Kiểm tra nhiều field có thể có ngày booking
      const dateStr = b.startDatetime || b.start_datetime || b.bookingDate || b.booking_date || 
                      b.createdAt || b.created_at || b.startDate || b.start_date ||
                      b.date || b.bookingDate;
      if (!dateStr) return null;
      const d = new Date(dateStr);
      if (Number.isNaN(d.getTime())) return null;
      return d.toISOString().slice(0, 10);
    };

    const getBookingAmount = (b: any) => {
      // Kiểm tra nhiều field có thể có số tiền
      const amount = b.totalAmount || b.total_amount || b.totalPrice || b.total_price || 
                     b.baseRentalFee || b.base_rental_fee || b.amount || 0;
      return typeof amount === "number" ? amount : 0;
    };

    const getBookingStatus = (b: any) => {
      return b.bookingStatus || b.status || "Unknown";
    };

    // Bookings theo ngày - đếm từ dữ liệu thực tế
    const todayBookings = bookings.filter((b: any) => {
      const dateStr = getBookingDate(b);
      return dateStr === todayStr;
    });

    // Bookings theo tuần - đếm từ dữ liệu thực tế
    const weekBookings = bookings.filter((b: any) => {
      const dateStr = getBookingDate(b);
      if (!dateStr) return false;
      return dateStr >= weekStartStr && dateStr <= todayStr;
    });

    // Bookings theo tháng - đếm từ dữ liệu thực tế
    const monthBookings = bookings.filter((b: any) => {
      const dateStr = getBookingDate(b);
      if (!dateStr) return false;
      return dateStr >= monthStartStr && dateStr <= todayStr;
    });
    
    // Log chi tiết để debug
    if (bookings.length > 0) {
      .map((b: any) => ({
        id: b.id,
        startDatetime: b.startDatetime,
        parsedDate: getBookingDate(b),
        bookingDate: b.bookingDate,
        createdAt: b.createdAt,
      })));
    }

    // Tính doanh thu - đếm từ dữ liệu thực tế
    const todayRevenue = todayBookings.reduce((sum: number, b: any) => {
      const amount = getBookingAmount(b);
      return sum + (typeof amount === "number" ? amount : 0);
    }, 0);

    const weekRevenue = weekBookings.reduce((sum: number, b: any) => {
      const amount = getBookingAmount(b);
      return sum + (typeof amount === "number" ? amount : 0);
    }, 0);

    const monthRevenue = monthBookings.reduce((sum: number, b: any) => {
      const amount = getBookingAmount(b);
      return sum + (typeof amount === "number" ? amount : 0);
    }, 0);
    // Thống kê booking theo status - đếm từ dữ liệu thực tế
    const bookingStatusCounts: Record<string, number> = {};
    bookings.forEach((b: any) => {
      const status = getBookingStatus(b);
      bookingStatusCounts[status] = (bookingStatusCounts[status] || 0) + 1;
    });
    // Thống kê insurance claims - theo đúng status từ API
    // Status: Reported, Processing, Rejected, Completed
    const reportedClaims = insuranceClaims.filter((c: any) => {
      const status = (c.status || c.claimStatus || "").toString();
      return status === "Reported" || status === "REPORTED";
    }).length;

    const processingClaims = insuranceClaims.filter((c: any) => {
      const status = (c.status || c.claimStatus || "").toString();
      return status === "Processing" || status === "PROCESSING";
    }).length;

    const rejectedClaims = insuranceClaims.filter((c: any) => {
      const status = (c.status || c.claimStatus || "").toString();
      return status === "Rejected" || status === "REJECTED";
    }).length;

    const completedClaims = insuranceClaims.filter((c: any) => {
      const status = (c.status || c.claimStatus || "").toString();
      return status === "Completed" || status === "COMPLETED";
    }).length;

    // Pending claims = Reported (chờ xử lý)
    const pendingClaims = reportedClaims;
    // Approved claims = Processing + Completed (đã duyệt và đang xử lý hoặc hoàn tất)
    const approvedClaims = processingClaims + completedClaims;

    // Thống kê transfer requests - đơn giản hóa
    const pendingTransfers = transferRequests.filter((t: any) => {
      const status = (t.status || t.transferStatus || "").toString().toUpperCase();
      return status === "PENDING" || status === "PENDING_APPROVAL";
    }).length;

    const approvedTransfers = transferRequests.filter((t: any) => {
      const status = (t.status || t.transferStatus || "").toString().toUpperCase();
      return status === "APPROVED" || status === "APPROVED_TRANSFER";
    }).length;
    // Log insurance claims stats
    // Đảm bảo luôn có dữ liệu, ngay cả khi một số API lỗi
    const result = {
      success: true,
      data: {
        branch: branch || {},
        vehicles: allVehicles || [],
        vehicleModels: vehiclesRaw || [], // Giữ lại models để reference nếu cần
        bookings: bookings || [],
        insuranceClaims: insuranceClaims || [],
        transferRequests: transferRequests || [],
        kpi: {
          // Vehicle KPIs
          totalVehicles: totalVehicles || 0,
          activeVehicles: activeVehicles || 0,
          maintenanceVehicles: maintenanceVehicles || 0,
          availableVehicles: availableVehicles || 0,
          unavailableVehicles: unavailableVehicles || 0,
          // Booking KPIs
          todayBookings: todayBookings?.length || 0,
          weekBookings: weekBookings?.length || 0,
          monthBookings: monthBookings?.length || 0,
          totalBookings: bookings?.length || 0,
          // Revenue KPIs
          todayRevenue: todayRevenue || 0,
          weekRevenue: weekRevenue || 0,
          monthRevenue: monthRevenue || 0,
          // Booking status breakdown
          bookingStatusCounts: bookingStatusCounts || {},
          // Insurance claims KPIs
          totalClaims: insuranceClaims?.length || 0,
          pendingClaims: pendingClaims || 0, // Reported status
          approvedClaims: approvedClaims || 0, // Processing + Completed
          rejectedClaims: rejectedClaims || 0,
          // Chi tiết thêm
          reportedClaims: reportedClaims || 0,
          processingClaims: processingClaims || 0,
          completedClaims: completedClaims || 0,
          // Transfer requests KPIs
          totalTransfers: transferRequests?.length || 0,
          pendingTransfers: pendingTransfers || 0,
          approvedTransfers: approvedTransfers || 0,
        },
      },
    };

    );
    return NextResponse.json(result);
  } catch (err) {
    console.error("Manager dashboard error:", err);
    return NextResponse.json(
      { success: false, message: "Internal BFF Error" },
      { status: 500 }
    );
  }
}


