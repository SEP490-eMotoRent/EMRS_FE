"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  Descriptions,
  Button,
  message,
  Modal,
  Form,
  Select,
  Space,
  Tag,
  Image,
  Spin,
} from "antd";
import {
  ArrowLeftOutlined,
  UserAddOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getTicketById,
  assignStaff,
  getBranchStaff,
  getBookingById,
  getStaffById,
} from "../ticket_service";

const { Option } = Select;

type TicketStatus = "Pending" | "Assigned" | "InProgress" | "Resolved";

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [form] = Form.useForm();
  const [ticket, setTicket] = useState<any>(null);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);

  const ticketId = params?.id as string;

  const loadStaffList = useCallback(async (branchNameOverride?: string, branchIdOverride?: string) => {
    try {
      // Lấy branchId và branchName từ cookie hoặc parameter
      let branchId: string | undefined = branchIdOverride;
      let branchName: string | undefined = branchNameOverride;
      
      // Lấy từ cookie
      if (typeof document !== "undefined") {
        const cookieStr = document.cookie || "";
        const cookies: Record<string, string> = {};
        cookieStr.split(";").forEach((c) => {
          const [key, value] = c.trim().split("=");
          if (key && value) {
            cookies[key] = decodeURIComponent(value);
          }
        });
        if (!branchId) {
          branchId = cookies.branchId || undefined;
        }
        // Chỉ dùng cookie branchName nếu chưa có branchNameOverride
        if (!branchName) {
          branchName = cookies.branchName || undefined;
        }
      }
      
      const staff = await getBranchStaff(branchName, branchId);
      setStaffList(staff);
    } catch (err: any) {
      console.error("Không thể tải danh sách staff:", err);
    }
  }, []);

  useEffect(() => {
    if (ticketId) {
      loadTicket();
    }
  }, [ticketId]);

  // Load staff list khi ticket đã được load hoặc khi branchName thay đổi
  useEffect(() => {
    if (ticketId) {
      loadStaffList(ticket?.branchName, ticket?.branchId);
    }
  }, [ticketId, ticket?.branchName, ticket?.branchId, loadStaffList]);

  const loadTicket = async () => {
    try {
      setLoading(true);
      const data = await getTicketById(ticketId);
      
      // Normalize data structure - xử lý cả PascalCase và camelCase
      const normalized: any = {
        id: data.id || data.ticketId || ticketId,
        status: data.status || data.Status || "Pending",
        ticketType: data.ticketType || data.TicketType || "",
        title: data.title || data.Title || "",
        description: data.description || data.Description || "",
        bookingId: data.bookingId || data.BookingId || "",
        staffId: data.staffId || null,
        currentLocation: data.currentLocation,
        latitude: data.latitude,
        longitude: data.longitude,
        createdAt: data.createdAt || data.CreatedAt,
        updatedAt: data.updatedAt || data.UpdatedAt,
        issueImages: data.issueImages || data.attachments || data.Attachments || [],
        resolutionNote: data.resolutionNote || data.resolutionNote,
      };
      
      // Lấy branchName từ cookie (fallback đầu tiên)
      let branchNameFromCookie: string | null = null;
      if (typeof document !== "undefined") {
        const cookieStr = document.cookie || "";
        const cookies: Record<string, string> = {};
        cookieStr.split(";").forEach((c) => {
          const [key, value] = c.trim().split("=");
          if (key && value) {
            cookies[key] = decodeURIComponent(value);
          }
        });
        branchNameFromCookie = cookies.branchName || null;
      }
      
      // Fetch booking info nếu có bookingId
      if (normalized.bookingId) {
        try {
          const booking = await getBookingById(normalized.bookingId);
          if (booking) {
            console.log("Booking data:", booking);
            // Lấy thông tin khách hàng từ booking
            normalized.renterName = booking.renter?.fullName || booking.renter?.account?.fullname || booking.renterName || data.renterName || data.renter?.fullName || data.renter?.account?.fullname;
            normalized.renterPhone = booking.renter?.phoneNumber || booking.renter?.phone || booking.renterPhone || data.renterPhone || data.renter?.phoneNumber || data.renter?.phone;
            normalized.renterEmail = booking.renter?.email || booking.renter?.account?.username || booking.renterEmail || data.renterEmail || data.renter?.email || data.renter?.account?.username;
            
            // Lấy thông tin xe từ booking
            normalized.vehicleModelName = booking.vehicle?.vehicleModel?.modelName || booking.vehicleModelName || data.vehicleModelName || data.vehicleModel?.modelName;
            normalized.licensePlate = booking.vehicle?.licensePlate || booking.licensePlate || data.licensePlate || data.vehicle?.licensePlate;
            normalized.vehicleDescription = booking.vehicle?.description || booking.vehicleDescription || data.vehicleDescription || data.vehicle?.description;
            
            // Lấy thông tin booking - thử nhiều cách để lấy branchName
            normalized.branchName = 
              booking.branch?.branchName || 
              booking.branch?.name ||
              booking.branchName || 
              booking.branch?.branch?.branchName ||
              data.branchName || 
              data.branch?.branchName ||
              branchNameFromCookie ||
              undefined;
            normalized.branchId =
              booking.branch?.id ||
              booking.branch?.branch?.id ||
              booking.branchId ||
              data.branchId ||
              data.branch?.id;
            normalized.bookingStartDate = booking.startDatetime || booking.startDate || booking.bookingStartDate || data.bookingStartDate || data.booking?.startDatetime;
            normalized.bookingEndDate = booking.endDatetime || booking.endDate || booking.bookingEndDate || data.bookingEndDate || data.booking?.endDatetime;
          }
        } catch (err) {
          console.warn(`Failed to fetch booking ${normalized.bookingId}:`, err);
          // Fallback về data từ ticket nếu không fetch được booking
          normalized.renterName = data.renterName || data.renter?.fullName || data.renter?.account?.fullname;
          normalized.renterPhone = data.renterPhone || data.renter?.phoneNumber || data.renter?.phone;
          normalized.renterEmail = data.renterEmail || data.renter?.email || data.renter?.account?.username;
          normalized.vehicleModelName = data.vehicleModelName || data.vehicleModel?.modelName;
          normalized.licensePlate = data.licensePlate || data.vehicle?.licensePlate;
          normalized.vehicleDescription = data.vehicleDescription || data.vehicle?.description;
          normalized.branchName = data.branchName || data.branch?.branchName || branchNameFromCookie || undefined;
          normalized.branchId = data.branchId || data.branch?.id;
          normalized.bookingStartDate = data.bookingStartDate || data.booking?.startDatetime;
          normalized.bookingEndDate = data.bookingEndDate || data.booking?.endDatetime;
        }
      } else {
        // Nếu không có bookingId, lấy từ ticket data
        normalized.renterName = data.renterName || data.renter?.fullName || data.renter?.account?.fullname;
        normalized.renterPhone = data.renterPhone || data.renter?.phoneNumber || data.renter?.phone;
        normalized.renterEmail = data.renterEmail || data.renter?.email || data.renter?.account?.username;
        normalized.vehicleModelName = data.vehicleModelName || data.vehicleModel?.modelName;
        normalized.licensePlate = data.licensePlate || data.vehicle?.licensePlate;
        normalized.vehicleDescription = data.vehicleDescription || data.vehicle?.description;
        normalized.branchName = data.branchName || data.branch?.branchName || branchNameFromCookie || undefined;
        normalized.branchId = data.branchId || data.branch?.id;
        normalized.bookingStartDate = data.bookingStartDate || data.booking?.startDatetime;
        normalized.bookingEndDate = data.bookingEndDate || data.booking?.endDatetime;
      }
      
      // Fetch staff info nếu có staffId - và lấy branchName từ staff nếu chưa có
      if (normalized.staffId) {
        try {
          const staff = await getStaffById(normalized.staffId);
          if (staff) {
            normalized.assignedStaffName = staff.fullname || staff.fullName || staff.username;
            // Nếu chưa có branchName, thử lấy từ staff
            if (!normalized.branchName && staff.staff?.branch?.branchName) {
              normalized.branchName = staff.staff.branch.branchName;
            }
          } else {
            normalized.assignedStaffName = data.assignedStaffName || data.staffName || data.staff?.fullName || "Đã phân công";
          }
        } catch (err) {
          console.warn(`Failed to fetch staff ${normalized.staffId}:`, err);
          normalized.assignedStaffName = data.assignedStaffName || data.staffName || data.staff?.fullName || "Đã phân công";
        }
      } else {
        normalized.assignedStaffName = undefined;
      }
      
      // Nếu vẫn chưa có branchName, dùng từ cookie
      if (!normalized.branchName && branchNameFromCookie) {
        normalized.branchName = branchNameFromCookie;
      }
      if (!normalized.branchId && typeof document !== "undefined") {
        const cookieStr = document.cookie || "";
        const cookies: Record<string, string> = {};
        cookieStr.split(";").forEach((c) => {
          const [key, value] = c.trim().split("=");
          if (key && value) {
            cookies[key] = decodeURIComponent(value);
          }
        });
        normalized.branchId = cookies.branchId || undefined;
      }
      
      setTicket(normalized);
    } catch (err: any) {
      console.error(err);
      message.error(err.message || "Không thể tải thông tin ticket");
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (values: any) => {
    try {
      setAssigning(true);
      
      if (!values.staffId) {
        message.error("Vui lòng chọn staff để phân công");
        return;
      }

      if (!values.status) {
        message.error("Vui lòng chọn trạng thái");
        return;
      }

      // Validation: Kiểm tra ticket có đang ở trạng thái hợp lệ để assign không
      if (ticket?.status !== "Pending" && ticket?.status !== "pending") {
        message.warning(`Ticket đang ở trạng thái "${ticket?.status}". Chỉ có thể assign ticket ở trạng thái Pending.`);
        return;
      }

      // Validation: Kiểm tra ticket đã được assign chưa
      if (ticket?.staffId) {
        message.warning("Ticket này đã được phân công staff khác. Vui lòng kiểm tra lại.");
        return;
      }

      console.log("🔵 [Client] Assigning staff:", {
        ticketId,
        staffId: values.staffId,
        status: values.status,
        currentTicketStatus: ticket?.status,
        currentStaffId: ticket?.staffId
      });

      const result = await assignStaff(ticketId, values.staffId, values.status);
      
      console.log("🟣 [Client] Assign result:", result);
      
      message.success(result.message || result.data?.message || "Phân công staff thành công");
      setAssignModalVisible(false);
      form.resetFields();
      await loadTicket();
    } catch (err: any) {
      console.error("❌ [Client] Assign error:", err);
      
      // Hiển thị error message chi tiết hơn
      let errorMessage = "Phân công staff thất bại";
      if (err.message) {
        errorMessage = err.message;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      message.error(errorMessage);
    } finally {
      setAssigning(false);
    }
  };

  const getStatusColor = (status: TicketStatus, staffId?: string | null) => {
    // Nếu status = Pending nhưng có staffId → đã được assign (màu xanh)
    if (status === "Pending" && staffId) {
      return "blue";
    }
    
    switch (status) {
      case "Pending":
        return "orange";
      case "Assigned":
        return "blue";
      case "InProgress":
        return "purple";
      case "Resolved":
        return "green";
      default:
        return "default";
    }
  };

  const getStatusText = (status: TicketStatus, staffId?: string | null) => {
    // Nếu status = Pending nhưng có staffId → đã được assign
    if (status === "Pending" && staffId) {
      return "Đã phân công";
    }
    
    switch (status) {
      case "Pending":
        return "Chờ phân công";
      case "Assigned":
        return "Đã phân công";
      case "InProgress":
        return "Đang xử lý";
      case "Resolved":
        return "Đã giải quyết";
      default:
        return status;
    }
  };

  const getIssueTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      "WeakBattery": "Pin yếu/hết",
      "BatteryWeak": "Pin yếu/hết", // Fallback
      "FlatTyre": "Lốp xẹp",
      "TireFlat": "Lốp xẹp", // Fallback
      "UsageHelp": "Không biết cách sử dụng",
      "Other": "Vấn đề kỹ thuật khác",
    };
    return typeMap[type] || type;
  };

  // Chỉ có thể assign khi status = Pending và chưa có staffId
  const canAssign = (ticket?.status === "Pending" || ticket?.status === "pending") && !ticket?.staffId;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-6">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.back()}
          className="mb-4"
        >
          Quay lại
        </Button>
        <Card>
          <p>Không tìm thấy thông tin ticket</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push("/dashboard/manager/tickets")}
        >
          Quay lại
        </Button>
        <Space>
          <Tag color={getStatusColor(ticket.status as TicketStatus, ticket.staffId)}>
            {getStatusText(ticket.status as TicketStatus, ticket.staffId)}
          </Tag>
          {canAssign && (
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={() => setAssignModalVisible(true)}
            >
              Phân công Staff
            </Button>
          )}
        </Space>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Thông tin ticket */}
        <Card title="Thông tin Ticket" className="mb-6">
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Mã Ticket">
              <span className="font-mono">{ticket.id}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Loại sự cố">
              <Tag color="blue">{getIssueTypeText(ticket.ticketType)}</Tag>
            </Descriptions.Item>
            {ticket.title && (
              <Descriptions.Item label="Tiêu đề">
                {ticket.title}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Mô tả">
              {ticket.description || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={getStatusColor(ticket.status as TicketStatus, ticket.staffId)}>
                {getStatusText(ticket.status as TicketStatus, ticket.staffId)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">
              {dayjs(ticket.createdAt).format("DD/MM/YYYY HH:mm")}
            </Descriptions.Item>
            {ticket.updatedAt && (
              <Descriptions.Item label="Ngày cập nhật">
                {dayjs(ticket.updatedAt).format("DD/MM/YYYY HH:mm")}
              </Descriptions.Item>
            )}
            {ticket.assignedStaffName && (
              <Descriptions.Item label="Nhân viên được phân công">
                <Tag color="cyan">{ticket.assignedStaffName}</Tag>
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        {/* Thông tin khách hàng */}
        <Card title="Thông tin khách hàng" className="mb-6">
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Tên">
              {ticket.renterName ? (
                <div className="flex items-center gap-2">
                  <span>{ticket.renterName}</span>
                </div>
              ) : (
                <span className="text-gray-400">Chưa có thông tin</span>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">
              {ticket.renterPhone ? (
                <div className="flex items-center gap-2">
                  <PhoneOutlined />
                  <a href={`tel:${ticket.renterPhone}`} className="text-blue-600">
                    {ticket.renterPhone}
                  </a>
                </div>
              ) : (
                <span className="text-gray-400">Chưa có thông tin</span>
              )}
            </Descriptions.Item>
            {ticket.renterEmail && (
              <Descriptions.Item label="Email">
                {ticket.renterEmail}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        {/* Thông tin xe */}
        <Card title="Thông tin xe" className="mb-6">
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Mẫu xe">
              {ticket.vehicleModelName || <span className="text-gray-400">Chưa có thông tin</span>}
            </Descriptions.Item>
            <Descriptions.Item label="Biển số">
              {ticket.licensePlate || <span className="text-gray-400">Chưa có thông tin</span>}
            </Descriptions.Item>
            {ticket.vehicleDescription && (
              <Descriptions.Item label="Mô tả">
                {ticket.vehicleDescription}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        {/* Thông tin booking */}
        <Card title="Thông tin booking" className="mb-6">
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Mã booking">
              {ticket.bookingId ? (
                <Link
                  href={`/dashboard/manager/bookings/${ticket.bookingId}`}
                  className="text-blue-600 hover:underline font-mono"
                >
                  {ticket.bookingId}
                </Link>
              ) : (
                <span className="text-gray-400">Chưa có</span>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Chi nhánh">
              {ticket.branchName || <span className="text-gray-400">Chưa có</span>}
            </Descriptions.Item>
            {ticket.bookingStartDate && (
              <Descriptions.Item label="Ngày bắt đầu">
                {dayjs(ticket.bookingStartDate).format("DD/MM/YYYY HH:mm")}
              </Descriptions.Item>
            )}
            {ticket.bookingEndDate && (
              <Descriptions.Item label="Ngày kết thúc">
                {dayjs(ticket.bookingEndDate).format("DD/MM/YYYY HH:mm")}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        {/* Vị trí hiện tại */}
        {ticket.currentLocation && (
          <Card title="Vị trí hiện tại" className="mb-6 col-span-2">
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Địa chỉ">
                <div className="flex items-center gap-2">
                  <EnvironmentOutlined />
                  <span>{ticket.currentLocation}</span>
                </div>
              </Descriptions.Item>
              {ticket.latitude && ticket.longitude && (
                <Descriptions.Item label="Tọa độ GPS">
                  <span className="font-mono text-sm">
                    {ticket.latitude}, {ticket.longitude}
                  </span>
                  <Button
                    type="link"
                    size="small"
                    className="ml-2"
                    onClick={() => {
                      window.open(
                        `https://www.google.com/maps?q=${ticket.latitude},${ticket.longitude}`,
                        "_blank"
                      );
                    }}
                  >
                    Xem trên Google Maps
                  </Button>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        )}

        {/* Ghi chú giải quyết */}
        {ticket.resolutionNote && (
          <Card title="Ghi chú giải quyết" className="mb-6 col-span-2">
            <p className="text-gray-700">{ticket.resolutionNote}</p>
          </Card>
        )}
      </div>

      {/* Hình ảnh sự cố */}
      {ticket.issueImages && ticket.issueImages.length > 0 && (
        <Card title="Hình ảnh/Tệp đính kèm" className="mt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {ticket.issueImages.map((img: any, idx: number) => {
              // Xử lý cả string URL và object với url/fileUrl
              const imageUrl = typeof img === 'string' ? img : (img.url || img.fileUrl || img);
              return (
                <div key={idx} className="relative">
                  <Image
                    src={imageUrl}
                    alt={`Hình ảnh ${idx + 1}`}
                    className="w-full h-48 object-cover rounded"
                    preview={true}
                  />
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Modal phân công staff */}
      <Modal
        title="Phân công Staff xử lý ticket"
        open={assignModalVisible}
        onCancel={() => setAssignModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAssign}
        >
          <Form.Item
            label="Chọn Staff"
            name="staffId"
            rules={[
              {
                required: true,
                message: "Vui lòng chọn staff để phân công",
              },
            ]}
          >
            <Select
              placeholder="Chọn staff"
              showSearch
              filterOption={(input, option) => {
                const label = typeof option?.label === 'string' ? option.label : String(option?.label || '');
                return label.toLowerCase().includes(input.toLowerCase());
              }}
            >
              {staffList.map((staff: any) => {
                // Lấy staff.id thực sự từ staff.staff.id (KHÔNG phải account.id)
                const actualStaffId = staff.staff?.id || staff.staffId;
                const displayName = staff.fullname || staff.fullName || staff.username;
                
                return (
                  <Option
                    key={actualStaffId || staff.id}
                    value={actualStaffId || staff.id}
                    label={displayName}
                  >
                    <div>
                      <div className="font-medium">
                        {displayName}
                      </div>
                      {staff.phoneNumber && (
                        <div className="text-xs text-gray-500">
                          {staff.phoneNumber}
                        </div>
                      )}
                    </div>
                  </Option>
                );
              })}
            </Select>
          </Form.Item>

          <Form.Item
            label="Trạng thái"
            name="status"
            rules={[
              {
                required: true,
                message: "Vui lòng chọn trạng thái",
              },
            ]}
            initialValue="InProgress"
          >
            <Select placeholder="Chọn trạng thái">
              <Option value="Pending">Pending - Chờ phân công</Option>
              <Option value="InProgress">InProgress - Đang xử lý</Option>
              <Option value="Resolved">Resolved - Đã giải quyết</Option>
            </Select>
          </Form.Item>

          <div className="bg-blue-50 p-4 rounded mb-4">
            <p className="text-sm text-gray-600">
              <strong>Lưu ý:</strong> Sau khi phân công, ticket sẽ được cập nhật với staff và trạng thái đã chọn.
              Staff được chọn sẽ nhận được thông báo để xử lý ticket này.
            </p>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button onClick={() => setAssignModalVisible(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={assigning}>
              Phân công
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}

