"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Table,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Tag,
  Space,
  message,
} from "antd";
import { ColumnsType } from "antd/es/table";
import {
  configurationTypeOptions,
  ConfigurationItem,
  ConfigurationType,
  createConfiguration,
  deleteConfiguration,
  getConfigurations,
  updateConfiguration,
} from "./configuration_service";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";

const { TextArea } = Input;

const typeLabel = (type: ConfigurationType) =>
  configurationTypeOptions.find((opt) => opt.value === type)?.label ||
  `Loại ${type}`;

export default function AdminConfigurationPage() {
  const [configs, setConfigs] = useState<ConfigurationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ConfigurationItem | null>(
    null
  );
  const [form] = Form.useForm();

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const data = await getConfigurations();
      const sorted = data
        .filter((item) => item.type !== ConfigurationType.FacePlusPlus)
        .sort((a, b) => a.type - b.type);
      setConfigs(sorted);
    } catch (error: any) {
      console.error("Error loading configurations:", error);
      message.error(error?.message || "Không thể tải danh sách cấu hình");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingConfig(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const openEditModal = (record: ConfigurationItem) => {
    setEditingConfig(record);
    form.setFieldsValue({
      title: record.title,
      description: record.description,
      type: record.type,
      value: record.value,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (record: ConfigurationItem) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: `Bạn chắc chắn muốn xóa cấu hình "${record.title}"?`,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await deleteConfiguration(record.id);
          message.success("Đã xóa cấu hình");
          loadConfigs();
        } catch (error: any) {
          console.error("Error deleting configuration:", error);
          message.error(error?.message || "Không thể xóa cấu hình");
        }
      },
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        title: values.title,
        description: values.description,
        type: values.type,
        value: values.value.toString(),
      };

      if (editingConfig) {
        await updateConfiguration(editingConfig.id, payload);
        message.success("Cập nhật cấu hình thành công");
      } else {
        await createConfiguration(payload);
        message.success("Tạo cấu hình thành công");
      }

      setIsModalOpen(false);
      form.resetFields();
      loadConfigs();
    } catch (error: any) {
      if (error?.errorFields) return;
      console.error("Error saving configuration:", error);
      message.error(error?.message || "Không thể lưu cấu hình");
    }
  };

  const columns: ColumnsType<ConfigurationItem> = useMemo(
    () => [
      {
        title: "Tiêu đề",
        dataIndex: "title",
        key: "title",
        width: 260,
        render: (text, record) => (
          <div>
            <p className="font-medium text-gray-800">{text}</p>
            <p className="text-xs text-gray-500 mt-1">{record.id}</p>
          </div>
        ),
      },
      {
        title: "Mô tả",
        dataIndex: "description",
        key: "description",
        width: 280,
        render: (value) => (
          <span className="text-gray-600">{value || "-"}</span>
        ),
      },
      {
        title: "Loại",
        dataIndex: "type",
        key: "type",
        width: 200,
        render: (type) => <Tag color="blue">{typeLabel(type)}</Tag>,
      },
      {
        title: "Giá trị",
        dataIndex: "value",
        key: "value",
        width: 180,
        render: (value, record) =>
          record.type === ConfigurationType.RentalContractTemplate ? (
            <a href={value} target="_blank" className="text-blue-600">
              Tải xuống
            </a>
          ) : (
            <span>{value}</span>
          ),
      },
      {
        title: "Cập nhật",
        dataIndex: "updatedAt",
        key: "updatedAt",
        width: 200,
        render: (_, record) =>
          record.updatedAt
            ? new Date(record.updatedAt).toLocaleString("vi-VN")
            : new Date(record.createdAt || "").toLocaleString("vi-VN"),
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
              onClick={() => openEditModal(record)}
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
      <div className="flex justify-between items-center bg-white rounded-xl shadow px-6 py-4 border border-gray-100">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Quản lý cấu hình hệ thống</h2>
          <p className="text-sm text-gray-500 mt-1">
            Điều chỉnh giá thuê, phụ phí, chính sách hoàn/hủy... (ngoại trừ Face ID).
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={openCreateModal}
        >
          Tạo cấu hình
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
        <Table
          columns={columns}
          dataSource={configs}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: 1000 }}
          locale={{ emptyText: "Chưa có cấu hình" }}
        />
      </div>

      <Modal
        title={editingConfig ? "Cập nhật cấu hình" : "Tạo cấu hình"}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        onOk={handleSubmit}
        okText={editingConfig ? "Cập nhật" : "Tạo"}
        cancelText="Hủy"
        width={520}
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
          >
            <Input placeholder="Nhập tiêu đề" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Mô tả"
            rules={[{ required: true, message: "Vui lòng nhập mô tả" }]}
          >
            <TextArea rows={3} placeholder="Nhập mô tả" />
          </Form.Item>
          <Form.Item
            name="type"
            label="Loại cấu hình"
            rules={[{ required: true, message: "Vui lòng chọn loại" }]}
          >
            <Select
              placeholder="Chọn loại cấu hình"
              options={configurationTypeOptions}
              showSearch
              filterOption={(input, option) =>
                (option?.label as string)
                  ?.toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Form.Item>
          <Form.Item
            shouldUpdate={(prev, current) => prev.type !== current.type}
            noStyle
          >
            {() => {
              const type = form.getFieldValue("type");
              const isNumeric = type !== ConfigurationType.RentalContractTemplate;
              return (
                <Form.Item
                  name="value"
                  label={isNumeric ? "Giá trị" : "Đường dẫn / Nội dung"}
                  rules={[{ required: true, message: "Vui lòng nhập giá trị" }]}
                >
                  {isNumeric ? (
                    <InputNumber
                      className="w-full"
                      min={0}
                      step={500}
                      formatter={(value) =>
                        `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                      }
                      parser={(value) => value?.replace(/,/g, "") || ""}
                    />
                  ) : (
                    <Input placeholder="Nhập URL hoặc nội dung" />
                  )}
                </Form.Item>
              );
            }}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

