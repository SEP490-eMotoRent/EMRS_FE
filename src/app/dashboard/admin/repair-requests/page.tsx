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
  Card,
  Input,
} from "antd";
import { ReloadOutlined, UserSwitchOutlined, SearchOutlined, EyeOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getRepairRequests,
  updateRepairRequest,
} from "@/services/repair_request_service";
import {
  Account,
  getStaffs,
} from "../staffs/staff_service";
import { getBranches, Branch } from "../branches/branch_service";

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
  const [branches, setBranches] = useState<Branch[]>([]);
  const [searchText, setSearchText] = useState("");
  const [assignForm] = Form.useForm();

  useEffect(() => {
    loadRequests();
    loadTechnicians();
    loadBranches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadBranches = async () => {
    try {
      const data = await getBranches();
      setBranches(data);
    } catch (err: any) {
      console.error("Error loading branches:", err);
    }
  };

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

  // Helper function để lấy tên chi nhánh
  const getBranchName = (record: any): string => {
    // Ưu tiên từ vehicle.branch
    if (record.vehicle?.branch?.branchName) {
      return record.vehicle.branch.branchName;
    }
    // Từ branch object
    if (record.branch?.branchName) {
      return record.branch.branchName;
    }
    // Từ staff.branch
    if (record.staff?.branch?.branchName) {
      return record.staff.branch.branchName;
    }
    // Từ branchId - tìm trong danh sách branches
    if (record.vehicle?.branchId || record.branchId) {
      const branchId = record.vehicle?.branchId || record.branchId;
      const branch = branches.find((b) => b.id === branchId || b.branchId === branchId);
      if (branch) {
        return branch.branchName;
      }
    }
    // Fallback
    return record.branchName || "N/A";
  };

  // Filter requests (client-side filter cho search)
  const filteredRequests = requests.filter((request) => {
    if (!searchText) return true;
    const searchLower = searchText.toLowerCase();
    return (
      request.id?.toLowerCase().includes(searchLower) ||
      getBranchName(request).toLowerCase().includes(searchLower) ||
      request.vehicle?.licensePlate?.toLowerCase().includes(searchLower) ||
      request.issueDescription?.toLowerCase().includes(searchLower) ||
      request.staff?.fullname?.toLowerCase().includes(searchLower) ||
      request.staff?.fullName?.toLowerCase().includes(searchLower)
    );
  });

  const columns = [
    {
      title: "Mã yêu cầu",
      dataIndex: "id",
      key: "id",
      width: 120,
      render: (id: string) => (
        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
          {id?.slice(0, 8)}...
        </span>
      ),
    },
    {
      title: "Chi nhánh",
      key: "branch",
      width: 200,
      render: (_: any, record: any) => {
        const branchName = getBranchName(record);
        return (
          <span className="font-medium text-blue-600">
            {branchName}
          </span>
        );
      },
    },
    {
      title: "Xe",
      key: "vehicle",
      width: 150,
      render: (_: any, record: any) => {
        const vehicle = record.vehicle || record.assignedVehicle;
        const licensePlate = vehicle?.licensePlate || record.vehicleLicensePlate || record.vehicleId || "N/A";
        const modelName = vehicle?.modelName || vehicle?.vehicleModelName || vehicle?.vehicleModel?.modelName || "-";
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-gray-800">
              {licensePlate}
            </span>
            {modelName !== "-" && (
              <span className="text-xs text-gray-500">
                {modelName}
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: "Mô tả",
      dataIndex: "issueDescription",
      key: "issueDescription",
      width: 250,
      ellipsis: { showTitle: true },
      render: (text: string) => (
        <span className="text-gray-700">{text || "-"}</span>
      ),
    },
    {
      title: "Ưu tiên",
      dataIndex: "priority",
      key: "priority",
      width: 120,
      render: (priority: string) => {
        const priorityText = priority || "CHƯA CÓ";
        const priorityMap: Record<string, string> = {
          LOW: "Thấp",
          MEDIUM: "Trung bình",
          HIGH: "Cao",
          CRITICAL: "Khẩn cấp",
        };
        return (
          <Tag color={priorityColors[priority] || "default"}>
            {priorityMap[priorityText] || priorityText}
          </Tag>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status: string) => {
        const statusText = status || "PENDING";
        const statusMap: Record<string, string> = {
          PENDING: "Chờ xử lý",
          REVIEWING: "Đang xem xét",
          ASSIGNED: "Đã phân công",
          IN_PROGRESS: "Đang xử lý",
          COMPLETED: "Hoàn thành",
          CANCELLED: "Đã hủy",
        };
        return (
          <Tag color={statusColors[status] || "default"}>
            {statusMap[statusText] || statusText}
          </Tag>
        );
      },
    },
    {
      title: "Kỹ thuật viên",
      key: "technician",
      width: 150,
      render: (_: any, record: any) => {
        const staff = record.staff || record.technician;
        const techName = staff?.fullname || staff?.fullName || staff?.account?.fullname;
        return (
          <span className={techName ? "text-gray-800" : "text-gray-400 italic"}>
            {techName || "Chưa phân công"}
          </span>
        );
      },
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (date: string) =>
        date ? (
          <span className="text-gray-600">
            {dayjs(date).format("DD/MM/YYYY HH:mm")}
          </span>
        ) : (
          "-"
        ),
    },
    {
      title: "Hành động",
      key: "action",
      width: 180,
      fixed: "right",
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => openDetail(record)}
          >
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Repair Request</p>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Quản lý yêu cầu sửa chữa
          </h1>
          <p className="text-gray-600">
            Theo dõi và phân công kỹ thuật viên cho các chi nhánh.
          </p>
        </div>
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={() => loadRequests()}
          size="large"
        >
          Làm mới
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="shadow-sm">
        <div className="flex gap-4 mb-4">
          <Input
            placeholder="Tìm kiếm theo mã, chi nhánh, xe, mô tả..."
            prefix={<SearchOutlined />}
            allowClear
            style={{ maxWidth: 400 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      </Card>

      {/* Table */}
      <Card className="shadow-sm">
        <Table
          rowKey="id"
          loading={loading}
          dataSource={filteredRequests}
          columns={columns}
          scroll={{ x: 1200 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} yêu cầu`,
            pageSizeOptions: ["10", "20", "50", "100"],
          }}
          onChange={handleTableChange}
          locale={{ emptyText: "Chưa có yêu cầu sửa chữa" }}
        />
      </Card>

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
              {getBranchName(selectedRequest)}
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

