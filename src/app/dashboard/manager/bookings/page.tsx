"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Table,
  Input,
  Tag,
  Button,
  Select,
  message,
} from "antd";
import { Search } from "lucide-react";
import dayjs from "dayjs";

import {
  getBookingsByBranch,
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

// Format currency
const formatCurrency = (amount: number) => {
  if (!amount) return "0 đ";
  return `${amount.toLocaleString("vi-VN")} đ`;
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  useEffect(() => {
    loadBookings();
  }, [statusFilter]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      // branchId will be read from cookie in the API route
      const data = await getBookingsByBranch(undefined, {
        PageSize: 100,
        orderByDescending: true,
      });
      setBookings(Array.isArray(data) ? data : []);
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
    if (statusFilter && booking.status !== statusFilter) {
      return false;
    }

    // Search filter
    if (!searchText.trim()) return true;
    const searchLower = searchText.toLowerCase();
    return (
      (booking.bookingId || booking.id || "")
        .toLowerCase()
        .includes(searchLower) ||
      (booking.renter?.fullName || booking.renterName || "")
        .toLowerCase()
        .includes(searchLower) ||
      (booking.renter?.phoneNumber || booking.phoneNumber || "")
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
      render: (text: string, record: any) => (
        <span className="font-mono">
          {text || record.id || record.bookingCode || "N/A"}
        </span>
      ),
    },
    {
      title: "KHÁCH",
      dataIndex: "renterName",
      key: "renterName",
      render: (_: any, record: any) =>
        record.renter?.fullName || record.renterName || "N/A",
    },
    {
      title: "SĐT",
      dataIndex: "phoneNumber",
      key: "phoneNumber",
      render: (_: any, record: any) =>
        record.renter?.phoneNumber || record.phoneNumber || "N/A",
    },
    {
      title: "MODEL",
      dataIndex: "vehicleModelName",
      key: "vehicleModelName",
      render: (_: any, record: any) =>
        record.vehicleModel?.modelName ||
        record.vehicleModelName ||
        "N/A",
    },
    {
      title: "GÓI",
      dataIndex: "package",
      key: "package",
      render: (_: any, record: any) => {
        const days = record.rentalDays || 0;
        const hours = record.rentalHours || 0;
        if (days > 0) {
          return days === 1 ? "Day" : `${days} Days`;
        }
        return hours > 0 ? `${hours} Hours` : "N/A";
      },
    },
    {
      title: "BẮT ĐẦU",
      dataIndex: "startDatetime",
      key: "startDatetime",
      render: (date: string) =>
        date ? dayjs(date).format("YYYY-MM-DD HH:mm") : "N/A",
    },
    {
      title: "KẾT THÚC",
      dataIndex: "endDatetime",
      key: "endDatetime",
      render: (date: string) =>
        date ? dayjs(date).format("YYYY-MM-DD HH:mm") : "N/A",
    },
    {
      title: "CỌC",
      dataIndex: "depositAmount",
      key: "depositAmount",
      render: (amount: number) => formatCurrency(amount || 0),
    },
    {
      title: "TRẠNG THÁI",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const statusInfo = getStatusInfo(status || "");
        return <Tag color={statusInfo.color}>{statusInfo.label}</Tag>;
      },
    },
    {
      title: "HÀNH ĐỘNG",
      key: "action",
      render: (_: any, record: any) => (
        <div className="flex gap-2 flex-wrap">
          <Button
            size="small"
            type="link"
            onClick={() => {
              // TODO: Open detail modal
              message.info("Chi tiết booking");
            }}
          >
            Chi tiết
          </Button>
          <Button
            size="small"
            type="link"
            disabled={
              record.status === "completed" || record.status === "cancelled"
            }
            onClick={() => handleAssignVehicle(record.id || record.bookingId)}
          >
            Giao xe
          </Button>
          <Button
            size="small"
            type="link"
            disabled={
              record.status === "completed" || record.status === "cancelled"
            }
            onClick={() => handleReturnVehicle(record.id || record.bookingId)}
          >
            Trả xe
          </Button>
          <Button
            size="small"
            type="link"
            danger
            onClick={() => handleIncident(record.id || record.bookingId)}
          >
            Sự cố
          </Button>
        </div>
      ),
    },
  ];

  // Get unique statuses for filter
  const statusOptions = [
    { label: "Tất cả trạng thái", value: undefined },
    ...Array.from(
      new Set(bookings.map((b) => b.status).filter(Boolean))
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

