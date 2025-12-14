"use client";

import { useEffect, useState } from "react";
import { Table, Button, Input, Select, Space, Tag, Modal, Form, message, Descriptions, Card, Tabs } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined, EyeOutlined, CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { 
  getTransferOrders, 
  getTransferOrderById, 
  createTransferOrder, 
  cancelTransferOrder,
  getInTransitOrders,
  VehicleTransferOrder 
} from "./transfer_order_service";
import {
  getTransferRequests,
  getPendingRequests,
  getTransferRequestById,
  approveTransferRequest,
  cancelTransferRequest,
  VehicleTransferRequest
} from "./transfer_request_service";
import { getVehicles } from "../vehicles/vehicle_service";
import { getBranches, Branch } from "../branches/branch_service";
import type { ColumnsType } from "antd/es/table";

const { Search } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

export default function TransferOrdersPage() {
  // Orders state
  const [orders, setOrders] = useState<VehicleTransferOrder[]>([]);
  const [inTransitOrders, setInTransitOrders] = useState<VehicleTransferOrder[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [isOrderModalVisible, setIsOrderModalVisible] = useState(false);
  const [isOrderDetailModalVisible, setIsOrderDetailModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<VehicleTransferOrder | null>(null);
  const [orderForm] = Form.useForm();
  const [orderSearchText, setOrderSearchText] = useState("");
  const [selectedOrderStatus, setSelectedOrderStatus] = useState<string>("all");
  const [selectedFromBranch, setSelectedFromBranch] = useState<string>("all");

  // Requests state
  const [requests, setRequests] = useState<VehicleTransferRequest[]>([]);
  const [pendingRequests, setPendingRequests] = useState<VehicleTransferRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [isRequestDetailModalVisible, setIsRequestDetailModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<VehicleTransferRequest | null>(null);
  const [requestSearchText, setRequestSearchText] = useState("");
  const [selectedRequestStatus, setSelectedRequestStatus] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("requests");

  useEffect(() => {
    loadBranches();
    if (activeTab === "requests") {
      loadRequests();
      loadPendingRequests();
    } else {
      loadOrders();
      loadInTransitOrders();
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedFromBranch && selectedFromBranch !== "all") {
      loadVehicles(selectedFromBranch);
    } else {
      setVehicles([]);
    }
  }, [selectedFromBranch]);

  const loadBranches = async () => {
    try {
      const data = await getBranches();
      setBranches(data);
    } catch (error) {
      console.error("Error loading branches:", error);
    }
  };

  const loadVehicles = async (branchId: string) => {
    setLoadingVehicles(true);
    try {
      const data = await getVehicles({ BranchId: branchId, Status: "Available", PageSize: 1000 });
      const availableVehicles =
        data.items?.filter(
          (vehicle) => (vehicle.status || "").toUpperCase() === "AVAILABLE"
        ) || [];

      if (data.items?.length && availableVehicles.length === 0) {
        console.warn(
          `[Create Order] Branch ${branchId} has vehicles but none are in Available status`
        );
      }

      setVehicles(availableVehicles);
    } catch (error) {
      console.error("Error loading vehicles:", error);
      message.error("Không thể tải danh sách xe");
    } finally {
      setLoadingVehicles(false);
    }
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await getTransferOrders();
      setOrders(data);
    } catch (error) {
      console.error("Error loading transfer orders:", error);
      message.error("Không thể tải danh sách lệnh điều chuyển");
    } finally {
      setLoading(false);
    }
  };

  const loadInTransitOrders = async () => {
    try {
      const data = await getInTransitOrders();
      setInTransitOrders(data);
    } catch (error) {
      console.error("Error loading in-transit orders:", error);
    }
  };

  const loadRequests = async () => {
    setLoadingRequests(true);
    try {
      console.log("Loading all requests...");
      const data = await getTransferRequests();
      console.log("Loaded requests:", data.length, "items");
      setRequests(data);
      console.log("Requests state updated");
    } catch (error) {
      console.error("Error loading transfer requests:", error);
      message.error("Không thể tải danh sách yêu cầu điều chuyển");
    } finally {
      setLoadingRequests(false);
    }
  };

  const loadPendingRequests = async () => {
    try {
      console.log("Loading pending requests...");
      const data = await getPendingRequests();
      console.log("Loaded pending requests:", data.length, "items");
      setPendingRequests(data);
      console.log("Pending requests state updated");
    } catch (error) {
      console.error("Error loading pending requests:", error);
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      !orderSearchText ||
      order.vehicleLicensePlate?.toLowerCase().includes(orderSearchText.toLowerCase()) ||
      order.fromBranchName?.toLowerCase().includes(orderSearchText.toLowerCase()) ||
      order.toBranchName?.toLowerCase().includes(orderSearchText.toLowerCase());
    
    const matchesStatus = selectedOrderStatus === "all" || order.status?.toUpperCase() === selectedOrderStatus.toUpperCase();
    const matchesFromBranch = selectedFromBranch === "all" || order.fromBranchId === selectedFromBranch;
    
    return matchesSearch && matchesStatus && matchesFromBranch;
  });

  // Filter requests
  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      !requestSearchText ||
      request.vehicleModelName?.toLowerCase().includes(requestSearchText.toLowerCase()) ||
      request.branchName?.toLowerCase().includes(requestSearchText.toLowerCase()) ||
      request.staffName?.toLowerCase().includes(requestSearchText.toLowerCase());
    
    const matchesStatus = selectedRequestStatus === "all" || request.status?.toUpperCase() === selectedRequestStatus.toUpperCase();
    
    return matchesSearch && matchesStatus;
  });

  // Order handlers
  const handleViewOrderDetail = async (order: VehicleTransferOrder) => {
    try {
      const detail = await getTransferOrderById(order.id);
      setSelectedOrder(detail);
      setIsOrderDetailModalVisible(true);
    } catch (error) {
      console.error("Error loading order detail:", error);
      message.error("Không thể tải chi tiết lệnh điều chuyển");
    }
  };

  const handleCreateOrder = () => {
    orderForm.resetFields();
    orderForm.setFieldsValue({
      fromBranchId: undefined,
      toBranchId: undefined,
      vehicleId: undefined,
      notes: undefined,
    });
    setSelectedFromBranch("all");
    setVehicles([]);
    setIsOrderModalVisible(true);
  };

  const handleSubmitOrder = async () => {
    try {
      const values = await orderForm.validateFields();
      console.log("[UI] Submitting order with values:", values);
      
      // Hiển thị loading message
      const hideLoading = message.loading("Đang tạo lệnh điều chuyển...", 0);
      
      const result = await createTransferOrder({
        vehicleId: values.vehicleId,
        fromBranchId: values.fromBranchId,
        toBranchId: values.toBranchId,
        notes: values.notes || undefined,
      });
      
      // Đóng loading message
      hideLoading();
      
      console.log("[UI] Order created successfully:", result);
      
      message.success("Tạo lệnh điều chuyển thành công");
      setIsOrderModalVisible(false);
      orderForm.resetFields();
      setSelectedFromBranch("all");
      setVehicles([]);
      
      // Reload data
      await Promise.all([
        loadOrders(),
        loadInTransitOrders()
      ]);
      
    } catch (error: any) {
      console.error("[UI] Error creating transfer order:", error);
      
      // Kiểm tra nếu là validation error từ form
      if (error.errorFields) {
        return;
      }
      
      // Hiển thị error message từ backend
      const errorMessage = error.message || "Không thể tạo lệnh điều chuyển";
      message.error(errorMessage);
    }
  };

  const handleCancelOrder = async (order: VehicleTransferOrder) => {
    if (order.status !== "Pending") {
      message.warning("Chỉ có thể hủy lệnh điều chuyển ở trạng thái Pending");
      return;
    }

    Modal.confirm({
      title: "Xác nhận hủy",
      content: `Bạn có chắc muốn hủy lệnh điều chuyển xe "${order.vehicleLicensePlate}"?`,
      okText: "Hủy lệnh",
      okType: "danger",
      cancelText: "Không",
      onOk: async () => {
        try {
          await cancelTransferOrder(order.id);
          message.success("Hủy lệnh điều chuyển thành công");
          loadOrders();
          loadInTransitOrders();
        } catch (error: any) {
          console.error("Error cancelling order:", error);
          message.error(error.message || "Không thể hủy lệnh điều chuyển");
        }
      },
    });
  };

  // Request handlers
  const handleViewRequestDetail = async (request: VehicleTransferRequest) => {
    try {
      const detail = await getTransferRequestById(request.id);
      setSelectedRequest(detail);
      setIsRequestDetailModalVisible(true);
    } catch (error: any) {
      console.error("Error loading request detail:", error);
      // Hiển thị message lỗi chi tiết từ backend nếu có
      const errorMessage = error?.message || "Không thể tải chi tiết yêu cầu điều chuyển";
      message.error(errorMessage);
    }
  };

  const handleApproveRequest = async (request: VehicleTransferRequest) => {
    console.log("[UI] ===== APPROVE BUTTON CLICKED =====");
    console.log("[UI] Request ID:", request.id);
    console.log("[UI] Request status:", request.status);
    
    // Normalize status để so sánh
    const normalizedStatus = (request.status || "").toUpperCase();
    
    if (normalizedStatus !== "PENDING") {
      message.warning("Chỉ có thể duyệt yêu cầu ở trạng thái Pending");
      return;
    }

    // Hiển thị loading message
    const hideLoading = message.loading("Đang duyệt yêu cầu...", 0);
    
    try {
      // Gọi API approve với ID của request
      console.log("[UI] Calling approveTransferRequest with ID:", request.id);
      const result = await approveTransferRequest(request.id);
      console.log("[UI] Approve result received:", result);
      
      // Đóng loading message
      hideLoading();
      
      // Kiểm tra result có hợp lệ không
      if (!result || !result.id) {
        console.error("[UI] Invalid result:", result);
        throw new Error("Không nhận được dữ liệu hợp lệ từ server");
      }
      
      console.log("[UI] Result is valid! Status:", result.status);
      
      // Cập nhật state trực tiếp
      setRequests(prevRequests => {
        const updated = prevRequests.map(req => 
          req.id === request.id 
            ? { ...req, status: result.status || "Approved", reviewedAt: result.reviewedAt || new Date().toISOString() }
            : req
        );
        return updated;
      });
      
      setPendingRequests(prevPending => {
        return prevPending.filter(req => req.id !== request.id);
      });
      
      // Hiển thị thông báo thành công
      message.success("Duyệt yêu cầu thành công. Bạn có thể tạo lệnh điều chuyển ngay bây giờ.");
      
      // Reload data từ server sau 500ms để đồng bộ
      setTimeout(async () => {
        try {
          await Promise.all([
            loadRequests(),
            loadPendingRequests()
          ]);
          console.log("[UI] Data reloaded successfully");
        } catch (reloadError) {
          console.error("[UI] Error reloading data:", reloadError);
        }
      }, 500);
      
      console.log("[UI] ===== APPROVE COMPLETED SUCCESSFULLY =====");
      
    } catch (error: any) {
      // Đóng loading message
      hideLoading();
      
      console.error("[UI] ===== ERROR IN APPROVE =====");
      console.error("[UI] Error:", error);
      
      // Parse error message
      let errorMessage = "Không thể duyệt yêu cầu";
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }
      
      message.error(errorMessage);
    }
  };

  const handleCancelRequest = async (request: VehicleTransferRequest) => {
    console.log("[UI] ===== CANCEL BUTTON CLICKED =====");
    console.log("[UI] Request ID:", request.id);
    console.log("[UI] Request status:", request.status);
    
    // Hiển thị loading message
    const hideLoading = message.loading("Đang hủy yêu cầu...", 0);
    
    try {
      // Gọi API cancel với ID của request
      console.log("[UI] Calling cancelTransferRequest with ID:", request.id);
      const result = await cancelTransferRequest(request.id);
      console.log("[UI] Cancel result received:", result);
      
      // Đóng loading message
      hideLoading();
      
      // Kiểm tra result có hợp lệ không
      if (!result || !result.id) {
        console.error("[UI] Invalid result:", result);
        throw new Error("Không nhận được dữ liệu hợp lệ từ server");
      }
      
      console.log("[UI] Result is valid! Status:", result.status);
      
      // Cập nhật state trực tiếp
      setRequests(prevRequests => {
        const updated = prevRequests.map(req => 
          req.id === request.id 
            ? { ...req, status: result.status || "Cancelled" }
            : req
        );
        return updated;
      });
      
      setPendingRequests(prevPending => {
        return prevPending.filter(req => req.id !== request.id);
      });
      
      // Hiển thị thông báo thành công
      message.success("Hủy yêu cầu thành công");
      
      // Reload data từ server sau 500ms để đồng bộ
      setTimeout(async () => {
        try {
          await Promise.all([
            loadRequests(),
            loadPendingRequests()
          ]);
          console.log("[UI] Data reloaded successfully");
        } catch (reloadError) {
          console.error("[UI] Error reloading data:", reloadError);
        }
      }, 500);
      
      console.log("[UI] ===== CANCEL COMPLETED SUCCESSFULLY =====");
      
    } catch (error: any) {
      // Đóng loading message
      hideLoading();
      
      console.error("[UI] ===== ERROR IN CANCEL =====");
      console.error("[UI] Error:", error);
      
      // Parse error message
      let errorMessage = "Không thể hủy yêu cầu";
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }
      
      message.error(errorMessage);
    }
  };

  const getStatusTag = (status?: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      PENDING: { color: "orange", text: "Chờ duyệt" },
      APPROVED: { color: "green", text: "Đã duyệt" },
      CANCELLED: { color: "default", text: "Đã hủy" },
      INTRANSIT: { color: "blue", text: "Đang vận chuyển" },
      COMPLETED: { color: "green", text: "Hoàn tất" },
    };
    const statusInfo = statusMap[status?.toUpperCase() || ""] || { color: "default", text: status || "N/A" };
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  // Order columns
  const orderColumns: ColumnsType<VehicleTransferOrder> = [
    {
      title: "Biển số xe",
      dataIndex: "vehicleLicensePlate",
      key: "vehicleLicensePlate",
      width: 120,
    },
    {
      title: "Từ chi nhánh",
      dataIndex: "fromBranchName",
      key: "fromBranchName",
      width: 180,
    },
    {
      title: "Đến chi nhánh",
      dataIndex: "toBranchName",
      key: "toBranchName",
      width: 180,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status) => getStatusTag(status),
    },
    {
      title: "Ngày tạo",
      key: "createdAt",
      width: 150,
      render: (_, record) => {
        if (!record.createdAt) return "-";
        return new Date(record.createdAt).toLocaleDateString("vi-VN");
      },
    },
    {
      title: "Ngày nhận",
      key: "receivedDate",
      width: 150,
      render: (_, record) => {
        if (!record.receivedDate) return "-";
        return new Date(record.receivedDate).toLocaleDateString("vi-VN");
      },
    },
    {
      title: "Ghi chú",
      dataIndex: "notes",
      key: "notes",
      width: 200,
      ellipsis: true,
    },
    {
      title: "Hành động",
      key: "action",
      width: 200,
      fixed: "right",
      render: (_, record) => {
        return (
          <Space>
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => handleViewOrderDetail(record)}
            >
              Xem
            </Button>
            {record.status === "Pending" && (
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleCancelOrder(record)}
              >
                Hủy
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  // Request columns
  const requestColumns: ColumnsType<VehicleTransferRequest> = [
    {
      title: "Model xe",
      dataIndex: "vehicleModelName",
      key: "vehicleModelName",
      width: 180,
    },
    {
      title: "Số lượng yêu cầu",
      dataIndex: "quantityRequested",
      key: "quantityRequested",
      width: 120,
      render: (quantity) => quantity || "-",
    },
    {
      title: "Chi nhánh",
      dataIndex: "branchName",
      key: "branchName",
      width: 180,
    },
    {
      title: "Người yêu cầu",
      dataIndex: "staffName",
      key: "staffName",
      width: 150,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => getStatusTag(status),
    },
    {
      title: "Ngày yêu cầu",
      key: "requestedAt",
      width: 150,
      render: (_, record) => {
        if (!record.requestedAt && !record.createdAt) return "-";
        return new Date(record.requestedAt || record.createdAt || "").toLocaleDateString("vi-VN");
      },
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      width: 250,
      ellipsis: true,
    },
    {
      title: "Hành động",
      key: "action",
      width: 250,
      fixed: "right",
      render: (_, record) => {
        return (
          <Space>
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => handleViewRequestDetail(record)}
            >
              Xem
            </Button>
            {((record.status || "").toUpperCase() === "PENDING") && (
              <>
                <Button
                  type="link"
                  icon={<CheckOutlined />}
                  onClick={() => {
                    console.log("Approve button clicked for request:", record);
                    handleApproveRequest(record);
                  }}
                >
                  Duyệt
                </Button>
                <Button
                  type="link"
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => handleCancelRequest(record)}
                >
                  Hủy
                </Button>
              </>
            )}
            {((record.status || "").toUpperCase() === "APPROVED") && (
              <Button
                type="link"
                danger
                icon={<CloseOutlined />}
                onClick={() => handleCancelRequest(record)}
              >
                Hủy
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Quản lý điều chuyển xe</h2>
        {activeTab === "orders" && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateOrder}
          >
            Tạo lệnh điều chuyển
          </Button>
        )}
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        {/* Tab: Yêu cầu điều chuyển */}
        <TabPane tab="Yêu cầu điều chuyển" key="requests">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Card>
              <div className="text-sm text-gray-500">Tổng yêu cầu</div>
              <div className="text-2xl font-semibold mt-1">{requests.length}</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-500">Chờ duyệt</div>
              <div className="text-2xl font-semibold mt-1 text-orange-600">{pendingRequests.length}</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-500">Đã duyệt</div>
              <div className="text-2xl font-semibold mt-1 text-green-600">
                {requests.filter(r => r.status === "Approved").length}
              </div>
            </Card>
          </div>

          {/* Filters */}
          <div className="mb-4 flex gap-4 flex-wrap">
            <Search
              placeholder="Tìm theo model, chi nhánh, người yêu cầu"
              allowClear
              style={{ width: 300 }}
              onSearch={(value) => setRequestSearchText(value)}
              onChange={(e) => !e.target.value && setRequestSearchText("")}
            />
            <Select
              placeholder="Trạng thái"
              style={{ width: 150 }}
              value={selectedRequestStatus}
              onChange={setSelectedRequestStatus}
            >
              <Option value="all">Tất cả</Option>
              <Option value="Pending">Chờ duyệt</Option>
              <Option value="Approved">Đã duyệt</Option>
              <Option value="Cancelled">Đã hủy</Option>
            </Select>
          </div>

          {/* Table */}
          <Table
            columns={requestColumns}
            dataSource={filteredRequests}
            rowKey="id"
            loading={loadingRequests}
            scroll={{ x: 1200 }}
            pagination={{
              pageSize: 12,
              showSizeChanger: true,
              showTotal: (total) => `Tổng: ${total} yêu cầu`,
              pageSizeOptions: ["12", "24", "48", "96"],
            }}
          />
        </TabPane>

        {/* Tab: Lệnh điều chuyển */}
        <TabPane tab="Lệnh điều chuyển" key="orders">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Card>
              <div className="text-sm text-gray-500">Tổng lệnh điều chuyển</div>
              <div className="text-2xl font-semibold mt-1">{orders.length}</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-500">Đang vận chuyển</div>
              <div className="text-2xl font-semibold mt-1 text-blue-600">{inTransitOrders.length}</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-500">Chờ xuất xe</div>
              <div className="text-2xl font-semibold mt-1 text-orange-600">
                {orders.filter(o => o.status === "Pending").length}
              </div>
            </Card>
          </div>

          {/* Filters */}
          <div className="mb-4 flex gap-4 flex-wrap">
            <Search
              placeholder="Tìm theo biển số, chi nhánh"
              allowClear
              style={{ width: 300 }}
              onSearch={(value) => setOrderSearchText(value)}
              onChange={(e) => !e.target.value && setOrderSearchText("")}
            />
            <Select
              placeholder="Trạng thái"
              style={{ width: 150 }}
              value={selectedOrderStatus}
              onChange={setSelectedOrderStatus}
            >
              <Option value="all">Tất cả</Option>
              <Option value="Pending">Chờ xuất xe</Option>
              <Option value="InTransit">Đang vận chuyển</Option>
              <Option value="Completed">Hoàn tất</Option>
              <Option value="Cancelled">Đã hủy</Option>
            </Select>
            <Select
              placeholder="Chi nhánh nguồn"
              style={{ width: 200 }}
              value={selectedFromBranch}
              onChange={setSelectedFromBranch}
            >
              <Option value="all">Tất cả</Option>
              {branches.map((branch) => (
                <Option key={branch.id} value={branch.id}>
                  {branch.branchName}
                </Option>
              ))}
            </Select>
          </div>

          {/* Table */}
          <Table
            columns={orderColumns}
            dataSource={filteredOrders}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1200 }}
            pagination={{
              pageSize: 12,
              showSizeChanger: true,
              showTotal: (total) => `Tổng: ${total} lệnh điều chuyển`,
              pageSizeOptions: ["12", "24", "48", "96"],
            }}
          />
        </TabPane>
      </Tabs>

      {/* Create Order Modal */}
      <Modal
        title="Tạo lệnh điều chuyển xe"
        open={isOrderModalVisible}
        onCancel={() => {
          setIsOrderModalVisible(false);
          orderForm.resetFields();
          setSelectedFromBranch("all");
          setVehicles([]);
        }}
        onOk={handleSubmitOrder}
        okText="Tạo"
        cancelText="Hủy"
        width={600}
        destroyOnHidden={true}
      >
        <Form form={orderForm} layout="vertical">
          <Form.Item
            name="fromBranchId"
            label="Chi nhánh nguồn"
            rules={[{ required: true, message: "Vui lòng chọn chi nhánh nguồn" }]}
          >
            <Select
              placeholder="Chọn chi nhánh nguồn"
              onChange={(value) => {
                setSelectedFromBranch(value);
                orderForm.setFieldsValue({ vehicleId: undefined });
              }}
            >
              {branches.map((branch) => (
                <Option key={branch.id} value={branch.id}>
                  {branch.branchName}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="vehicleId"
            label="Xe"
            rules={[{ required: true, message: "Vui lòng chọn xe" }]}
          >
            <Select
              placeholder="Chọn xe"
              loading={loadingVehicles}
              disabled={!selectedFromBranch || selectedFromBranch === "all"}
              showSearch
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
              options={vehicles.map((vehicle) => ({
                value: vehicle.id || vehicle.vehicleId,
                label: `${vehicle.licensePlate} - ${vehicle.vehicleModelName || ""}`,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="toBranchId"
            label="Chi nhánh đích"
            rules={[
              { required: true, message: "Vui lòng chọn chi nhánh đích" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("fromBranchId") !== value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Chi nhánh đích phải khác chi nhánh nguồn"));
                },
              }),
            ]}
          >
            <Select placeholder="Chọn chi nhánh đích">
              {branches.map((branch) => (
                <Option key={branch.id} value={branch.id}>
                  {branch.branchName}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="notes"
            label="Ghi chú"
          >
            <Input.TextArea rows={3} placeholder="Nhập ghi chú (tùy chọn)" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Order Detail Modal */}
      <Modal
        title="Chi tiết lệnh điều chuyển"
        open={isOrderDetailModalVisible}
        onCancel={() => setIsOrderDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsOrderDetailModalVisible(false)}>
            Đóng
          </Button>,
        ]}
        width={800}
      >
        {selectedOrder && (
          <div>
            <Descriptions title="Thông tin lệnh điều chuyển" column={2} bordered className="mb-4">
              <Descriptions.Item label="ID">
                {selectedOrder.id}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                {getStatusTag(selectedOrder.status)}
              </Descriptions.Item>
              <Descriptions.Item label="Biển số xe">
                {selectedOrder.vehicleLicensePlate || selectedOrder.vehicle?.licensePlate || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">
                {selectedOrder.createdAt 
                  ? new Date(selectedOrder.createdAt).toLocaleString("vi-VN")
                  : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày nhận">
                {selectedOrder.receivedDate 
                  ? new Date(selectedOrder.receivedDate).toLocaleString("vi-VN")
                  : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Ghi chú" span={2}>
                {selectedOrder.notes || "-"}
              </Descriptions.Item>
            </Descriptions>

            {selectedOrder.vehicle && (
              <Descriptions title="Thông tin xe" column={2} bordered className="mb-4">
                <Descriptions.Item label="Biển số">
                  {selectedOrder.vehicle.licensePlate}
                </Descriptions.Item>
                <Descriptions.Item label="Màu sắc">
                  {selectedOrder.vehicle.color || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  {selectedOrder.vehicle.status || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Model">
                  {selectedOrder.vehicle.vehicleModel?.modelName || "-"}
                </Descriptions.Item>
              </Descriptions>
            )}

            {selectedOrder.fromBranch && (
              <Descriptions title="Chi nhánh nguồn" column={2} bordered className="mb-4">
                <Descriptions.Item label="Tên">
                  {selectedOrder.fromBranch.branchName}
                </Descriptions.Item>
                <Descriptions.Item label="Địa chỉ" span={2}>
                  {selectedOrder.fromBranch.address || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Số điện thoại">
                  {selectedOrder.fromBranch.phone || "-"}
                </Descriptions.Item>
              </Descriptions>
            )}

            {selectedOrder.toBranch && (
              <Descriptions title="Chi nhánh đích" column={2} bordered>
                <Descriptions.Item label="Tên">
                  {selectedOrder.toBranch.branchName}
                </Descriptions.Item>
                <Descriptions.Item label="Địa chỉ" span={2}>
                  {selectedOrder.toBranch.address || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Số điện thoại">
                  {selectedOrder.toBranch.phone || "-"}
                </Descriptions.Item>
              </Descriptions>
            )}
          </div>
        )}
      </Modal>

      {/* Request Detail Modal */}
      <Modal
        title="Chi tiết yêu cầu điều chuyển"
        open={isRequestDetailModalVisible}
        onCancel={() => setIsRequestDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsRequestDetailModalVisible(false)}>
            Đóng
          </Button>,
        ]}
        width={900}
      >
        {selectedRequest && (
          <div>
            <Descriptions title="Thông tin yêu cầu" column={2} bordered className="mb-4">
              <Descriptions.Item label="ID">
                {selectedRequest.id}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                {getStatusTag(selectedRequest.status)}
              </Descriptions.Item>
              <Descriptions.Item label="Model xe">
                {selectedRequest.vehicleModelName || selectedRequest.vehicleModel?.modelName || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Số lượng yêu cầu">
                {selectedRequest.quantityRequested ?? "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Chi nhánh">
                {selectedRequest.branchName || (selectedRequest as any)?.staff?.branch?.branchName || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Người yêu cầu">
                {selectedRequest.staffName || selectedRequest.staff?.fullname || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày yêu cầu">
                {selectedRequest.requestedAt || selectedRequest.createdAt
                  ? new Date(selectedRequest.requestedAt || selectedRequest.createdAt || "").toLocaleString("vi-VN")
                  : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày duyệt">
                {selectedRequest.reviewedAt
                  ? new Date(selectedRequest.reviewedAt).toLocaleString("vi-VN")
                  : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Mô tả" span={2}>
                {selectedRequest.description || "-"}
              </Descriptions.Item>
            </Descriptions>

            {selectedRequest.vehicleModel && (
              <Descriptions title="Thông tin model xe" column={2} bordered className="mb-4">
                <Descriptions.Item label="Tên model">
                  {selectedRequest.vehicleModel.modelName || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Phân khúc">
                  {selectedRequest.vehicleModel.category || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Dung lượng pin">
                  {(selectedRequest as any)?.vehicleModel?.batteryCapacityKwh
                    ? `${(selectedRequest as any).vehicleModel.batteryCapacityKwh} kWh`
                    : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Tầm hoạt động">
                  {selectedRequest.vehicleModel.maxRangeKm ? `${selectedRequest.vehicleModel.maxRangeKm} km` : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Tốc độ tối đa">
                  {selectedRequest.vehicleModel.maxSpeedKmh ? `${selectedRequest.vehicleModel.maxSpeedKmh} km/h` : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Mô tả" span={2}>
                  {(selectedRequest as any)?.vehicleModel?.description || "-"}
                </Descriptions.Item>
              </Descriptions>
            )}

            {selectedRequest.staff && (
              <Descriptions title="Thông tin người yêu cầu" column={2} bordered className="mb-4">
                <Descriptions.Item label="Họ tên">
                  {selectedRequest.staff.fullname || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  {selectedRequest.staff.email || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Chi nhánh" span={2}>
                  {(selectedRequest as any)?.staff?.branch?.branchName || "-"}
                </Descriptions.Item>
                {(selectedRequest as any)?.staff?.branch && (
                  <>
                    <Descriptions.Item label="Địa chỉ" span={2}>
                      {(selectedRequest as any)?.staff?.branch?.address || "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Số điện thoại">
                      {(selectedRequest as any)?.staff?.branch?.phone || "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Email chi nhánh">
                      {(selectedRequest as any)?.staff?.branch?.email || "-"}
                    </Descriptions.Item>
                  </>
                )}
              </Descriptions>
            )}

            {selectedRequest.vehicleTransferOrder && (
              <Descriptions title="Lệnh điều chuyển liên quan" column={2} bordered>
                <Descriptions.Item label="ID">
                  {selectedRequest.vehicleTransferOrder.id}
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  {getStatusTag(selectedRequest.vehicleTransferOrder.status)}
                </Descriptions.Item>
                <Descriptions.Item label="Biển số xe">
                  {selectedRequest.vehicleTransferOrder.vehicleLicensePlate || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Từ chi nhánh">
                  {selectedRequest.vehicleTransferOrder.fromBranchName || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Đến chi nhánh">
                  {selectedRequest.vehicleTransferOrder.toBranchName || "-"}
                </Descriptions.Item>
              </Descriptions>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
