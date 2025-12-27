"use client";

import { useEffect, useState } from "react";
import { message } from "antd";
import {
  BarChart,
  Bar,
  LabelList,
  LineChart,
  Line,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp } from "lucide-react";

import {
  AdminDashboardData,
  getAdminDashboardData,
} from "./admin_dashboard_service";
import { getBookings } from "../bookings/booking_service";
import { getRepairRequests } from "@/services/repair_request_service";
import { getMemberships } from "../memberships/membership_service";
import { getTransferOrders } from "../transfers/transfer_order_service";
import { getTransferRequests } from "../transfers/transfer_request_service";
import {
  getTotalRevenue,
  getRevenueByYear,
  type RevenueByYearResponse,
} from "./revenue_service";
import { Calendar, Wrench, Crown, Truck, Ticket } from "lucide-react";

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [bookings, setBookings] = useState<any>(null);
  const [repairRequests, setRepairRequests] = useState<any>(null);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cashflowData, setCashflowData] = useState<
    { month: string; thu: number; chi: number; revenue?: number }[]
  >([]);
  const [loadingCashflow, setLoadingCashflow] = useState(false);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [revenueByYear, setRevenueByYear] = useState<RevenueByYearResponse | null>(null);

  useEffect(() => {
    async function loadRevenueData(hasCashflowData: boolean) {
      try {
        setLoadingCashflow(true);
        const currentYear = new Date().getFullYear();
        
        // Load tổng doanh thu
        const revenueResponse = await getTotalRevenue().catch(() => null);
        if (revenueResponse?.data?.totalRevenue) {
          setTotalRevenue(revenueResponse.data.totalRevenue);
        }
        
        // Load doanh thu theo năm để hiển thị trong biểu đồ (chỉ nếu chưa có cashflow data)
        if (!hasCashflowData) {
          const yearResponse = await getRevenueByYear(currentYear).catch(() => null);
          if (yearResponse?.data?.monthTotals) {
            setRevenueByYear(yearResponse);
            
            // Chuyển đổi dữ liệu để hiển thị trong biểu đồ
            const monthNames = [
              "T1", "T2", "T3", "T4", "T5", "T6",
              "T7", "T8", "T9", "T10", "T11", "T12"
            ];
            
            const chartData = yearResponse.data.monthTotals.map((item) => ({
              month: monthNames[item.month - 1] || `T${item.month}`,
              thu: parseFloat((item.totalRevenue / 1_000_000).toFixed(1)),
              chi: 0, // Chưa có dữ liệu chi phí từ API này
              revenue: parseFloat((item.totalRevenue / 1_000_000).toFixed(1)),
            }));
            
            setCashflowData(chartData);
          }
        }
      } catch (err: any) {
        console.error("Failed to load revenue data:", err);
        // Không hiển thị error message để tránh làm phiền user
      } finally {
        setLoadingCashflow(false);
      }
    }

    async function load() {
      try {
        setLoading(true);
        const [
          dashboard,
          bookingsData,
          repairData,
          membershipsData,
          transferOrdersData,
          transferRequestsData,
        ] = await Promise.all([
          getAdminDashboardData(),
          getBookings({ PageSize: 1 }).catch(() => ({ totalItems: 0 })),
          getRepairRequests({ pageSize: 1 }).catch(() => ({ totalItems: 0 })),
          getMemberships().catch(() => []),
          getTransferOrders().catch(() => []),
          getTransferRequests().catch(() => []),
        ]);
        setData(dashboard);
        
        // Cashflow: ưu tiên từ API dashboard. Nếu thiếu, sẽ fallback bằng revenue API.
        const hasCashflow = dashboard.cashflow && Array.isArray(dashboard.cashflow) && dashboard.cashflow.length > 0;
        if (hasCashflow) {
          setCashflowData(
            dashboard.cashflow.map((item: any) => ({
              month: item.month || item.monthLabel || item.period || "",
              thu:
                typeof item.thu === "number"
                  ? parseFloat((item.thu / 1_000_000).toFixed(1))
                  : typeof item.income === "number"
                  ? parseFloat((item.income / 1_000_000).toFixed(1))
                  : 0,
              chi:
                typeof item.chi === "number"
                  ? parseFloat((item.chi / 1_000_000).toFixed(1))
                  : typeof item.expense === "number"
                  ? parseFloat((item.expense / 1_000_000).toFixed(1))
                  : 0,
              revenue:
                typeof item.revenue === "number"
                  ? parseFloat((item.revenue / 1_000_000).toFixed(1))
                  : undefined,
            }))
          );
        }
        
        // Luôn load revenue data để cập nhật totalRevenue và fallback cho cashflow
        await loadRevenueData(hasCashflow);

        // Xử lý bookings
        setBookings(bookingsData);
        
        // Xử lý repair requests
        setRepairRequests(repairData);
        
        // Xử lý memberships
        const membershipsList = Array.isArray(membershipsData) 
          ? membershipsData 
          : (membershipsData as any)?.data || (membershipsData as any)?.items || [];
        setMemberships(membershipsList);
        
        // Xử lý transfers
        const transferOrdersList = Array.isArray(transferOrdersData) 
          ? transferOrdersData 
          : (transferOrdersData as any)?.data || (transferOrdersData as any)?.items || [];
        const transferRequestsList = Array.isArray(transferRequestsData) 
          ? transferRequestsData 
          : (transferRequestsData as any)?.data || (transferRequestsData as any)?.items || [];
        setTransfers({
          orders: transferOrdersList,
          requests: transferRequestsList,
        });
      } catch (err: any) {
        console.error("Failed to load admin dashboard:", err);
        message.error(err?.message || "Không thể tải dữ liệu dashboard");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-gray-500">
        Đang tải dữ liệu...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-red-500">
        Không thể tải dữ liệu dashboard
      </div>
    );
  }

  const vehicleTotals = data.vehicle || ({} as AdminDashboardData["vehicle"]);
  const accountTotals = data.accounts || ({} as AdminDashboardData["accounts"]);
  const trackedPercent = vehicleTotals.totalVehicles
    ? Math.round(
        (vehicleTotals.totalTracked / vehicleTotals.totalVehicles) * 100
      )
    : 0;

  const vehicleStatusData = [
    { name: "Sẵn sàng", value: vehicleTotals.totalAvailable || 0 },
    { name: "Đã đặt", value: vehicleTotals.totalBooked || 0 },
    { name: "Giữ chỗ", value: vehicleTotals.totalHold || 0 },
    { name: "Đang điều chuyển", value: vehicleTotals.totalTransfering || 0 },
    { name: "Đang thuê", value: vehicleTotals.totalRented || 0 },
    { name: "Không khả dụng", value: vehicleTotals.totalUnavailable || 0 },
    { name: "Đang sửa", value: vehicleTotals.totalRepaired || 0 },
  ];

  const accountRoleData = [
    { name: "Admin", value: accountTotals.totalAdmin || 0 },
    { name: "Manager", value: accountTotals.totalManager || 0 },
    { name: "Staff", value: accountTotals.totalStaff || 0 },
    { name: "Technician", value: accountTotals.totalTechnician || 0 },
    { name: "Khách thuê", value: accountTotals.totalRenter || 0 },
  ];

  // Ưu tiên sử dụng totalRevenue từ API mới, fallback về data.transactions
  const revenueInMillions = totalRevenue > 0 
    ? totalRevenue / 1_000_000 
    : (data.transactions?.totalRevenue || 0) / 1_000_000;

  // Fallback từ giao dịch tạm thời tắt để tránh lỗi runtime; giữ data từ API dashboard

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <SummaryCard
          title="Tổng model"
          value={data.vehicleModel?.totalVehicleModels ?? 0}
        />
        <SummaryCard
          title="Tổng xe"
          value={vehicleTotals.totalVehicles ?? 0}
          subText={`${vehicleTotals.totalAvailable ?? 0} đang sẵn sàng`}
        />
        <SummaryCard
          title="Tổng chi nhánh"
          value={data.branch?.totalBranches ?? 0}
        />
        <SummaryCard
          title="Tổng tài khoản"
          value={accountTotals.totalAccounts ?? 0}
          subText={`${accountTotals.totalManager ?? 0} manager`}
        />
      </div>

      {/* Thêm các summary cards mới */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <SummaryCard
          title="Admin"
          value={accountTotals.totalAdmin || 0}
          subText="Quản trị viên"
        />
        <SummaryCard
          title="Manager"
          value={accountTotals.totalManager || 0}
          subText="Quản lý"
        />
        <SummaryCard
          title="Staff"
          value={accountTotals.totalStaff || 0}
          subText="Nhân viên"
        />
        <SummaryCard
          title="Technician"
          value={accountTotals.totalTechnician || 0}
          subText="Kỹ thuật viên"
        />
      </div>

      {/* Thống kê các module khác */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <SummaryCard
          title="Tổng đặt xe"
          value={bookings?.totalItems || 0}
          subText="Bookings"
          icon={<Calendar size={20} className="text-blue-600" />}
        />
        <SummaryCard
          title="Yêu cầu sửa chữa"
          value={repairRequests?.totalItems || 0}
          subText="Repair requests"
          icon={<Wrench size={20} className="text-orange-600" />}
        />
        <SummaryCard
          title="Hạng thành viên"
          value={memberships.length || 0}
          subText="Membership tiers"
          icon={<Crown size={20} className="text-yellow-600" />}
        />
        <SummaryCard
          title="Điều phối xe"
          value={(transfers?.orders?.length || 0) + (transfers?.requests?.length || 0)}
          subText={`${transfers?.orders?.length || 0} orders, ${transfers?.requests?.length || 0} requests`}
          icon={<Truck size={20} className="text-purple-600" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 bg-white border rounded-xl sm:rounded-2xl p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={20} className="text-emerald-600" />
            <h2 className="font-semibold text-sm sm:text-base">Thống kê dòng tiền</h2>
          </div>
          {loadingCashflow ? (
            <div className="flex items-center justify-center h-[280px] text-gray-500">
              <p>Đang tải dữ liệu thống kê dòng tiền...</p>
            </div>
          ) : cashflowData.length === 0 ? (
            <div className="flex items-center justify-center h-[280px] text-gray-500">
              <p>Chưa có dữ liệu thống kê dòng tiền</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={cashflowData} barCategoryGap={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="month"
                stroke="#6B7280"
                style={{ fontSize: "12px" }}
              />
              <YAxis
                stroke="#6B7280"
                style={{ fontSize: "12px" }}
                tickFormatter={(value) => `${value}M`}
              />
              <Tooltip
                formatter={(value: number) => [`${value} triệu`, ""]}
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                }}
              />
              <Legend
                formatter={(value) => {
                  if (value === "thu") return "Thu nhập";
                  if (value === "chi") return "Chi phí";
                  return value;
                }}
              />
              <Bar
                dataKey="thu"
                name="thu"
                fill="#10B981"
                radius={[6, 6, 0, 0]}
              >
                <LabelList
                  dataKey="thu"
                  position="top"
                  formatter={(val: number) => `${val}M`}
                  style={{ fill: "#0F172A", fontSize: 12 }}
                />
              </Bar>
              <Bar
                dataKey="chi"
                name="chi"
                fill="#EF4444"
                radius={[6, 6, 0, 0]}
              >
                <LabelList
                  dataKey="chi"
                  position="top"
                  formatter={(val: number) => `${val}M`}
                  style={{ fill: "#0F172A", fontSize: 12 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          )}
        </div>
        <div className="bg-white border rounded-xl sm:rounded-2xl p-3 sm:p-4">
          <h2 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Phân bổ tài khoản</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={accountRoleData}
                dataKey="value"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
              >
                {accountRoleData.map((_, idx) => (
                  <Cell
                    key={idx}
                    fill={["#4F46E5", "#EC4899", "#10B981", "#F59E0B", "#94A3B8"][idx % 5]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value) => `${value}: ${accountRoleData.find(d => d.name === value)?.value || 0}`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <DetailCard
          title="Xe có tracking"
          value={`${vehicleTotals.totalTracked ?? 0}/${vehicleTotals.totalVehicles ?? 0}`}
          extra={`${trackedPercent}% đội xe`}
        />
        <DetailCard
          title="Xe đang sửa chữa"
          value={vehicleTotals.totalRepaired ?? 0}
          extra={`${vehicleTotals.totalUnavailable ?? 0} xe không khả dụng`}
        />
        <DetailCard
          title="Tổng doanh thu"
          value={`${revenueInMillions.toFixed(1)} triệu`}
          extra="Từ tất cả giao dịch"
        />
      </div>

    </div>
  );
}

function SummaryCard({
  title,
  value,
  subText,
  icon,
}: {
  title: string;
  value: number | string;
  subText?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-white border rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-gray-500 text-xs sm:text-sm">{title}</p>
        {icon}
      </div>
      <p className="text-2xl sm:text-3xl font-semibold mt-1 sm:mt-2">{value}</p>
      {subText && <p className="text-xs text-gray-400 mt-1">{subText}</p>}
    </div>
  );
}

function DetailCard({
  title,
  value,
  extra,
}: {
  title: string;
  value: string | number;
  extra?: string;
}) {
  return (
    <div className="bg-white border rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm">
      <p className="text-gray-500 text-xs sm:text-sm">{title}</p>
      <p className="text-xl sm:text-2xl font-semibold mt-1 sm:mt-2">{value}</p>
      {extra && <p className="text-xs text-gray-400 mt-1">{extra}</p>}
    </div>
  );
}