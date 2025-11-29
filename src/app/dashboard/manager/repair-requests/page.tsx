"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Descriptions,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  message,
} from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  createRepairRequest,
  getBranchRepairRequests,
  getBranchVehicles,
} from "@/services/repair_request_service";

const { TextArea } = Input;

const statusColors: Record<string, string> = {
  PENDING: "default",
  REVIEWING: "processing",
  ASSIGNED: "blue",
  IN_PROGRESS: "orange",
  COMPLETED: "green",
  CANCELLED: "red",
};

const priorityColors: Record<string, string> = {
  LOW: "default",
  MEDIUM: "blue",
  HIGH: "orange",
  CRITICAL: "red",
};

export default function ManagerRepairRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [vehicleLoading, setVehicleLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const [form] = Form.useForm();

  const loadRequests = async (page = pagination.current, pageSize = pagination.pageSize) => {
    try {
      setLoading(true);
      const res = await getBranchRepairRequests({
        pageNum: page,
        pageSize,
        orderByDesc: true,
      });
      setRequests(res.items ?? []);
      setPagination({
        current: res.currentPage ?? page,
        pageSize: res.pageSize ?? pageSize,
        total: res.totalItems ?? res.items?.length ?? 0,
      });
    } catch (err: any) {
      console.error(err);
      message.error(err.message || "Không thể tải yêu cầu sửa chữa");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const loadVehicles = async () => {
    try {
      setVehicleLoading(true);
      const data = await getBranchVehicles({ pageSize: 500 });
      setVehicles(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);
      message.warning("Không thể tải danh sách xe của chi nhánh");
      setVehicles([]);
    } finally {
      setVehicleLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    loadVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTableChange = (paginationConfig: any) => {
    loadRequests(paginationConfig.current, paginationConfig.pageSize);
  };

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      await createRepairRequest(values);
      message.success("Đã tạo yêu cầu sửa chữa");
      setCreateModalOpen(false);
      form.resetFields();
      loadRequests();
    } catch (err: any) {
      if (err?.errorFields) return;
      console.error(err);
      message.error(err.message || "Không thể tạo yêu cầu");
    }
  };

  const handleOpenDetail = (record: any) => {
    setSelectedRequest(record);
    setDetailModalOpen(true);
  };

  const requestColumns = [
    {
      title: "Mã yêu cầu",
      dataIndex: "id",
      key: "id",
      render: (id: string) => (
        <span className="font-mono text-sm">{id?.slice(0, 8)}...</span>
      ),
    },
    {
      title: "Xe",
      key: "vehicle",
      render: (_: any, record: any) => {
        const vehicle = record.vehicle || record.assignedVehicle;
        const license =
          vehicle?.licensePlate ||
          record.vehicleLicensePlate ||
          record.vehicleId;
        return (
          <div className="flex flex-col">
            <span className="font-medium">{license || "N/A"}</span>
            <span className="text-xs text-gray-500">
              {vehicle?.modelName || vehicle?.vehicleModelName || "-"}
            </span>
          </div>
        );
      },
    },
    {
      title: "Mô tả sự cố",
      dataIndex: "issueDescription",
      key: "issueDescription",
      ellipsis: true,
    },
    {
      title: "Ưu tiên",
      dataIndex: "priority",
      key: "priority",
      render: (priority: string) => (
        <Tag color={priorityColors[priority] || "default"}>
          {priority || "CHƯA CÓ"}
        </Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={statusColors[status] || "default"}>
          {status || "PENDING"}
        </Tag>
      ),
    },
    {
      title: "Kỹ thuật viên",
      key: "technician",
      render: (_: any, record: any) => {
        const staff = record.staff || record.technician;
        const name =
          staff?.fullname ||
          staff?.fullName ||
          staff?.account?.fullname ||
          staff?.account?.fullName;
        return name || "Chưa phân công";
      },
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) =>
        date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "-",
    },
    {
      title: "Ngày duyệt",
      dataIndex: "approvedAt",
      key: "approvedAt",
      render: (date: string) =>
        date ? (
          <span className="text-gray-600">
            {dayjs(date).format("DD/MM/YYYY HH:mm")}
          </span>
        ) : (
          <Tag color="default">Chưa duyệt</Tag>
        ),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_: any, record: any) => (
        <Button type="link" onClick={() => handleOpenDetail(record)}>
          Xem chi tiết
        </Button>
      ),
    },
  ];

  const vehicleOptions = useMemo(() => {
    return vehicles.map((vehicle) => {
      const labelParts = [
        vehicle.licensePlate || vehicle.VehicleLicensePlate,
        vehicle.vehicleModelName || vehicle.ModelName,
      ].filter(Boolean);
      return {
        label: labelParts.join(" • ") || vehicle.vehicleId || vehicle.id,
        value: vehicle.vehicleId || vehicle.id,
        disabled: vehicle.status?.toLowerCase() === "maintenance",
      };
    });
  }, [vehicles]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500 uppercase tracking-wide">
            Quản lý sửa chữa
          </p>
          <h1 className="text-2xl font-semibold text-blue-600">
            Yêu cầu sửa chữa của chi nhánh
          </h1>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => loadRequests()}>
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalOpen(true)}
          >
            Tạo yêu cầu sửa chữa
          </Button>
        </Space>
      </div>

      <div className="bg-white shadow rounded-lg p-4">
        <Table
          rowKey="id"
          loading={loading}
          dataSource={requests}
          columns={requestColumns}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} yêu cầu`,
          }}
          onChange={handleTableChange}
          locale={{ emptyText: "Chưa có yêu cầu nào" }}
        />
      </div>

      <Modal
        title="Tạo yêu cầu sửa chữa"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        okText="Tạo yêu cầu"
        onOk={handleCreate}
        destroyOnClose
      >
        <Form
          layout="vertical"
          form={form}
          initialValues={{ issueDescription: "", vehicleId: undefined }}
        >
          <Form.Item
            name="vehicleId"
            label="Xe cần sửa chữa"
            rules={[{ required: true, message: "Vui lòng chọn xe" }]}
          >
            <Select
              showSearch
              placeholder={
                vehicleLoading
                  ? "Đang tải danh sách xe..."
                  : "Chọn xe trong chi nhánh"
              }
              loading={vehicleLoading}
              options={vehicleOptions}
              filterOption={(input, option) =>
                (option?.label as string)
                  ?.toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Form.Item>

          <Form.Item
            name="issueDescription"
            label="Mô tả tình trạng"
            rules={[
              { required: true, message: "Vui lòng mô tả vấn đề" },
              { min: 10, message: "Mô tả tối thiểu 10 ký tự" },
            ]}
          >
            <TextArea rows={4} placeholder="Ví dụ: Xe rung mạnh khi tăng tốc..." />
          </Form.Item>

          <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 text-sm text-blue-700 rounded-lg px-3 py-2">
            <ExclamationCircleOutlined className="mt-0.5" />
            <p>
              Yêu cầu sau khi tạo sẽ gửi đến Admin để phân công kỹ thuật viên phù
              hợp. Bạn vẫn có thể cập nhật mức ưu tiên trong tương lai.
            </p>
          </div>
        </Form>
      </Modal>

      <Modal
        title="Chi tiết yêu cầu sửa chữa"
        open={detailModalOpen}
        footer={[
          <Button key="close" onClick={() => setDetailModalOpen(false)}>
            Đóng
          </Button>,
        ]}
        onCancel={() => setDetailModalOpen(false)}
        width={720}
      >
        {selectedRequest ? (
          <Descriptions bordered column={2} size="middle">
            <Descriptions.Item label="Mã yêu cầu">
              <span className="font-mono">{selectedRequest.id}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={statusColors[selectedRequest.status] || "default"}>
                {selectedRequest.status || "PENDING"}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Xe">
              {selectedRequest.vehicle?.licensePlate ||
                selectedRequest.vehicleLicensePlate ||
                selectedRequest.vehicleId}
            </Descriptions.Item>
            <Descriptions.Item label="Ưu tiên">
              <Tag color={priorityColors[selectedRequest.priority] || "default"}>
                {selectedRequest.priority || "CHƯA CÓ"}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Mô tả" span={2}>
              {selectedRequest.issueDescription}
            </Descriptions.Item>
            <Descriptions.Item label="Kỹ thuật viên" span={2}>
              {selectedRequest.staff?.fullname ||
                selectedRequest.staff?.fullName ||
                selectedRequest.staff?.account?.fullname ||
                "Chưa phân công"}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">
              {selectedRequest.createdAt
                ? dayjs(selectedRequest.createdAt).format("DD/MM/YYYY HH:mm")
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày duyệt">
              {selectedRequest.approvedAt
                ? dayjs(selectedRequest.approvedAt).format("DD/MM/YYYY HH:mm")
                : "Chưa duyệt"}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày cập nhật">
              {selectedRequest.updatedAt
                ? dayjs(selectedRequest.updatedAt).format("DD/MM/YYYY HH:mm")
                : "-"}
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <p className="text-gray-500">Không tìm thấy dữ liệu yêu cầu.</p>
        )}
      </Modal>
    </div>
  );
}

