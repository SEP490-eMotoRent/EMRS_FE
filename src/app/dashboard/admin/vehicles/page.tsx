"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Table, Button, Input, Select, Space, Tag, Modal, Form, DatePicker, Upload, message, Image, Card, Descriptions, Tooltip } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined, EyeOutlined, UploadOutlined, RadarChartOutlined, SearchOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import { getVehicles, getVehicleById, createVehicle, updateVehicle, deleteVehicle, createMedia, updateMedia, VehicleFilters, VehicleListResponse } from "./vehicle_service";
import type { ColumnsType } from "antd/es/table";

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

interface TrackingInfo {
  gpsDeviceIdent?: string;
  flespiDeviceId?: number;
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
  medias?: Array<{
    id: string;
    mediaType: string;
    fileUrl: string;
    docNo?: string;
    entityType?: string;
  }>;
}

export default function VehiclesPage() {
  const router = useRouter();
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
  const [selectedModel, setSelectedModel] = useState<string>("all");
  
  // Modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);
  const [originalMedias, setOriginalMedias] = useState<Array<{ id: string; fileUrl: string }>>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [vehicleModels, setVehicleModels] = useState<VehicleModel[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [trackingCache, setTrackingCache] = useState<Record<string, TrackingInfo>>({});

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
        VehicleModelId: selectedModel !== "all" ? selectedModel : undefined,
      };
      
      const response: VehicleListResponse = await getVehicles(apiFilters);
      
      // Map branchName từ branches list nếu vehicle có branchId nhưng không có branch object
      const vehiclesWithBranch = response.items.map((vehicle) => {
        // Nếu đã có branch object với branchName, giữ nguyên
        if (vehicle.branch?.branchName) {
          return {
            ...vehicle,
            branchName: vehicle.branch.branchName,
          };
        }
        
        // Nếu đã có branchName trực tiếp, giữ nguyên
        if (vehicle.branchName) {
          return vehicle;
        }
        
        // Nếu có branchId, tìm trong branches list để lấy branchName
        if (vehicle.branchId && branches.length > 0) {
          const branch = branches.find((b) => b.branchId === vehicle.branchId);
          if (branch) {
            return {
              ...vehicle,
              branchName: branch.branchName,
            };
          }
        }
        
        // Nếu không tìm thấy branch name, hiển thị "-" trong bảng
        return {
          ...vehicle,
          branchName: "-",
        };
      });
      
      const trackingUpdates: Record<string, TrackingInfo> = {};
      const vehiclesWithTracking = await Promise.all(
        vehiclesWithBranch.map(async (vehicle) => {
          const vehicleId = vehicle.id || vehicle.vehicleId;
          if (!vehicleId) {
            return vehicle;
          }

          const cachedTracking = trackingCache[vehicleId];
          if (cachedTracking) {
            return {
              ...vehicle,
              ...cachedTracking,
            };
          }

          if (vehicle.gpsDeviceIdent || vehicle.flespiDeviceId) {
            trackingUpdates[vehicleId] = {
              gpsDeviceIdent: vehicle.gpsDeviceIdent,
              flespiDeviceId: vehicle.flespiDeviceId,
            };
            return vehicle;
          }

          try {
            const detail = await getVehicleById(vehicleId);
            const trackingData: TrackingInfo = {
              gpsDeviceIdent: detail.gpsDeviceIdent || undefined,
              flespiDeviceId: detail.flespiDeviceId || undefined,
            };
            trackingUpdates[vehicleId] = trackingData;
            return {
              ...vehicle,
              ...trackingData,
            };
          } catch (error) {
            console.warn("Không thể lấy tracking info cho xe", vehicleId, error);
            trackingUpdates[vehicleId] = {};
            return vehicle;
          }
        })
      );

      if (Object.keys(trackingUpdates).length > 0) {
        setTrackingCache((prev) => ({
          ...prev,
          ...trackingUpdates,
        }));
      }

      setVehicles(vehiclesWithTracking);
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
    }, searchText ? 500 : 0); // Debounce 500ms cho search, không debounce cho status/branch/model

    return () => clearTimeout(timer);
  }, [searchText, selectedStatus, selectedBranch, selectedModel]);

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
      
      // Handle different response structures
      let branchesData = [];
      if (json.success && json.data) {
        if (Array.isArray(json.data)) {
          branchesData = json.data;
        } else if (json.data.items && Array.isArray(json.data.items)) {
          branchesData = json.data.items;
        }
      } else if (Array.isArray(json)) {
        branchesData = json;
      } else if (Array.isArray(json.data)) {
        branchesData = json.data;
      }
      
      // Normalize branch data: handle both 'id' and 'branchId', 'branchName' and 'name'
      const normalizedBranches = branchesData.map((branch: any) => ({
        branchId: branch.branchId || branch.id,
        branchName: branch.branchName || branch.name || branch.branchName || "-",
      })).filter((branch: Branch) => branch.branchId); // Filter out invalid branches
      
      console.log("Loaded branches:", normalizedBranches);
      setBranches(normalizedBranches);
    } catch (error) {
      console.error("Error loading branches:", error);
      message.error("Không thể tải danh sách chi nhánh");
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
      
      // Lấy ảnh từ medias array (ưu tiên) hoặc từ fileUrl/imageFiles
      let imageFiles: string[] = [];
      let medias: Array<{ id: string; fileUrl: string }> = [];
      
      if (vehicle.medias && Array.isArray(vehicle.medias)) {
        const imageMedias = vehicle.medias.filter((m) => m.mediaType === "Image" && m.fileUrl);
        imageFiles = imageMedias.map((m) => m.fileUrl);
        medias = imageMedias.map((m) => ({ id: m.id, fileUrl: m.fileUrl }));
      } else {
        imageFiles = vehicle.imageFiles || vehicle.fileUrl || [];
      }
      
      setOriginalMedias(medias);
      
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
        mediaId: medias[index]?.id, // Lưu mediaId để dùng khi update
      })));
    } else {
      setEditingVehicle(null);
      form.resetFields();
      setFileList([]);
      setOriginalMedias([]);
    }
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setEditingVehicle(null);
    form.resetFields();
    setFileList([]);
    setOriginalMedias([]);
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

      if (editingVehicle) {
        const vehicleId = editingVehicle.id || editingVehicle.vehicleId;
        if (!vehicleId) {
          message.error("Không tìm thấy ID xe");
          return;
        }
        
        // Update vehicle info trước (không kèm ảnh)
        await updateVehicle(formData);
        
        // Xử lý update ảnh: nếu có file mới và có mediaId -> dùng PUT /api/Media
        // Nếu có file mới nhưng không có mediaId -> dùng POST /api/Media
        const mediaPromises: Promise<any>[] = [];
        
        console.log("FileList khi submit:", fileList);
        console.log("OriginalMedias:", originalMedias);
        
        fileList.forEach((file: any) => {
          if (file.originFileObj) {
            // File mới được upload
            if (file.mediaId) {
              // Có file mới và có mediaId -> update media bằng PUT /api/Media
              console.log(`Updating media ${file.mediaId} with new file`);
              mediaPromises.push(updateMedia(file.mediaId, file.originFileObj));
            } else {
              // Có file mới nhưng không có mediaId -> tạo media mới bằng POST /api/Media
              console.log(`Creating new media for vehicle ${vehicleId}`);
              mediaPromises.push(createMedia(vehicleId, file.originFileObj, "Vehicle", "Image"));
            }
          }
        });
        
        // Chờ tất cả media operations hoàn thành
        if (mediaPromises.length > 0) {
          console.log(`Processing ${mediaPromises.length} media files...`);
          await Promise.all(mediaPromises);
          console.log("All media operations completed");
        }
        
        message.success("Cập nhật xe thành công");
      } else {
        if (!values.vehicleModelId || !values.branchId) {
          message.error("Vui lòng chọn Model xe và Chi nhánh");
          return;
        }
        
        // Tạo vehicle mới (không kèm ảnh, sẽ thêm sau)
        const createdVehicle = await createVehicle(formData);
        const newVehicleId = createdVehicle?.id || createdVehicle?.data?.id || createdVehicle?.vehicleId;
        
        if (!newVehicleId) {
          console.error("Failed to get vehicle ID after creation:", createdVehicle);
          message.error("Tạo xe thành công nhưng không lấy được ID để thêm ảnh");
          handleCloseModal();
          loadVehicles();
          return;
        }
        
        // Thêm ảnh bằng POST /api/Media sau khi tạo vehicle
        const createMediaPromises: Promise<any>[] = [];
        fileList.forEach((file: any) => {
          if (file.originFileObj) {
            console.log(`Creating new media for vehicle ${newVehicleId}`);
            createMediaPromises.push(createMedia(newVehicleId, file.originFileObj, "Vehicle", "Image"));
          }
        });
        
        if (createMediaPromises.length > 0) {
          console.log(`Creating ${createMediaPromises.length} media files for new vehicle...`);
          await Promise.all(createMediaPromises);
          console.log("All media files created");
        }
        
        message.success("Thêm xe thành công");
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
      console.log("Vehicle detail loaded:", detail);
      console.log("Medias in detail:", detail.medias);
      console.log("FileUrl in detail:", detail.fileUrl);
      console.log("ImageFiles in detail:", detail.imageFiles);
      setSelectedVehicle(detail);
      setIsDetailModalVisible(true);
    } catch (error) {
      console.error("Error loading vehicle detail:", error);
      message.error("Không thể tải chi tiết xe");
    }
  };

  // Handle tracking vehicle - navigate to tracking page
  const handleTrackVehicle = (vehicle: Vehicle) => {
    const vehicleId = vehicle.id || vehicle.vehicleId;
    if (!vehicleId) {
      message.error("Không tìm thấy ID xe");
      return;
    }
    // Navigate to tracking page
    router.push(`/dashboard/admin/vehicles/${vehicleId}/tracking`);
  };

  // Handle delete vehicle
  const handleDelete = (vehicle: Vehicle) => {
    console.log("handleDelete called with vehicle:", vehicle);
    setVehicleToDelete(vehicle);
    setIsDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!vehicleToDelete) return;
    
    const vehicleId = vehicleToDelete.id || vehicleToDelete.vehicleId;
    
    if (!vehicleId) {
      console.error("No vehicleId found:", vehicleToDelete);
      message.error("Không tìm thấy ID xe");
      setIsDeleteModalVisible(false);
      setVehicleToDelete(null);
      return;
    }

    setIsDeleting(true);
    try {
      console.log("Delete confirmed. Deleting vehicle with ID:", vehicleId);
      await deleteVehicle(vehicleId);
      console.log("Vehicle deleted successfully");
      message.success("Xóa xe thành công");
      setIsDeleteModalVisible(false);
      setVehicleToDelete(null);
      loadVehicles();
    } catch (error: any) {
      console.error("Error deleting vehicle:", error);
      message.error(error.message || "Không thể xóa xe");
    } finally {
      setIsDeleting(false);
    }
  };

  // Status tag color
  const getStatusTag = (status?: string) => {
    if (!status) return <Tag color="default">N/A</Tag>;
    
    // Normalize status to uppercase để xử lý cả "Available" và "AVAILABLE"
    const normalizedStatus = status.toUpperCase();
    
    const statusMap: Record<string, { color: string; text: string }> = {
      AVAILABLE: { color: "green", text: "Sẵn sàng" },
      RENTED: { color: "blue", text: "Đang thuê" },
      MAINTENANCE: { color: "orange", text: "Bảo trì" },
      UNAVAILABLE: { color: "red", text: "Không khả dụng" },
      BOOKED: { color: "purple", text: "Đã đặt" },
      INACTIVE: { color: "default", text: "Không hoạt động" },
    };
    
    const statusInfo = statusMap[normalizedStatus] || { 
      color: "default", 
      text: status // Giữ nguyên nếu không tìm thấy trong map
    };
    
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
      title: "Tracking",
      key: "tracking",
      width: 100,
      render: (_, record) => {
        const hasTracking = Boolean(record.gpsDeviceIdent || record.flespiDeviceId);
        return (
          <Tag color={hasTracking ? "green" : "default"}>
            {hasTracking ? "Có" : "Không"}
          </Tag>
        );
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
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Delete button clicked for vehicle:", record);
                handleDelete(record);
              }}
              disabled={!vehicleId}
            >
              Xóa
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-800">
          Quản lý xe
        </h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => handleOpenModal()}
          size="large"
        >
          Thêm xe mới
        </Button>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <div className="flex gap-4 flex-wrap">
        <Input
          placeholder="Tìm theo biển số hoặc model"
          allowClear
          prefix={<SearchOutlined />}
          style={{ width: 300 }}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
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
        <Select
          placeholder="Model xe"
          style={{ width: 200 }}
          value={selectedModel}
          onChange={setSelectedModel}
          loading={loadingModels}
          showSearch
          filterOption={(input, option) => {
            const label = typeof option?.label === 'string' ? option.label : String(option?.label || '');
            return label.toLowerCase().includes(input.toLowerCase());
          }}
        >
          <Option value="all">Tất cả</Option>
          {vehicleModels.map((model) => (
            <Option key={model.vehicleModelId} value={model.vehicleModelId}>
              {model.modelName}
            </Option>
          ))}
        </Select>
        </div>
      </Card>

      {/* Table */}
      <Card className="shadow-sm">
        <Table
          columns={columns}
          dataSource={vehicles}
          rowKey={(record) => record.id || record.vehicleId || record.licensePlate}
          loading={loading}
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
      </Card>

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
              filterOption={(input, option) => {
                const label = typeof option?.label === 'string' ? option.label : String(option?.label || '');
                return label.toLowerCase().includes(input.toLowerCase());
              }}
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
              onChange={({ fileList: newFileList }) => {
                // Map mediaId từ originalMedias hoặc từ fileList cũ
                const mappedFileList = newFileList.map((file: any, index: number) => {
                  // Nếu file đã có mediaId, giữ nguyên
                  if (file.mediaId) {
                    return file;
                  }
                  
                  // Nếu file có URL (ảnh cũ), tìm mediaId từ originalMedias
                  if (file.url && !file.originFileObj) {
                    const originalMedia = originalMedias.find((m) => m.fileUrl === file.url);
                    if (originalMedia) {
                      return {
                        ...file,
                        mediaId: originalMedia.id,
                      };
                    }
                  }
                  
                  // Nếu file có originFileObj (file mới được upload), tìm mediaId từ fileList cũ
                  if (file.originFileObj) {
                    // Tìm file cũ ở cùng vị trí trong fileList
                    const oldFile = fileList[index];
                    if (oldFile && oldFile.mediaId) {
                      // Giữ lại mediaId của file cũ để update
                      return {
                        ...file,
                        mediaId: oldFile.mediaId,
                      };
                    }
                    
                    // Nếu không tìm thấy ở cùng vị trí, thử tìm trong originalMedias
                    const originalMedia = originalMedias[index];
                    if (originalMedia) {
                      return {
                        ...file,
                        mediaId: originalMedia.id,
                      };
                    }
                  }
                  
                  return file;
                });
                
                setFileList(mappedFileList);
              }}
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
          (() => {
            const hasTracking = Boolean(selectedVehicle?.gpsDeviceIdent || selectedVehicle?.flespiDeviceId);
            const trackButton = (
              <Button 
                key="track" 
                type="primary"
                icon={<RadarChartOutlined />}
                onClick={() => selectedVehicle && handleTrackVehicle(selectedVehicle)}
                disabled={!hasTracking}
              >
                Theo dõi vị trí
              </Button>
            );
            
            return hasTracking ? trackButton : (
              <Tooltip 
                key="track" 
                title="Xe này chưa được cấu hình tracking. Vui lòng cấu hình GPS Device ID hoặc Flespi Device ID để sử dụng tính năng tracking."
              >
                {trackButton}
              </Tooltip>
            );
          })(),
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
            <div className="mt-4">
              <h4 className="mb-3 font-semibold">Hình ảnh xe:</h4>
              {(() => {
                // Ưu tiên lấy từ medias array (format mới từ API)
                let imageUrls: string[] = [];
                
                console.log("Checking images for selectedVehicle:", {
                  medias: selectedVehicle.medias,
                  fileUrl: selectedVehicle.fileUrl,
                  imageFiles: selectedVehicle.imageFiles,
                });
                
                if (selectedVehicle.medias && Array.isArray(selectedVehicle.medias) && selectedVehicle.medias.length > 0) {
                  console.log("Using medias array, count:", selectedVehicle.medias.length);
                  imageUrls = selectedVehicle.medias
                    .filter((media) => {
                      const isImage = media.mediaType === "Image" && media.fileUrl;
                      if (!isImage) {
                        console.log("Filtered out media:", media);
                      }
                      return isImage;
                    })
                    .map((media) => media.fileUrl);
                  console.log("Extracted imageUrls from medias:", imageUrls);
                } else if (selectedVehicle.fileUrl && Array.isArray(selectedVehicle.fileUrl) && selectedVehicle.fileUrl.length > 0) {
                  console.log("Using fileUrl array, count:", selectedVehicle.fileUrl.length);
                  imageUrls = selectedVehicle.fileUrl;
                } else if (selectedVehicle.imageFiles && Array.isArray(selectedVehicle.imageFiles) && selectedVehicle.imageFiles.length > 0) {
                  console.log("Using imageFiles array, count:", selectedVehicle.imageFiles.length);
                  imageUrls = selectedVehicle.imageFiles;
                } else {
                  console.log("No images found in any source");
                }

                return imageUrls.length > 0 ? (
                  <Image.PreviewGroup>
                    <Space wrap>
                      {imageUrls.map((url, index) => (
                        <Image
                          key={index}
                          src={url}
                          alt={`Ảnh xe ${index + 1}`}
                          width={150}
                          height={150}
                          style={{ objectFit: "cover", borderRadius: "8px" }}
                          className="border border-gray-200"
                        />
                      ))}
                    </Space>
                  </Image.PreviewGroup>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-500">Chưa có hình ảnh</p>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Xác nhận xóa xe"
        open={isDeleteModalVisible}
        onOk={confirmDelete}
        onCancel={() => {
          setIsDeleteModalVisible(false);
          setVehicleToDelete(null);
        }}
        okText="Xóa"
        okButtonProps={{ danger: true, loading: isDeleting }}
        cancelText="Hủy"
        width={480}
        centered
      >
        {vehicleToDelete && (
          <div className="space-y-4">
            <p className="text-base">
              Bạn có chắc chắn muốn xóa xe này không?
            </p>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="font-semibold text-gray-900 mb-2">
                Biển số: <span className="text-blue-600">{vehicleToDelete.licensePlate}</span>
              </p>
              {vehicleToDelete.vehicleModel?.modelName && (
                <p className="text-sm text-gray-600 mb-2">
                  Model: <span className="font-medium">{vehicleToDelete.vehicleModel.modelName}</span>
                </p>
              )}
              {vehicleToDelete.branch?.branchName && (
                <p className="text-sm text-gray-600 mb-2">
                  Chi nhánh: <span className="font-medium">{vehicleToDelete.branch.branchName}</span>
                </p>
              )}
              <p className="text-sm text-gray-600">
                ID: <span className="font-mono text-xs">{vehicleToDelete.id || vehicleToDelete.vehicleId}</span>
              </p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 font-semibold flex items-center gap-2">
                <span>⚠️</span>
                <span>Hành động này không thể hoàn tác!</span>
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
