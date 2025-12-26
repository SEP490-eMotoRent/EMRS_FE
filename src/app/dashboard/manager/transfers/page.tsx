"use client";

import { useEffect, useState } from "react";
import { Table, Button, Input, Select, Space, Tag, Modal, Form, message, Descriptions, Card, Tabs, InputNumber } from "antd";
import { PlusOutlined, EyeOutlined, CheckOutlined, CloseOutlined, SendOutlined, InboxOutlined, FileTextOutlined, ClockCircleOutlined, CheckCircleOutlined, CarOutlined } from "@ant-design/icons";
import { 
  getTransferOrdersByBranch,
  getPendingTransferOrdersByBranch,
  getTransferOrderById,
  dispatchTransferOrder,
  receiveTransferOrder,
  VehicleTransferOrder 
} from "../../admin/transfers/transfer_order_service";
import {
  getTransferRequestsByBranch,
  getTransferRequestById,
  createTransferRequest,
  cancelTransferRequest,
  VehicleTransferRequest
} from "../../admin/transfers/transfer_request_service";
import { getVehicleModels, VehicleModel } from "../../admin/vehicle-models/vehicle_model_service";
import type { ColumnsType } from "antd/es/table";

import { SearchOutlined } from "@ant-design/icons";
const { Option } = Select;
const { TabPane } = Tabs;

export default function ManagerTransferPage() {
  const [branchId, setBranchId] = useState<string>("");
  const [branchName, setBranchName] = useState<string>("");

  // Requests state
  const [requests, setRequests] = useState<VehicleTransferRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [isRequestModalVisible, setIsRequestModalVisible] = useState(false);
  const [isRequestDetailModalVisible, setIsRequestDetailModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<VehicleTransferRequest | null>(null);
  const [requestForm] = Form.useForm();
  const [vehicleModels, setVehicleModels] = useState<VehicleModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [requestSearchText, setRequestSearchText] = useState("");
  const [selectedRequestStatus, setSelectedRequestStatus] = useState<string>("all");

  // Orders state
  const [orders, setOrders] = useState<VehicleTransferOrder[]>([]);
  const [pendingOrders, setPendingOrders] = useState<VehicleTransferOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [isOrderDetailModalVisible, setIsOrderDetailModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<VehicleTransferOrder | null>(null);
  const [orderSearchText, setOrderSearchText] = useState("");
  const [selectedOrderStatus, setSelectedOrderStatus] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("requests");
  
  // Dispatch/Receive confirmation modal state
  const [isDispatchModalVisible, setIsDispatchModalVisible] = useState(false);
  const [isReceiveModalVisible, setIsReceiveModalVisible] = useState(false);
  const [orderToDispatch, setOrderToDispatch] = useState<VehicleTransferOrder | null>(null);
  const [orderToReceive, setOrderToReceive] = useState<VehicleTransferOrder | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Lấy branchId từ cookie
    if (typeof document !== "undefined") {
      const cookieStr = document.cookie || "";
      const cookies: Record<string, string> = {};
      cookieStr.split(";").forEach((c) => {
        const [key, value] = c.trim().split("=");
        if (key && value) {
          cookies[key] = decodeURIComponent(value);
        }
      });
      
      if (cookies.branchId) {
        setBranchId(cookies.branchId);
      } else {
        console.warn("[Manager Transfers] No branchId found in cookies");
      }
      if (cookies.branchName) {
        setBranchName(cookies.branchName);
      }
    }
  }, []);

  useEffect(() => {
    if (branchId) {
      if (activeTab === "requests") {
        loadRequests();
        loadVehicleModels();
      } else {
        loadOrders();
        loadPendingOrders();
      }
    } else {
      console.warn("No branchId available, cannot load data");
    }
  }, [branchId, activeTab]);

  const loadVehicleModels = async () => {
    setLoadingModels(true);
    try {
      const data = await getVehicleModels();
      setVehicleModels(data);
    } catch (error) {
      console.error("Error loading vehicle models:", error);
      message.error("Không thể tải danh sách model xe");
    } finally {
      setLoadingModels(false);
    }
  };

  const loadRequests = async () => {
    if (!branchId) {
      console.warn("No branchId, cannot load requests");
      return;
    }
    setLoadingRequests(true);
    try {
      const data = await getTransferRequestsByBranch(branchId);
      // Filter lại theo branchName để đảm bảo chỉ hiển thị requests của branch này
      // (trong trường hợp backend trả về tất cả requests)
      let filteredData = data || [];
      if (branchName) {
        filteredData = filteredData.filter((req: VehicleTransferRequest) => {
          // So sánh theo branchName để đảm bảo chỉ hiển thị requests của branch này
          return req.branchName === branchName;
        });
      }
      
      setRequests(filteredData);
    } catch (error: any) {
      console.error("Error loading transfer requests:", error);
      // Chỉ hiển thị error message nếu không phải lỗi mapping types
      if (!error?.message?.includes("mapping types") && 
          !error?.message?.includes("AutoMapper")) {
        message.error(error?.message || "Không thể tải danh sách yêu cầu điều chuyển");
      }
      // Set empty array để UI không crash
      setRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  const loadOrders = async () => {
    if (!branchId) return;
    setLoadingOrders(true);
    try {
      const data = await getTransferOrdersByBranch(branchId);
      setOrders(data || []);
    } catch (error: any) {
      console.error("Error loading transfer orders:", error);
      // Nếu API lỗi mapping types, không hiển thị error message vì đây là lỗi backend
      // Chỉ log và set empty array để UI vẫn hoạt động
      if (error?.message?.includes("mapping types") || 
          error?.message?.includes("AutoMapper") ||
          error?.message?.includes("Lỗi xử lý dữ liệu từ server")) {
        console.warn("Backend AutoMapper error - cannot load orders. This is a backend configuration issue.");
        setOrders([]);
      } else {
        // Chỉ hiển thị error message cho các lỗi khác (network, auth, etc.)
        const errorMessage = error?.message || "Không thể tải danh sách lệnh điều chuyển";
        message.error(errorMessage);
        setOrders([]);
      }
    } finally {
      setLoadingOrders(false);
    }
  };

  const loadPendingOrders = async () => {
    if (!branchId) return;
    
    // Lấy pending orders từ /VehicleTransferOrder/branch/{branchId}/pending
    // Đây là các orders đang chờ Manager dispatch hoặc receive
    try {
      const pendingOrdersData = await getPendingTransferOrdersByBranch(branchId);
      setPendingOrders(pendingOrdersData || []);
    } catch (error: any) {
      console.warn("Could not load pending orders from VehicleTransferOrder API:", error);
      
      // Nếu API pending lỗi mapping types, thử lấy từ orders chính và filter pending
      if (error?.message?.includes("mapping types") || 
          error?.message?.includes("AutoMapper") ||
          error?.message?.includes("Lỗi xử lý dữ liệu từ server")) {
        try {
          // Fallback: Lấy tất cả orders và filter pending
          const allOrders = await getTransferOrdersByBranch(branchId);
          if (allOrders && Array.isArray(allOrders)) {
            const pending = allOrders.filter(order => order.status === "Pending");
            setPendingOrders(pending);
          } else {
            setPendingOrders([]);
          }
        } catch (fallbackError) {
          console.warn("Could not load orders as fallback:", fallbackError);
          setPendingOrders([]);
        }
      } else {
        // Nếu lỗi khác, chỉ set empty array
        setPendingOrders([]);
      }
    }
  };

  // Filter requests
  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      !requestSearchText ||
      request.vehicleModelName?.toLowerCase().includes(requestSearchText.toLowerCase()) ||
      request.description?.toLowerCase().includes(requestSearchText.toLowerCase());
    
    const matchesStatus = selectedRequestStatus === "all" || request.status?.toUpperCase() === selectedRequestStatus.toUpperCase();
    
    return matchesSearch && matchesStatus;
  });

  // Filter orders
  const filteredOrders = (orders || []).filter((order) => {
    const matchesSearch =
      !orderSearchText ||
      order.vehicleLicensePlate?.toLowerCase().includes(orderSearchText.toLowerCase()) ||
      order.fromBranchName?.toLowerCase().includes(orderSearchText.toLowerCase()) ||
      order.toBranchName?.toLowerCase().includes(orderSearchText.toLowerCase());
    
    const matchesStatus = selectedOrderStatus === "all" || order.status?.toUpperCase() === selectedOrderStatus.toUpperCase();
    
    return matchesSearch && matchesStatus;
  });

  // Request handlers
  const handleCreateRequest = () => {
    requestForm.resetFields();
    setIsRequestModalVisible(true);
  };

  const handleSubmitRequest = async () => {
    try {
      const values = await requestForm.validateFields();
      // Hiển thị loading message
      const hideLoading = message.loading("Đang tạo yêu cầu điều chuyển...", 0);
      
      const result = await createTransferRequest({
        vehicleModelId: values.vehicleModelId,
        quantityRequested: values.quantityRequested,
        description: values.description,
      });
      
      // Đóng loading message
      hideLoading();
      message.success("Tạo yêu cầu điều chuyển thành công");
      setIsRequestModalVisible(false);
      requestForm.resetFields();
      
      // Reload danh sách requests để hiển thị request mới
      await loadRequests();
    } catch (error: any) {
      console.error("Error creating transfer request:", error);
      if (error.errorFields) {
        return;
      }
      // Hiển thị error message chi tiết từ backend
      const errorMessage = error?.message || "Không thể tạo yêu cầu điều chuyển";
      message.error(errorMessage);
    }
  };

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

  const handleCancelRequest = async (request: VehicleTransferRequest) => {
    // Validate status - only Pending requests can be cancelled
    const normalizedStatus = (request.status || "").toUpperCase();
    if (normalizedStatus !== "PENDING") {
      message.warning("Chỉ có thể hủy yêu cầu ở trạng thái Pending");
      return;
    }

    Modal.confirm({
      title: "Xác nhận hủy",
      content: `Bạn có chắc muốn hủy yêu cầu điều chuyển "${request.vehicleModelName}"?`,
      okText: "Hủy yêu cầu",
      okType: "danger",
      cancelText: "Không",
      onOk: async () => {
        try {
          await cancelTransferRequest(request.id);
          message.success("Hủy yêu cầu thành công");
          // Reload requests to update UI
          await loadRequests();
        } catch (error: any) {
          console.error("Error cancelling request:", error);
          // Show detailed error message from backend
          const errorMessage = error?.message || "Không thể hủy yêu cầu";
          message.error(errorMessage);
        }
      },
    });
  };

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

  const handleDispatch = async (order: VehicleTransferOrder) => {
    const currentStatus = (order.status || "").toUpperCase();
    const currentBranch = (branchId || "").toLowerCase();
    const fromBranch = (order.fromBranchId || "").toLowerCase();

    if (currentStatus !== "PENDING") {
      message.warning("Chỉ có thể xác nhận xuất xe khi lệnh ở trạng thái Pending");
      return;
    }

    if (!currentBranch || currentBranch !== fromBranch) {
      message.warning("Chỉ Manager chi nhánh nguồn mới được xác nhận xuất xe");
      return;
    }

    setOrderToDispatch(order);
    setIsDispatchModalVisible(true);
  };

  const handleReceive = async (order: VehicleTransferOrder) => {
    if (order.status !== "InTransit") {
      message.warning("Chỉ có thể xác nhận nhận xe khi lệnh ở trạng thái InTransit");
      return;
    }

    if (order.toBranchId !== branchId) {
      message.warning("Chỉ Manager chi nhánh đích mới được xác nhận nhận xe");
      return;
    }

    setOrderToReceive(order);
    setIsReceiveModalVisible(true);
  };

  const handleConfirmDispatch = async () => {
    if (!orderToDispatch) return;
    
    setIsProcessing(true);
    const orderIdToUpdate = orderToDispatch.id; // Save ID before setting to null
    
    try {
      const updatedOrder = await dispatchTransferOrder(orderIdToUpdate);
      message.success("Xác nhận xuất xe thành công. Xe đang được vận chuyển.");

      // Ensure status is correctly set from API response
      const newStatus = updatedOrder?.status || "InTransit";

      // Update UI with response data from API immediately
      setOrders((prev) =>
        prev.map((item) =>
          item.id === orderIdToUpdate
            ? { ...item, ...updatedOrder, status: newStatus }
            : item
        )
      );
      
      setPendingOrders((prev) =>
        prev.filter((item) => item.id !== orderIdToUpdate)
      );

      // Update selectedOrder if modal is open and showing this order
      if (selectedOrder && selectedOrder.id === orderIdToUpdate) {
        setSelectedOrder({ ...selectedOrder, ...updatedOrder, status: newStatus });
      }

      // Close modal
      setIsDispatchModalVisible(false);
      setOrderToDispatch(null);

      // Don't reload immediately - the state update from API response is sufficient
      // Reload will happen naturally when user navigates or refreshes
      // This prevents reload from overwriting the optimistic update
    } catch (error: any) {
      const errorMessage = error?.message || "Không thể xác nhận xuất xe";
      message.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReceive = async () => {
    if (!orderToReceive) return;
    
    setIsProcessing(true);
    try {
      const updatedOrder = await receiveTransferOrder(orderToReceive.id);
      message.success("Xác nhận nhận xe thành công. Xe đã sẵn sàng cho thuê tại chi nhánh này.");

      // Ensure status is correctly set from API response
      const newStatus = updatedOrder?.status || "Completed";
      // Close modal first
      setIsReceiveModalVisible(false);
      const orderIdToUpdate = orderToReceive.id;
      setOrderToReceive(null);

      // Update UI with response data from API immediately - include all fields from response
      setOrders((prev) => {
        const updated = prev.map((item) =>
          item.id === orderIdToUpdate
            ? { 
                ...item, 
                ...updatedOrder, 
                status: newStatus,
                receivedDate: updatedOrder?.receivedDate || item.receivedDate
              }
            : item
        );
        return updated;
      });
      
      setPendingOrders((prev) => {
        const filtered = prev.filter((item) => item.id !== orderIdToUpdate);
        return filtered;
      });

      // Update selectedOrder if modal is open and showing this order
      if (selectedOrder && selectedOrder.id === orderIdToUpdate) {
        const updatedSelected = { 
          ...selectedOrder, 
          ...updatedOrder, 
          status: newStatus,
          receivedDate: updatedOrder?.receivedDate || selectedOrder.receivedDate
        };
        setSelectedOrder(updatedSelected);
      }

      // Don't reload immediately - the state update from API response is sufficient
      // Reload will happen naturally when user navigates or refreshes
      // This prevents reload from overwriting the optimistic update
    } catch (error: any) {
      console.error("[Receive] Error:", error);
      const errorMessage = error?.message || "Không thể xác nhận nhận xe";
      message.error(errorMessage);
    } finally {
      setIsProcessing(false);
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
      width: 200,
      fixed: "right",
      render: (_, record) => {
        return (
          <Space size="small">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => handleViewRequestDetail(record)}
              className="px-2"
            >
              Xem
            </Button>
            {record.status === "Pending" && (
              <Button
                type="link"
                danger
                icon={<CloseOutlined />}
                onClick={() => handleCancelRequest(record)}
                className="px-2"
              >
                Hủy
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

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
      width: 250,
      fixed: "right",
      render: (_, record) => {
        const canDispatch = record.status === "Pending" && record.fromBranchId === branchId;
        const canReceive = record.status === "InTransit" && record.toBranchId === branchId;
        
        return (
          <Space size="small">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => handleViewOrderDetail(record)}
              className="px-2"
            >
              Xem
            </Button>
            {canDispatch && (
              <Button
                type="link"
                icon={<SendOutlined />}
                onClick={() => handleDispatch(record)}
                className="px-2 text-blue-600 hover:text-blue-700"
              >
                Xác nhận xuất
              </Button>
            )}
            {canReceive && (
              <Button
                type="link"
                icon={<InboxOutlined />}
                onClick={() => handleReceive(record)}
                className="px-2 text-green-600 hover:text-green-700"
              >
                Xác nhận nhận
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  if (!branchId) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">
          Đang tải thông tin chi nhánh...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h1 className="text-xl font-semibold text-gray-800">Điều chuyển xe</h1>
        {activeTab === "requests" && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateRequest}
            size="middle"
          >
            Tạo yêu cầu điều chuyển
          </Button>
        )}
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        {/* Tab: Yêu cầu điều chuyển */}
        <TabPane tab="Yêu cầu điều chuyển" key="requests">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Tổng yêu cầu</div>
                  <div className="text-2xl font-bold text-gray-800">{requests.length}</div>
                </div>
                <FileTextOutlined className="text-3xl text-blue-400 opacity-60" />
              </div>
            </Card>
            <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Chờ duyệt</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {requests.filter(r => r.status === "Pending").length}
                  </div>
                </div>
                <ClockCircleOutlined className="text-3xl text-orange-400 opacity-60" />
              </div>
            </Card>
            <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Đã duyệt</div>
                  <div className="text-2xl font-bold text-green-600">
                    {requests.filter(r => r.status === "Approved").length}
                  </div>
                </div>
                <CheckCircleOutlined className="text-3xl text-green-400 opacity-60" />
              </div>
            </Card>
          </div>

          {/* Filters */}
          <Card className="shadow-sm mb-4 border-0">
            <div className="flex gap-3 flex-wrap">
              <Input
                placeholder="Tìm theo model, mô tả"
                allowClear
                prefix={<SearchOutlined className="text-gray-400" />}
                style={{ maxWidth: 400, flex: 1, minWidth: 250 }}
                value={requestSearchText}
                onChange={(e) => setRequestSearchText(e.target.value)}
                onPressEnter={() => setRequestSearchText(requestSearchText)}
                className="rounded-lg"
              />
              <Select
                placeholder="Trạng thái"
                style={{ width: 150 }}
                value={selectedRequestStatus}
                onChange={setSelectedRequestStatus}
                className="rounded-lg"
              >
                <Option value="all">Tất cả</Option>
                <Option value="Pending">Chờ duyệt</Option>
                <Option value="Approved">Đã duyệt</Option>
                <Option value="Cancelled">Đã hủy</Option>
              </Select>
            </div>
          </Card>

          {/* Table */}
          <Card className="shadow-sm border-0">
            <Table
            columns={requestColumns}
            dataSource={filteredRequests}
            rowKey="id"
            loading={loadingRequests}
            scroll={{ x: 1200 }}
            locale={{
              emptyText: "Không có yêu cầu điều chuyển nào"
            }}
            pagination={{
              pageSize: 12,
              showSizeChanger: true,
              showTotal: (total) => `Tổng: ${total} yêu cầu`,
              pageSizeOptions: ["12", "24", "48", "96"],
            }}
            size="middle"
          />
          </Card>
        </TabPane>

        {/* Tab: Lệnh điều chuyển */}
        <TabPane tab="Lệnh điều chuyển" key="orders">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <Card className="border-l-4 border-l-indigo-500 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Tổng lệnh điều chuyển</div>
                  <div className="text-2xl font-bold text-gray-800">{orders.length}</div>
                </div>
                <FileTextOutlined className="text-3xl text-indigo-400 opacity-60" />
              </div>
            </Card>
            <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Chờ xử lý</div>
                  <div className="text-2xl font-bold text-orange-600">{pendingOrders.length}</div>
                </div>
                <ClockCircleOutlined className="text-3xl text-orange-400 opacity-60" />
              </div>
            </Card>
            <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Đang vận chuyển</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {orders.filter(o => o.status === "InTransit").length}
                  </div>
                </div>
                <CarOutlined className="text-3xl text-blue-400 opacity-60" />
              </div>
            </Card>
          </div>

          {/* Filters */}
          <Card className="shadow-sm mb-4 border-0">
            <div className="flex gap-3 flex-wrap">
              <Input
                placeholder="Tìm theo biển số, chi nhánh"
                allowClear
                prefix={<SearchOutlined className="text-gray-400" />}
                style={{ maxWidth: 400, flex: 1, minWidth: 250 }}
                value={orderSearchText}
                onChange={(e) => setOrderSearchText(e.target.value)}
                onPressEnter={() => setOrderSearchText(orderSearchText)}
                className="rounded-lg"
              />
              <Select
                placeholder="Trạng thái"
                style={{ width: 150 }}
                value={selectedOrderStatus}
                onChange={setSelectedOrderStatus}
                className="rounded-lg"
              >
                <Option value="all">Tất cả</Option>
                <Option value="Pending">Chờ xuất xe</Option>
              <Option value="InTransit">Đang vận chuyển</Option>
              <Option value="Completed">Hoàn tất</Option>
              <Option value="Cancelled">Đã hủy</Option>
            </Select>
            </div>
          </Card>

          {/* Table */}
          <Card className="shadow-sm border-0">
            <Table
              columns={orderColumns}
              dataSource={filteredOrders}
              rowKey="id"
              loading={loadingOrders}
              scroll={{ x: 1200 }}
              locale={{
                emptyText: "Không có lệnh điều chuyển nào"
              }}
              pagination={{
                pageSize: 12,
                showSizeChanger: true,
                showTotal: (total) => `Tổng: ${total} lệnh điều chuyển`,
                pageSizeOptions: ["12", "24", "48", "96"],
              }}
              size="middle"
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* Create Request Modal */}
      <Modal
        title="Tạo yêu cầu điều chuyển xe"
        open={isRequestModalVisible}
        onCancel={() => {
          setIsRequestModalVisible(false);
          requestForm.resetFields();
        }}
        onOk={handleSubmitRequest}
        okText="Tạo yêu cầu"
        cancelText="Hủy"
        width={600}
        destroyOnHidden={true}
      >
        <Form form={requestForm} layout="vertical">
          <Form.Item
            name="vehicleModelId"
            label="Model xe"
            rules={[{ required: true, message: "Vui lòng chọn model xe" }]}
          >
            <Select
              placeholder="Chọn model xe"
              loading={loadingModels}
              showSearch
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
              options={vehicleModels.map((model) => ({
                value: model.id || model.vehicleModelId,
                label: `${model.modelName}${model.category ? ` (${model.category})` : ""}`,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="quantityRequested"
            label="Số lượng yêu cầu"
            rules={[
              { required: true, message: "Vui lòng nhập số lượng" },
              { type: "number", min: 1, message: "Số lượng phải lớn hơn 0" },
            ]}
          >
            <InputNumber
              placeholder="Nhập số lượng xe cần điều chuyển"
              min={1}
              style={{ width: "100%" }}
            />
          </Form.Item>
          <Form.Item
            name="description"
            label="Mô tả / Lý do"
            rules={[{ required: true, message: "Vui lòng nhập mô tả lý do điều chuyển" }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Nhập mô tả lý do cần điều chuyển xe (ví dụ: Chi nhánh cần thêm xe Klara S để đáp ứng nhu cầu cao điểm)"
            />
          </Form.Item>
        </Form>
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
                {selectedRequest.branchName ||
                  (selectedRequest.staff as any)?.branch?.branchName ||
                  branchName ||
                  "-"}
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
                  {(selectedRequest.vehicleModel as any).batteryCapacityKwh
                    ? `${(selectedRequest.vehicleModel as any).batteryCapacityKwh} kWh`
                    : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Tầm hoạt động">
                  {selectedRequest.vehicleModel.maxRangeKm
                    ? `${selectedRequest.vehicleModel.maxRangeKm} km`
                    : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Tốc độ tối đa">
                  {selectedRequest.vehicleModel.maxSpeedKmh
                    ? `${selectedRequest.vehicleModel.maxSpeedKmh} km/h`
                    : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Mô tả" span={2}>
                  {(selectedRequest.vehicleModel as any).description || "-"}
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
                  {(selectedRequest.staff as any).branch?.branchName || "-"}
                </Descriptions.Item>
                {(selectedRequest.staff as any).branch && (
                  <>
                    <Descriptions.Item label="Địa chỉ" span={2}>
                      {(selectedRequest.staff as any).branch.address || "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Số điện thoại">
                      {(selectedRequest.staff as any).branch.phone || "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Email chi nhánh">
                      {(selectedRequest.staff as any).branch.email || "-"}
                    </Descriptions.Item>
                  </>
                )}
              </Descriptions>
            )}

            {selectedRequest.vehicleTransferOrder && (
              <Descriptions title="Lệnh điều chuyển liên quan" column={2} bordered>
                <Descriptions.Item label="ID lệnh">
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

      {/* Dispatch Confirmation Modal */}
      <Modal
        title="Xác nhận xuất xe"
        open={isDispatchModalVisible}
        onOk={handleConfirmDispatch}
        onCancel={() => {
          setIsDispatchModalVisible(false);
          setOrderToDispatch(null);
        }}
        okText="Xác nhận xuất"
        cancelText="Hủy"
        okType="primary"
        confirmLoading={isProcessing}
      >
        {orderToDispatch && (
          <p>Bạn có chắc muốn xác nhận đã xuất xe <strong>"{orderToDispatch.vehicleLicensePlate}"</strong> cho vận chuyển?</p>
        )}
      </Modal>

      {/* Receive Confirmation Modal */}
      <Modal
        title="Xác nhận nhận xe"
        open={isReceiveModalVisible}
        onOk={handleConfirmReceive}
        onCancel={() => {
          setIsReceiveModalVisible(false);
          setOrderToReceive(null);
        }}
        okText="Xác nhận nhận"
        cancelText="Hủy"
        okType="primary"
        confirmLoading={isProcessing}
      >
        {orderToReceive && (
          <p>Bạn có chắc muốn xác nhận đã nhận xe <strong>"{orderToReceive.vehicleLicensePlate}"</strong>? Xe sẽ được mở khóa và sẵn sàng cho thuê.</p>
        )}
      </Modal>
    </div>
  );
}
