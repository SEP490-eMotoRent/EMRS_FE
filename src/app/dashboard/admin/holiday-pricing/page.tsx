"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
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
    Modal.confirm({
      title: "Xóa giá ngày lễ",
      content: `Bạn có chắc muốn xóa giá ngày lễ "${record.holidayName}"?`,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await deleteHolidayPricing(record.id);
          message.success("Đã xóa giá ngày lễ");
          refreshList();
        } catch (error: any) {
          console.error("Error deleting holiday pricing:", error);
          message.error(error?.message || "Không thể xóa giá ngày lễ");
        }
      },
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        holidayName: values.holidayName,
        holidayDate: values.holidayDate.toISOString(),
        priceMultiplier: values.priceMultiplier,
        description: values.description,
        isActive: values.isActive,
      };

      if (editingHoliday) {
        await updateHolidayPricing(editingHoliday.id, payload);
        message.success("Cập nhật giá ngày lễ thành công");
      } else {
        await createHolidayPricing(payload);
        message.success("Tạo giá ngày lễ thành công");
      }

      setIsModalOpen(false);
      form.resetFields();
      refreshList();
    } catch (error: any) {
      if (error?.errorFields) return;
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Quản lý giá ngày lễ
          </h2>
          <p className="text-gray-500">
            Thiết lập hệ số giá thuê cho các ngày lễ/tết đặc biệt.
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => handleOpenModal()}
        >
          Thêm ngày lễ
        </Button>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={holidayPricings}
        loading={loading}
        pagination={{ pageSize: 10 }}
        locale={{ emptyText: "Chưa có giá ngày lễ" }}
      />

      <Modal
        title={editingHoliday ? "Cập nhật giá ngày lễ" : "Thêm giá ngày lễ"}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        onOk={handleSubmit}
        okText={editingHoliday ? "Cập nhật" : "Thêm mới"}
        cancelText="Hủy"
        width={520}
      >
        <Form form={form} layout="vertical">
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
    </div>
  );
}

