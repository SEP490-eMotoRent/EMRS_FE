"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Table, Tag, message, Button, Space, Select } from "antd";
import dayjs from "dayjs";
import type { ColumnsType } from "antd/es/table";
import { UserOutlined, PhoneOutlined, EnvironmentOutlined } from "@ant-design/icons";

import { getBranchTickets, getBookingById, getStaffById } from "./ticket_service";
import { useRouter } from "next/navigation";

type TicketStatus = "Pending" | "Assigned" | "InProgress" | "Resolved";

interface TicketItem {
  id: string;
  status: TicketStatus;
  ticketType: string;
  title: string;
  description: string;
  bookingId: string;
  staffId?: string | null; // Thêm staffId để check xem đã được assign chưa
  renterName?: string;
  renterPhone?: string;
  vehicleModelName?: string;
  licensePlate?: string;
  branchName?: string;
  assignedStaffName?: string;
  staffName?: string;
  currentLocation?: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  updatedAt?: string;
}

export default function TicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | undefined>(undefined);
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    pageSize: 10,
  });

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async (page: number = 1, pageSize: number = 10) => {
    try {
      setLoading(true);
      const response = await getBranchTickets(pageSize, page);
      
      // Normalize data structure từ API response và fetch thêm booking/staff info
      const normalized: TicketItem[] = await Promise.all(
        response.items.map(async (ticket: any) => {
          const baseTicket: TicketItem = {
            id: ticket.id || "",
            status: (ticket.status || "Pending") as TicketStatus,
            ticketType: ticket.ticketType || "",
            title: ticket.title || "",
            description: ticket.description || "",
            bookingId: ticket.bookingId || "",
            staffId: ticket.staffId || null,
            currentLocation: ticket.currentLocation || undefined,
            latitude: ticket.latitude || undefined,
            longitude: ticket.longitude || undefined,
            createdAt: ticket.createdAt || new Date().toISOString(),
            updatedAt: ticket.updatedAt || undefined,
          };
          
          // Fetch booking info nếu có bookingId
          if (baseTicket.bookingId) {
            try {
              const booking = await getBookingById(baseTicket.bookingId);
              if (booking) {
                baseTicket.renterName = booking.renter?.fullName || booking.renter?.account?.fullname || booking.renterName;
                baseTicket.renterPhone = booking.renter?.phoneNumber || booking.renter?.phone || booking.renterPhone;
                baseTicket.vehicleModelName = booking.vehicle?.vehicleModel?.modelName || booking.vehicleModelName;
                baseTicket.licensePlate = booking.vehicle?.licensePlate || booking.licensePlate;
              }
            } catch (err) {
              console.warn(`Failed to fetch booking ${baseTicket.bookingId}:`, err);
            }
          }
          
          // Nếu không có renterName từ booking, thử lấy từ ticket
          if (!baseTicket.renterName) {
            baseTicket.renterName = ticket.renterName || ticket.renter?.fullName || ticket.renter?.account?.fullname;
          }
          if (!baseTicket.renterPhone) {
            baseTicket.renterPhone = ticket.renterPhone || ticket.renter?.phoneNumber || ticket.renter?.phone;
          }
          if (!baseTicket.vehicleModelName) {
            baseTicket.vehicleModelName = ticket.vehicleModelName || ticket.vehicleModel?.modelName;
          }
          if (!baseTicket.licensePlate) {
            baseTicket.licensePlate = ticket.licensePlate || ticket.vehicle?.licensePlate;
          }
          
          // Fetch staff info nếu có staffId
          if (baseTicket.staffId) {
            try {
              const staff = await getStaffById(baseTicket.staffId);
              if (staff) {
                baseTicket.assignedStaffName = staff.fullname || staff.fullName || staff.username;
              } else {
                baseTicket.assignedStaffName = ticket.assignedStaffName || ticket.staffName || ticket.staff?.fullName || "Đã phân công";
              }
            } catch (err) {
              console.warn(`Failed to fetch staff ${baseTicket.staffId}:`, err);
              baseTicket.assignedStaffName = ticket.assignedStaffName || ticket.staffName || ticket.staff?.fullName || "Đã phân công";
            }
          } else {
            baseTicket.assignedStaffName = undefined;
          }
          
          return baseTicket;
        })
      );
      
      setTickets(normalized);
      setPagination({
        totalItems: response.totalItems,
        totalPages: response.totalPages,
        currentPage: response.currentPage,
        pageSize: response.pageSize,
      });
    } catch (err: any) {
      console.error(err);
      message.error(err.message || "Không thể tải danh sách tickets");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: TicketStatus, staffId?: string | null) => {
    // Nếu status = Pending nhưng có staffId → đã được assign (màu xanh)
    if (status === "Pending" && staffId) {
      return "blue";
    }
    
    switch (status) {
      case "Pending":
        return "orange";
      case "InProgress":
        return "purple";
      case "Resolved":
        return "green";
      default:
        return "default";
    }
  };

  const getStatusText = (status: TicketStatus, staffId?: string | null) => {
    // Nếu status = Pending nhưng có staffId → đã được assign
    if (status === "Pending" && staffId) {
      return "Đã phân công";
    }
    
    switch (status) {
      case "Pending":
        return "Chờ phân công";
      case "InProgress":
        return "Đang xử lý";
      case "Resolved":
        return "Đã giải quyết";
      default:
        return status;
    }
  };

  const getIssueTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      "WeakBattery": "Pin yếu/hết",
      "BatteryWeak": "Pin yếu/hết", // Fallback
      "FlatTyre": "Lốp xẹp",
      "TireFlat": "Lốp xẹp", // Fallback
      "UsageHelp": "Không biết cách sử dụng",
      "Other": "Vấn đề kỹ thuật khác",
    };
    return typeMap[type] || type;
  };

  const filteredTickets = statusFilter
    ? tickets.filter((t) => t.status === statusFilter)
    : tickets;

  const columns: ColumnsType<TicketItem> = [
    {
      title: "Mã Ticket",
      dataIndex: "id",
      key: "id",
      width: 120,
      render: (id: string) => <span className="font-mono text-xs">{id ? id.substring(0, 8) : "N/A"}...</span>,
    },
    {
      title: "Khách hàng",
      key: "renter",
      width: 180,
      render: (_: any, record: TicketItem) => {
        // Luôn hiển thị thông tin nếu có, nếu không có thì hiển thị "Đang tải..." hoặc link
        if (record.renterName) {
          return (
            <div>
              <div className="flex items-center gap-2">
                <UserOutlined className="text-gray-400" />
                <span className="font-medium">{record.renterName}</span>
              </div>
              {record.renterPhone && (
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                  <PhoneOutlined className="text-gray-400" />
                  <a href={`tel:${record.renterPhone}`} className="text-blue-600">
                    {record.renterPhone}
                  </a>
                </div>
              )}
            </div>
          );
        }
        
        // Nếu không có thông tin, hiển thị link đến booking
        if (record.bookingId) {
          return (
            <span className="text-gray-400 text-sm">
              <a
                href={`/dashboard/manager/bookings/${record.bookingId}`}
                className="text-blue-600 hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  router.push(`/dashboard/manager/bookings/${record.bookingId}`);
                }}
              >
                Xem booking
              </a>
            </span>
          );
        }
        
        return <span className="text-gray-400 text-xs">N/A</span>;
      },
    },
    {
      title: "Tiêu đề",
      key: "title",
      width: 200,
      render: (_: any, record: TicketItem) => (
        <div>
          <div className="font-medium">{record.title || "N/A"}</div>
          <Tag color="blue" className="mt-1">
            {getIssueTypeText(record.ticketType)}
          </Tag>
        </div>
      ),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (text: string) => (
        <span className="text-sm" title={text}>
          {text || "N/A"}
        </span>
      ),
    },
    {
      title: "Xe",
      key: "vehicle",
      width: 150,
      render: (_: any, record: TicketItem) => {
        // Hiển thị thông tin xe nếu có
        if (record.vehicleModelName || record.licensePlate) {
          return (
            <div>
              <div className="font-medium">{record.vehicleModelName || "N/A"}</div>
              {record.licensePlate && (
                <div className="text-xs text-gray-500">{record.licensePlate}</div>
              )}
            </div>
          );
        }
        
        // Nếu không có thông tin, hiển thị link đến booking
        if (record.bookingId) {
          return (
            <span className="text-gray-400 text-xs">
              <a
                href={`/dashboard/manager/bookings/${record.bookingId}`}
                className="text-blue-600 hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  router.push(`/dashboard/manager/bookings/${record.bookingId}`);
                }}
              >
                Xem booking
              </a>
            </span>
          );
        }
        
        return <span className="text-gray-400 text-xs">N/A</span>;
      },
    },
    {
      title: "Booking",
      dataIndex: "bookingId",
      key: "bookingId",
      width: 120,
      render: (id: string) => <span className="font-mono text-xs">{id ? id.substring(0, 8) : "N/A"}...</span>,
    },
    {
      title: "Vị trí",
      key: "location",
      width: 150,
      render: (_: any, record: TicketItem) => (
        record.currentLocation ? (
          <div className="flex items-center gap-1">
            <EnvironmentOutlined className="text-gray-400" />
            <span className="text-xs text-gray-600 truncate" title={record.currentLocation}>
              {record.currentLocation}
            </span>
          </div>
        ) : (
          <span className="text-gray-400 text-xs">Chưa có</span>
        )
      ),
    },
    {
      title: "Nhân viên",
      dataIndex: "assignedStaffName",
      key: "assignedStaffName",
      width: 120,
      render: (name: string, record: TicketItem) => {
        if (name) {
          return <Tag color="cyan">{name}</Tag>;
        }
        if (record.staffId) {
          // Có staffId nhưng chưa load được tên
          return <span className="text-gray-400 text-xs">Đang tải...</span>;
        }
        return <span className="text-gray-400 text-xs">Chưa phân công</span>;
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status: TicketStatus, record: TicketItem) => {
        const displayStatus = status === "Pending" && record.staffId ? "Assigned" : status;
        return (
          <Tag color={getStatusColor(status, record.staffId)}>
            {getStatusText(status, record.staffId)}
          </Tag>
        );
      },
      filters: [
        { text: "Chờ phân công", value: "Pending" },
        { text: "Đã phân công", value: "Assigned" },
        { text: "Đang xử lý", value: "InProgress" },
        { text: "Đã giải quyết", value: "Resolved" },
      ],
      onFilter: (value, record) => {
        // Xử lý filter "Assigned" = Pending + có staffId
        if (value === "Assigned") {
          return record.status === "Pending" && !!record.staffId;
        }
        return record.status === value as TicketStatus;
      },
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (d: string) => dayjs(d).format("DD/MM/YYYY HH:mm"),
      sorter: (a, b) =>
        dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 120,
      fixed: "right",
      render: (_: any, record: TicketItem) => (
        <Link
          href={`/dashboard/manager/tickets/${record.id}`}
          className="text-blue-600 hover:underline"
        >
          Xem chi tiết
        </Link>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Quản lý Tickets - Hỗ trợ kỹ thuật</h1>
        <Button onClick={() => loadTickets(pagination.currentPage, pagination.pageSize)} loading={loading}>
          Làm mới
        </Button>
      </div>

      <div className="mb-4">
        <Space>
          <span className="text-sm text-gray-600">Lọc theo trạng thái:</span>
          <Select
            placeholder="Tất cả trạng thái"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 200 }}
            allowClear
          >
            <Select.Option value="Pending">Chờ phân công</Select.Option>
            <Select.Option value="Assigned">Đã phân công</Select.Option>
            <Select.Option value="InProgress">Đang xử lý</Select.Option>
            <Select.Option value="Resolved">Đã giải quyết</Select.Option>
          </Select>
        </Space>
      </div>

      <div className="bg-white shadow rounded-lg p-4">
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={filteredTickets}
          locale={{ emptyText: "Không có ticket nào" }}
          scroll={{ x: 1600 }}
          pagination={{
            current: pagination.currentPage,
            pageSize: pagination.pageSize,
            total: pagination.totalItems,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} ticket`,
            onChange: (page, pageSize) => {
              loadTickets(page, pageSize);
            },
            onShowSizeChange: (current, size) => {
              loadTickets(1, size);
            },
          }}
        />
      </div>
    </div>
  );
}

