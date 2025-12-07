"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
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
  getRepairRequestById,
} from "@/services/repair_request_service";
import { getVehicleById } from "../fleet/fleet_service";
import { getStaffs } from "../../admin/staffs/staff_service";

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
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [techLoading, setTechLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const [form] = Form.useForm();

  const loadRequests = async (page = pagination.current, pageSize = pagination.pageSize, vehiclesList?: any[], techniciansList?: any[]) => {
    try {
      setLoading(true);
      const res = await getBranchRepairRequests({
        pageNum: page,
        pageSize,
        orderByDesc: true,
      });
      const items = res.items ?? [];
      
      // Sử dụng vehiclesList nếu có, nếu không thì dùng state vehicles
      const vehiclesToUse = vehiclesList || vehicles;
      // Sử dụng techniciansList nếu có, nếu không thì dùng state technicians
      const techniciansToUse = techniciansList || technicians;
      
      // Enrich requests với licensePlate từ vehicleId và technician info từ technicianId
      const enrichedItems = await Promise.all(
        items.map(async (request: any) => {
          let enrichedRequest = { ...request };
          
          // Enrich với licensePlate từ vehicleId
          const vehicleId = request.vehicleId || request.vehicle?.id || request.vehicle?.vehicleId;
          if (vehicleId) {
            try {
              // Thử tìm trong danh sách vehicles đã load trước
              const vehicleFromList = vehiclesToUse.find(
                (v: any) => (v.id || v.vehicleId) === vehicleId
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
              } else {
                // Nếu không có trong list, fetch vehicle detail
                const vehicleDetail = await getVehicleById(vehicleId);
                if (vehicleDetail?.licensePlate) {
                  enrichedRequest = {
                    ...enrichedRequest,
                    vehicleLicensePlate: vehicleDetail.licensePlate,
                    vehicle: {
                      ...enrichedRequest.vehicle,
                      licensePlate: vehicleDetail.licensePlate,
                    },
                  };
                }
              }
            } catch (err) {
              console.warn(`Failed to fetch vehicle ${vehicleId}:`, err);
            }
          }
          
          // Enrich với technician info từ technicianId
          if (request.technicianId && techniciansToUse.length > 0) {
            const technician = techniciansToUse.find(
              (tech: any) => tech.staff?.id === request.technicianId || tech.id === request.technicianId
            );
            if (technician) {
              enrichedRequest = {
                ...enrichedRequest,
                staff: {
                  id: technician.staff?.id || technician.id,
                  fullname: technician.fullname || technician.staff?.fullName || technician.staff?.account?.fullname,
                  fullName: technician.fullname || technician.staff?.fullName || technician.staff?.account?.fullname,
                  account: technician.staff?.account || technician.account,
                },
                technician: {
                  id: technician.staff?.id || technician.id,
                  fullname: technician.fullname || technician.staff?.fullName || technician.staff?.account?.fullname,
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
      const vehiclesList = Array.isArray(data) ? data : [];
      setVehicles(vehiclesList);
      return vehiclesList;
    } catch (err: any) {
      console.error(err);
      message.warning("Không thể tải danh sách xe của chi nhánh");
      setVehicles([]);
      return [];
    } finally {
      setVehicleLoading(false);
    }
  };

  const loadTechnicians = async () => {
    try {
      setTechLoading(true);
      const data = await getStaffs();
      const filtered = data.filter(
        (account: any) => account.role?.toUpperCase() === "TECHNICIAN"
      );
      setTechnicians(filtered);
      return filtered;
    } catch (err: any) {
      console.error(err);
      message.warning("Không thể tải danh sách kỹ thuật viên");
      setTechnicians([]);
      return [];
    } finally {
      setTechLoading(false);
    }
  };

  useEffect(() => {
    // Load vehicles và technicians trước để có data khi enrich requests
    Promise.all([
      loadVehicles(),
      loadTechnicians(),
    ]).then(([vehiclesData, techniciansData]) => {
      const vehiclesList = Array.isArray(vehiclesData) ? vehiclesData : [];
      const techniciansList = Array.isArray(techniciansData) ? techniciansData : [];
      setVehicles(vehiclesList);
      setTechnicians(techniciansList);
      loadRequests(1, 10, vehiclesList, techniciansList);
    });
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

  const parseChecklist = (checklist: any): any => {
    if (!checklist) return null;
    
    if (typeof checklist === "string") {
      try {
        const parsed = JSON.parse(checklist);
        return parsed;
      } catch (e) {
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
    
    return checklist;
  };

  const handleOpenDetail = async (record: any) => {
    try {
      setDetailLoading(true);
      setDetailModalOpen(true);
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
      title: "Biển số xe",
      key: "vehicle",
      render: (_: any, record: any) => {
        // Ưu tiên lấy licensePlate từ các nguồn khác nhau
        const licensePlate = 
          record.vehicleLicensePlate ||
          record.vehicle?.licensePlate ||
          record.assignedVehicle?.licensePlate ||
          record.licensePlate;
        
        if (licensePlate && licensePlate.length <= 20) {
          return <span className="font-medium">{licensePlate}</span>;
        }
        
        return <span className="text-gray-400">N/A</span>;
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h1 className="text-xl font-semibold text-gray-800">Quản lý sửa chữa</h1>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => loadRequests()}>
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalOpen(true)}
            size="middle"
          >
            Tạo yêu cầu sửa chữa
          </Button>
        </Space>
      </div>

      {/* Table */}
      <Card className="shadow-sm border-0">
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
          size="middle"
        />
      </Card>

      <Modal
        title="Tạo yêu cầu sửa chữa"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        okText="Tạo yêu cầu"
        onOk={handleCreate}
        destroyOnHidden
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
        onCancel={() => {
          setDetailModalOpen(false);
          setSelectedRequest(null);
        }}
        width={900}
        loading={detailLoading}
        centered
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
                  {!["PENDING", "REVIEWING", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"].includes(selectedRequest.status) && (selectedRequest.status || "PENDING")}
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

            {/* Thông tin xe */}
            {selectedRequest.vehicle && (
              <Descriptions title="Thông tin xe" bordered column={2}>
                <Descriptions.Item label="Biển số">
                  <span className="font-semibold text-blue-600">
                    {selectedRequest.vehicle.licensePlate || "N/A"}
                  </span>
                </Descriptions.Item>
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
              </Descriptions>
            )}
          </div>
        ) : (
          <p className="text-gray-500">Không tìm thấy dữ liệu yêu cầu.</p>
        )}
      </Modal>
    </div>
  );
}

