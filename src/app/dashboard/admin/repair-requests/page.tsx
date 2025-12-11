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
  getRepairRequestById,
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
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assigningRequest, setAssigningRequest] = useState<any | null>(null);
  const [technicians, setTechnicians] = useState<Account[]>([]);
  const [techLoading, setTechLoading] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [searchText, setSearchText] = useState("");
  const [assignForm] = Form.useForm();

  useEffect(() => {
    // Set loading = true ngay từ đầu để hiển thị loading indicator
    setLoading(true);
    
    // Load tất cả data song song để tăng tốc độ
    const initializeData = async () => {
      try {
        // Load branches và technicians song song (không cần đợi nhau)
        const [techniciansData] = await Promise.all([
          loadTechnicians(),
          loadBranches(),
        ]);
        
        // Sau khi cả hai đã load xong, load requests với technicians data
        await loadRequests(1, 10, techniciansData);
      } catch (err) {
        console.error("Error initializing data:", err);
        setLoading(false);
      }
    };
    initializeData();
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
    pageSize = pagination.pageSize,
    techniciansList?: Account[]
  ) => {
    try {
      setLoading(true);
      const res = await getRepairRequests({
        pageNum: page,
        pageSize,
        orderByDesc: true,
      });
      const items = res.items ?? [];
      
      // Sử dụng techniciansList nếu có, nếu không thì dùng state technicians
      const techniciansToUse = techniciansList || technicians;
      
      // Enrich với thông tin technician từ danh sách technicians
      const enrichedItems = items.map((item: any) => {
        if (item.technicianId && techniciansToUse.length > 0) {
          const technician = techniciansToUse.find(
            (tech) => tech.staff?.id === item.technicianId || tech.id === item.technicianId
          );
          if (technician) {
            return {
              ...item,
              staff: {
                id: technician.staff?.id || technician.id,
                fullname: technician.fullname || (technician as any)?.staff?.fullName || (technician as any)?.staff?.account?.fullname,
                fullName: technician.fullname || (technician as any)?.staff?.fullName || (technician as any)?.staff?.account?.fullname,
                account: (technician as any)?.staff?.account || (technician as any)?.account,
              },
              technician: {
                id: technician.staff?.id || technician.id,
                fullname: technician.fullname || (technician as any)?.staff?.fullName || (technician as any)?.staff?.account?.fullname,
              },
            };
          }
        }
        return item;
      });
      
      setRequests(enrichedItems);
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
      return filtered;
    } catch (err: any) {
      console.error(err);
      message.error("Không thể tải danh sách kỹ thuật viên");
      setTechnicians([]);
      return [];
    } finally {
      setTechLoading(false);
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
    } catch (err: any) {
      console.error("Error loading repair request detail:", err);
      message.error(err.message || "Không thể tải chi tiết yêu cầu sửa chữa");
      // Fallback: dùng data từ table
      setSelectedRequest(record);
    } finally {
      setDetailLoading(false);
    }
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
      message.success("Phân công kỹ thuật viên thành công");
      setAssignOpen(false);
      setAssigningRequest(null);
      // Reload với pagination hiện tại
      await loadRequests(pagination.current, pagination.pageSize);
    } catch (err: any) {
      if (err?.errorFields) return;
      console.error(err);
      message.error(err.message || "Không thể cập nhật yêu cầu");
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest?.id) return;
    try {
      // API chỉ nhận id, priority, status, staffId
      // Set status thành ASSIGNED sau khi phê duyệt (có thể phân công sau)
      await updateRepairRequest({
        id: selectedRequest.id,
        status: "ASSIGNED", // Sau khi phê duyệt, status sẽ là ASSIGNED
        priority: selectedRequest.priority || "MEDIUM",
      });
      message.success("Đã phê duyệt yêu cầu sửa chữa");
      setDetailOpen(false);
      setSelectedRequest(null);
      // Reload với pagination hiện tại
      await loadRequests(pagination.current, pagination.pageSize);
    } catch (err: any) {
      console.error(err);
      message.error(err.message || "Không thể phê duyệt yêu cầu");
    }
  };

  const technicianOptions = technicians.map((tech) => ({
    label:
      tech.fullname ||
      tech.username ||
      (tech as any)?.staff?.fullName ||
      (tech as any)?.staff?.account?.fullname ||
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

  const columns: ColumnsType<any> = [
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
      render: (status: string, record: any) => {
        const statusText = status || "PENDING";
        const statusMap: Record<string, string> = {
          PENDING: "Chờ xử lý",
          REVIEWING: "Đang xem xét",
          ASSIGNED: record?.approvedAt ? "Đã phê duyệt" : "Đã phân công",
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
      title: "Ngày duyệt",
      dataIndex: "approvedAt",
      key: "approvedAt",
      width: 150,
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
      width: 180,
      fixed: "right" as const,
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
        <h1 className="text-3xl font-bold text-gray-800">
          Quản lý yêu cầu sửa chữa
        </h1>
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
        onCancel={() => {
          setDetailOpen(false);
          setSelectedRequest(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setDetailOpen(false);
            setSelectedRequest(null);
          }}>
            Đóng
          </Button>,
          !selectedRequest?.approvedAt && (
            <Button
              key="approve"
              type="primary"
              onClick={handleApprove}
              className="bg-green-600 hover:bg-green-700 border-0"
            >
              Phê duyệt
            </Button>
          ),
        ].filter(Boolean)}
        width={900}
        loading={detailLoading}
      >
        {selectedRequest ? (
          <div className="space-y-6">
            {/* Thông tin cơ bản */}
            <Descriptions title="Thông tin cơ bản" bordered column={2}>
              <Descriptions.Item label="Mã yêu cầu">
                <span className="font-mono text-sm">{selectedRequest.id}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={statusColors[selectedRequest.status] || "default"}>
                  {selectedRequest.status === "PENDING" && "Chờ xử lý"}
                  {selectedRequest.status === "REVIEWING" && "Đang xem xét"}
                  {selectedRequest.status === "ASSIGNED" && (selectedRequest.approvedAt ? "Đã phê duyệt" : "Đã phân công")}
                  {selectedRequest.status === "IN_PROGRESS" && "Đang xử lý"}
                  {selectedRequest.status === "COMPLETED" && "Hoàn thành"}
                  {selectedRequest.status === "CANCELLED" && "Đã hủy"}
                  {!["PENDING", "REVIEWING", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"].includes(selectedRequest.status) && selectedRequest.status}
                </Tag>
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
            </Descriptions>

            {/* Checklist */}
            {selectedRequest.checklist && Object.keys(selectedRequest.checklist).length > 0 ? (
              <Descriptions title="Checklist kiểm tra" bordered column={2} className="mt-4">
                {selectedRequest.checklist.oil && (
                  <Descriptions.Item label="Dầu máy">
                    <Tag color={selectedRequest.checklist.oil === "done" ? "green" : "default"}>
                      {selectedRequest.checklist.oil === "done" ? "Đã kiểm tra" : selectedRequest.checklist.oil}
                    </Tag>
                  </Descriptions.Item>
                )}
                {selectedRequest.checklist.engine_check !== undefined && (
                  <Descriptions.Item label="Kiểm tra động cơ">
                    <Tag color={selectedRequest.checklist.engine_check ? "green" : "red"}>
                      {selectedRequest.checklist.engine_check ? "Đã kiểm tra" : "Chưa kiểm tra"}
                    </Tag>
                  </Descriptions.Item>
                )}
                {selectedRequest.checklist.extra && 
                 Object.keys(selectedRequest.checklist.extra).length > 0 && (
                  <Descriptions.Item label="Thông tin bổ sung" span={2}>
                    <div className="bg-gray-50 p-3 rounded border">
                      {selectedRequest.checklist.extra.time && (
                        <p className="mb-1">
                          <span className="font-semibold">Thời gian:</span> {selectedRequest.checklist.extra.time}
                        </p>
                      )}
                      {selectedRequest.checklist.extra.technician && (
                        <p>
                          <span className="font-semibold">Kỹ thuật viên:</span> {selectedRequest.checklist.extra.technician}
                        </p>
                      )}
                      {Object.keys(selectedRequest.checklist.extra).length > 0 && 
                       !selectedRequest.checklist.extra.time && 
                       !selectedRequest.checklist.extra.technician && (
                        <pre className="text-xs whitespace-pre-wrap">
                          {JSON.stringify(selectedRequest.checklist.extra, null, 2)}
                        </pre>
                      )}
                    </div>
                  </Descriptions.Item>
                )}
                {selectedRequest.checklist.notes && 
                 Array.isArray(selectedRequest.checklist.notes) && 
                 selectedRequest.checklist.notes.length > 0 && (
                  <Descriptions.Item label="Ghi chú" span={2}>
                    <div className="bg-gray-50 p-3 rounded border">
                      <ul className="list-disc list-inside space-y-1">
                        {selectedRequest.checklist.notes.map((note: string, index: number) => (
                          <li key={index} className="text-gray-700">{note}</li>
                        ))}
                      </ul>
                    </div>
                  </Descriptions.Item>
                )}
              </Descriptions>
            ) : (
              <Descriptions title="Checklist kiểm tra" bordered column={2} className="mt-4">
                <Descriptions.Item span={2}>
                  <span className="text-gray-400 italic">Chưa có thông tin checklist</span>
                </Descriptions.Item>
              </Descriptions>
            )}

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
                  <Descriptions.Item label="Email">
                    {selectedRequest.branch.email}
                  </Descriptions.Item>
                )}
                {(selectedRequest.branch.openingTime || selectedRequest.branch.closingTime) && (
                  <Descriptions.Item label="Giờ mở cửa">
                    {selectedRequest.branch.openingTime || "N/A"} - {selectedRequest.branch.closingTime || "N/A"}
                  </Descriptions.Item>
                )}
                {(selectedRequest.branch.latitude || selectedRequest.branch.longitude) && (
                  <Descriptions.Item label="Tọa độ">
                    {selectedRequest.branch.latitude && selectedRequest.branch.longitude
                      ? `${selectedRequest.branch.latitude}, ${selectedRequest.branch.longitude}`
                      : "N/A"}
                  </Descriptions.Item>
                )}
              </Descriptions>
            )}
          </div>
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
        destroyOnHidden
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

