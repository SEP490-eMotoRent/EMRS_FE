"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Descriptions,
  Form,
  Modal,
  Select,
  Table,
  Tag,
  message,
} from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getTechnicianRepairRequests,
  updateRepairRequest,
} from "@/services/repair_request_service";
import {
  readBrowserCookies,
  resolveAccountFromSession,
} from "@/utils/sessionAccount";

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

const technicianStatusOptions = ["ASSIGNED", "IN_PROGRESS", "COMPLETED"];

export default function TechnicianRepairRequestsPage() {
  const [technicianId, setTechnicianId] = useState("");
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [statusForm] = Form.useForm();

  useEffect(() => {
    let mounted = true;
    const detectTechnician = async () => {
      const cookies = readBrowserCookies();
      if (cookies.staffId) {
        if (mounted) setTechnicianId(cookies.staffId);
        return;
      }

      const account = await resolveAccountFromSession(cookies);
      const staffId = account?.staff?.id;
      if (staffId) {
        document.cookie = `staffId=${staffId}; path=/;`;
        if (account.staff?.branch?.branchName) {
          document.cookie = `branchName=${encodeURIComponent(
            account.staff.branch.branchName
          )}; path=/;`;
        }
        if (mounted) setTechnicianId(staffId);
      } else if (mounted) {
        message.error("Không tìm thấy thông tin kỹ thuật viên trong phiên đăng nhập");
      }
    };

    detectTechnician();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!technicianId) return;
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [technicianId]);

  const loadRequests = async (
    page = pagination.current,
    pageSize = pagination.pageSize
  ) => {
    if (!technicianId) return;
    try {
      setLoading(true);
      const res = await getTechnicianRepairRequests(technicianId, {
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
      message.error(err.message || "Không thể tải yêu cầu được phân công");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (config: any) => {
    loadRequests(config.current, config.pageSize);
  };

  const openDetail = (record: any) => {
    setSelectedRequest(record);
    statusForm.setFieldsValue({ status: record.status || "ASSIGNED" });
    setDetailOpen(true);
  };

  const handleStatusUpdate = async () => {
    if (!selectedRequest?.id) return;
    try {
      const values = await statusForm.validateFields();
      await updateRepairRequest({
        id: selectedRequest.id,
        status: values.status,
      });
      message.success("Đã cập nhật trạng thái yêu cầu");
      setDetailOpen(false);
      setSelectedRequest(null);
      loadRequests();
    } catch (err: any) {
      if (err?.errorFields) return;
      console.error(err);
      message.error(err.message || "Không thể cập nhật trạng thái");
    }
  };

  const columns = useMemo(
    () => [
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
          record.managerBranch?.branchName ||
          record.staff?.branch?.branchName ||
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
            {status || "ASSIGNED"}
          </Tag>
        ),
      },
      {
        title: "Ngày cập nhật",
        dataIndex: "updatedAt",
        key: "updatedAt",
        render: (date: string) =>
          date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "-",
      },
      {
        title: "Hành động",
        key: "action",
        render: (_: any, record: any) => (
          <Button type="link" onClick={() => openDetail(record)}>
            Chi tiết
          </Button>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Technician Workspace
          </p>
          <h1 className="text-2xl font-semibold text-gray-900">
            Yêu cầu sửa chữa được phân công
          </h1>
          <p className="text-sm text-gray-500">
            Theo dõi và cập nhật tiến độ xử lý tại chi nhánh.
          </p>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => loadRequests()}
          disabled={!technicianId}
        >
          Làm mới
        </Button>
      </div>

      {!technicianId && (
        <Alert
          type="error"
          showIcon
          message="Thiếu mã kỹ thuật viên"
          description="Vui lòng đăng nhập lại để hệ thống xác định đúng kỹ thuật viên."
        />
      )}

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
          locale={{ emptyText: "Chưa có yêu cầu nào được giao" }}
        />
      </div>

      <Modal
        title="Chi tiết yêu cầu"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailOpen(false)}>
            Đóng
          </Button>,
          <Button
            key="update"
            type="primary"
            onClick={handleStatusUpdate}
            disabled={!technicianId}
          >
            Cập nhật trạng thái
          </Button>,
        ]}
        width={760}
      >
        {selectedRequest ? (
          <div className="space-y-4">
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Mã yêu cầu">
                <span className="font-mono">{selectedRequest.id}</span>
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
              <Descriptions.Item label="Chi nhánh">
                {selectedRequest.branch?.branchName ||
                  selectedRequest.staff?.branch?.branchName ||
                  "N/A"}
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

            <Form layout="vertical" form={statusForm}>
              <Form.Item
                name="status"
                label="Cập nhật trạng thái"
                rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
              >
                <Select
                  options={technicianStatusOptions.map((status) => ({
                    label: status,
                    value: status,
                  }))}
                />
              </Form.Item>
            </Form>
          </div>
        ) : (
          <p className="text-gray-500">Không tìm thấy dữ liệu yêu cầu.</p>
        )}
      </Modal>
    </div>
  );
}

