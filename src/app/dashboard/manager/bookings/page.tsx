"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  Input,
  Tag,
  Button,
  Select,
  message,
  Typography,
  Tooltip,
  Space,
  Avatar,
} from "antd";
import { Search } from "lucide-react";
import dayjs from "dayjs";

import {
  getBookingsByBranch,
  getBookingById,
} from "./booking_service";

const { Search: AntSearch } = Input;

// Map status to Vietnamese and color
const getStatusInfo = (status: string) => {
  const statusMap: Record<string, { label: string; color: string }> = {
    active: { label: "Đang hoạt động", color: "green" },
    "handover-pending": { label: "Chờ giao xe", color: "orange" },
    "return-inspection": { label: "Kiểm tra trả xe", color: "blue" },
    completed: { label: "Hoàn thành", color: "default" },
    cancelled: { label: "Đã hủy", color: "red" },
    pending: { label: "Chờ xử lý", color: "orange" },
    Active: { label: "Đang hoạt động", color: "green" },
    "Handover-Pending": { label: "Chờ giao xe", color: "orange" },
    "Return-Inspection": { label: "Kiểm tra trả xe", color: "blue" },
    Completed: { label: "Hoàn thành", color: "default" },
    Cancelled: { label: "Đã hủy", color: "red" },
    Pending: { label: "Chờ xử lý", color: "orange" },
  };

  return (
    statusMap[status] || { label: status || "N/A", color: "default" }
  );
};

const { Text } = Typography;

// Format currency
const formatCurrency = (amount: number) => {
  if (!amount) return "0 đ";
  return `${amount.toLocaleString("vi-VN")} đ`;
};

const formatDateTime = (date?: string) =>
  date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "N/A";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const router = useRouter();

  useEffect(() => {
    loadBookings();
  }, [statusFilter]);

  const enrichBookingsWithDetail = async (items: any[]) => {
    return Promise.all(
      items.map(async (booking) => {
        const bookingId = booking.id || booking.bookingId || booking.bookingCode;
        if (!bookingId) return booking;

        try {
          const detail = await getBookingById(bookingId);
          return { ...booking, ...detail };
        } catch (err) {
          console.warn("Không thể lấy chi tiết booking", bookingId, err);
          return booking;
        }
      })
    );
  };

  const loadBookings = async () => {
    try {
      setLoading(true);
      // branchId will be read from cookie in the API route
      const data = await getBookingsByBranch(undefined, {
        PageSize: 100,
        orderByDescending: true,
      });
      const list = Array.isArray(data) ? data : [];
      const hydrated = await enrichBookingsWithDetail(list);
      setBookings(hydrated);
    } catch (err) {
      console.error("Error loading bookings:", err);
      message.error("Không thể tải danh sách booking");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  // Filter bookings based on search text and status
  const filteredBookings = bookings.filter((booking) => {
    // Status filter
    const statusValue = booking.bookingStatus || booking.status;
    if (statusFilter && statusValue !== statusFilter) {
      return false;
    }

    // Search filter
    if (!searchText.trim()) return true;
    const searchLower = searchText.toLowerCase();
    return (
      (booking.bookingId || booking.id || "")
        .toLowerCase()
        .includes(searchLower) ||
      (
        booking.renter?.fullName ||
        booking.renter?.account?.fullname ||
        booking.renterName ||
        ""
      )
        .toLowerCase()
        .includes(searchLower) ||
      (
        booking.renter?.phoneNumber ||
        booking.renter?.phone ||
        booking.phoneNumber ||
        ""
      )
        .toLowerCase()
        .includes(searchLower) ||
      (booking.vehicleModel?.modelName || booking.vehicleModelName || "")
        .toLowerCase()
        .includes(searchLower)
    );
  });

  const handleAssignVehicle = async (bookingId: string) => {
    // TODO: Open modal to select vehicle
    message.info("Chức năng gán xe đang được phát triển");
  };

  const handleReturnVehicle = async (bookingId: string) => {
    // TODO: Open modal for return vehicle process
    message.info("Chức năng trả xe đang được phát triển");
  };

  const handleIncident = (bookingId: string) => {
    // Navigate to insurance create page with bookingId
    window.location.href = `/dashboard/manager/insurance/create?bookingId=${bookingId}`;
  };

  const columns = [
    {
      title: "MÃ",
      dataIndex: "bookingId",
      key: "bookingId",
      align: "center" as const,
      render: (text: string, record: any) => (
        <Text code className="text-sm">
          {text || record.id || record.bookingCode || "N/A"}
        </Text>
      ),
    },
    {
      title: "KHÁCH",
      dataIndex: "renterName",
      key: "renterName",
      align: "left" as const,
      render: (_: any, record: any) => {
        const name =
          record.renter?.account?.fullname ||
          record.renter?.fullName ||
          record.renterName ||
          "N/A";
        const email =
          record.renter?.email ||
          record.renter?.account?.username ||
          undefined;
        const avatarText = name && name !== "N/A" ? name.charAt(0) : "?";
        return (
          <Space align="start">
            <Avatar size="small">{avatarText}</Avatar>
            <div className="leading-tight">
              <Text strong>{name}</Text>
              {email && (
                <div className="text-xs text-gray-500 truncate max-w-[140px]">
                  {email}
                </div>
              )}
            </div>
          </Space>
        );
      },
    },
    {
      title: "SĐT",
      dataIndex: "phoneNumber",
      key: "phoneNumber",
      align: "center" as const,
      render: (_: any, record: any) => {
        const phone =
          record.renter?.phone ||
          record.renter?.phoneNumber ||
          record.phoneNumber ||
          "N/A";
        return phone === "N/A" ? (
          <Text>N/A</Text>
        ) : (
          <a href={`tel:${phone}`} className="text-blue-600">
            {phone}
          </a>
        );
      },
    },
    {
      title: "MODEL",
      dataIndex: "vehicleModelName",
      key: "vehicleModelName",
      align: "center" as const,
      render: (_: any, record: any) => {
        const model =
          record.vehicleModel?.modelName ||
          record.vehicleModelName ||
          "N/A";
        const category = record.vehicleModel?.category || "";
        return (
          <Space direction="vertical" size={0}>
            <Text strong>{model}</Text>
            {category && (
              <Tag color="blue" className="mt-1 w-fit">
                {category}
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: "GÓI",
      dataIndex: "package",
      key: "package",
      align: "center" as const,
      render: (_: any, record: any) => {
        const days = record.rentalDays || 0;
        const hours = record.rentalHours || 0;
        if (days > 0) {
          return (
            <Tag color="purple" className="w-fit">
              {days === 1 ? "1 Day" : `${days} Days`}
            </Tag>
          );
        }
        return hours > 0 ? (
          <Tag color="purple" className="w-fit">{`${hours} Hours`}</Tag>
        ) : (
          "N/A"
        );
      },
    },
    {
      title: "BẮT ĐẦU",
      dataIndex: "startDatetime",
      key: "startDatetime",
      align: "center" as const,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: "KẾT THÚC",
      dataIndex: "endDatetime",
      key: "endDatetime",
      align: "center" as const,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: "CỌC",
      dataIndex: "depositAmount",
      key: "depositAmount",
      align: "center" as const,
      render: (amount: number) => formatCurrency(amount || 0),
    },
    {
      title: "TRẠNG THÁI",
      dataIndex: "status",
      key: "status",
      align: "center" as const,
      render: (_: string, record: any) => {
        const value = record.bookingStatus || record.status || "";
        const statusInfo = getStatusInfo(value);
        return (
          <Tag color={statusInfo.color} className="font-medium px-3 py-1">
            {statusInfo.label}
          </Tag>
        );
      },
    },
    {
      title: "HÀNH ĐỘNG",
      key: "action",
      align: "center" as const,
      render: (_: any, record: any) => (
        <Space size="small" wrap>
          <Button
            size="small"
            type="link"
            onClick={() =>
              router.push(
                `/dashboard/manager/bookings/${
                  record.id || record.bookingId || record.bookingCode
                }`
              )
            }
          >
            Chi tiết
          </Button>
          <Tooltip title="Giao xe cho khách">
            <Button
              size="small"
              type="link"
              disabled={
                (record.bookingStatus || record.status) === "completed" ||
                (record.bookingStatus || record.status) === "cancelled"
              }
              onClick={() => handleAssignVehicle(record.id || record.bookingId)}
            >
              Giao xe
            </Button>
          </Tooltip>
          <Tooltip title="Xử lý trả xe">
            <Button
              size="small"
              type="link"
              disabled={
                (record.bookingStatus || record.status) === "completed" ||
                (record.bookingStatus || record.status) === "cancelled"
              }
              onClick={() => handleReturnVehicle(record.id || record.bookingId)}
            >
              Trả xe
            </Button>
          </Tooltip>
          <Tooltip title="Tạo báo cáo sự cố/bảo hiểm">
            <Button
              size="small"
              type="link"
              danger
              onClick={() => handleIncident(record.id || record.bookingId)}
            >
              Sự cố
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Get unique statuses for filter
  const statusOptions = [
    { label: "Tất cả trạng thái", value: undefined },
    ...Array.from(
      new Set(
        bookings
          .map((b) => b.bookingStatus || b.status)
          .filter((status): status is string => Boolean(status))
      )
    ).map((status) => ({
      label: getStatusInfo(status).label,
      value: status,
    })),
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-4">
          Bookings - giao/nhận, hợp đồng, cọc
        </h1>

        <div className="flex gap-4 items-center mb-4">
          <div className="flex-1">
            <AntSearch
              placeholder="Tìm booking, khách, model"
              allowClear
              enterButton={<Search className="w-4 h-4" />}
              size="large"
              onSearch={handleSearch}
              onChange={(e) => {
                if (!e.target.value) {
                  handleSearch("");
                }
              }}
            />
          </div>
          <Select
            placeholder="Tất cả trạng thái"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 200 }}
            allowClear
          >
            {statusOptions.map((opt) => (
              <Select.Option key={opt.value || "all"} value={opt.value}>
                {opt.label}
              </Select.Option>
            ))}
          </Select>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-4">
        <Table
          size="middle"
          className="booking-table"
          rowKey={(record) => record.id || record.bookingId || Math.random()}
          loading={loading}
          columns={columns}
          dataSource={filteredBookings}
          locale={{ emptyText: "Không có booking nào" }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} booking`,
          }}
        />
      </div>
    </div>
  );
}

