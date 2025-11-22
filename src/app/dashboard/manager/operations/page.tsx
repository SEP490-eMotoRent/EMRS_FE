"use client";

import React, { useEffect, useState } from "react";
import { Table, Tag, Button, Modal, Descriptions, Image, Space, message } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { getRentalReceipts, getRentalReceiptById } from "./operation_service";

export default function OperationPage() {
  const [tab, setTab] = useState<"all" | "handover" | "return">("all");
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    loadReceipts();
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
    } catch (err: any) {
      console.error(err);
      message.error(err.message || "Không thể tải chi tiết biên bản");
    } finally {
      setDetailLoading(false);
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
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-4">
          Vận hành (Giao/Trả)
        </h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <Button
            type={tab === "all" ? "primary" : "default"}
            onClick={() => setTab("all")}
          >
            Tất cả
          </Button>
          <Button
            type={tab === "handover" ? "primary" : "default"}
            onClick={() => setTab("handover")}
          >
            Đã giao xe
          </Button>
          <Button
            type={tab === "return" ? "primary" : "default"}
            onClick={() => setTab("return")}
          >
            Đã trả xe
          </Button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-4">
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
        />
      </div>

      {/* Modal chi tiết */}
      <Modal
        title="Chi tiết biên bản giao/trả xe"
        open={!!selectedReceipt}
        onCancel={() => setSelectedReceipt(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedReceipt(null)}>
            Đóng
          </Button>,
        ]}
        width={1000}
        loading={detailLoading}
      >
        {selectedReceipt && (
          <div className="space-y-6">
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
