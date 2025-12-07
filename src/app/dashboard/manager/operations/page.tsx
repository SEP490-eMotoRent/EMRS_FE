"use client";

import React, { useEffect, useState } from "react";
import { Table, Tag, Button, Modal, Descriptions, Image, Space, message, Card, Tabs } from "antd";
import { EyeOutlined, FileTextOutlined, DownloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { getRentalReceipts, getRentalReceiptById } from "./operation_service";
import { getBookingById } from "../bookings/booking_service";

export default function OperationPage() {
  const [tab, setTab] = useState<"all" | "handover" | "return">("all");
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [contractTemplate, setContractTemplate] = useState<any | null>(null);

  const RENTAL_CONTRACT_TEMPLATE_TYPE = "RentalContractTemplate";

  useEffect(() => {
    loadReceipts();
    loadContractTemplate();
  }, []);

  const loadReceipts = async () => {
    try {
      setLoading(true);
      const data = await getRentalReceipts();
      setReceipts(data || []);
    } catch (err: any) {
      console.error(err);
      message.error(err.message || "Không thể tải danh sách biên bản");
      setReceipts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (id: string) => {
    try {
      setDetailLoading(true);
      const detail = await getRentalReceiptById(id);
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

  // Filter receipts theo tab
  const filteredReceipts = receipts.filter((receipt) => {
    if (tab === "all") return true;
    if (tab === "handover") {
      // Có hình ảnh giao xe và chưa có hình ảnh trả xe
      return (
        receipt.handOverVehicleImageFiles &&
        receipt.handOverVehicleImageFiles.length > 0 &&
        (!receipt.returnVehicleImageFiles ||
          receipt.returnVehicleImageFiles.length === 0)
      );
    }
    if (tab === "return") {
      // Có hình ảnh trả xe
      return (
        receipt.returnVehicleImageFiles &&
        receipt.returnVehicleImageFiles.length > 0
      );
    }
    return true;
  });

  const columns = [
    {
      title: "Mã biên bản",
      dataIndex: "id",
      key: "id",
      render: (id: string) => (
        <span className="font-mono text-sm">{id.substring(0, 8)}...</span>
      ),
    },
    {
      title: "Mã Booking",
      dataIndex: "bookingId",
      key: "bookingId",
      render: (bookingId: string) => (
        <span className="font-mono text-sm">{bookingId?.substring(0, 8)}...</span>
      ),
    },
    {
      title: "Xe",
      dataIndex: "vehicleId",
      key: "vehicleId",
      render: (vehicleId: string) => (
        <span className="font-mono text-sm">{vehicleId?.substring(0, 8)}...</span>
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
          onClick={() => handleViewDetail(record.id)}
        >
          Xem chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <h1 className="text-xl font-semibold text-gray-800">Vận hành (Giao/Trả)</h1>

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
        />
      </Card>

      {/* Table */}
      <Card className="shadow-sm border-0">
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={filteredReceipts}
          locale={{ emptyText: "Không có biên bản nào" }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} biên bản`,
          }}
          size="middle"
        />
      </Card>

      {/* Modal chi tiết */}
      <Modal
        title="Chi tiết biên bản giao/trả xe"
        open={!!selectedReceipt}
        onCancel={() => {
          setSelectedReceipt(null);
          setSelectedBooking(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setSelectedReceipt(null);
            setSelectedBooking(null);
          }}>
            Đóng
          </Button>,
        ]}
        width={1000}
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
