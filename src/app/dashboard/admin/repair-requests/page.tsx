"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Descriptions,
  Form,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  message,
} from "antd";
import { ReloadOutlined, UserSwitchOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getRepairRequests,
  updateRepairRequest,
} from "@/services/repair_request_service";
import {
  Account,
  getStaffs,
} from "../staffs/staff_service";

const statusOptions = [
  "PENDING",
  "REVIEWING",
  "ASSIGNED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

const priorityOptions = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

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

export default function AdminRepairRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assigningRequest, setAssigningRequest] = useState<any | null>(null);
  const [technicians, setTechnicians] = useState<Account[]>([]);
  const [techLoading, setTechLoading] = useState(false);
  const [assignForm] = Form.useForm();

  useEffect(() => {
    loadRequests();
    loadTechnicians();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRequests = async (
    page = pagination.current,
    pageSize = pagination.pageSize
  ) => {
    try {
      setLoading(true);
      const res = await getRepairRequests({
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

  const loadTechnicians = async () => {
    try {
      setTechLoading(true);
      const data = await getStaffs();
      const filtered = data.filter(
        (account) => account.role?.toUpperCase() === "TECHNICIAN"
      );
      setTechnicians(filtered);
    } catch (err: any) {
      console.error(err);
      message.error("Không thể tải danh sách kỹ thuật viên");
      setTechnicians([]);
    } finally {
      setTechLoading(false);
    }
  };

  const handleTableChange = (config: any) => {
    loadRequests(config.current, config.pageSize);
  };

  const openDetail = (record: any) => {
    setSelectedRequest(record);
    setDetailOpen(true);
  };

  const openAssignModal = (record: any) => {
    setAssigningRequest(record);
    assignForm.setFieldsValue({
      staffId: record.staff?.id || record.technician?.id || undefined,
      priority: record.priority || "MEDIUM",
      status: record.status || "PENDING",
    });
    setAssignOpen(true);
  };

  const handleAssign = async () => {
    if (!assigningRequest?.id) return;
    try {
      const values = await assignForm.validateFields();
      await updateRepairRequest({
        id: assigningRequest.id,
        ...values,
      });
      message.success("Đã cập nhật yêu cầu sửa chữa");
      setAssignOpen(false);
      setAssigningRequest(null);
      loadRequests();
    } catch (err: any) {
      if (err?.errorFields) return;
      console.error(err);
      message.error(err.message || "Không thể cập nhật yêu cầu");
    }
  };

  const technicianOptions = technicians.map((tech) => ({
    label:
      tech.fullname ||
      tech.username ||
      tech.staff?.fullName ||
      tech.staff?.account?.fullname ||
      "Tech",
    value: tech.staff?.id || tech.id,
    description: tech.staff?.branch?.branchName,
  }));

  const columns = [
    {
      title: "Mã yêu cầu",
      dataIndex: "id",
      key: "id",
      render: (id: string) => (
        <span className="font-mono text-sm">{id?.slice(0, 8)}...</span>
      ),
    },
    {
      title: "Chi nhánh",
      key: "branch",
      render: (_: any, record: any) =>
        record.branch?.branchName ||
        record.staff?.branch?.branchName ||
        record.branchName ||
        "N/A",
    },
    {
      title: "Xe",
      key: "vehicle",
      render: (_: any, record: any) => {
        const vehicle = record.vehicle || record.assignedVehicle;
        return (
          <div className="flex flex-col">
            <span className="font-medium">
              {vehicle?.licensePlate ||
                record.vehicleLicensePlate ||
                record.vehicleId ||
                "N/A"}
            </span>
            <span className="text-xs text-gray-500">
              {vehicle?.modelName || vehicle?.vehicleModelName || "-"}
            </span>
          </div>
        );
      },
    },
    {
      title: "Mô tả",
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
        return (
          staff?.fullname ||
          staff?.fullName ||
          staff?.account?.fullname ||
          "Chưa phân công"
        );
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
      title: "Hành động",
      key: "action",
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" onClick={() => openDetail(record)}>
            Chi tiết
          </Button>
          <Button
            type="link"
            icon={<UserSwitchOutlined />}
            onClick={() => openAssignModal(record)}
          >
            Phân công
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-sm text-gray-400 uppercase">Repair Request</p>
          <h1 className="text-2xl font-semibold text-white">
            Quản lý yêu cầu sửa chữa
          </h1>
          <p className="text-gray-300 text-sm">
            Theo dõi và phân công kỹ thuật viên cho các chi nhánh.
          </p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => loadRequests()}>
          Làm mới
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <Table
          rowKey="id"
          loading={loading}
          dataSource={requests}
          columns={columns}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} yêu cầu`,
          }}
          onChange={handleTableChange}
          locale={{ emptyText: "Chưa có yêu cầu sửa chữa" }}
        />
      </div>

      <Modal
        title="Chi tiết yêu cầu sửa chữa"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailOpen(false)}>
            Đóng
          </Button>,
        ]}
        width={820}
      >
        {selectedRequest ? (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Mã yêu cầu">
              <span className="font-mono">{selectedRequest.id}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={statusColors[selectedRequest.status] || "default"}>
                {selectedRequest.status || "PENDING"}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Chi nhánh">
              {selectedRequest.branch?.branchName ||
                selectedRequest.staff?.branch?.branchName ||
                selectedRequest.branchName ||
                "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Ưu tiên">
              <Tag color={priorityColors[selectedRequest.priority] || "default"}>
                {selectedRequest.priority || "CHƯA CÓ"}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Xe">
              {selectedRequest.vehicle?.licensePlate ||
                selectedRequest.vehicleLicensePlate ||
                selectedRequest.vehicleId}
            </Descriptions.Item>
            <Descriptions.Item label="Kỹ thuật viên">
              {selectedRequest.staff?.fullname ||
                selectedRequest.staff?.fullName ||
                selectedRequest.staff?.account?.fullname ||
                "Chưa phân công"}
            </Descriptions.Item>
            <Descriptions.Item label="Mô tả" span={2}>
              {selectedRequest.issueDescription}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">
              {selectedRequest.createdAt
                ? dayjs(selectedRequest.createdAt).format("DD/MM/YYYY HH:mm")
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày cập nhật">
              {selectedRequest.updatedAt
                ? dayjs(selectedRequest.updatedAt).format("DD/MM/YYYY HH:mm")
                : "-"}
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <p className="text-gray-500">Không có dữ liệu yêu cầu.</p>
        )}
      </Modal>

      <Modal
        title="Phân công kỹ thuật viên"
        open={assignOpen}
        onCancel={() => setAssignOpen(false)}
        onOk={handleAssign}
        okText="Lưu phân công"
        destroyOnClose
      >
        <Form layout="vertical" form={assignForm}>
          <Form.Item
            name="staffId"
            label="Kỹ thuật viên"
            rules={[{ required: true, message: "Vui lòng chọn kỹ thuật viên" }]}
          >
            <Select
              placeholder="Chọn kỹ thuật viên"
              loading={techLoading}
              options={technicianOptions}
              showSearch
              filterOption={(input, option) =>
                (option?.label as string)
                  ?.toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Form.Item>

          <Form.Item
            name="priority"
            label="Mức độ ưu tiên"
            rules={[{ required: true, message: "Vui lòng chọn ưu tiên" }]}
          >
            <Select
              options={priorityOptions.map((priority) => ({
                label: priority,
                value: priority,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="status"
            label="Trạng thái"
            rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
          >
            <Select
              options={statusOptions.map((status) => ({
                label: status,
                value: status,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

