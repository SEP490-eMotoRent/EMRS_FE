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
  Upload,
  Typography,
} from "antd";
import { ColumnsType } from "antd/es/table";
import {
  configurationTypeOptions,
  ConfigurationItem,
  ConfigurationType,
  createConfiguration,
  deleteConfiguration,
  getConfigurationByType,
  getConfigurations,
  updateConfiguration,
  createConfigurationMedia,
  updateConfigurationMedia,
} from "./configuration_service";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  UploadOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import type {
  UploadChangeParam,
  UploadFile,
  UploadProps,
} from "antd/es/upload/interface";

const { TextArea } = Input;
const { Dragger } = Upload;
const { Text } = Typography;

const normalizeConfig = (item: ConfigurationItem | any): ConfigurationItem => ({
  ...item,
  type: item.type,
});

const isRentalTemplateType = (type: ConfigurationType | string) =>
  String(type) === "RentalContractTemplate" ||
  Number(type) === ConfigurationType.RentalContractTemplate;

const getTypeLabel = (type: ConfigurationType | string) => {
  if (isRentalTemplateType(type)) {
    return "File hợp đồng thuê";
  }
  const numericType = Number(type);
  return (
    configurationTypeOptions.find((opt) => Number(opt.value) === numericType)
      ?.label || `Loại ${type}`
  );
};

export default function AdminConfigurationPage() {
  const [configs, setConfigs] = useState<ConfigurationItem[]>([]);
  const [activeType, setActiveType] = useState<string>("ALL");
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ConfigurationItem | null>(
    null
  );
  const [configToDelete, setConfigToDelete] =
    useState<ConfigurationItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [form] = Form.useForm();
  const [templateForm] = Form.useForm();
  const [templateConfig, setTemplateConfig] = useState<ConfigurationItem | null>(
    null
  );
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateSaving, setTemplateSaving] = useState(false);
  const [templateFileList, setTemplateFileList] = useState<UploadFile[]>([]);

  const RENTAL_TEMPLATE_TYPE = ConfigurationType.RentalContractTemplate;
  const RENTAL_TEMPLATE_SLUG = "RentalContractTemplate";

  useEffect(() => {
    loadConfigs();
    loadContractTemplate();
  }, []);

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const data = await getConfigurations();
      const normalized = data.map(normalizeConfig);
      const sorted = normalized
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

  const loadContractTemplate = async () => {
    setTemplateLoading(true);
    try {
      const data = await getConfigurationByType(RENTAL_TEMPLATE_SLUG);
      const list = Array.isArray(data) ? data : [];
      setTemplateConfig(list[0] ? normalizeConfig(list[0]) : null);
    } catch (error) {
      console.error("Error loading contract template:", error);
      setTemplateConfig(null);
    } finally {
      setTemplateLoading(false);
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

  const openTemplateModal = () => {
    templateForm.setFieldsValue({
      title: templateConfig?.title || "RentalContractTemplate",
      description: templateConfig?.description || "RentalContractTemplate",
    });

    if (templateConfig?.value) {
      const fileName =
        templateConfig.value.split("/").pop() || "rental-contract.pdf";
      setTemplateFileList([
        {
          uid: "-1",
          name: fileName,
          status: "done",
          url: templateConfig.value,
        },
      ]);
    } else {
      setTemplateFileList([]);
    }

    setTemplateModalOpen(true);
  };

  const handleTemplateModalClose = () => {
    setTemplateModalOpen(false);
    setTemplateFileList([]);
    templateForm.resetFields();
  };

  const handleDelete = (record: ConfigurationItem) => {
    setConfigToDelete(record);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!configToDelete) return;
    setIsDeleting(true);
    try {
      await deleteConfiguration(configToDelete.id);
      message.success("Đã xóa cấu hình");
      setIsDeleteModalOpen(false);
      setConfigToDelete(null);
      loadConfigs();
    } catch (error: any) {
      console.error("Error deleting configuration:", error);
      message.error(error?.message || "Không thể xóa cấu hình");
    } finally {
      setIsDeleting(false);
    }
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
        message.success("Thêm cấu hình thành công");
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

  const handleTemplateSubmit = async () => {
    try {
      const values = await templateForm.validateFields();
      const file = templateFileList[0]?.originFileObj as File | undefined;

      if (!templateConfig?.id && !file) {
        message.error("Vui lòng tải lên file hợp đồng (PDF)");
        return;
      }

      if (templateConfig?.id && !file) {
        message.error("Vui lòng chọn file PDF mới để cập nhật");
        return;
      }

      setTemplateSaving(true);

      if (templateConfig?.id && file) {
        await updateConfigurationMedia({
          id: templateConfig.id,
          title: values.title,
          description: values.description,
          type: RENTAL_TEMPLATE_SLUG,
          file,
        });
        message.success("Đã cập nhật hợp đồng mẫu");
      } else if (file) {
        await createConfigurationMedia({
          title: values.title,
          description: values.description,
          type: RENTAL_TEMPLATE_SLUG,
          file,
        });
        message.success("Đã tạo hợp đồng mẫu");
      }

      handleTemplateModalClose();
      loadContractTemplate();
    } catch (error: any) {
      if (error?.errorFields) return;
      console.error("Error saving contract template:", error);
      message.error(error?.message || "Không thể lưu hợp đồng mẫu");
    } finally {
      setTemplateSaving(false);
    }
  };

  const typeOptions = useMemo(() => {
    const baseList = configurationTypeOptions
      .filter((opt) => opt.value !== ConfigurationType.FacePlusPlus)
      .map((opt) => ({ label: opt.label, value: String(opt.value) }));

    const existingValues = new Set(baseList.map((o) => String(o.value)));

    // Bổ sung các type phát sinh từ API (backend có thêm type mới)
    configs.forEach((item) => {
      const key = String(item.type);
      if (!existingValues.has(key)) {
        baseList.push({
          label: getTypeLabel(item.type),
          value: key,
        });
        existingValues.add(key);
      }
    });

    // Đảm bảo có tab template
    if (!existingValues.has(String(RENTAL_TEMPLATE_TYPE))) {
      baseList.push({
        label: "File hợp đồng thuê",
        value: String(RENTAL_TEMPLATE_TYPE),
      });
      existingValues.add(String(RENTAL_TEMPLATE_TYPE));
    }

    return baseList;
  }, [configs]);

  const templateRow = useMemo(
    () =>
      templateConfig
        ? {
            ...templateConfig,
            type: String(RENTAL_TEMPLATE_TYPE),
            _isTemplate: true,
          }
        : null,
    [templateConfig]
  );

  const hasTemplateInConfigs = useMemo(
    () => configs.some((item) => isRentalTemplateType(item.type)),
    [configs]
  );

  const groupedCounts = useMemo(() => {
    const counts = configs.reduce<Record<string, number>>((acc, item) => {
      const key = String(item.type);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    if (templateRow && !hasTemplateInConfigs) {
      counts[String(RENTAL_TEMPLATE_TYPE)] =
        (counts[String(RENTAL_TEMPLATE_TYPE)] || 0) + 1;
    }

    return counts;
  }, [configs, templateRow, hasTemplateInConfigs]);

  const filteredConfigs = useMemo(() => {
    if (activeType === "ALL") return configs;

    if (activeType === String(RENTAL_TEMPLATE_TYPE)) {
      if (hasTemplateInConfigs) {
        return configs.filter(
          (item) => String(item.type) === String(RENTAL_TEMPLATE_TYPE)
        );
      }
      return templateRow ? [templateRow] : [];
    }

    return configs.filter((item) => String(item.type) === activeType);
  }, [configs, templateRow, activeType, hasTemplateInConfigs]);

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
        render: (type) => <Tag color="blue">{getTypeLabel(type)}</Tag>,
      },
      {
        title: "Giá trị",
        dataIndex: "value",
        key: "value",
        width: 200,
        render: (value, record) =>
          (record as ConfigurationItem)._isTemplate ||
          isRentalTemplateType(record.type) ? (
            <Button
              type="link"
              icon={<FilePdfOutlined />}
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="p-0"
            >
              Download hợp đồng mẫu
            </Button>
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

  const templateUploadProps: UploadProps = {
    accept: ".pdf",
    multiple: false,
    fileList: templateFileList,
    beforeUpload: (file) => {
      const isPdf =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");
      if (!isPdf) {
        message.error("Vui lòng chọn file định dạng PDF");
        return Upload.LIST_IGNORE;
      }
      return false;
    },
    onChange: (info: UploadChangeParam<UploadFile>) => {
      const latest = info.fileList.slice(-1).map((file) => ({
        ...file,
        status: "done" as const,
      }));
      setTemplateFileList(latest);
    },
    onRemove: () => {
      setTemplateFileList([]);
    },
  };

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

      <div className="bg-white rounded-xl shadow border border-gray-100 p-4 space-y-5">
        <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[
            { label: "Tất cả", value: "ALL" },
            ...typeOptions,
          ].map((option) => {
            const isActive = activeType === option.value;
            const count =
              option.value === "ALL"
                ? configs.length +
                  (templateRow && !hasTemplateInConfigs ? 1 : 0)
                : groupedCounts[option.value] || 0;
            return (
              <button
                key={option.value}
                onClick={() => setActiveType(option.value)}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-blue-600 text-white border-blue-600 shadow"
                    : "bg-gray-50 text-gray-700 border-gray-200 hover:border-blue-400 hover:text-blue-800"
                }`}
              >
                <span>{option.label}</span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    isActive ? "bg-white/30" : "bg-white text-blue-600 border border-blue-200"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {activeType === String(RENTAL_TEMPLATE_TYPE) && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-blue-600">
                Hợp đồng thuê mẫu
              </p>
              {templateLoading ? (
                <Text type="secondary">Đang tải thông tin hợp đồng...</Text>
              ) : templateConfig ? (
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-gray-900">
                    {templateConfig.title}
                  </p>
                  <p className="text-sm text-gray-600">
                    Cập nhật lần cuối:{" "}
                    {templateConfig.updatedAt || templateConfig.createdAt
                      ? new Date(
                          templateConfig.updatedAt ||
                            templateConfig.createdAt ||
                            ""
                        ).toLocaleString("vi-VN")
                      : "Chưa xác định"}
                  </p>
                </div>
              ) : (
                <Text type="secondary">
                  Chưa có file hợp đồng mẫu. Vui lòng tải lên để các bộ phận sử dụng chung.
                </Text>
              )}
            </div>
            <Space>
              {templateConfig?.value && (
                <Button
                  icon={<FilePdfOutlined />}
                  href={templateConfig.value}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Xem file hiện tại
                </Button>
              )}
              <Button
                type="primary"
                icon={<UploadOutlined />}
                onClick={openTemplateModal}
              >
                {templateConfig ? "Cập nhật mẫu" : "Tải mẫu lên"}
              </Button>
            </Space>
          </div>
        )}

        <Table
          columns={columns}
          dataSource={filteredConfigs}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: 1000 }}
          locale={{ emptyText: "Chưa có cấu hình" }}
        />
      </div>

      <Modal
        title={templateConfig ? "Cập nhật hợp đồng mẫu" : "Tải hợp đồng mẫu"}
        open={templateModalOpen}
        onCancel={handleTemplateModalClose}
        onOk={handleTemplateSubmit}
        okText={templateConfig ? "Cập nhật" : "Tạo mới"}
        confirmLoading={templateSaving}
        destroyOnHidden
      >
        <Form layout="vertical" form={templateForm}>
          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
          >
            <Input placeholder="Tên hiển thị của mẫu hợp đồng" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Mô tả"
            rules={[{ required: true, message: "Vui lòng nhập mô tả" }]}
          >
            <TextArea rows={3} placeholder="Mô tả ngắn về mẫu hợp đồng" />
          </Form.Item>
          <Form.Item
            label="File PDF"
            required
            extra="Chỉ hỗ trợ định dạng .pdf, dung lượng tối đa theo cấu hình máy chủ."
          >
            <Dragger {...templateUploadProps}>
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">
                Kéo thả hoặc bấm để chọn file PDF hợp đồng
              </p>
              <p className="ant-upload-hint text-gray-500">
                File hiện tại sẽ được thay thế sau khi lưu.
              </p>
            </Dragger>
          </Form.Item>
        </Form>
      </Modal>

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

      <Modal
        title="Xác nhận xóa"
        open={isDeleteModalOpen}
        okText="Xóa"
        okButtonProps={{ danger: true, loading: isDeleting }}
        cancelText="Hủy"
        onOk={confirmDelete}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setConfigToDelete(null);
        }}
      >
        <p>
          Bạn chắc chắn muốn xóa cấu hình{" "}
          <strong>{configToDelete?.title}</strong>?
        </p>
        <p className="text-sm text-gray-500">ID: {configToDelete?.id}</p>
      </Modal>
    </div>
  );
}

