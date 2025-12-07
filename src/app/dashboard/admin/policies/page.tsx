"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Table,
  Modal,
  Form,
  InputNumber,
  Space,
  Tag,
  message,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import {
  RentalPricing,
  createRentalPricing,
  deleteRentalPricing,
  getRentalPricings,
  updateRentalPricing,
} from "./rental_pricing_service";

const currencyFormat = (value?: number) =>
  typeof value === "number"
    ? value.toLocaleString("vi-VN", { style: "currency", currency: "VND" })
    : "-";

export default function RentalPricingPage() {
  const [pricings, setPricings] = useState<RentalPricing[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPricing, setEditingPricing] = useState<RentalPricing | null>(
    null
  );
  const [form] = Form.useForm();

  useEffect(() => {
    refreshList();
  }, []);

  const refreshList = async () => {
    setLoading(true);
    try {
      const data = await getRentalPricings();
      setPricings(data);
    } catch (error: any) {
      console.error("Error loading rental pricing:", error);
      message.error(error?.message || "Không thể tải danh sách bảng giá");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClick = () => {
    setEditingPricing(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEditClick = (record: RentalPricing) => {
    setEditingPricing(record);
    form.setFieldsValue({
      rentalPrice: record.rentalPrice,
      excessKmPrice: record.excessKmPrice,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (record: RentalPricing) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: `Bạn có chắc muốn xóa bảng giá có giá thuê ${currencyFormat(
        record.rentalPrice
      )}?`,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await deleteRentalPricing(record.id);
          message.success("Đã xóa bảng giá");
          refreshList();
        } catch (error: any) {
          console.error("Error deleting rental pricing:", error);
          message.error(error?.message || "Không thể xóa bảng giá");
        }
      },
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingPricing) {
        await updateRentalPricing(editingPricing.id, values);
        message.success("Cập nhật bảng giá thành công");
      } else {
        await createRentalPricing(values);
        message.success("Thêm bảng giá thành công");
      }
      setIsModalOpen(false);
      refreshList();
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }
      console.error("Error saving rental pricing:", error);
      message.error(error?.message || "Không thể lưu bảng giá");
    }
  };

  const columns: ColumnsType<RentalPricing> = useMemo(
    () => [
      {
        title: "Giá thuê cơ bản",
        dataIndex: "rentalPrice",
        key: "rentalPrice",
        render: (value) => (
          <Tag color="green" className="text-base">
            {currencyFormat(value)}
          </Tag>
        ),
      },
      {
        title: "Giá vượt km",
        dataIndex: "excessKmPrice",
        key: "excessKmPrice",
        render: (value) => currencyFormat(value),
      },
      {
        title: "Hành động",
        key: "action",
        width: 200,
        render: (_, record) => (
          <Space>
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEditClick(record)}
            >
              Sửa
            </Button>
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            >
              Xóa
            </Button>
          </Space>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Bảng giá & Chính sách</h2>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý giá thuê cơ bản và giá vượt km cho các loại xe.
          </p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateClick}>
          Tạo bảng giá
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={pricings}
        rowKey="id"
        loading={loading}
        pagination={false}
        locale={{
          emptyText: "Chưa có bảng giá nào",
        }}
      />

      <Modal
        title={editingPricing ? "Cập nhật bảng giá" : "Tạo bảng giá mới"}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        onOk={handleSubmit}
        okText={editingPricing ? "Cập nhật" : "Tạo"}
        cancelText="Hủy"
        width={480}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="rentalPrice"
            label="Giá thuê cơ bản (VND/ngày)"
            rules={[
              { required: true, message: "Vui lòng nhập giá thuê" },
              { type: "number", min: 1000, message: "Giá thuê phải lớn hơn 0" },
            ]}
          >
            <InputNumber
              min={1000}
              step={1000}
              className="w-full"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => Number(value?.replace(/,/g, ""))}
            />
          </Form.Item>

          <Form.Item
            name="excessKmPrice"
            label="Giá vượt km (VND/km)"
            rules={[
              { required: true, message: "Vui lòng nhập giá vượt km" },
              { type: "number", min: 0, message: "Giá vượt km phải >= 0" },
            ]}
          >
            <InputNumber
              min={0}
              step={500}
              className="w-full"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => Number(value?.replace(/,/g, ""))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

