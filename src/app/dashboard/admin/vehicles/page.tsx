"use client";

import { useEffect, useState } from "react";
import { Table, Button, Input, Select, Space, Tag, Modal, Form, DatePicker, Upload, message, Image, Card, Descriptions } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined, EyeOutlined, UploadOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import { getVehicles, getVehicleById, createVehicle, updateVehicle, VehicleFilters, VehicleListResponse } from "./vehicle_service";
import type { ColumnsType } from "antd/es/table";

const { Search } = Input;
const { Option } = Select;

const INTERNAL_BASE = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface Branch {
  branchId: string;
  branchName: string;
}

interface VehicleModel {
  vehicleModelId: string;
  modelName: string;
  brand?: string;
}

interface Vehicle {
  id?: string; // API trả về id
  vehicleId?: string; // Hoặc vehicleId
  licensePlate: string;
  color?: string;
  yearOfManufacture?: string;
  currentOdometerKm?: number;
  batteryHealthPercentage?: number;
  status?: string;
  purchaseDate?: string;
  branchId?: string;
  branchName?: string;
  branch?: {
    id: string;
    branchName: string;
    address?: string;
    city?: string;
    phone?: string;
    email?: string;
    latitude?: number;
    longitude?: number;
    openingTime?: string;
    closingTime?: string;
  };
  gpsDeviceIdent?: string;
  flespiDeviceId?: number;
  description?: string;
  vehicleModelId?: string;
  vehicleModel?: {
    id: string;
    modelName: string;
    category?: string;
    batteryCapacityKwh?: number;
    maxRangeKm?: number;
    maxSpeedKmh?: number;
    description?: string;
    rentalPricing?: {
      id: string;
      rentalPrice: number;
      excessKmPrice: number;
    };
  };
  vehicleModelName?: string; // Mapped từ vehicleModel.modelName
  imageFiles?: string[];
  fileUrl?: string[];
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 12,
    total: 0,
  });
  const [filters, setFilters] = useState<VehicleFilters>({
    PageSize: 12,
    PageNum: 1,
  });
  const [searchText, setSearchText] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  
  // Modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [vehicleModels, setVehicleModels] = useState<VehicleModel[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);

  // Load branches and models once
  useEffect(() => {
    loadBranches();
    loadVehicleModels();
  }, []);

  // Load vehicles khi filters thay đổi hoặc branches đã load xong
  useEffect(() => {
    if (branches.length > 0 || filters) {
      loadVehicles();
    }
  }, [filters, branches.length]);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      // Build filters với search và status
      const apiFilters: VehicleFilters = {
        ...filters,
        LicensePlate: searchText || undefined,
        Status: selectedStatus !== "all" ? selectedStatus : undefined,
        BranchId: selectedBranch !== "all" ? selectedBranch : undefined,
      };
      
      const response: VehicleListResponse = await getVehicles(apiFilters);
      
      // Map branchName từ branches list nếu vehicle có branchId nhưng không có branch object
      const vehiclesWithBranch = response.items.map((vehicle) => {
        // Nếu đã có branch object hoặc branchName, giữ nguyên
        if (vehicle.branch?.branchName || vehicle.branchName) {
          return vehicle;
        }
        
        // Nếu có branchId, tìm trong branches list
        if (vehicle.branchId && branches.length > 0) {
          const branch = branches.find((b) => b.branchId === vehicle.branchId);
          if (branch) {
            return {
              ...vehicle,
              branchName: branch.branchName,
            };
          }
        }
        
        // List API không trả về branch info, sẽ hiển thị "-" trong bảng
        // Khi click "Xem" chi tiết, modal sẽ hiển thị đầy đủ từ API chi tiết
        return vehicle;
      });
      
      setVehicles(vehiclesWithBranch);
      setPagination({
        current: response.currentPage,
        pageSize: response.pageSize,
        total: response.totalItems,
      });
    } catch (error) {
      console.error("Error loading vehicles:", error);
      message.error("Không thể tải danh sách xe");
    } finally {
      setLoading(false);
    }
  };

  // Reset về trang 1 và reload khi search hoặc filter thay đổi (với debounce cho search)
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        PageNum: 1, // Reset về trang 1 khi search/filter
      }));
    }, searchText ? 500 : 0); // Debounce 500ms cho search, không debounce cho status/branch

    return () => clearTimeout(timer);
  }, [searchText, selectedStatus, selectedBranch]);

  // Handle pagination change
  const handleTableChange = (page: number, pageSize: number) => {
    setFilters({
      ...filters,
      PageNum: page,
      PageSize: pageSize,
    });
  };

  const loadBranches = async () => {
    setLoadingBranches(true);
    try {
      const res = await fetch(`${INTERNAL_BASE}/api/branch/list`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch branches");
      const text = await res.text();
      const json = text ? JSON.parse(text) : {};
      const branchesData = json.data || json || [];
      setBranches(Array.isArray(branchesData) ? branchesData : []);
    } catch (error) {
      console.error("Error loading branches:", error);
      // Không hiển thị error vì có thể API chưa có
    } finally {
      setLoadingBranches(false);
    }
  };

  const loadVehicleModels = async () => {
    setLoadingModels(true);
    try {
      const res = await fetch(`${INTERNAL_BASE}/api/vehicle-model/list-all`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch vehicle models");
      const text = await res.text();
      const json = text ? JSON.parse(text) : {};
      
      console.log("Vehicle Models API response:", json);
      
      let modelsData = [];
      if (json.success && json.data) {
        if (Array.isArray(json.data)) {
          // API trả về { success: true, data: [...] }
          modelsData = json.data;
        } else if (json.data.items && Array.isArray(json.data.items)) {
          // API trả về { success: true, data: { items: [...] } }
          modelsData = json.data.items;
        }
      } else if (Array.isArray(json)) {
        // API trả về array trực tiếp
        modelsData = json;
      } else if (Array.isArray(json.data)) {
        // API trả về { data: [...] }
        modelsData = json.data;
      }
      
      // Map dữ liệu để đảm bảo có vehicleModelId và modelName
      const mappedModels = modelsData.map((model: any) => ({
        vehicleModelId: model.vehicleModelId || model.id,
        modelName: model.modelName || model.name,
        category: model.category,
        batteryCapacityKwh: model.batteryCapacityKwh,
        maxRangeKm: model.maxRangeKm,
        rentalPrice: model.rentalPrice,
        imageUrl: model.imageUrl,
        availableColors: model.availableColors || [],
      }));
      
      console.log("Mapped vehicle models:", mappedModels);
      setVehicleModels(mappedModels);
    } catch (error) {
      console.error("Error loading vehicle models:", error);
      message.error("Không thể tải danh sách model xe");
    } finally {
      setLoadingModels(false);
    }
  };

  // Không cần filter client-side nữa vì đã filter ở server

  // Handle create/edit
  const handleOpenModal = (vehicle?: Vehicle) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      const vehicleId = vehicle.id || vehicle.vehicleId;
      const vehicleModelId = vehicle.vehicleModelId || vehicle.vehicleModel?.id;
      const imageFiles = vehicle.imageFiles || vehicle.fileUrl || [];
      
      form.setFieldsValue({
        licensePlate: vehicle.licensePlate,
        color: vehicle.color,
        yearOfManufacture: vehicle.yearOfManufacture ? dayjs(vehicle.yearOfManufacture) : undefined,
        currentOdometerKm: vehicle.currentOdometerKm,
        batteryHealthPercentage: vehicle.batteryHealthPercentage,
        status: vehicle.status,
        purchaseDate: vehicle.purchaseDate ? dayjs(vehicle.purchaseDate) : undefined,
        branchId: vehicle.branchId,
        vehicleModelId: vehicleModelId,
        gpsDeviceIdent: vehicle.gpsDeviceIdent,
        flespiDeviceId: vehicle.flespiDeviceId,
        description: vehicle.description,
      });
      setFileList(imageFiles.map((url: string, index: number) => ({
        uid: `-${index}`,
        name: `image-${index}.jpg`,
        status: 'done',
        url: url,
      })));
    } else {
      setEditingVehicle(null);
      form.resetFields();
      setFileList([]);
    }
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setEditingVehicle(null);
    form.resetFields();
    setFileList([]);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const formData = new FormData();

      // Append all fields
      if (editingVehicle) {
        const vehicleId = editingVehicle.id || editingVehicle.vehicleId;
        if (vehicleId) {
          formData.append("VehicleId", vehicleId);
        }
      }
      if (values.licensePlate) formData.append("LicensePlate", values.licensePlate);
      if (values.color) formData.append("Color", values.color);
      if (values.yearOfManufacture) {
        formData.append("YearOfManufacture", dayjs(values.yearOfManufacture).toISOString());
      }
      if (values.currentOdometerKm !== undefined) {
        formData.append("CurrentOdometerKm", String(values.currentOdometerKm));
      }
      if (values.batteryHealthPercentage !== undefined) {
        formData.append("BatteryHealthPercentage", String(values.batteryHealthPercentage));
      }
      if (values.status) formData.append("Status", values.status);
      if (values.purchaseDate) {
        formData.append("PurchaseDate", dayjs(values.purchaseDate).toISOString());
      }
      if (values.branchId) formData.append("BranchId", values.branchId);
      if (values.gpsDeviceIdent) formData.append("GpsDeviceIdent", values.gpsDeviceIdent);
      if (values.flespiDeviceId !== undefined) {
        formData.append("FlespiDeviceId", String(values.flespiDeviceId));
      }
      if (values.description) formData.append("Description", values.description);
      if (values.vehicleModelId) {
        formData.append("VehicleModelId", values.vehicleModelId);
      } else if (editingVehicle?.vehicleModelId) {
        formData.append("VehicleModelId", editingVehicle.vehicleModelId);
      }

      // Append image files (only new files)
      fileList.forEach((file) => {
        if (file.originFileObj) {
          formData.append("ImageFiles", file.originFileObj);
        }
      });

      if (editingVehicle) {
        await updateVehicle(formData);
        message.success("Cập nhật xe thành công");
      } else {
        if (!values.vehicleModelId || !values.branchId) {
          message.error("Vui lòng chọn Model xe và Chi nhánh");
          return;
        }
        await createVehicle(formData);
        message.success("Tạo xe mới thành công");
      }

      handleCloseModal();
      loadVehicles();
    } catch (error: any) {
      console.error("Error saving vehicle:", error);
      if (error.errorFields) {
        // Form validation errors
        return;
      }
      message.error(error.message || "Không thể lưu xe");
    }
  };

  // Handle view detail
  const handleViewDetail = async (vehicle: Vehicle) => {
    try {
      const vehicleId = vehicle.id || vehicle.vehicleId;
      if (!vehicleId) {
        message.error("Không tìm thấy ID xe");
        return;
      }
      const detail = await getVehicleById(vehicleId);
      setSelectedVehicle(detail);
      setIsDetailModalVisible(true);
    } catch (error) {
      console.error("Error loading vehicle detail:", error);
      message.error("Không thể tải chi tiết xe");
    }
  };

  // Status tag color
  const getStatusTag = (status?: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      AVAILABLE: { color: "green", text: "Sẵn sàng" },
      RENTED: { color: "blue", text: "Đang thuê" },
      MAINTENANCE: { color: "orange", text: "Bảo trì" },
      UNAVAILABLE: { color: "red", text: "Không khả dụng" },
    };
    const statusInfo = statusMap[status || ""] || { color: "default", text: status || "N/A" };
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  const columns: ColumnsType<Vehicle> = [
    {
      title: "Biển số",
      dataIndex: "licensePlate",
      key: "licensePlate",
      width: 120,
    },
    {
      title: "Model",
      key: "vehicleModelName",
      width: 150,
      render: (_, record) => record.vehicleModelName || record.vehicleModel?.modelName || "-",
    },
    {
      title: "Màu sắc",
      dataIndex: "color",
      key: "color",
      width: 100,
    },
    {
      title: "Số km",
      dataIndex: "currentOdometerKm",
      key: "currentOdometerKm",
      width: 100,
      render: (text) => text ? `${text.toLocaleString()} km` : "-",
    },
    {
      title: "Pin %",
      dataIndex: "batteryHealthPercentage",
      key: "batteryHealthPercentage",
      width: 100,
      render: (text) => text !== undefined ? `${text}%` : "-",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => getStatusTag(status),
    },
    {
      title: "Chi nhánh",
      key: "branchName",
      width: 200,
      render: (_, record) => {
        // Ưu tiên lấy từ branch object, sau đó từ branchName
        return record.branch?.branchName || record.branchName || "-";
      },
    },
    {
      title: "Hành động",
      key: "action",
      width: 200,
      fixed: "right",
      render: (_, record) => {
        const vehicleId = record.id || record.vehicleId;
        return (
          <Space>
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
              disabled={!vehicleId}
            >
              Xem
            </Button>
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleOpenModal(record)}
              disabled={!vehicleId}
            >
              Sửa
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Quản lý xe</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => handleOpenModal()}
        >
          Thêm xe mới
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-4 flex-wrap">
        <Search
          placeholder="Tìm theo biển số hoặc model"
          allowClear
          style={{ width: 300 }}
          onSearch={(value) => setSearchText(value)}
          onChange={(e) => !e.target.value && setSearchText("")}
        />
        <Select
          placeholder="Trạng thái"
          style={{ width: 150 }}
          value={selectedStatus}
          onChange={setSelectedStatus}
        >
          <Option value="all">Tất cả</Option>
          <Option value="AVAILABLE">Sẵn sàng</Option>
          <Option value="RENTED">Đang thuê</Option>
          <Option value="MAINTENANCE">Bảo trì</Option>
          <Option value="UNAVAILABLE">Không khả dụng</Option>
        </Select>
        <Select
          placeholder="Chi nhánh"
          style={{ width: 200 }}
          value={selectedBranch}
          onChange={setSelectedBranch}
          loading={loadingBranches}
        >
          <Option value="all">Tất cả</Option>
          {branches.map((branch) => (
            <Option key={branch.branchId} value={branch.branchId}>
              {branch.branchName}
            </Option>
          ))}
        </Select>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={vehicles}
        rowKey={(record) => record.id || record.vehicleId || record.licensePlate}
        loading={loading}
        scroll={{ x: 1200 }}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showTotal: (total) => `Tổng: ${total} xe`,
          pageSizeOptions: ["12", "24", "48", "96"],
          onChange: handleTableChange,
          onShowSizeChange: handleTableChange,
        }}
      />

      {/* Create/Edit Modal */}
      <Modal
        title={editingVehicle ? "Chỉnh sửa xe" : "Thêm xe mới"}
        open={isModalVisible}
        onCancel={handleCloseModal}
        onOk={handleSubmit}
        width={800}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="licensePlate"
            label="Biển số"
            rules={[{ required: true, message: "Vui lòng nhập biển số" }]}
          >
            <Input placeholder="Nhập biển số" />
          </Form.Item>

          <Form.Item name="color" label="Màu sắc">
            <Input placeholder="Nhập màu sắc" />
          </Form.Item>

          <Form.Item name="yearOfManufacture" label="Năm sản xuất">
            <DatePicker
              picker="year"
              style={{ width: "100%" }}
              placeholder="Chọn năm"
            />
          </Form.Item>

          <Form.Item name="currentOdometerKm" label="Số km hiện tại">
            <Input type="number" placeholder="Nhập số km" />
          </Form.Item>

          <Form.Item name="batteryHealthPercentage" label="Phần trăm pin (%)">
            <Input type="number" min={0} max={100} placeholder="Nhập % pin" />
          </Form.Item>

          <Form.Item
            name="status"
            label="Trạng thái"
            rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
          >
            <Select placeholder="Chọn trạng thái">
              <Option value="AVAILABLE">Sẵn sàng</Option>
              <Option value="RENTED">Đang thuê</Option>
              <Option value="MAINTENANCE">Bảo trì</Option>
              <Option value="UNAVAILABLE">Không khả dụng</Option>
            </Select>
          </Form.Item>

          <Form.Item name="purchaseDate" label="Ngày mua">
            <DatePicker style={{ width: "100%" }} placeholder="Chọn ngày mua" />
          </Form.Item>

          <Form.Item
            name="branchId"
            label="Chi nhánh"
            rules={[{ required: !editingVehicle, message: "Vui lòng chọn chi nhánh" }]}
          >
            <Select 
              placeholder="Chọn chi nhánh" 
              disabled={!!editingVehicle}
              loading={loadingBranches}
            >
              {branches.map((branch) => (
                <Option key={branch.branchId} value={branch.branchId}>
                  {branch.branchName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="vehicleModelId"
            label="Model xe"
            rules={[{ required: !editingVehicle, message: "Vui lòng chọn model xe" }]}
          >
            <Select 
              placeholder="Chọn model xe" 
              disabled={!!editingVehicle}
              loading={loadingModels}
              showSearch
              filterOption={(input, option) =>
                (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
              }
            >
              {vehicleModels.map((model) => (
                <Option key={model.vehicleModelId} value={model.vehicleModelId}>
                  {model.modelName} {model.brand ? `(${model.brand})` : ""}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="gpsDeviceIdent" label="GPS Device ID">
            <Input placeholder="Nhập GPS Device ID" />
          </Form.Item>

          <Form.Item name="flespiDeviceId" label="Flespi Device ID">
            <Input type="number" placeholder="Nhập Flespi Device ID" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} placeholder="Nhập mô tả" />
          </Form.Item>

          <Form.Item label="Hình ảnh">
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
              beforeUpload={() => false}
              multiple
            >
              {fileList.length < 5 && <div><UploadOutlined /> Tải lên</div>}
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title="Chi tiết xe"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalVisible(false)}>
            Đóng
          </Button>,
        ]}
        width={800}
      >
        {selectedVehicle && (
          <div>
            {/* Thông tin cơ bản */}
            <Descriptions title="Thông tin xe" column={2} bordered className="mb-4">
              <Descriptions.Item label="Biển số">
                {selectedVehicle.licensePlate}
              </Descriptions.Item>
              <Descriptions.Item label="Model">
                {selectedVehicle.vehicleModelName || selectedVehicle.vehicleModel?.modelName || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Màu sắc">
                {selectedVehicle.color || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Năm sản xuất">
                {selectedVehicle.yearOfManufacture
                  ? dayjs(selectedVehicle.yearOfManufacture).format("YYYY")
                  : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Số km hiện tại">
                {selectedVehicle.currentOdometerKm
                  ? `${selectedVehicle.currentOdometerKm.toLocaleString()} km`
                  : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Phần trăm pin">
                {selectedVehicle.batteryHealthPercentage !== undefined
                  ? `${selectedVehicle.batteryHealthPercentage}%`
                  : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                {getStatusTag(selectedVehicle.status)}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày mua">
                {selectedVehicle.purchaseDate
                  ? dayjs(selectedVehicle.purchaseDate).format("DD/MM/YYYY")
                  : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="GPS Device ID">
                {selectedVehicle.gpsDeviceIdent || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Flespi Device ID">
                {selectedVehicle.flespiDeviceId || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Mô tả" span={2}>
                {selectedVehicle.description || "-"}
              </Descriptions.Item>
            </Descriptions>

            {/* Thông tin Model */}
            {selectedVehicle.vehicleModel && (
              <Descriptions title="Thông tin Model" column={2} bordered className="mb-4">
                <Descriptions.Item label="Tên Model">
                  {selectedVehicle.vehicleModel.modelName}
                </Descriptions.Item>
                <Descriptions.Item label="Phân loại">
                  {selectedVehicle.vehicleModel.category || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Dung lượng pin">
                  {selectedVehicle.vehicleModel.batteryCapacityKwh
                    ? `${selectedVehicle.vehicleModel.batteryCapacityKwh} kWh`
                    : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Quãng đường tối đa">
                  {selectedVehicle.vehicleModel.maxRangeKm
                    ? `${selectedVehicle.vehicleModel.maxRangeKm} km`
                    : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Tốc độ tối đa">
                  {selectedVehicle.vehicleModel.maxSpeedKmh
                    ? `${selectedVehicle.vehicleModel.maxSpeedKmh} km/h`
                    : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Mô tả Model" span={2}>
                  {selectedVehicle.vehicleModel.description || "-"}
                </Descriptions.Item>
                {selectedVehicle.vehicleModel.rentalPricing && (
                  <>
                    <Descriptions.Item label="Giá thuê">
                      {selectedVehicle.vehicleModel.rentalPricing.rentalPrice
                        ? `${selectedVehicle.vehicleModel.rentalPricing.rentalPrice.toLocaleString()} VNĐ`
                        : "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Giá vượt km">
                      {selectedVehicle.vehicleModel.rentalPricing.excessKmPrice
                        ? `${selectedVehicle.vehicleModel.rentalPricing.excessKmPrice.toLocaleString()} VNĐ/km`
                        : "-"}
                    </Descriptions.Item>
                  </>
                )}
              </Descriptions>
            )}

            {/* Thông tin Chi nhánh */}
            {selectedVehicle.branch && (
              <Descriptions title="Thông tin Chi nhánh" column={2} bordered className="mb-4">
                <Descriptions.Item label="Tên chi nhánh">
                  {selectedVehicle.branch.branchName}
                </Descriptions.Item>
                <Descriptions.Item label="Thành phố">
                  {selectedVehicle.branch.city || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Địa chỉ" span={2}>
                  {selectedVehicle.branch.address || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Số điện thoại">
                  {selectedVehicle.branch.phone || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  {selectedVehicle.branch.email || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Giờ mở cửa">
                  {selectedVehicle.branch.openingTime || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Giờ đóng cửa">
                  {selectedVehicle.branch.closingTime || "-"}
                </Descriptions.Item>
                {(selectedVehicle.branch.latitude && selectedVehicle.branch.longitude) && (
                  <Descriptions.Item label="Tọa độ" span={2}>
                    {selectedVehicle.branch.latitude}, {selectedVehicle.branch.longitude}
                  </Descriptions.Item>
                )}
              </Descriptions>
            )}

            {/* Hình ảnh */}
            {(selectedVehicle.imageFiles?.length > 0 || selectedVehicle.fileUrl?.length > 0) && (
              <div className="mt-4">
                <h4 className="mb-2">Hình ảnh:</h4>
                <Image.PreviewGroup>
                  <Space wrap>
                    {(selectedVehicle.fileUrl || selectedVehicle.imageFiles || []).map((url, index) => (
                      <Image
                        key={index}
                        src={url}
                        alt={`Image ${index + 1}`}
                        width={100}
                        height={100}
                        style={{ objectFit: "cover" }}
                      />
                    ))}
                  </Space>
                </Image.PreviewGroup>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
