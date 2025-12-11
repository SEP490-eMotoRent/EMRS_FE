"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Table, Tag, Button, Modal, Descriptions, Image, Space, message, Card, Tabs, Drawer, Badge } from "antd";
import { EyeOutlined, FileTextOutlined, DownloadOutlined, FileSearchOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { getRentalReceipts, getRentalReceiptById } from "./operation_service";
import { getBookingById, getBookingsByBranch } from "../bookings/booking_service";
import { formatCurrency } from "@/utils/format";

export default function OperationPage() {
  const [tab, setTab] = useState<"all" | "handover" | "return">("all");
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [receiptsDrawerVisible, setReceiptsDrawerVisible] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [contractTemplate, setContractTemplate] = useState<any | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [allBookings, setAllBookings] = useState<any[]>([]); // Lưu tất cả bookings để filter

  const RENTAL_CONTRACT_TEMPLATE_TYPE = "RentalContractTemplate";

  useEffect(() => {
    loadContractTemplate();
  }, []);

  useEffect(() => {
    loadData();
  }, [pagination.current, pagination.pageSize]);

  // Reset về trang 1 khi đổi tab
  useEffect(() => {
    setPagination(prev => ({ ...prev, current: 1 }));
  }, [tab]);

  // Bổ sung bookingCode còn thiếu bằng cách gọi detail (nếu cần)
  const hydrateBookingCodes = async (bookings: any[]) => {
    const needHydrate = bookings.filter(
      (b) => !b?.bookingCode && (b?.id || b?.bookingId || b?.bookingID)
    );

    if (needHydrate.length === 0) return bookings;

    const hydratedPromises = needHydrate.map(async (b) => {
      const key = b?.id || b?.bookingId || b?.bookingID;
      try {
        const detail = await getBookingById(key);
        return {
          ...b,
          bookingCode:
            detail?.bookingCode ||
            detail?.code ||
            detail?.bookingId ||
            detail?.bookingID ||
            key,
        };
      } catch (err) {
        console.warn("Hydrate bookingCode failed", key, err);
        return b;
      }
    });

    const hydrated = await Promise.all(hydratedPromises);

    // Merge lại vào danh sách gốc
    const hydratedMap = new Map(
      hydrated.map((item) => [
        item.id || item.bookingId || item.bookingID,
        item,
      ])
    );

    return bookings.map((b) => {
      const key = b?.id || b?.bookingId || b?.bookingID;
      return hydratedMap.get(key) || b;
    });
  };

  const loadData = async () => {
    try {
      setLoading(true);
      // Load tất cả bookings (với pageSize lớn) để có thể filter chính xác
      // và receipts song song
      const [bookingsResponse, receiptsData] = await Promise.all([
        fetch(
          `/api/booking/branch?PageNum=1&PageSize=1000&orderByDescending=true`,
          { cache: "no-store" }
        ).then((res) => res.json()),
        getRentalReceipts(),
      ]);

      // Xử lý bookings - API trả về { success, message, data: { items, totalItems, ... } }
      let bookingsList = [];
      if (bookingsResponse?.success && bookingsResponse?.data) {
        if (Array.isArray(bookingsResponse.data)) {
          bookingsList = bookingsResponse.data;
        } else if (bookingsResponse.data.items) {
          bookingsList = bookingsResponse.data.items;
        }
      } else if (Array.isArray(bookingsResponse)) {
        bookingsList = bookingsResponse;
      } else if (bookingsResponse?.items) {
        bookingsList = bookingsResponse.items;
      }

      // Lưu tất cả bookings để filter
      // Đảm bảo luôn có mã hiển thị: ưu tiên bookingCode, fallback bookingId/id
      const normalizedBookings = bookingsList.map((b: any) => {
        const fallbackId =
          b?.bookingId ||
          b?.bookingID ||
          b?.id ||
          b?.bookingCode ||
          b?.code;

        return {
          ...b,
          // Đảm bảo luôn có các trường đồng nhất để hiển thị & tra cứu
          id: b?.id || fallbackId,
          bookingId: b?.bookingId || b?.bookingID || fallbackId,
          bookingCode:
            b?.bookingCode || b?.code || b?.bookingId || b?.bookingID || fallbackId,
        };
      });

      const hydratedBookings = await hydrateBookingCodes(normalizedBookings);
      setAllBookings(hydratedBookings);
      setReceipts(receiptsData || []);
    } catch (err: any) {
      console.error(err);
      message.error(err.message || "Không thể tải dữ liệu");
      setAllBookings([]);
      setReceipts([]);
    } finally {
      setLoading(false);
    }
  };

  // Group receipts by bookingId
  const receiptsByBooking = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    receipts.forEach((receipt) => {
      if (receipt.bookingId) {
        if (!grouped[receipt.bookingId]) {
          grouped[receipt.bookingId] = [];
        }
        grouped[receipt.bookingId].push(receipt);
      }
    });
    return grouped;
  }, [receipts]);

  const handleViewBookingReceipts = async (booking: any) => {
    try {
      setDetailLoading(true);
      // Load full booking details
      const bookingKey =
        booking?.id || booking?.bookingId || booking?.bookingID || booking?.bookingCode;
      const bookingDetail = await getBookingById(bookingKey);
      setSelectedBooking(bookingDetail);
      setReceiptsDrawerVisible(true);
    } catch (err: any) {
      console.error(err);
      message.error(err.message || "Không thể tải thông tin booking");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleViewReceiptDetail = async (receiptId: string) => {
    try {
      setDetailLoading(true);
      const detail = await getRentalReceiptById(receiptId);
      setSelectedReceipt(detail);
      
      // Load booking để lấy hợp đồng thuê
      if (detail.bookingId) {
        try {
          const booking = await getBookingById(detail.bookingId);
          setSelectedBooking(booking);
        } catch (err) {
          console.warn("Không thể tải thông tin booking:", err);
          setSelectedBooking(null);
        }
      } else {
        setSelectedBooking(null);
      }
    } catch (err: any) {
      console.error(err);
      message.error(err.message || "Không thể tải chi tiết biên bản");
    } finally {
      setDetailLoading(false);
    }
  };

  const loadContractTemplate = async () => {
    try {
      const res = await fetch(
        `/api/configuration/type/${RENTAL_CONTRACT_TEMPLATE_TYPE}`,
        {
          cache: "no-store",
        }
      );
      if (!res.ok) {
        throw new Error("Không thể tải mẫu hợp đồng");
      }
      const json = await res.json();
      const data = Array.isArray(json?.data)
        ? json.data
        : Array.isArray(json)
        ? json
        : [];
      setContractTemplate(data?.[0] || null);
    } catch (error) {
      console.warn("Không thể tải mẫu hợp đồng:", error);
      setContractTemplate(null);
    }
  };

  // Filter bookings theo tab - filter trên tất cả bookings đã load
  const filteredBookings = useMemo(() => {
    return allBookings.filter((booking) => {
      const bookingReceipts = receiptsByBooking[booking.id] || [];
      
      if (tab === "all") return true;
      if (tab === "handover") {
        // Có ít nhất 1 biên bản đã giao và chưa trả
        return bookingReceipts.some(
          (receipt) =>
            receipt.handOverVehicleImageFiles &&
            receipt.handOverVehicleImageFiles.length > 0 &&
            (!receipt.returnVehicleImageFiles ||
              receipt.returnVehicleImageFiles.length === 0)
        );
      }
      if (tab === "return") {
        // Có ít nhất 1 biên bản đã trả
        return bookingReceipts.some(
          (receipt) =>
            receipt.returnVehicleImageFiles &&
            receipt.returnVehicleImageFiles.length > 0
        );
      }
      return true;
    });
  }, [allBookings, receiptsByBooking, tab]);

  // Phân trang trên filteredBookings
  const paginatedBookings = useMemo(() => {
    const start = (pagination.current - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return filteredBookings.slice(start, end);
  }, [filteredBookings, pagination.current, pagination.pageSize]);

  // Get receipts for selected booking - sử dụng rentalReceipt từ booking detail
  const selectedBookingReceipts = useMemo(() => {
    if (!selectedBooking) return [];
    // Ưu tiên sử dụng rentalReceipt từ booking detail (từ API booking detail)
    // API trả về rentalReceipt array trong booking detail
    if (selectedBooking.rentalReceipt) {
      return Array.isArray(selectedBooking.rentalReceipt) 
        ? selectedBooking.rentalReceipt 
        : [];
    }
    // Fallback: sử dụng receiptsByBooking nếu không có rentalReceipt (trường hợp cũ)
    const key =
      selectedBooking.id ||
      selectedBooking.bookingId ||
      selectedBooking.bookingID ||
      selectedBooking.bookingCode;

    return receiptsByBooking[key] || [];
  }, [selectedBooking, receiptsByBooking]);

  const bookingColumns = [
    {
      title: "Mã Booking",
      dataIndex: "bookingCode",
      key: "bookingCode",
      render: (code: string, record: any) => {
        const value =
          code ||
          record?.bookingId ||
          record?.bookingID ||
          record?.id ||
          record?.code ||
          "-";
        return (
          <span className="font-mono font-semibold text-xs sm:text-sm break-all">
            {value}
          </span>
        );
      },
      fixed: "left" as const,
      width: 120,
    },
    {
      title: "Trạng thái",
      dataIndex: "bookingStatus",
      key: "bookingStatus",
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          Renting: { color: "blue", text: "Đang thuê" },
          Completed: { color: "green", text: "Hoàn thành" },
          Returned: { color: "cyan", text: "Đã trả" },
          Cancelled: { color: "red", text: "Đã hủy" },
          Booked: { color: "orange", text: "Đã đặt" },
        };
        const statusInfo = statusMap[status] || { color: "default", text: status };
        return <Tag color={statusInfo.color} className="text-xs">{statusInfo.text}</Tag>;
      },
      width: 100,
    },
    {
      title: "Ngày bắt đầu",
      dataIndex: "startDatetime",
      key: "startDatetime",
      render: (date: string) =>
        date ? (
          <span className="text-xs sm:text-sm">
            {dayjs(date).format("DD/MM/YYYY")}
            <span className="hidden sm:inline"> {dayjs(date).format("HH:mm")}</span>
          </span>
        ) : "-",
      responsive: ['sm'] as any,
      width: 120,
    },
    {
      title: "Ngày kết thúc",
      dataIndex: "endDatetime",
      key: "endDatetime",
      render: (date: string) =>
        date ? (
          <span className="text-xs sm:text-sm">
            {dayjs(date).format("DD/MM/YYYY")}
            <span className="hidden sm:inline"> {dayjs(date).format("HH:mm")}</span>
          </span>
        ) : "-",
      responsive: ['md'] as any,
      width: 120,
    },
    {
      title: "Tổng phí",
      dataIndex: "totalRentalFee",
      key: "totalRentalFee",
      render: (fee: number) => (
        <span className="text-xs sm:text-sm font-medium">{formatCurrency(fee || 0)}</span>
      ),
      responsive: ['lg'] as any,
      width: 120,
    },
    {
      title: "Số biên bản",
      key: "receiptCount",
      render: (_: any, record: any) => {
        const count = receiptsByBooking[record.id]?.length || 0;
        return (
          <Badge count={count} showZero size="small">
            <Tag color={count > 0 ? "blue" : "default"} className="text-xs">
              <span className="hidden sm:inline">{count} biên bản</span>
              <span className="sm:hidden">{count}</span>
            </Tag>
          </Badge>
        );
      },
      width: 100,
    },
    {
      title: "Hành động",
      key: "action",
      fixed: "right" as const,
      width: 100,
      render: (_: any, record: any) => (
        <Button
          type="link"
          icon={<FileSearchOutlined />}
          onClick={() => handleViewBookingReceipts(record)}
          size="small"
          className="text-xs sm:text-sm p-0"
        >
          <span className="hidden sm:inline">Xem biên bản</span>
          <span className="sm:hidden">Xem</span>
        </Button>
      ),
    },
  ];

  const receiptColumns = [
    {
      title: "Mã biên bản",
      dataIndex: "id",
      key: "id",
      render: (id: string) => (
        <span className="font-mono text-sm">{id.substring(0, 8)}...</span>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      render: (_: any, record: any) => {
        const hasHandover =
          record.handOverVehicleImageFiles &&
          record.handOverVehicleImageFiles.length > 0;
        const hasReturn =
          record.returnVehicleImageFiles &&
          record.returnVehicleImageFiles.length > 0;

        if (hasHandover && hasReturn) {
          return <Tag color="green">Đã giao & trả</Tag>;
        } else if (hasHandover) {
          return <Tag color="orange">Đã giao</Tag>;
        } else {
          return <Tag color="default">Chưa giao</Tag>;
        }
      },
    },
    {
      title: "Số km bắt đầu",
      dataIndex: "startOdometerKm",
      key: "startOdometerKm",
      render: (km: number) => (km ? `${km} km` : "-"),
    },
    {
      title: "Pin bắt đầu",
      dataIndex: "startBatteryPercentage",
      key: "startBatteryPercentage",
      render: (percent: number) => (percent ? `${percent}%` : "-"),
    },
    {
      title: "Số km kết thúc",
      dataIndex: "endOdometerKm",
      key: "endOdometerKm",
      render: (km: number) => (km ? `${km} km` : "-"),
    },
    {
      title: "Pin kết thúc",
      dataIndex: "endBatteryPercentage",
      key: "endBatteryPercentage",
      render: (percent: number) => (percent ? `${percent}%` : "-"),
    },
    {
      title: "Xác nhận khách",
      dataIndex: "renterConfirmedAt",
      key: "renterConfirmedAt",
      render: (date: string) =>
        date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "-",
    },
    {
      title: "Hành động",
      key: "action",
      render: (_: any, record: any) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewReceiptDetail(record.id)}
        >
          Xem chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header */}
      <h1 className="text-lg sm:text-xl font-semibold text-gray-800">Vận hành (Giao/Trả)</h1>

      {/* Filter Tabs */}
      <Card className="shadow-sm border-0">
        <Tabs
          activeKey={tab}
          onChange={(key) => setTab(key as "all" | "handover" | "return")}
          items={[
            {
              key: "all",
              label: "Tất cả",
            },
            {
              key: "handover",
              label: "Giao xe",
            },
            {
              key: "return",
              label: "Trả xe",
            },
          ]}
          size="small"
        />
      </Card>

      {/* Bookings Table */}
      <Card className="shadow-sm border-0">
        <div className="overflow-x-auto">
          <Table
            rowKey={(record) =>
              record?.id ||
              record?.bookingId ||
              record?.bookingID ||
              record?.bookingCode ||
              record?.code
            }
            loading={loading}
            columns={bookingColumns}
            dataSource={paginatedBookings}
            locale={{ emptyText: "Không có booking nào" }}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: filteredBookings.length, // Sử dụng số lượng đã filter
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} booking`,
              onChange: (page, pageSize) => {
                setPagination(prev => ({
                  ...prev,
                  current: page,
                  pageSize: pageSize || prev.pageSize,
                }));
              },
              responsive: true,
              showLessItems: true,
            }}
            size="small"
            scroll={{ x: 'max-content' }}
          />
        </div>
      </Card>

      {/* Drawer hiển thị biên bản của booking */}
      <Drawer
        title={
          <div>
            <div className="text-base sm:text-lg font-semibold truncate">
              Biên bản giao/trả xe -{" "}
              {selectedBooking?.bookingCode ||
                selectedBooking?.bookingId ||
                selectedBooking?.bookingID ||
                selectedBooking?.id ||
                "-"}
            </div>
            <div className="text-xs sm:text-sm text-gray-500 mt-1">
              {selectedBookingReceipts.length} biên bản
            </div>
          </div>
        }
        open={receiptsDrawerVisible}
        onClose={() => {
          setReceiptsDrawerVisible(false);
          setSelectedBooking(null);
        }}
        width="100%"
        style={{ maxWidth: 1200 }}
        loading={detailLoading}
        placement="right"
      >
        {selectedBooking && (
          <div className="space-y-4">
            {/* Thông tin booking */}
            <Card size="small" title="Thông tin Booking">
              <Descriptions column={2} size="small">
                <Descriptions.Item label="Mã Booking">
                  {selectedBooking.bookingCode ||
                    selectedBooking.bookingId ||
                    selectedBooking.bookingID ||
                    selectedBooking.id ||
                    "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  <Tag
                    color={
                      selectedBooking.bookingStatus === "Renting"
                        ? "blue"
                        : selectedBooking.bookingStatus === "Completed"
                        ? "green"
                        : selectedBooking.bookingStatus === "Cancelled"
                        ? "red"
                        : "default"
                    }
                  >
                    {selectedBooking.bookingStatus}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Ngày bắt đầu">
                  {selectedBooking.startDatetime
                    ? dayjs(selectedBooking.startDatetime).format(
                        "DD/MM/YYYY HH:mm"
                      )
                    : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày kết thúc">
                  {selectedBooking.endDatetime
                    ? dayjs(selectedBooking.endDatetime).format(
                        "DD/MM/YYYY HH:mm"
                      )
                    : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Tổng phí">
                  {formatCurrency(selectedBooking.totalRentalFee || 0)}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Danh sách biên bản */}
            <Card size="small" title="Danh sách biên bản">
              {selectedBookingReceipts.length > 0 ? (
                <Table
                  rowKey="id"
                  columns={receiptColumns}
                  dataSource={selectedBookingReceipts}
                  pagination={false}
                  size="small"
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Chưa có biên bản nào cho booking này
                </div>
              )}
            </Card>
          </div>
        )}
      </Drawer>

      {/* Modal chi tiết */}
      <Modal
        title="Chi tiết biên bản giao/trả xe"
        open={!!selectedReceipt}
        onCancel={() => {
          setSelectedReceipt(null);
          // Không set selectedBooking về null để giữ drawer mở
        }}
        footer={[
          <Button key="close" onClick={() => {
            setSelectedReceipt(null);
            // Không set selectedBooking về null để giữ drawer mở
          }}>
            Đóng
          </Button>,
        ]}
        width="90%"
        style={{ maxWidth: 1000 }}
        centered
        loading={detailLoading}
      >
        {selectedReceipt && (
          <div className="space-y-6">
            {/* Hợp đồng thuê */}
            {(selectedBooking?.rentalContract || contractTemplate) && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Hợp đồng thuê</h3>
                <Descriptions bordered column={2}>
                  {selectedBooking?.rentalContract ? (
                    <>
                      <Descriptions.Item label="Trạng thái">
                        {selectedBooking.rentalContract.contractStatus ? (
                          <Tag
                            color={
                              selectedBooking.rentalContract.contractStatus ===
                              "Signed"
                                ? "green"
                                : "orange"
                            }
                          >
                            {selectedBooking.rentalContract.contractStatus ===
                            "Signed"
                              ? "Đã ký"
                              : selectedBooking.rentalContract.contractStatus}
                          </Tag>
                        ) : (
                          "N/A"
                        )}
                      </Descriptions.Item>
                      {selectedBooking.rentalContract.otpCode && (
                        <Descriptions.Item label="Mã OTP">
                          <span className="font-mono">
                            {selectedBooking.rentalContract.otpCode}
                          </span>
                        </Descriptions.Item>
                      )}
                      {selectedBooking.rentalContract.expireAt && (
                        <Descriptions.Item label="Hết hạn">
                          {dayjs(
                            selectedBooking.rentalContract.expireAt
                          ).format("DD/MM/YYYY HH:mm")}
                        </Descriptions.Item>
                      )}
                    </>
                  ) : (
                    <Descriptions.Item span={2} label="Trạng thái">
                      <Tag color="blue">Mẫu cấu hình</Tag>
                    </Descriptions.Item>
                  )}
                  {selectedBooking?.rentalContract?.file ||
                  contractTemplate?.value ? (
                    <Descriptions.Item label="File hợp đồng" span={2}>
                      <Button
                        type="link"
                        icon={<FileTextOutlined />}
                        href={
                          selectedBooking?.rentalContract?.file ||
                          contractTemplate?.value
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-0"
                      >
                        <Space>
                          <DownloadOutlined />
                          {selectedBooking?.rentalContract?.file
                            ? "Xem/Tải hợp đồng"
                            : "Xem mẫu hợp đồng"}
                        </Space>
                      </Button>
                      {!selectedBooking?.rentalContract?.file &&
                        contractTemplate?.value && (
                          <p className="text-xs text-gray-500 mt-1">
                            Đang hiển thị file từ cấu hình "{contractTemplate?.title}
                            ".
                          </p>
                        )}
                    </Descriptions.Item>
                  ) : null}
                </Descriptions>
              </div>
            )}

            {/* Thông tin cơ bản */}
            <Descriptions title="Thông tin cơ bản" bordered column={2}>
              <Descriptions.Item label="Mã biên bản">
                {selectedReceipt.id}
              </Descriptions.Item>
              <Descriptions.Item label="Mã Booking">
                {selectedReceipt.bookingId}
              </Descriptions.Item>
              <Descriptions.Item label="Xe">
                {selectedReceipt.vehicleId}
              </Descriptions.Item>
              <Descriptions.Item label="Nhân viên">
                {selectedReceipt.staffId}
              </Descriptions.Item>
              <Descriptions.Item label="Ghi chú">
                {selectedReceipt.notes || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Xác nhận khách">
                {selectedReceipt.renterConfirmedAt
                  ? dayjs(selectedReceipt.renterConfirmedAt).format(
                      "DD/MM/YYYY HH:mm"
                    )
                  : "Chưa xác nhận"}
              </Descriptions.Item>
            </Descriptions>

            {/* Thông tin giao xe */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Thông tin giao xe</h3>
              <Descriptions bordered column={2}>
                <Descriptions.Item label="Số km">
                  {selectedReceipt.startOdometerKm
                    ? `${selectedReceipt.startOdometerKm} km`
                    : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Pin">
                  {selectedReceipt.startBatteryPercentage
                    ? `${selectedReceipt.startBatteryPercentage}%`
                    : "-"}
                </Descriptions.Item>
              </Descriptions>

              {/* Hình ảnh giao xe */}
              {selectedReceipt.handOverVehicleImageFiles &&
                selectedReceipt.handOverVehicleImageFiles.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Hình ảnh giao xe:</h4>
                    <Image.PreviewGroup>
                      <Space wrap>
                        {selectedReceipt.handOverVehicleImageFiles.map(
                          (img: string, idx: number) => (
                            <Image
                              key={idx}
                              src={img}
                              alt={`Giao xe ${idx + 1}`}
                              width={150}
                              height={150}
                              className="object-cover rounded"
                            />
                          )
                        )}
                      </Space>
                    </Image.PreviewGroup>
                  </div>
                )}

              {/* Checklist giao xe */}
              {selectedReceipt.checkListHandoverFile &&
                selectedReceipt.checkListHandoverFile.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Checklist giao xe:</h4>
                    <Image.PreviewGroup>
                      <Space wrap>
                        {selectedReceipt.checkListHandoverFile.map(
                          (img: string, idx: number) => (
                            <Image
                              key={idx}
                              src={img}
                              alt={`Checklist giao xe ${idx + 1}`}
                              width={200}
                              className="object-cover rounded"
                            />
                          )
                        )}
                      </Space>
                    </Image.PreviewGroup>
                  </div>
                )}
            </div>

            {/* Thông tin trả xe */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Thông tin trả xe</h3>
              <Descriptions bordered column={2}>
                <Descriptions.Item label="Số km">
                  {selectedReceipt.endOdometerKm
                    ? `${selectedReceipt.endOdometerKm} km`
                    : "Chưa trả"}
                </Descriptions.Item>
                <Descriptions.Item label="Pin">
                  {selectedReceipt.endBatteryPercentage
                    ? `${selectedReceipt.endBatteryPercentage}%`
                    : "Chưa trả"}
                </Descriptions.Item>
              </Descriptions>

              {/* Hình ảnh trả xe */}
              {selectedReceipt.returnVehicleImageFiles &&
                selectedReceipt.returnVehicleImageFiles.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Hình ảnh trả xe:</h4>
                    <Image.PreviewGroup>
                      <Space wrap>
                        {selectedReceipt.returnVehicleImageFiles.map(
                          (img: string, idx: number) => (
                            <Image
                              key={idx}
                              src={img}
                              alt={`Trả xe ${idx + 1}`}
                              width={150}
                              height={150}
                              className="object-cover rounded"
                            />
                          )
                        )}
                      </Space>
                    </Image.PreviewGroup>
                  </div>
                )}

              {/* Checklist trả xe */}
              {selectedReceipt.checkListReturnFile &&
                selectedReceipt.checkListReturnFile.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Checklist trả xe:</h4>
                    <Image.PreviewGroup>
                      <Space wrap>
                        {selectedReceipt.checkListReturnFile.map(
                          (img: string, idx: number) => (
                            <Image
                              key={idx}
                              src={img}
                              alt={`Checklist trả xe ${idx + 1}`}
                              width={200}
                              className="object-cover rounded"
                            />
                          )
                        )}
                      </Space>
                    </Image.PreviewGroup>
                  </div>
                )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
