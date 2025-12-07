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
  CloseCircleOutlined,
  SearchOutlined,
  FileTextOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getBookings,
  getBookingById,
  cancelBooking,
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
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

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
      setBookings(response.items);
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
    setBookingToCancel(booking);
    setIsCancelModalVisible(true);
  };

  const confirmCancel = async () => {
    if (!bookingToCancel) return;
    
    setIsCancelling(true);
    try {
      await cancelBooking(bookingToCancel.id);
      message.success("Hủy đặt xe thành công");
      setIsCancelModalVisible(false);
      setBookingToCancel(null);
      loadBookings();
    } catch (error: any) {
      console.error("Error cancelling booking:", error);
      message.error(error.message || "Không thể hủy đặt xe");
    } finally {
      setIsCancelling(false);
    }
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
            <Tag size="small" color="blue">
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
      render: (_, record) => (
        <div>
          {record.handoverBranch ? (
            <>
              <div className="font-medium">
                {record.handoverBranch.branchName}
              </div>
              {record.handoverBranch.city && (
                <div className="text-xs text-gray-500">
                  {record.handoverBranch.city}
                </div>
              )}
            </>
          ) : (
            <span className="text-gray-400">N/A</span>
          )}
        </div>
      ),
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
        const canCancel = 
          record.bookingStatus !== "Cancelled" && 
          record.bookingStatus !== "CANCELLED" &&
          record.bookingStatus !== "Completed" &&
          record.bookingStatus !== "COMPLETED";
        
        return (
          <Space>
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            >
              Chi tiết
            </Button>
            {canCancel && (
              <Button
                type="link"
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => handleCancel(record)}
              >
                Hủy
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-800">
          Quản lý đặt xe
        </h1>
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={() => loadBookings()}
          size="large"
        >
          Làm mới
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="shadow-sm">
        <div className="flex gap-4 flex-wrap">
          <Input
            placeholder="Tìm kiếm theo mã, khách hàng, xe, chi nhánh..."
            prefix={<SearchOutlined />}
            allowClear
            style={{ maxWidth: 400, flex: 1, minWidth: 250 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={() => loadBookings()}
          />
          <Select
            placeholder="Trạng thái"
            style={{ width: 200 }}
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
        <Table
          rowKey="id"
          loading={loading}
          dataSource={filteredBookings}
          columns={columns}
          scroll={{ x: 1500 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: searchText ? filteredBookings.length : pagination.total,
            showSizeChanger: true,
            showTotal: (total, range) => {
              if (searchText) {
                return `Hiển thị ${range[0]}-${range[1]} của ${total} kết quả tìm kiếm`;
              }
              return `Tổng ${total} đặt xe`;
            },
            pageSizeOptions: ["10", "20", "50", "100"],
            onChange: searchText ? undefined : handleTableChange,
            onShowSizeChange: searchText ? undefined : handleTableChange,
          }}
          locale={{ emptyText: "Chưa có đặt xe nào" }}
        />
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
        width={900}
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
            {selectedBooking.handoverBranch && (
              <Descriptions title="Chi nhánh giao xe" column={2} bordered>
                <Descriptions.Item label="Tên chi nhánh">
                  {selectedBooking.handoverBranch.branchName}
                </Descriptions.Item>
                <Descriptions.Item label="Thành phố">
                  {selectedBooking.handoverBranch.city || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Địa chỉ" span={2}>
                  {selectedBooking.handoverBranch.address || "N/A"}
                </Descriptions.Item>
                {selectedBooking.handoverBranch.phone && (
                  <Descriptions.Item label="Số điện thoại">
                    {selectedBooking.handoverBranch.phone}
                  </Descriptions.Item>
                )}
                {selectedBooking.handoverBranch.email && (
                  <Descriptions.Item label="Email">
                    {selectedBooking.handoverBranch.email}
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
      <Modal
        title="Xác nhận hủy đặt xe"
        open={isCancelModalVisible}
        onOk={confirmCancel}
        onCancel={() => {
          setIsCancelModalVisible(false);
          setBookingToCancel(null);
        }}
        okText="Hủy đặt xe"
        okButtonProps={{ danger: true, loading: isCancelling }}
        cancelText="Đóng"
      >
        {bookingToCancel && (
          <>
            <p>
              Bạn có chắc muốn hủy đặt xe{" "}
              <strong>{bookingToCancel.bookingCode || bookingToCancel.id.slice(0, 8)}</strong>?
            </p>
            <div className="mt-3 space-y-1 text-sm text-gray-600">
              <p>
                <strong>Khách hàng:</strong>{" "}
                {bookingToCancel.renter?.account?.fullname || bookingToCancel.renter?.email || "N/A"}
              </p>
              <p>
                <strong>Model xe:</strong>{" "}
                {bookingToCancel.vehicleModel?.modelName || "N/A"}
              </p>
              <p>
                <strong>Thời gian:</strong>{" "}
                {dayjs(bookingToCancel.startDatetime).format("DD/MM/YYYY HH:mm")} -{" "}
                {dayjs(bookingToCancel.endDatetime).format("DD/MM/YYYY HH:mm")}
              </p>
            </div>
            <p className="text-red-500 text-sm mt-3 font-medium">
              ⚠️ Hành động này không thể hoàn tác!
            </p>
          </>
        )}
      </Modal>

    </div>
  );
}

