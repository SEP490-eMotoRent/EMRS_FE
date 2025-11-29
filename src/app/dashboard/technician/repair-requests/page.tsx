"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Descriptions,
  Form,
  Input,
  Modal,
  Select,
  Table,
  Tag,
  message,
} from "antd";
import { ReloadOutlined, EyeOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  createTechnicianRepairRequest,
  getBranchVehicles,
  getRepairRequestById,
  getTechnicianRepairRequests,
  updateTechnicianRepairRequest,
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

const statusDisplayMap: Record<string, string> = {
  PENDING: "Chờ xử lý",
  REVIEWING: "Đang xem xét",
  ASSIGNED: "Đã phân công",
  IN_PROGRESS: "Đang xử lý",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

const priorityColors: Record<string, string> = {
  LOW: "default",
  MEDIUM: "blue",
  HIGH: "orange",
  CRITICAL: "red",
};

const priorityOptions = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const technicianStatusOptions = ["ASSIGNED", "IN_PROGRESS", "COMPLETED"];
const { TextArea } = Input;

const normalizeStatus = (status?: string) =>
  (status || "PENDING").replace(/\s+/g, "").toUpperCase();

const toPascalCaseStatus = (status: string) =>
  status
    .toLowerCase()
    .split(/[_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

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
  const [detailLoading, setDetailLoading] = useState(false);
  const [statusForm] = Form.useForm();
  const [createForm] = Form.useForm();
  const [createOpen, setCreateOpen] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [vehicleLoading, setVehicleLoading] = useState(false);

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
    loadVehicles();
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

  const loadVehicles = async () => {
    try {
      setVehicleLoading(true);
      const data = await getBranchVehicles({ pageSize: 500 });
      setVehicles(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);
      message.warning("Không thể tải danh sách xe để tạo yêu cầu");
      setVehicles([]);
    } finally {
      setVehicleLoading(false);
    }
  };

  const handleTableChange = (config: any) => {
    loadRequests(config.current, config.pageSize);
  };

  const openDetail = async (record: any) => {
    try {
      setDetailLoading(true);
      setDetailOpen(true);
      // Load chi tiết từ API để có đầy đủ thông tin
      const detail = await getRepairRequestById(record.id);
      setSelectedRequest(detail);
      const normalized = normalizeStatus(detail.status || record.status || "ASSIGNED");
      statusForm.setFieldsValue({ status: normalized });
    } catch (err: any) {
      console.error("Error loading repair request detail:", err);
      message.error(err.message || "Không thể tải chi tiết yêu cầu sửa chữa");
      // Fallback: dùng data từ table
      setSelectedRequest(record);
      statusForm.setFieldsValue({ status: normalizeStatus(record.status || "ASSIGNED") });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedRequest?.id) return;
    try {
      const values = await statusForm.validateFields();
      const apiStatus = toPascalCaseStatus(values.status);
      await updateTechnicianRepairRequest(selectedRequest.id, {
        status: apiStatus,
        staffId: technicianId || selectedRequest.technicianId,
      });
      message.success("Đã cập nhật trạng thái yêu cầu");
      setDetailOpen(false);
      setSelectedRequest(null);
      // Reload với pagination hiện tại
      await loadRequests(pagination.current, pagination.pageSize);
    } catch (err: any) {
      if (err?.errorFields) return;
      console.error(err);
      message.error(err.message || "Không thể cập nhật trạng thái");
    }
  };

  const handleCreateRequest = async () => {
    if (!technicianId) {
      message.error("Không xác định được kỹ thuật viên");
      return;
    }
    try {
      const values = await createForm.validateFields();
      await createTechnicianRepairRequest({
        issueDescription: values.issueDescription,
        vehicleId: values.vehicleId,
        priority: values.priority,
        status: toPascalCaseStatus("PENDING"),
        technicianId,
      });
      message.success("Đã tạo yêu cầu sửa chữa");
      setCreateOpen(false);
      createForm.resetFields();
      await loadRequests();
    } catch (err: any) {
      if (err?.errorFields) return;
      console.error(err);
      message.error(err.message || "Không thể tạo yêu cầu");
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
        title: "Xe",
        key: "vehicle",
        width: 180,
        render: (_: any, record: any) => {
          const vehicle = record.vehicle || record.assignedVehicle;
          const licensePlate = vehicle?.licensePlate ||
            record.vehicleLicensePlate ||
            record.vehicleId ||
            "N/A";
          const modelName = vehicle?.modelName ||
            vehicle?.vehicleModelName ||
            vehicle?.vehicleModel?.modelName ||
            "-";
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
          const normalized = normalizeStatus(status);
          return (
            <Tag color={statusColors[normalized] || "default"}>
              {statusDisplayMap[normalized] || status || "PENDING"}
            </Tag>
          );
        },
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
        width: 120,
        render: (_: any, record: any) => (
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => openDetail(record)}
          >
            Chi tiết
          </Button>
        ),
      },
    ],
    []
  );

  const vehicleOptions = useMemo(() => {
    return vehicles.map((vehicle) => {
      const license =
        vehicle.licensePlate ||
        vehicle.VehicleLicensePlate ||
        vehicle.vehicleId ||
        vehicle.id;
      const model =
        vehicle.vehicleModelName ||
        vehicle.ModelName ||
        vehicle.vehicleModel?.modelName;

      return {
        label: [license, model].filter(Boolean).join(" • "),
        value: vehicle.vehicleId || vehicle.id,
      };
    });
  }, [vehicles]);

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
        <div className="flex gap-2">
          <Button
            type="primary"
            disabled={!technicianId}
            onClick={() => {
              createForm.resetFields();
              setCreateOpen(true);
            }}
          >
            Tạo yêu cầu
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => loadRequests()}
            disabled={!technicianId}
          >
            Làm mới
          </Button>
        </div>
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
        title="Chi tiết yêu cầu sửa chữa"
        open={detailOpen}
        onCancel={() => {
          setDetailOpen(false);
          setSelectedRequest(null);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setDetailOpen(false);
              setSelectedRequest(null);
            }}
          >
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
        width={900}
        loading={detailLoading}
      >
        {selectedRequest ? (
          <div className="space-y-4">
            {/* Thông tin cơ bản */}
            <Descriptions title="Thông tin cơ bản" bordered column={2}>
              <Descriptions.Item label="Mã yêu cầu">
                <span className="font-mono text-sm">{selectedRequest.id}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                {(() => {
                  const normalized = normalizeStatus(selectedRequest.status);
                  return (
                    <Tag color={statusColors[normalized] || "default"}>
                      {statusDisplayMap[normalized] ||
                        selectedRequest.status ||
                        "PENDING"}
                    </Tag>
                  );
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="Ưu tiên">
                <Tag color={priorityColors[selectedRequest.priority] || "default"}>
                  {selectedRequest.priority === "LOW" && "Thấp"}
                  {selectedRequest.priority === "MEDIUM" && "Trung bình"}
                  {selectedRequest.priority === "HIGH" && "Cao"}
                  {selectedRequest.priority === "CRITICAL" && "Khẩn cấp"}
                  {!["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(selectedRequest.priority) && (selectedRequest.priority || "CHƯA CÓ")}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Mã xe">
                <span className="font-mono text-sm">
                  {selectedRequest.vehicleId || "N/A"}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Mã kỹ thuật viên">
                <span className="font-mono text-sm">
                  {selectedRequest.technicianId || "Chưa phân công"}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Mô tả sự cố" span={2}>
                <div className="bg-gray-50 p-3 rounded border">
                  {selectedRequest.issueDescription || "N/A"}
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">
                {selectedRequest.createdAt
                  ? dayjs(selectedRequest.createdAt).format("DD/MM/YYYY HH:mm")
                  : "-"}
              </Descriptions.Item>
              {selectedRequest.approvedAt && (
                <Descriptions.Item label="Ngày duyệt">
                  {dayjs(selectedRequest.approvedAt).format("DD/MM/YYYY HH:mm")}
                </Descriptions.Item>
              )}
              {selectedRequest.updatedAt && (
                <Descriptions.Item label="Ngày cập nhật">
                  {dayjs(selectedRequest.updatedAt).format("DD/MM/YYYY HH:mm")}
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* Thông tin chi nhánh */}
            {selectedRequest.branch && (
              <Descriptions title="Thông tin chi nhánh" bordered column={2}>
                <Descriptions.Item label="Tên chi nhánh">
                  <span className="font-semibold text-blue-600">
                    {selectedRequest.branch.branchName || "N/A"}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Mã chi nhánh">
                  <span className="font-mono text-sm">
                    {selectedRequest.branch.id || "N/A"}
                  </span>
                </Descriptions.Item>
                {selectedRequest.branch.address && (
                  <Descriptions.Item label="Địa chỉ" span={2}>
                    {selectedRequest.branch.address}
                  </Descriptions.Item>
                )}
                {selectedRequest.branch.city && (
                  <Descriptions.Item label="Thành phố">
                    {selectedRequest.branch.city}
                  </Descriptions.Item>
                )}
                {selectedRequest.branch.phone && (
                  <Descriptions.Item label="Số điện thoại">
                    {selectedRequest.branch.phone}
                  </Descriptions.Item>
                )}
                {selectedRequest.branch.email && (
                  <Descriptions.Item label="Email liên hệ">
                    {selectedRequest.branch.email}
                  </Descriptions.Item>
                )}
              </Descriptions>
            )}

            {/* Thông tin xe */}
            {selectedRequest.vehicle && (
              <Descriptions title="Thông tin xe" bordered column={2}>
                <Descriptions.Item label="Biển số">
                  <span className="font-semibold text-green-600">
                    {selectedRequest.vehicle.licensePlate ||
                      selectedRequest.vehicleId ||
                      "N/A"}
                  </span>
                </Descriptions.Item>
                {selectedRequest.vehicle.color && (
                  <Descriptions.Item label="Màu sắc">
                    {selectedRequest.vehicle.color}
                  </Descriptions.Item>
                )}
                {selectedRequest.vehicle.vehicleModel && (
                  <>
                    <Descriptions.Item label="Model">
                      {selectedRequest.vehicle.vehicleModel.modelName || "N/A"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Phân loại">
                      {selectedRequest.vehicle.vehicleModel.category || "N/A"}
                    </Descriptions.Item>
                  </>
                )}
                {selectedRequest.vehicle.currentOdometerKm !== undefined && (
                  <Descriptions.Item label="Odo hiện tại">
                    {selectedRequest.vehicle.currentOdometerKm} km
                  </Descriptions.Item>
                )}
                {selectedRequest.vehicle.status && (
                  <Descriptions.Item label="Trạng thái xe">
                    {selectedRequest.vehicle.status}
                  </Descriptions.Item>
                )}
              </Descriptions>
            )}

            {/* Form cập nhật trạng thái */}
            <Form layout="vertical" form={statusForm}>
              <Form.Item
                name="status"
                label="Cập nhật trạng thái"
                rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
              >
                <Select
                  options={technicianStatusOptions.map((status) => {
                    const statusMap: Record<string, string> = {
                      ASSIGNED: "Đã phân công",
                      IN_PROGRESS: "Đang xử lý",
                      COMPLETED: "Hoàn thành",
                    };
                    return {
                      label: statusMap[status] || status,
                      value: status,
                    };
                  })}
                />
              </Form.Item>
            </Form>
          </div>
        ) : (
          <p className="text-gray-500">Không tìm thấy dữ liệu yêu cầu.</p>
        )}
      </Modal>

      <Modal
        title="Tạo yêu cầu sửa chữa"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={handleCreateRequest}
        okText="Gửi yêu cầu"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" initialValues={{ priority: "MEDIUM" }}>
          <Form.Item
            name="vehicleId"
            label="Xe cần sửa chữa"
            rules={[{ required: true, message: "Vui lòng chọn xe" }]}
          >
            <Select
              showSearch
              placeholder={
                vehicleLoading ? "Đang tải danh sách xe..." : "Chọn xe cần báo lỗi"
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
            name="issueDescription"
            label="Mô tả sự cố"
            rules={[
              { required: true, message: "Vui lòng mô tả chi tiết" },
              { min: 10, message: "Mô tả tối thiểu 10 ký tự" },
            ]}
          >
            <TextArea rows={4} placeholder="Ví dụ: Đèn pha không sáng..." />
          </Form.Item>

          <Alert
            type="info"
            showIcon
            message="Yêu cầu sẽ được gửi lên hệ thống để quản lý phê duyệt."
          />
        </Form>
      </Modal>
    </div>
  );
}

