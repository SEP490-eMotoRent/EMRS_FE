"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from "antd";
import { ReloadOutlined, EyeOutlined, EditOutlined } from "@ant-design/icons";
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
  const [updateOpen, setUpdateOpen] = useState(false);
  const [updatingRequest, setUpdatingRequest] = useState<any | null>(null);
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
    // Load vehicles trước, sau đó load requests để có thể enrich vehicle data
    loadVehicles().then((vehiclesList) => {
      loadRequests(pagination.current, pagination.pageSize, vehiclesList);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [technicianId]);

  const loadRequests = async (
    page = pagination.current,
    pageSize = pagination.pageSize,
    vehiclesToUse: any[] = vehicles
  ) => {
    if (!technicianId) return;
    try {
      setLoading(true);
      const res = await getTechnicianRepairRequests(technicianId, {
        pageNum: page,
        pageSize,
        orderByDesc: true,
      });
      
      // Enrich requests với vehicle licensePlate từ danh sách vehicles
      const enrichedItems = await Promise.all(
        (res.items ?? []).map(async (request: any) => {
          let enrichedRequest = { ...request };
          
          // Enrich với vehicle licensePlate từ vehicleId
          if (request.vehicleId && vehiclesToUse.length > 0) {
            const vehicleFromList = vehiclesToUse.find((v: any) => 
              v.id === request.vehicleId || 
              v.vehicleId === request.vehicleId
            );
            if (vehicleFromList?.licensePlate) {
              enrichedRequest = {
                ...enrichedRequest,
                vehicleLicensePlate: vehicleFromList.licensePlate,
                vehicle: {
                  ...enrichedRequest.vehicle,
                  licensePlate: vehicleFromList.licensePlate,
                },
              };
            }
          }
          
          return enrichedRequest;
        })
      );
      
      setRequests(enrichedItems);
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

  const loadVehicles = async (): Promise<any[]> => {
    try {
      setVehicleLoading(true);
      const data = await getBranchVehicles({ pageSize: 500 });
      const vehiclesList = Array.isArray(data) ? data : [];
      setVehicles(vehiclesList);
      return vehiclesList;
    } catch (err: any) {
      console.error(err);
      message.warning("Không thể tải danh sách xe để tạo yêu cầu");
      const emptyList: any[] = [];
      setVehicles(emptyList);
      return emptyList;
    } finally {
      setVehicleLoading(false);
    }
  };

  const handleTableChange = (config: any) => {
    loadRequests(config.current, config.pageSize, vehicles);
  };

  const parseChecklist = (checklist: any): any => {
    if (!checklist) return null;
    
    // Nếu là string, parse nó
    if (typeof checklist === "string") {
      try {
        // Thử parse trực tiếp
        const parsed = JSON.parse(checklist);
        return parsed;
      } catch (e) {
        // Nếu parse thất bại, có thể là string đã bị double-encoded
        // Thử parse lại một lần nữa
        try {
          const firstParse = JSON.parse(checklist);
          if (typeof firstParse === "string") {
            return JSON.parse(firstParse);
          }
          return firstParse;
        } catch (e2) {
          console.error("Error parsing checklist:", e2);
          return null;
        }
      }
    }
    
    // Nếu đã là object, trả về trực tiếp
    return checklist;
  };

  const openDetail = async (record: any) => {
    try {
      setDetailLoading(true);
      setDetailOpen(true);
      // Load chi tiết từ API để có đầy đủ thông tin
      const detail = await getRepairRequestById(record.id);
      
      // Parse checklist nếu cần
      if (detail.checklist) {
        detail.checklist = parseChecklist(detail.checklist);
      }
      
      setSelectedRequest(detail);
    } catch (err: any) {
      console.error("Error loading repair request detail:", err);
      message.error(err.message || "Không thể tải chi tiết yêu cầu sửa chữa");
      // Fallback: dùng data từ table
      const recordWithParsedChecklist = { ...record };
      if (record.checklist) {
        recordWithParsedChecklist.checklist = parseChecklist(record.checklist);
      }
      setSelectedRequest(recordWithParsedChecklist);
    } finally {
      setDetailLoading(false);
    }
  };

  const openUpdate = async (record: any) => {
    try {
      setUpdateOpen(true);
      // Load chi tiết từ API để có đầy đủ thông tin
      const detail = await getRepairRequestById(record.id);
      setUpdatingRequest(detail);
      const normalized = normalizeStatus(detail.status || record.status || "ASSIGNED");
      
      // Set form values cho status và checklist
      statusForm.setFieldsValue({
        status: normalized,
        checklist_battery: detail.checklist?.battery || "",
        checklist_motor: detail.checklist?.motor || "",
        checklist_brake: detail.checklist?.brake || "",
        checklist_lighting: detail.checklist?.lighting || "",
        checklist_controller: detail.checklist?.controller !== undefined ? detail.checklist.controller : false,
        checklist_tires: detail.checklist?.tires || "",
        checklist_notes: detail.checklist?.notes 
          ? (Array.isArray(detail.checklist.notes) 
              ? detail.checklist.notes.join("\n") 
              : detail.checklist.notes)
          : "",
      });
    } catch (err: any) {
      console.error("Error loading repair request for update:", err);
      message.error(err.message || "Không thể tải thông tin yêu cầu");
      // Fallback: dùng data từ table
      setUpdatingRequest(record);
      const normalized = normalizeStatus(record.status || "ASSIGNED");
      statusForm.setFieldsValue({
        status: normalized,
        checklist_battery: record.checklist?.battery || "",
        checklist_motor: record.checklist?.motor || "",
        checklist_brake: record.checklist?.brake || "",
        checklist_lighting: record.checklist?.lighting || "",
        checklist_controller: record.checklist?.controller !== undefined ? record.checklist.controller : false,
        checklist_tires: record.checklist?.tires || "",
        checklist_notes: record.checklist?.notes 
          ? (Array.isArray(record.checklist.notes) 
              ? record.checklist.notes.join("\n") 
              : record.checklist.notes)
          : "",
      });
    }
  };

  const handleStatusUpdate = async () => {
    const requestToUpdate = updatingRequest || selectedRequest;
    if (!requestToUpdate?.id) return;
    try {
      const values = await statusForm.validateFields();
      const apiStatus = toPascalCaseStatus(values.status);
      
      // Tạo checklist object từ form values (phù hợp với xe máy điện)
      const checklist: any = {
        ...(requestToUpdate.checklist || {}),
      };
      
      // Cập nhật battery nếu có
      if (values.checklist_battery !== undefined && values.checklist_battery !== null && values.checklist_battery !== "") {
        checklist.battery = values.checklist_battery;
      }
      
      // Cập nhật motor nếu có
      if (values.checklist_motor !== undefined && values.checklist_motor !== null && values.checklist_motor !== "") {
        checklist.motor = values.checklist_motor;
      }
      
      // Cập nhật brake nếu có
      if (values.checklist_brake !== undefined && values.checklist_brake !== null && values.checklist_brake !== "") {
        checklist.brake = values.checklist_brake;
      }
      
      // Cập nhật lighting nếu có
      if (values.checklist_lighting !== undefined && values.checklist_lighting !== null && values.checklist_lighting !== "") {
        checklist.lighting = values.checklist_lighting;
      }
      
      // Cập nhật controller nếu có
      if (values.checklist_controller !== undefined) {
        checklist.controller = values.checklist_controller;
      }
      
      // Cập nhật tires nếu có
      if (values.checklist_tires !== undefined && values.checklist_tires !== null && values.checklist_tires !== "") {
        checklist.tires = values.checklist_tires;
      }
      
      // Cập nhật notes nếu có
      if (values.checklist_notes && values.checklist_notes.trim()) {
        // Chia notes thành array (mỗi dòng là một note)
        checklist.notes = values.checklist_notes
          .split("\n")
          .map((note: string) => note.trim())
          .filter((note: string) => note.length > 0);
      }
      
      // Thêm extra info nếu cần
      if (!checklist.extra) {
        checklist.extra = {};
      }
      checklist.extra.time = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
      
      // Đảm bảo checklist luôn có ít nhất một field
      // Nếu checklist rỗng, tạo object mặc định
      const finalChecklist = Object.keys(checklist).length > 0 
        ? checklist 
        : { status: apiStatus };
      
      console.log("Checklist object:", finalChecklist);
      console.log("Checklist JSON string:", JSON.stringify(finalChecklist));
      
      await updateTechnicianRepairRequest(requestToUpdate.id, {
        status: apiStatus,
        checklist: finalChecklist,
      });
      message.success("Đã cập nhật trạng thái yêu cầu");
      setUpdateOpen(false);
      setUpdatingRequest(null);
      setDetailOpen(false);
      setSelectedRequest(null);
      statusForm.resetFields();
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
        status: "Pending", // API có thể cần "Pending" hoặc "PENDING", thử "Pending" trước
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
        title: "Biển số xe",
        key: "vehicle",
        width: 180,
        render: (_: any, record: any) => {
          // Ưu tiên lấy licensePlate từ record trực tiếp
          let licensePlate = 
            record.vehicleLicensePlate ||
            record.vehicle?.licensePlate ||
            record.assignedVehicle?.licensePlate ||
            record.licensePlate;
          
          // Nếu không có, tìm trong danh sách vehicles dựa trên vehicleId
          if ((!licensePlate || licensePlate.length > 20) && record.vehicleId && vehicles.length > 0) {
            const vehicleFromList = vehicles.find((v: any) => 
              v.id === record.vehicleId || 
              v.vehicleId === record.vehicleId
            );
            if (vehicleFromList?.licensePlate) {
              licensePlate = vehicleFromList.licensePlate;
            }
          }
          
          // Nếu vẫn không có hoặc là UUID, hiển thị N/A
          if (!licensePlate || licensePlate.length > 20) {
            return <span className="text-gray-400 italic">N/A</span>;
          }
          
          const vehicle = record.vehicle || record.assignedVehicle;
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
        width: 180,
        render: (_: any, record: any) => (
          <Space size="small">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => openDetail(record)}
              className="px-2 text-indigo-600 hover:text-indigo-700"
            >
              Chi tiết
            </Button>
            <Button
              type="link"
              onClick={() => openUpdate(record)}
              className="px-2 text-purple-600 hover:text-purple-700"
            >
              Sửa
            </Button>
          </Space>
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý sửa chữa</h1>
        <div className="flex gap-2">
          <Button
            type="primary"
            disabled={!technicianId}
            onClick={() => {
              createForm.resetFields();
              setCreateOpen(true);
            }}
            size="middle"
            className="bg-gradient-to-r from-indigo-600 to-purple-600 border-0 hover:from-indigo-700 hover:to-purple-700 shadow-md"
          >
            Tạo yêu cầu
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => loadRequests()}
            disabled={!technicianId}
            size="middle"
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

      {/* Table */}
      <Card className="shadow-sm border-0">
        <Table
          rowKey="id"
          loading={loading}
          dataSource={requests}
          columns={columns}
          size="middle"
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
      </Card>

      <Modal
        title={
          <span className="text-lg font-semibold text-gray-800">
            Chi tiết yêu cầu sửa chữa
          </span>
        }
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
            className="rounded-lg"
          >
            Đóng
          </Button>,
        ]}
        width={900}
        loading={detailLoading}
        centered
        styles={{
          content: {
            borderRadius: '12px',
          },
        }}
      >
        {selectedRequest ? (
          <div className="space-y-6">
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

            {/* Checklist */}
            {(() => {
              const checklist = selectedRequest.checklist 
                ? (typeof selectedRequest.checklist === "string" 
                    ? parseChecklist(selectedRequest.checklist) 
                    : selectedRequest.checklist)
                : null;
              
              const hasChecklist = checklist && 
                typeof checklist === "object" && 
                Object.keys(checklist).length > 0;
              
              if (!hasChecklist) {
                return (
                  <Descriptions title="Checklist kiểm tra" bordered column={2}>
                    <Descriptions.Item span={2}>
                      <span className="text-gray-400 italic">Chưa có thông tin checklist</span>
                    </Descriptions.Item>
                  </Descriptions>
                );
              }
              
              // Map các giá trị checklist để hiển thị
              const batteryMap: Record<string, string> = {
                normal: "Bình thường",
                weak: "Yếu",
                need_replace: "Cần thay",
                replaced: "Đã thay",
              };
              
              const motorMap: Record<string, string> = {
                normal: "Bình thường",
                abnormal_sound: "Có tiếng kêu lạ",
                overheating: "Quá nóng",
                need_repair: "Cần sửa chữa",
              };
              
              const brakeMap: Record<string, string> = {
                normal: "Bình thường",
                weak: "Yếu",
                need_adjust: "Cần điều chỉnh",
                need_replace: "Cần thay",
              };
              
              const lightingMap: Record<string, string> = {
                normal: "Bình thường",
                headlight_off: "Đèn pha không sáng",
                turn_signal_off: "Đèn xi-nhan không hoạt động",
                need_replace: "Cần thay bóng đèn",
              };
              
              const tiresMap: Record<string, string> = {
                normal: "Bình thường",
                worn: "Mòn",
                low_pressure: "Non hơi",
                need_replace: "Cần thay",
              };
              
              return (
                <Descriptions title="Checklist kiểm tra" bordered column={2}>
                  {/* Format mới cho xe máy điện */}
                  {checklist.battery && (
                    <Descriptions.Item label="Pin">
                      <Tag color={checklist.battery === "normal" ? "green" : checklist.battery === "weak" ? "orange" : "red"}>
                        {batteryMap[checklist.battery] || checklist.battery}
                      </Tag>
                    </Descriptions.Item>
                  )}
                  {checklist.motor && (
                    <Descriptions.Item label="Động cơ điện">
                      <Tag color={checklist.motor === "normal" ? "green" : "orange"}>
                        {motorMap[checklist.motor] || checklist.motor}
                      </Tag>
                    </Descriptions.Item>
                  )}
                  {checklist.brake && (
                    <Descriptions.Item label="Hệ thống phanh">
                      <Tag color={checklist.brake === "normal" ? "green" : "orange"}>
                        {brakeMap[checklist.brake] || checklist.brake}
                      </Tag>
                    </Descriptions.Item>
                  )}
                  {checklist.lighting && (
                    <Descriptions.Item label="Hệ thống đèn">
                      <Tag color={checklist.lighting === "normal" ? "green" : "orange"}>
                        {lightingMap[checklist.lighting] || checklist.lighting}
                      </Tag>
                    </Descriptions.Item>
                  )}
                  {checklist.controller !== undefined && (
                    <Descriptions.Item label="Bộ điều khiển">
                      <Tag color={checklist.controller ? "green" : "red"}>
                        {checklist.controller ? "Đã kiểm tra" : "Chưa kiểm tra"}
                      </Tag>
                    </Descriptions.Item>
                  )}
                  {checklist.tires && (
                    <Descriptions.Item label="Lốp xe">
                      <Tag color={checklist.tires === "normal" ? "green" : "orange"}>
                        {tiresMap[checklist.tires] || checklist.tires}
                      </Tag>
                    </Descriptions.Item>
                  )}
                  
                  {/* Format cũ (backward compatibility) */}
                  {checklist.oil && (
                    <Descriptions.Item label="Dầu máy">
                      <Tag color={checklist.oil === "done" ? "green" : "default"}>
                        {checklist.oil === "done" ? "Đã kiểm tra" : checklist.oil}
                      </Tag>
                    </Descriptions.Item>
                  )}
                  {checklist.engine_check !== undefined && (
                    <Descriptions.Item label="Kiểm tra động cơ">
                      <Tag color={checklist.engine_check ? "green" : "red"}>
                        {checklist.engine_check ? "Đã kiểm tra" : "Chưa kiểm tra"}
                      </Tag>
                    </Descriptions.Item>
                  )}
                  
                  {/* Extra info */}
                  {checklist.extra && 
                   Object.keys(checklist.extra).length > 0 && (
                    <Descriptions.Item label="Thông tin bổ sung" span={2}>
                      <div className="bg-gray-50 p-3 rounded border">
                        {checklist.extra.time && (
                          <p className="mb-1">
                            <span className="font-semibold">Thời gian:</span> {checklist.extra.time}
                          </p>
                        )}
                        {checklist.extra.technician && (
                          <p>
                            <span className="font-semibold">Kỹ thuật viên:</span> {checklist.extra.technician}
                          </p>
                        )}
                        {Object.keys(checklist.extra).length > 0 && 
                         !checklist.extra.time && 
                         !checklist.extra.technician && (
                          <pre className="text-xs whitespace-pre-wrap">
                            {JSON.stringify(checklist.extra, null, 2)}
                          </pre>
                        )}
                      </div>
                    </Descriptions.Item>
                  )}
                  
                  {/* Notes */}
                  {checklist.notes && 
                   Array.isArray(checklist.notes) && 
                   checklist.notes.length > 0 && (
                    <Descriptions.Item label="Ghi chú" span={2}>
                      <div className="bg-gray-50 p-3 rounded border">
                        <ul className="list-disc list-inside space-y-1">
                          {checklist.notes.map((note: string, index: number) => (
                            <li key={index} className="text-gray-700">{note}</li>
                          ))}
                        </ul>
                      </div>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              );
            })()}
          </div>
        ) : (
          <p className="text-gray-500">Không tìm thấy dữ liệu yêu cầu.</p>
        )}
      </Modal>

      {/* Modal cập nhật trạng thái và checklist */}
      <Modal
        title={
          <span className="text-lg font-semibold text-gray-800">
            Cập nhật yêu cầu sửa chữa
          </span>
        }
        open={updateOpen}
        onCancel={() => {
          setUpdateOpen(false);
          setUpdatingRequest(null);
          statusForm.resetFields();
        }}
        onOk={handleStatusUpdate}
        okText="Cập nhật"
        cancelText="Hủy"
        destroyOnHidden
        width={600}
        centered
        confirmLoading={loading}
        okButtonProps={{
          className: "bg-gradient-to-r from-indigo-600 to-purple-600 border-0 hover:from-indigo-700 hover:to-purple-700",
        }}
        styles={{
          content: {
            borderRadius: '12px',
          },
        }}
      >
        {updatingRequest ? (
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded border">
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-semibold">Mã yêu cầu:</span> {updatingRequest.id}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Xe:</span>{" "}
                {updatingRequest.vehicle?.licensePlate ||
                  updatingRequest.assignedVehicle?.licensePlate ||
                  updatingRequest.vehicleLicensePlate ||
                  "N/A"}
              </p>
            </div>

            <Form layout="vertical" form={statusForm}>
              <Form.Item
                name="status"
                label="* Cập nhật trạng thái"
                rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
              >
                <Select
                  placeholder="Chọn trạng thái"
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

              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Checklist kiểm tra</h4>
                
                <Form.Item
                  name="checklist_battery"
                  label="Pin (Battery)"
                >
                  <Select
                    placeholder="Chọn trạng thái pin"
                    allowClear
                    options={[
                      { label: "Bình thường", value: "normal" },
                      { label: "Yếu", value: "weak" },
                      { label: "Cần thay", value: "need_replace" },
                      { label: "Đã thay", value: "replaced" },
                    ]}
                  />
                </Form.Item>

                <Form.Item
                  name="checklist_motor"
                  label="Động cơ điện"
                >
                  <Select
                    placeholder="Chọn trạng thái động cơ"
                    allowClear
                    options={[
                      { label: "Bình thường", value: "normal" },
                      { label: "Có tiếng kêu lạ", value: "abnormal_sound" },
                      { label: "Quá nóng", value: "overheating" },
                      { label: "Cần sửa chữa", value: "need_repair" },
                    ]}
                  />
                </Form.Item>

                <Form.Item
                  name="checklist_brake"
                  label="Hệ thống phanh"
                >
                  <Select
                    placeholder="Chọn trạng thái phanh"
                    allowClear
                    options={[
                      { label: "Bình thường", value: "normal" },
                      { label: "Yếu", value: "weak" },
                      { label: "Cần điều chỉnh", value: "need_adjust" },
                      { label: "Cần thay", value: "need_replace" },
                    ]}
                  />
                </Form.Item>

                <Form.Item
                  name="checklist_lighting"
                  label="Hệ thống đèn"
                >
                  <Select
                    placeholder="Chọn trạng thái đèn"
                    allowClear
                    options={[
                      { label: "Bình thường", value: "normal" },
                      { label: "Đèn pha không sáng", value: "headlight_off" },
                      { label: "Đèn xi-nhan không hoạt động", value: "turn_signal_off" },
                      { label: "Cần thay bóng đèn", value: "need_replace" },
                    ]}
                  />
                </Form.Item>

                <Form.Item
                  name="checklist_controller"
                  label="Bộ điều khiển"
                  valuePropName="checked"
                >
                  <div className="flex items-center gap-2">
                    <Switch />
                    <span className="text-sm text-gray-600">Đã kiểm tra bộ điều khiển</span>
                  </div>
                </Form.Item>

                <Form.Item
                  name="checklist_tires"
                  label="Lốp xe"
                >
                  <Select
                    placeholder="Chọn trạng thái lốp"
                    allowClear
                    options={[
                      { label: "Bình thường", value: "normal" },
                      { label: "Mòn", value: "worn" },
                      { label: "Non hơi", value: "low_pressure" },
                      { label: "Cần thay", value: "need_replace" },
                    ]}
                  />
                </Form.Item>

                <Form.Item
                  name="checklist_notes"
                  label="Ghi chú"
                >
                  <TextArea
                    rows={3}
                    placeholder="Nhập ghi chú (mỗi dòng là một ghi chú riêng)"
                  />
                </Form.Item>
              </div>
            </Form>
          </div>
        ) : (
          <p className="text-gray-500">Đang tải thông tin...</p>
        )}
      </Modal>

      <Modal
        title={
          <span className="text-lg font-semibold text-gray-800">
            Tạo yêu cầu sửa chữa
          </span>
        }
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={handleCreateRequest}
        okText="Gửi yêu cầu"
        cancelText="Hủy"
        destroyOnHidden
        width={600}
        centered
        okButtonProps={{
          className: "bg-gradient-to-r from-indigo-600 to-purple-600 border-0 hover:from-indigo-700 hover:to-purple-700",
        }}
        styles={{
          content: {
            borderRadius: '12px',
          },
        }}
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
              placeholder="Chọn mức độ ưu tiên"
              options={priorityOptions.map((priority) => {
                const priorityMap: Record<string, string> = {
                  LOW: "Thấp",
                  MEDIUM: "Trung bình",
                  HIGH: "Cao",
                  CRITICAL: "Khẩn cấp",
                };
                return {
                  label: `${priority} - ${priorityMap[priority] || priority}`,
                  value: priority,
                };
              })}
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

