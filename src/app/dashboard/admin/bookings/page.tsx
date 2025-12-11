"use client";

import { useEffect, useState } from "react";
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Modal,
  Form,
  message,
  Card,
  Descriptions,
  Tooltip,
} from "antd";
import {
  ReloadOutlined,
  EyeOutlined,
  SearchOutlined,
  FileTextOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getBookings,
  getBookingById,
  BookingFilters,
  BookingListResponse,
  Booking,
} from "./booking_service";
import type { ColumnsType } from "antd/es/table";

const { Option } = Select;

// Map status to Vietnamese and color
const getStatusInfo = (status: string) => {
  const statusMap: Record<string, { label: string; color: string }> = {
    Pending: { label: "Chờ xử lý", color: "orange" },
    Booked: { label: "Đã đặt", color: "blue" },
    Renting: { label: "Đang thuê", color: "green" },
    Completed: { label: "Hoàn thành", color: "default" },
    Cancelled: { label: "Đã hủy", color: "red" },
    PENDING: { label: "Chờ xử lý", color: "orange" },
    BOOKED: { label: "Đã đặt", color: "blue" },
    RENTING: { label: "Đang thuê", color: "green" },
    COMPLETED: { label: "Hoàn thành", color: "default" },
    CANCELLED: { label: "Đã hủy", color: "red" },
  };

  return (
    statusMap[status] || { label: status || "N/A", color: "default" }
  );
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState<BookingFilters>({
    PageSize: 10,
    PageNum: 1,
  });
  const [searchText, setSearchText] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  
  // Modal states
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    loadBookings();
  }, [filters]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const apiFilters: BookingFilters = {
        ...filters,
        BookingStatus: selectedStatus !== "all" ? selectedStatus : undefined,
      };
      
      const response: BookingListResponse = await getBookings(apiFilters);

      // Bổ sung chi nhánh cho từng booking (API list có thể không trả chi nhánh)
      const enriched = await Promise.all(
        response.items.map(async (item) => {
          // Nếu đã có thông tin chi nhánh thì dùng luôn
          const hasBranch =
            item.handoverBranch ||
            (item as any).branch ||
            (item as any).pickupBranch ||
            (item as any).dropoffBranch ||
            (item as any).handoverBranchName ||
            (item as any).returnBranchName ||
            (item as any).branchName ||
            (item as any).pickupBranchName ||
            (item as any).dropoffBranchName;

          if (hasBranch) return item;

          // Nếu thiếu, gọi chi tiết để lấy chi nhánh
          try {
            const detail = await getBookingById(item.id);
            return {
              ...item,
              handoverBranch:
                detail.handoverBranch ||
                (detail as any).branch ||
                (detail as any).pickupBranch,
              branchName:
                (detail as any).handoverBranchName ||
                (detail as any).branchName ||
                (detail as any).pickupBranchName ||
                detail.handoverBranch?.branchName ||
                (detail as any).branch?.name,
              branchCity:
                (detail as any).branchCity ||
                detail.handoverBranch?.city ||
                (detail as any).branch?.city,
            };
          } catch (err) {
            console.error("Error enriching booking with branch:", err);
            return item;
          }
        })
      );

      setBookings(enriched);
      setPagination({
        current: response.currentPage,
        pageSize: response.pageSize,
        total: response.totalItems,
      });
    } catch (error) {
      console.error("Error loading bookings:", error);
      message.error("Không thể tải danh sách đặt xe");
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (page: number, pageSize: number) => {
    setFilters({
      ...filters,
      PageNum: page,
      PageSize: pageSize,
    });
  };

  // Reset về trang 1 khi filter thay đổi
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      PageNum: 1,
    }));
  }, [selectedStatus]);

  const handleViewDetail = async (booking: Booking) => {
    try {
      const detail = await getBookingById(booking.id);
      setSelectedBooking(detail);
      setIsDetailModalVisible(true);
    } catch (error) {
      console.error("Error loading booking detail:", error);
      message.error("Không thể tải chi tiết đặt xe");
    }
  };

  const handleCancel = (booking: Booking) => {
    // Admin không hủy từ màn này; chỉ xem chi tiết
  };

  const confirmCancel = async () => {
    // Admin không hủy từ màn này
  };


  // Note: Search is client-side, pagination is server-side
  // For better UX, we can either:
  // 1. Keep search client-side (current) - works with current page data
  // 2. Move search to server-side - requires API call on search change
  // Currently using client-side search for simplicity
  const filteredBookings = bookings.filter((booking) => {
    if (!searchText) return true;
    const searchLower = searchText.toLowerCase();
    return (
      booking.bookingCode?.toLowerCase().includes(searchLower) ||
      booking.id?.toLowerCase().includes(searchLower) ||
      booking.renter?.account?.fullname?.toLowerCase().includes(searchLower) ||
      booking.renter?.email?.toLowerCase().includes(searchLower) ||
      booking.renter?.phone?.toLowerCase().includes(searchLower) ||
      booking.vehicleModel?.modelName?.toLowerCase().includes(searchLower) ||
      booking.vehicle?.licensePlate?.toLowerCase().includes(searchLower) ||
      booking.handoverBranch?.branchName?.toLowerCase().includes(searchLower)
    );
  });

  const columns: ColumnsType<Booking> = [
    {
      title: "Mã đặt xe",
      key: "bookingCode",
      width: 150,
      render: (_, record) => (
        <div>
          {record.bookingCode ? (
            <span className="font-mono font-semibold text-blue-600">
              {record.bookingCode}
            </span>
          ) : (
            <span className="font-mono text-xs text-gray-400">
              {record.id.slice(0, 8)}...
            </span>
          )}
        </div>
      ),
    },
    {
      title: "Khách hàng",
      key: "renter",
      width: 200,
      render: (_, record) => {
        const renter = record.renter;
        return (
          <div>
            <div className="font-medium">
              {renter?.account?.fullname || renter?.email || "N/A"}
            </div>
            {renter?.phone && (
              <div className="text-xs text-gray-500">{renter.phone}</div>
            )}
            {renter?.email && (
              <div className="text-xs text-gray-500">{renter.email}</div>
            )}
          </div>
        );
      },
    },
    {
      title: "Model xe",
      key: "vehicleModel",
      width: 150,
      render: (_, record) => (
        <div>
          <div className="font-medium">
            {record.vehicleModel?.modelName || "N/A"}
          </div>
          {record.vehicleModel?.category && (
            <Tag color="blue">
              {record.vehicleModel.category}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "Xe được phân",
      key: "vehicle",
      width: 150,
      render: (_, record) => {
        if (record.vehicle) {
          return (
            <div>
              <div className="font-semibold text-green-600">
                {record.vehicle.licensePlate}
              </div>
              {record.vehicle.color && (
                <div className="text-xs text-gray-500">
                  Màu: {record.vehicle.color}
                </div>
              )}
            </div>
          );
        }
        return (
          <Tag color="orange">
            Chưa phân công
          </Tag>
        );
      },
    },
    {
      title: "Chi nhánh",
      key: "branch",
      width: 200,
      render: (_, record) => {
        const branchObj =
          record.handoverBranch ||
          record.returnBranch ||
          (record as any).branch ||
          (record as any).pickupBranch ||
          (record as any).dropoffBranch;

        const branchNameStr =
          (record as any).handoverBranchName ||
          (record as any).returnBranchName ||
          (record as any).branchName ||
          (record as any).pickupBranchName ||
          (record as any).dropoffBranchName;

        // Nếu chỉ có tên dạng string
        if (typeof branchObj === "string") {
          return <span className="font-medium">{branchObj || "N/A"}</span>;
        }

        if (!branchObj && !branchNameStr) {
          return <span className="text-gray-400">N/A</span>;
        }

        return (
          <div>
            <div className="font-medium">
              {branchObj?.branchName ||
                branchObj?.name ||
                branchNameStr ||
                "N/A"}
            </div>
            {(branchObj?.city || (record as any).branchCity) && (
              <div className="text-xs text-gray-500">
                {branchObj?.city || (record as any).branchCity}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Thời gian",
      key: "datetime",
      width: 200,
      render: (_, record) => (
        <div className="text-sm">
          <div>
            <span className="text-gray-500">Từ:</span>{" "}
            {dayjs(record.startDatetime).format("DD/MM/YYYY HH:mm")}
          </div>
          <div>
            <span className="text-gray-500">Đến:</span>{" "}
            {dayjs(record.endDatetime).format("DD/MM/YYYY HH:mm")}
          </div>
          <div className="text-xs text-gray-400">
            {record.rentalDays} ngày
          </div>
        </div>
      ),
    },
    {
      title: "Phí thuê",
      key: "fee",
      width: 150,
      render: (_, record) => (
        <div>
          <div className="font-semibold text-green-600">
            {record.totalRentalFee?.toLocaleString("vi-VN")} VNĐ
          </div>
          {record.depositAmount > 0 && (
            <div className="text-xs text-gray-500">
              Cọc: {record.depositAmount.toLocaleString("vi-VN")} VNĐ
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "bookingStatus",
      key: "bookingStatus",
      width: 120,
      render: (status: string) => {
        const statusInfo = getStatusInfo(status);
        return <Tag color={statusInfo.color}>{statusInfo.label}</Tag>;
      },
    },
    {
      title: "Hành động",
      key: "action",
      width: 200,
      fixed: "right",
      render: (_, record) => {
        return (
          <Space>
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            >
              Chi tiết
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">
          Quản lý đặt xe
        </h1>
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={() => loadBookings()}
          size="large"
          className="w-full sm:w-auto"
        >
          <span className="hidden sm:inline">Làm mới</span>
          <span className="sm:hidden">Tải lại</span>
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Input
            placeholder="Tìm kiếm theo mã, khách hàng, xe..."
            prefix={<SearchOutlined />}
            allowClear
            className="w-full sm:flex-1"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={() => loadBookings()}
          />
          <Select
            placeholder="Trạng thái"
            className="w-full sm:w-48"
            value={selectedStatus}
            onChange={setSelectedStatus}
          >
            <Option value="all">Tất cả</Option>
            <Option value="Pending">Chờ xử lý</Option>
            <Option value="Booked">Đã đặt</Option>
            <Option value="Renting">Đang thuê</Option>
            <Option value="Completed">Hoàn thành</Option>
            <Option value="Cancelled">Đã hủy</Option>
          </Select>
        </div>
      </Card>

      {/* Table */}
      <Card className="shadow-sm">
        <div className="overflow-x-auto">
          <Table
            rowKey="id"
            loading={loading}
            dataSource={filteredBookings}
            columns={columns}
            scroll={{ x: 'max-content' }}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: searchText ? filteredBookings.length : pagination.total,
              showSizeChanger: true,
              showTotal: (total, range) => {
                if (searchText) {
                  return `Hiển thị ${range[0]}-${range[1]} của ${total} kết quả`;
                }
                return `Tổng ${total} đặt xe`;
              },
              pageSizeOptions: ["10", "20", "50", "100"],
              onChange: searchText ? undefined : handleTableChange,
              onShowSizeChange: searchText ? undefined : handleTableChange,
              responsive: true,
              showLessItems: true,
            }}
            locale={{ emptyText: "Chưa có đặt xe nào" }}
            size="small"
          />
        </div>
      </Card>

      {/* Detail Modal */}
      <Modal
        title="Chi tiết đặt xe"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalVisible(false)}>
            Đóng
          </Button>,
        ]}
        width="90%"
        style={{ maxWidth: 1000 }}
        centered
      >
        {selectedBooking && (
          <div className="space-y-4">
            {/* Thông tin cơ bản */}
            <Descriptions title="Thông tin đặt xe" column={2} bordered>
              <Descriptions.Item label="Mã đặt xe">
                <span className="font-mono font-semibold">
                  {selectedBooking.bookingCode || selectedBooking.id}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                {(() => {
                  const statusInfo = getStatusInfo(selectedBooking.bookingStatus);
                  return <Tag color={statusInfo.color}>{statusInfo.label}</Tag>;
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày bắt đầu">
                {dayjs(selectedBooking.startDatetime).format("DD/MM/YYYY HH:mm")}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày kết thúc">
                {dayjs(selectedBooking.endDatetime).format("DD/MM/YYYY HH:mm")}
              </Descriptions.Item>
              {selectedBooking.actualReturnDatetime && (
                <Descriptions.Item label="Ngày trả thực tế">
                  {dayjs(selectedBooking.actualReturnDatetime).format("DD/MM/YYYY HH:mm")}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Số ngày thuê">
                {selectedBooking.rentalDays} ngày
              </Descriptions.Item>
            </Descriptions>

            {/* Thông tin khách hàng */}
            {selectedBooking.renter && (
              <Descriptions title="Thông tin khách hàng" column={2} bordered>
                <Descriptions.Item label="Họ tên">
                  {selectedBooking.renter.account?.fullname || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  {selectedBooking.renter.email || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Số điện thoại">
                  {selectedBooking.renter.phone || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Địa chỉ">
                  {selectedBooking.renter.address || "N/A"}
                </Descriptions.Item>
                {selectedBooking.renter.dateOfBirth && (
                  <Descriptions.Item label="Ngày sinh">
                    {dayjs(selectedBooking.renter.dateOfBirth).format("DD/MM/YYYY")}
                  </Descriptions.Item>
                )}
              </Descriptions>
            )}

            {/* Thông tin xe */}
            {selectedBooking.vehicleModel && (
              <Descriptions title="Thông tin Model xe" column={2} bordered>
                <Descriptions.Item label="Tên Model">
                  {selectedBooking.vehicleModel.modelName}
                </Descriptions.Item>
                <Descriptions.Item label="Phân loại">
                  {selectedBooking.vehicleModel.category || "N/A"}
                </Descriptions.Item>
                {selectedBooking.vehicleModel.batteryCapacityKwh && (
                  <Descriptions.Item label="Dung lượng pin">
                    {selectedBooking.vehicleModel.batteryCapacityKwh} kWh
                  </Descriptions.Item>
                )}
                {selectedBooking.vehicleModel.maxRangeKm && (
                  <Descriptions.Item label="Quãng đường tối đa">
                    {selectedBooking.vehicleModel.maxRangeKm} km
                  </Descriptions.Item>
                )}
                {selectedBooking.vehicleModel.maxSpeedKmh && (
                  <Descriptions.Item label="Tốc độ tối đa">
                    {selectedBooking.vehicleModel.maxSpeedKmh} km/h
                  </Descriptions.Item>
                )}
                {selectedBooking.vehicleModel.description && (
                  <Descriptions.Item label="Mô tả" span={2}>
                    {selectedBooking.vehicleModel.description}
                  </Descriptions.Item>
                )}
              </Descriptions>
            )}

            {/* Xe được phân công */}
            {selectedBooking.vehicle ? (
              <Descriptions title="Xe được phân công" column={2} bordered>
                <Descriptions.Item label="Biển số">
                  <span className="font-semibold text-green-600">
                    {selectedBooking.vehicle.licensePlate}
                  </span>
                </Descriptions.Item>
                {selectedBooking.vehicle.color && (
                  <Descriptions.Item label="Màu sắc">
                    {selectedBooking.vehicle.color}
                  </Descriptions.Item>
                )}
              </Descriptions>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 font-medium">
                  ⚠️ Chưa được phân công xe
                </p>
              </div>
            )}

            {/* Chi nhánh */}
            {(selectedBooking.handoverBranch ||
              selectedBooking.returnBranch ||
              (selectedBooking as any).branch ||
              (selectedBooking as any).pickupBranch ||
              (selectedBooking as any).dropoffBranch ||
              (selectedBooking as any).handoverBranchName ||
              (selectedBooking as any).returnBranchName ||
              (selectedBooking as any).branchName ||
              (selectedBooking as any).pickupBranchName ||
              (selectedBooking as any).dropoffBranchName) && (
              <Descriptions title="Chi nhánh giao xe" column={2} bordered>
                <Descriptions.Item label="Tên chi nhánh">
                  {(selectedBooking.handoverBranch ||
                    selectedBooking.returnBranch ||
                    (selectedBooking as any).branch ||
                    (selectedBooking as any).pickupBranch ||
                    (selectedBooking as any).dropoffBranch)?.branchName ||
                    (selectedBooking as any).branch?.name ||
                    (selectedBooking as any).handoverBranchName ||
                    (selectedBooking as any).returnBranchName ||
                    (selectedBooking as any).branchName ||
                    (selectedBooking as any).pickupBranchName ||
                    (selectedBooking as any).dropoffBranchName ||
                    "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Thành phố">
                  {(selectedBooking.handoverBranch ||
                    selectedBooking.returnBranch ||
                    (selectedBooking as any).branch ||
                    (selectedBooking as any).pickupBranch ||
                    (selectedBooking as any).dropoffBranch)?.city ||
                    (selectedBooking as any).branchCity ||
                    "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Địa chỉ" span={2}>
                  {(selectedBooking.handoverBranch ||
                    selectedBooking.returnBranch ||
                    (selectedBooking as any).branch ||
                    (selectedBooking as any).pickupBranch ||
                    (selectedBooking as any).dropoffBranch)?.address ||
                    "N/A"}
                </Descriptions.Item>
                {(selectedBooking.handoverBranch ||
                  selectedBooking.returnBranch ||
                  (selectedBooking as any).branch ||
                  (selectedBooking as any).pickupBranch ||
                  (selectedBooking as any).dropoffBranch)?.phone && (
                  <Descriptions.Item label="Số điện thoại">
                    {(selectedBooking.handoverBranch ||
                      selectedBooking.returnBranch ||
                      (selectedBooking as any).branch ||
                      (selectedBooking as any).pickupBranch ||
                      (selectedBooking as any).dropoffBranch)?.phone}
                  </Descriptions.Item>
                )}
                {(selectedBooking.handoverBranch ||
                  selectedBooking.returnBranch ||
                  (selectedBooking as any).branch ||
                  (selectedBooking as any).pickupBranch ||
                  (selectedBooking as any).dropoffBranch)?.email && (
                  <Descriptions.Item label="Email">
                    {(selectedBooking.handoverBranch ||
                      selectedBooking.returnBranch ||
                      (selectedBooking as any).branch ||
                      (selectedBooking as any).pickupBranch ||
                      (selectedBooking as any).dropoffBranch)?.email}
                  </Descriptions.Item>
                )}
              </Descriptions>
            )}

            {/* Chi nhánh trả xe */}
            {selectedBooking.returnBranch && (
              <Descriptions title="Chi nhánh trả xe" column={2} bordered>
                <Descriptions.Item label="Tên chi nhánh">
                  {selectedBooking.returnBranch.branchName}
                </Descriptions.Item>
                <Descriptions.Item label="Thành phố">
                  {selectedBooking.returnBranch.city || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Địa chỉ" span={2}>
                  {selectedBooking.returnBranch.address || "N/A"}
                </Descriptions.Item>
              </Descriptions>
            )}

            {/* Bảo hiểm */}
            {selectedBooking.insurancePackage && (
              <Descriptions title="Gói bảo hiểm" column={2} bordered>
                <Descriptions.Item label="Tên gói">
                  {selectedBooking.insurancePackage.packageName}
                </Descriptions.Item>
                <Descriptions.Item label="Phí bảo hiểm">
                  {selectedBooking.insurancePackage.packageFee.toLocaleString("vi-VN")} VNĐ
                </Descriptions.Item>
                {selectedBooking.insurancePackage.description && (
                  <Descriptions.Item label="Mô tả" span={2}>
                    {selectedBooking.insurancePackage.description}
                  </Descriptions.Item>
                )}
              </Descriptions>
            )}

            {/* Thông tin thanh toán */}
            <Descriptions title="Thông tin thanh toán" column={2} bordered>
              <Descriptions.Item label="Phí thuê cơ bản">
                {selectedBooking.baseRentalFee.toLocaleString("vi-VN")} VNĐ
              </Descriptions.Item>
              <Descriptions.Item label="Tiền cọc">
                {selectedBooking.depositAmount.toLocaleString("vi-VN")} VNĐ
              </Descriptions.Item>
              <Descriptions.Item label="Phí trả muộn">
                {selectedBooking.lateReturnFee.toLocaleString("vi-VN")} VNĐ
              </Descriptions.Item>
              <Descriptions.Item label="Tổng phí thuê">
                <span className="font-semibold text-green-600">
                  {selectedBooking.totalRentalFee.toLocaleString("vi-VN")} VNĐ
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Tổng thanh toán">
                <span className="font-semibold text-blue-600">
                  {selectedBooking.totalAmount.toLocaleString("vi-VN")} VNĐ
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Giá thuê trung bình">
                {selectedBooking.averageRentalPrice.toLocaleString("vi-VN")} VNĐ/ngày
              </Descriptions.Item>
            </Descriptions>

            {/* Hợp đồng thuê */}
            {selectedBooking.rentalContract && (
              <Descriptions title="Hợp đồng thuê" column={2} bordered>
                <Descriptions.Item label="Trạng thái hợp đồng">
                  {selectedBooking.rentalContract.contractStatus ? (
                    <Tag color={selectedBooking.rentalContract.contractStatus === "Signed" ? "green" : "orange"}>
                      {selectedBooking.rentalContract.contractStatus === "Signed" ? "Đã ký" : selectedBooking.rentalContract.contractStatus}
                    </Tag>
                  ) : (
                    "N/A"
                  )}
                </Descriptions.Item>
                {selectedBooking.rentalContract.otpCode && (
                  <Descriptions.Item label="Mã OTP">
                    <span className="font-mono">{selectedBooking.rentalContract.otpCode}</span>
                  </Descriptions.Item>
                )}
                {selectedBooking.rentalContract.expireAt && (
                  <Descriptions.Item label="Hết hạn">
                    {dayjs(selectedBooking.rentalContract.expireAt).format("DD/MM/YYYY HH:mm")}
                  </Descriptions.Item>
                )}
                {selectedBooking.rentalContract.file && (
                  <Descriptions.Item label="File hợp đồng" span={2}>
                    <Button
                      type="link"
                      icon={<FileTextOutlined />}
                      href={selectedBooking.rentalContract.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-0"
                    >
                      <Space>
                        <DownloadOutlined />
                        Xem/Tải hợp đồng
                      </Space>
                    </Button>
                  </Descriptions.Item>
                )}
              </Descriptions>
            )}

            {/* Biên bản giao trả */}
            {selectedBooking.rentalReceipt && selectedBooking.rentalReceipt.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold mb-3">Biên bản giao trả</h4>
                {selectedBooking.rentalReceipt.map((receipt, index) => (
                  <Descriptions
                    key={receipt.id || index}
                    title={`Biên bản ${index + 1}`}
                    column={2}
                    bordered
                    className="mb-4"
                  >
                    {receipt.notes && (
                      <Descriptions.Item label="Ghi chú" span={2}>
                        {receipt.notes}
                      </Descriptions.Item>
                    )}
                    {receipt.renterConfirmedAt && (
                      <Descriptions.Item label="Thời gian xác nhận">
                        {dayjs(receipt.renterConfirmedAt).format("DD/MM/YYYY HH:mm")}
                      </Descriptions.Item>
                    )}
                    {receipt.startOdometerKm !== undefined && (
                      <Descriptions.Item label="Số km bắt đầu">
                        {receipt.startOdometerKm} km
                      </Descriptions.Item>
                    )}
                    {receipt.endOdometerKm !== undefined && (
                      <Descriptions.Item label="Số km kết thúc">
                        {receipt.endOdometerKm} km
                      </Descriptions.Item>
                    )}
                    {receipt.startBatteryPercentage !== undefined && (
                      <Descriptions.Item label="Pin bắt đầu">
                        {receipt.startBatteryPercentage}%
                      </Descriptions.Item>
                    )}
                    {receipt.endBatteryPercentage !== undefined && (
                      <Descriptions.Item label="Pin kết thúc">
                        {receipt.endBatteryPercentage}%
                      </Descriptions.Item>
                    )}
                    {receipt.handOverVehicleImageFiles && receipt.handOverVehicleImageFiles.length > 0 && (
                      <Descriptions.Item label="Ảnh giao xe" span={2}>
                        <Space wrap>
                          {receipt.handOverVehicleImageFiles.map((url, imgIndex) => (
                            <Button
                              key={imgIndex}
                              type="link"
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              icon={<EyeOutlined />}
                            >
                              Ảnh {imgIndex + 1}
                            </Button>
                          ))}
                        </Space>
                      </Descriptions.Item>
                    )}
                    {receipt.returnVehicleImageFiles && receipt.returnVehicleImageFiles.length > 0 && (
                      <Descriptions.Item label="Ảnh trả xe" span={2}>
                        <Space wrap>
                          {receipt.returnVehicleImageFiles.map((url, imgIndex) => (
                            <Button
                              key={imgIndex}
                              type="link"
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              icon={<EyeOutlined />}
                            >
                              Ảnh {imgIndex + 1}
                            </Button>
                          ))}
                        </Space>
                      </Descriptions.Item>
                    )}
                    {receipt.checkListHandoverFile && receipt.checkListHandoverFile.length > 0 && (
                      <Descriptions.Item label="Checklist giao xe" span={2}>
                        <Space wrap>
                          {receipt.checkListHandoverFile.map((url, imgIndex) => (
                            <Button
                              key={imgIndex}
                              type="link"
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              icon={<FileTextOutlined />}
                            >
                              Checklist giao xe
                            </Button>
                          ))}
                        </Space>
                      </Descriptions.Item>
                    )}
                    {receipt.checkListReturnFile && receipt.checkListReturnFile.length > 0 && (
                      <Descriptions.Item label="Checklist trả xe" span={2}>
                        <Space wrap>
                          {receipt.checkListReturnFile.map((url, imgIndex) => (
                            <Button
                              key={imgIndex}
                              type="link"
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              icon={<FileTextOutlined />}
                            >
                              Checklist trả xe
                            </Button>
                          ))}
                        </Space>
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Cancel Confirmation Modal */}
    </div>
  );
}

