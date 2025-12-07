"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import {
  HolidayPricing,
  createHolidayPricing,
  deleteHolidayPricing,
  getHolidayPricings,
  updateHolidayPricing,
} from "./holiday_pricing_service";
import {
  CalendarOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";

const dateFormat = "DD/MM/YYYY";

export default function HolidayPricingPage() {
  const [holidayPricings, setHolidayPricings] = useState<HolidayPricing[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<HolidayPricing | null>(
    null
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingHoliday, setDeletingHoliday] = useState<HolidayPricing | null>(
    null
  );
  const [form] = Form.useForm();

  useEffect(() => {
    refreshList();
  }, []);

  const refreshList = async () => {
    setLoading(true);
    try {
      const data = await getHolidayPricings();
      const sorted = [...data].sort(
        (a, b) =>
          new Date(a.holidayDate).getTime() -
          new Date(b.holidayDate).getTime()
      );
      setHolidayPricings(sorted);
    } catch (error: any) {
      console.error("Error loading holiday pricing:", error);
      message.error(error?.message || "Không thể tải danh sách giá ngày lễ");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (record?: HolidayPricing) => {
    if (record) {
      setEditingHoliday(record);
      form.setFieldsValue({
        holidayName: record.holidayName,
        holidayDate: dayjs(record.holidayDate),
        priceMultiplier: record.priceMultiplier,
        description: record.description,
        isActive: record.isActive,
      });
    } else {
      setEditingHoliday(null);
      form.resetFields();
      form.setFieldsValue({
        isActive: true,
        priceMultiplier: 1,
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = (record: HolidayPricing) => {
    setDeletingHoliday(record);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingHoliday) return;
    
    try {
      setLoading(true);
      await deleteHolidayPricing(deletingHoliday.id);
      message.success("Đã xóa giá ngày lễ thành công");
      setIsDeleteModalOpen(false);
      setDeletingHoliday(null);
      await refreshList();
    } catch (error: any) {
      console.error("Error deleting holiday pricing:", error);
      message.error(error?.message || "Không thể xóa giá ngày lễ");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      // DatePicker trả về dayjs object, API cần format YYYY-MM-DD
      const holidayDate = values.holidayDate
        ? dayjs(values.holidayDate).format("YYYY-MM-DD")
        : null;

      if (!holidayDate) {
        message.error("Ngày lễ không hợp lệ");
        return;
      }

      const payload = {
        holidayName: values.holidayName,
        holidayDate: holidayDate,
        priceMultiplier: values.priceMultiplier,
        description: values.description || "",
        isActive: values.isActive ?? true,
      };

      if (editingHoliday) {
        // Cập nhật
        await updateHolidayPricing(editingHoliday.id, payload);
        message.success("Đã cập nhật giá ngày lễ");
      } else {
        // Tạo mới
        await createHolidayPricing(payload);
        message.success("Đã thêm giá ngày lễ");
      }

      setIsModalOpen(false);
      form.resetFields();
      refreshList();
    } catch (error: any) {
      console.error("Error saving holiday pricing:", error);
      message.error(error?.message || "Không thể lưu giá ngày lễ");
    }
  };

  const columns: ColumnsType<HolidayPricing> = useMemo(
    () => [
      {
        title: "Tên ngày lễ",
        dataIndex: "holidayName",
        key: "holidayName",
        render: (text, record) => (
          <div>
            <p className="font-semibold text-gray-900">{text}</p>
            <p className="text-xs text-gray-500">{record.id}</p>
          </div>
        ),
      },
      {
        title: "Ngày",
        dataIndex: "holidayDate",
        key: "holidayDate",
        width: 160,
        render: (value) => (
          <Tag icon={<CalendarOutlined />} color="blue">
            {dayjs(value).format(dateFormat)}
          </Tag>
        ),
      },
      {
        title: "Hệ số giá",
        dataIndex: "priceMultiplier",
        key: "priceMultiplier",
        width: 120,
        render: (value, record) => (
          <Tag color={record.isActive ? "green" : "default"}>
            x{value.toFixed(2)}
          </Tag>
        ),
      },
      {
        title: "Mô tả",
        dataIndex: "description",
        key: "description",
        ellipsis: true,
        render: (value) => value || "-",
      },
      {
        title: "Trạng thái",
        dataIndex: "isActive",
        key: "isActive",
        width: 120,
        render: (value: boolean) =>
          value ? <Tag color="green">Đang áp dụng</Tag> : <Tag>Không dùng</Tag>,
      },
      {
        title: "Hành động",
        key: "actions",
        width: 180,
        render: (_, record) => (
          <Space>
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleOpenModal(record)}
            >
              Sửa
            </Button>
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDelete(record);
              }}
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-800">
          Quản lý giá ngày lễ
        </h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => handleOpenModal()}
          size="large"
        >
          Thêm ngày lễ
        </Button>
      </div>

      {/* Table */}
      <Card className="shadow-sm">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={holidayPricings}
          loading={loading}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: "Chưa có giá ngày lễ" }}
        />
      </Card>

      <Modal
        title={editingHoliday ? "Cập nhật giá ngày lễ" : "Thêm giá ngày lễ"}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText={editingHoliday ? "Cập nhật" : "Thêm mới"}
        cancelText="Hủy"
        width={520}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="holidayName"
            label="Tên ngày lễ"
            rules={[{ required: true, message: "Vui lòng nhập tên ngày lễ" }]}
          >
            <Input placeholder="Ví dụ: Tết Nguyên Đán - Ngày 1" />
          </Form.Item>

          <Form.Item
            name="holidayDate"
            label="Ngày áp dụng"
            rules={[{ required: true, message: "Vui lòng chọn ngày" }]}
          >
            <DatePicker className="w-full" format={dateFormat} />
          </Form.Item>

          <Form.Item
            name="priceMultiplier"
            label="Hệ số giá"
            rules={[{ required: true, message: "Vui lòng nhập hệ số giá" }]}
          >
            <InputNumber
              min={1}
              step={0.1}
              className="w-full"
              placeholder="Nhập hệ số giá, ví dụ 1.5"
            />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} maxLength={200} showCount />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Trạng thái"
            valuePropName="checked"
          >
            <Switch checkedChildren="Đang áp dụng" unCheckedChildren="Không" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Xác nhận xóa giá ngày lễ"
        open={isDeleteModalOpen}
        onOk={confirmDelete}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setDeletingHoliday(null);
        }}
        okText="Xóa"
        okType="danger"
        cancelText="Hủy"
        width={480}
        centered
        confirmLoading={loading}
      >
        {deletingHoliday && (
          <div className="space-y-4">
            <p className="text-base">
              Bạn có chắc chắn muốn xóa giá ngày lễ này không?
            </p>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="font-semibold text-gray-900 mb-2">
                Tên ngày lễ: <span className="text-blue-600">{deletingHoliday.holidayName}</span>
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Ngày: <span className="font-medium">{dayjs(deletingHoliday.holidayDate).format(dateFormat)}</span>
              </p>
              <p className="text-sm text-gray-600">
                Hệ số giá: <span className="font-medium text-orange-600">x{deletingHoliday.priceMultiplier.toFixed(2)}</span>
              </p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 font-semibold flex items-center gap-2">
                <span>⚠️</span>
                <span>Hành động này không thể hoàn tác!</span>
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

