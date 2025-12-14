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
  Select,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from "antd";

const { Option } = Select;
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
  ReloadOutlined,
  SearchOutlined,
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
  const [searchText, setSearchText] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
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

  // Filter và search client-side
  const filteredHolidays = useMemo(() => {
    let filtered = [...holidayPricings];
    
    // Filter theo trạng thái
    if (selectedStatus !== "all") {
      const isActive = selectedStatus === "active";
      filtered = filtered.filter((h) => h.isActive === isActive);
    }
    
    // Search
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(
        (h) =>
          h.holidayName.toLowerCase().includes(searchLower) ||
          h.description?.toLowerCase().includes(searchLower) ||
          dayjs(h.holidayDate).format(dateFormat).includes(searchLower) ||
          h.id.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [holidayPricings, selectedStatus, searchText]);

  const columns: ColumnsType<HolidayPricing> = useMemo(
    () => [
      {
        title: "Tên ngày lễ",
        dataIndex: "holidayName",
        key: "holidayName",
        width: 250,
        sorter: (a, b) => a.holidayName.localeCompare(b.holidayName),
        render: (text, record) => (
          <div>
            <p className="font-semibold text-gray-900 mb-0">{text}</p>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">{record.id.slice(0, 8)}...</p>
          </div>
        ),
      },
      {
        title: "Ngày",
        dataIndex: "holidayDate",
        key: "holidayDate",
        width: 150,
        sorter: (a, b) => new Date(a.holidayDate).getTime() - new Date(b.holidayDate).getTime(),
        defaultSortOrder: 'ascend' as const,
        render: (value) => (
          <Tag icon={<CalendarOutlined />} color="blue" className="text-sm">
            {dayjs(value).format(dateFormat)}
          </Tag>
        ),
      },
      {
        title: "Hệ số giá",
        dataIndex: "priceMultiplier",
        key: "priceMultiplier",
        width: 130,
        sorter: (a, b) => a.priceMultiplier - b.priceMultiplier,
        render: (value, record) => (
          <Tag color={record.isActive ? "green" : "default"} className="text-sm font-semibold">
            x{value.toFixed(2)}
          </Tag>
        ),
      },
      {
        title: "Mô tả",
        dataIndex: "description",
        key: "description",
        ellipsis: { showTitle: true },
        render: (value) => (
          <span className="text-gray-600">{value || "-"}</span>
        ),
      },
      {
        title: "Trạng thái",
        dataIndex: "isActive",
        key: "isActive",
        width: 140,
        render: (value: boolean) =>
          value ? (
            <Tag color="green" className="text-sm">Đang áp dụng</Tag>
          ) : (
            <Tag color="default" className="text-sm">Không dùng</Tag>
          ),
      },
      {
        title: "Hành động",
        key: "actions",
        width: 150,
        fixed: 'right' as const,
        render: (_, record) => (
          <Space size="small">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleOpenModal(record)}
              size="small"
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
              size="small"
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
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">
          Quản lý giá ngày lễ
        </h1>
        <div className="flex gap-2">
          <Button
            type="default"
            icon={<ReloadOutlined />}
            onClick={() => refreshList()}
            size="large"
            className="w-full sm:w-auto"
          >
            <span className="hidden sm:inline">Làm mới</span>
            <span className="sm:hidden">Tải lại</span>
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
            size="large"
            className="w-full sm:w-auto"
          >
            <span className="hidden sm:inline">Thêm ngày lễ</span>
            <span className="sm:hidden">Thêm mới</span>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Input
            placeholder="Tìm kiếm theo tên, mô tả, ngày..."
            prefix={<SearchOutlined />}
            allowClear
            className="w-full sm:flex-1"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Select
            placeholder="Trạng thái"
            className="w-full sm:w-48"
            value={selectedStatus}
            onChange={setSelectedStatus}
          >
            <Option value="all">Tất cả</Option>
            <Option value="active">Đang áp dụng</Option>
            <Option value="inactive">Không dùng</Option>
          </Select>
        </div>
      </Card>

      {/* Table */}
      <Card className="shadow-sm">
        <div className="overflow-x-auto">
          <Table
            rowKey="id"
            columns={columns}
            dataSource={filteredHolidays}
            loading={loading}
            scroll={{ x: 'max-content' }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) => {
                if (searchText || selectedStatus !== "all") {
                  return `Hiển thị ${range[0]}-${range[1]} của ${total} kết quả`;
                }
                return `Tổng ${total} ngày lễ`;
              },
              pageSizeOptions: ["10", "20", "50", "100"],
              responsive: true,
              showLessItems: true,
            }}
            locale={{ emptyText: "Chưa có giá ngày lễ" }}
            size="small"
          />
        </div>
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

