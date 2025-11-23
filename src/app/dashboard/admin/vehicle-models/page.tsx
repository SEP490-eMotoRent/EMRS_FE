"use client";

import { useEffect, useState } from "react";
import { Table, Button, Input, Space, Tag, Modal, Form, InputNumber, Upload, message, Image, Descriptions, Select } from "antd";
import { EditOutlined, PlusOutlined, EyeOutlined, UploadOutlined } from "@ant-design/icons";
import { getVehicleModels, getVehicleModelById, createVehicleModel, updateVehicleModel, VehicleModel } from "./vehicle_model_service";
import { getVehicles } from "../vehicles/vehicle_service";
import type { ColumnsType } from "antd/es/table";

const { TextArea } = Input;
const { Option } = Select;

const INTERNAL_BASE = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface RentalPricing {
  id: string;
  rentalPrice: number;
  excessKmPrice: number;
}

export default function VehicleModelsPage() {
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [editingModel, setEditingModel] = useState<VehicleModel | null>(null);
  const [selectedModel, setSelectedModel] = useState<VehicleModel | null>(null);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);
  const [rentalPricings, setRentalPricings] = useState<RentalPricing[]>([]);
  const [loadingPricings, setLoadingPricings] = useState(false);

  useEffect(() => {
    loadModels();
    loadRentalPricings();
  }, []);

  const loadRentalPricings = async () => {
    setLoadingPricings(true);
    try {
      const res = await fetch(`${INTERNAL_BASE}/api/rental/pricing`, {
        cache: "no-store",
      });
      
      if (!res.ok) {
        throw new Error("Failed to fetch rental pricings");
      }
      
      const text = await res.text();
      const json = text ? JSON.parse(text) : {};
      
      if (json.success && json.data && Array.isArray(json.data)) {
        setRentalPricings(json.data);
      } else if (Array.isArray(json)) {
        setRentalPricings(json);
      } else if (Array.isArray(json.data)) {
        setRentalPricings(json.data);
      }
    } catch (error) {
      console.error("Error loading rental pricings:", error);
      // Không hiển thị error vì có thể không có API
    } finally {
      setLoadingPricings(false);
    }
  };

  const loadModels = async () => {
    setLoading(true);
    try {
      // Load models trước
      const modelsData = await getVehicleModels();

      // Load tất cả vehicles để đếm (có thể cần pagination nếu có nhiều)
      let allVehicles: any[] = [];
      let currentPage = 1;
      let hasMore = true;
      const pageSize = 100;

      while (hasMore) {
        try {
          const vehiclesData = await getVehicles({ PageSize: pageSize, PageNum: currentPage });
          allVehicles = allVehicles.concat(vehiclesData.items);
          
          // Kiểm tra xem còn trang nào không
          if (currentPage >= vehiclesData.totalPages || vehiclesData.items.length === 0) {
            hasMore = false;
          } else {
            currentPage++;
          }
        } catch (err) {
          console.error("Error loading vehicles page:", currentPage, err);
          hasMore = false; // Dừng nếu có lỗi
        }
      }

      console.log(`Loaded ${allVehicles.length} vehicles for counting`);

      // Đếm số lượng vehicles theo vehicleModelId
      const vehicleCountMap = new Map<string, { total: number; available: number }>();
      
      allVehicles.forEach((vehicle: any) => {
        const modelId = vehicle.vehicleModelId || vehicle.vehicleModel?.id;
        if (modelId) {
          const current = vehicleCountMap.get(modelId) || { total: 0, available: 0 };
          current.total += 1;
          if (vehicle.status === "AVAILABLE") {
            current.available += 1;
          }
          vehicleCountMap.set(modelId, current);
        }
      });

      console.log("Vehicle count map:", Array.from(vehicleCountMap.entries()));

      // Cập nhật số lượng vào models
      const modelsWithCount = modelsData.map((model) => {
        const modelId = model.vehicleModelId || model.id;
        const counts = vehicleCountMap.get(modelId || "") || { total: 0, available: 0 };
        return {
          ...model,
          countTotal: counts.total,
          countAvailable: counts.available,
        };
      });

      setModels(modelsWithCount);
    } catch (error) {
      console.error("Error loading vehicle models:", error);
      message.error("Không thể tải danh sách model xe");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (model?: VehicleModel) => {
    if (model) {
      setEditingModel(model);
      form.setFieldsValue({
        modelName: model.modelName,
        category: model.category,
        batteryCapacityKwh: model.batteryCapacityKwh,
        maxRangeKm: model.maxRangeKm,
        maxSpeedKmh: model.maxSpeedKmh,
        description: model.description,
        rentalPricingId: model.rentalPricingId,
      });
      if (model.imageUrl) {
        setFileList([{
          uid: '-1',
          name: 'image.jpg',
          status: 'done',
          url: model.imageUrl,
        }]);
      } else {
        setFileList([]);
      }
    } else {
      setEditingModel(null);
      form.resetFields();
      setFileList([]);
    }
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setEditingModel(null);
    form.resetFields();
    setFileList([]);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingModel) {
        // Update
        await updateVehicleModel(editingModel.vehicleModelId || editingModel.id || "", values);
        message.success("Cập nhật model xe thành công");
      } else {
        // Create
        const formData = new FormData();
        formData.append("ModelName", values.modelName);
        formData.append("Category", values.category);
        if (values.batteryCapacityKwh) {
          formData.append("BatteryCapacityKwh", String(values.batteryCapacityKwh));
        }
        if (values.maxRangeKm) {
          formData.append("MaxRangeKm", String(values.maxRangeKm));
        }
        if (values.maxSpeedKmh) {
          formData.append("MaxSpeedKmh", String(values.maxSpeedKmh));
        }
        if (values.description) {
          formData.append("Description", values.description);
        }
        // RentalPricingId là bắt buộc
        if (values.rentalPricingId) {
          formData.append("RentalPricingId", values.rentalPricingId);
        } else {
          message.error("Vui lòng chọn bảng giá thuê");
          return;
        }
        
        // Append image files
        fileList.forEach((file) => {
          if (file.originFileObj) {
            formData.append("ImageFiles", file.originFileObj);
          }
        });

        await createVehicleModel(formData);
        message.success("Tạo model xe mới thành công");
      }

      handleCloseModal();
      loadModels();
    } catch (error: any) {
      console.error("Error saving vehicle model:", error);
      if (error.errorFields) {
        return;
      }
      message.error(error.message || "Không thể lưu model xe");
    }
  };

  const handleViewDetail = async (model: VehicleModel) => {
    try {
      const modelId = model.vehicleModelId || model.id;
      if (!modelId) {
        message.error("Không tìm thấy ID model");
        return;
      }
      const detail = await getVehicleModelById(modelId);
      setSelectedModel(detail);
      setIsDetailModalVisible(true);
    } catch (error) {
      console.error("Error loading vehicle model detail:", error);
      message.error("Không thể tải chi tiết model xe");
    }
  };

  const getCategoryTag = (category?: string) => {
    const categoryMap: Record<string, { color: string; text: string }> = {
      ECONOMY: { color: "blue", text: "ECONOMY" },
      STANDARD: { color: "green", text: "STANDARD" },
      PREMIUM: { color: "gold", text: "PREMIUM" },
    };
    const categoryInfo = categoryMap[category || ""] || { color: "default", text: category || "N/A" };
    return <Tag color={categoryInfo.color}>{categoryInfo.text}</Tag>;
  };

  const columns: ColumnsType<VehicleModel> = [
    {
      title: "Tên Model",
      dataIndex: "modelName",
      key: "modelName",
      width: 200,
    },
    {
      title: "Phân loại",
      dataIndex: "category",
      key: "category",
      width: 120,
      render: (category) => getCategoryTag(category),
    },
    {
      title: "Dung lượng pin (kWh)",
      dataIndex: "batteryCapacityKwh",
      key: "batteryCapacityKwh",
      width: 150,
      render: (text) => text ? `${text} kWh` : "-",
    },
    {
      title: "Quãng đường tối đa (km)",
      dataIndex: "maxRangeKm",
      key: "maxRangeKm",
      width: 180,
      render: (text) => text ? `${text} km` : "-",
    },
    {
      title: "Giá thuê",
      dataIndex: "rentalPrice",
      key: "rentalPrice",
      width: 120,
      render: (text) => text ? `${text.toLocaleString()} VNĐ` : "-",
    },
    {
      title: "Số lượng",
      key: "count",
      width: 120,
      render: (_, record) => {
        const total = record.countTotal ?? 0;
        const available = record.countAvailable ?? 0;
        
        // Nếu cả hai đều là 0 hoặc undefined/null, hiển thị "-"
        if (total === 0 && available === 0) {
          return <span className="text-gray-400">-</span>;
        }
        
        // Nếu có giá trị, hiển thị
        return (
          <span>
            <span className={available > 0 ? "text-green-600 font-medium" : "text-gray-500"}>
              {available}
            </span>
            <span className="text-gray-400">/</span>
            <span>{total}</span>
          </span>
        );
      },
    },
    {
      title: "Hành động",
      key: "action",
      width: 200,
      fixed: "right",
      render: (_, record) => {
        const modelId = record.vehicleModelId || record.id;
        return (
          <Space>
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
              disabled={!modelId}
            >
              Xem
            </Button>
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleOpenModal(record)}
              disabled={!modelId}
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
        <h2 className="text-2xl font-semibold">Quản lý Model xe</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => handleOpenModal()}
        >
          Thêm model mới
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={models}
        rowKey={(record) => record.vehicleModelId || record.id || ""}
        loading={loading}
        scroll={{ x: 1200 }}
        pagination={{
          pageSize: 12,
          showSizeChanger: true,
          showTotal: (total) => `Tổng: ${total} model`,
          pageSizeOptions: ["12", "24", "48", "96"],
        }}
      />

      {/* Create/Edit Modal */}
      <Modal
        title={editingModel ? "Chỉnh sửa model xe" : "Thêm model xe mới"}
        open={isModalVisible}
        onCancel={handleCloseModal}
        onOk={handleSubmit}
        width={800}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="modelName"
            label="Tên Model"
            rules={[{ required: true, message: "Vui lòng nhập tên model" }]}
          >
            <Input placeholder="Nhập tên model" />
          </Form.Item>

          <Form.Item
            name="category"
            label="Phân loại"
            rules={[{ required: true, message: "Vui lòng chọn phân loại" }]}
          >
            <Select placeholder="Chọn phân loại">
              <Option value="ECONOMY">ECONOMY</Option>
              <Option value="STANDARD">STANDARD</Option>
              <Option value="PREMIUM">PREMIUM</Option>
            </Select>
          </Form.Item>

          <Form.Item name="batteryCapacityKwh" label="Dung lượng pin (kWh)">
            <InputNumber
              min={0}
              step={0.1}
              style={{ width: "100%" }}
              placeholder="Nhập dung lượng pin"
            />
          </Form.Item>

          <Form.Item name="maxRangeKm" label="Quãng đường tối đa (km)">
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              placeholder="Nhập quãng đường tối đa"
            />
          </Form.Item>

          <Form.Item name="maxSpeedKmh" label="Tốc độ tối đa (km/h)">
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              placeholder="Nhập tốc độ tối đa"
            />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <TextArea rows={3} placeholder="Nhập mô tả" />
          </Form.Item>

          <Form.Item 
            name="rentalPricingId" 
            label="Bảng giá thuê"
            rules={[{ required: true, message: "Vui lòng chọn bảng giá thuê" }]}
          >
            <Select 
              placeholder="Chọn bảng giá thuê" 
              loading={loadingPricings}
              showSearch
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
            >
              {rentalPricings.map((pricing) => (
                <Option 
                  key={pricing.id} 
                  value={pricing.id}
                  label={`${pricing.rentalPrice.toLocaleString()} VNĐ - ${pricing.excessKmPrice.toLocaleString()} VNĐ/km`}
                >
                  <div className="flex justify-between items-center">
                    <span>
                      <strong>{pricing.rentalPrice.toLocaleString()} VNĐ</strong>
                      <span className="text-gray-500 ml-2">
                        / {pricing.excessKmPrice.toLocaleString()} VNĐ/km
                      </span>
                    </span>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

          {!editingModel && (
            <Form.Item label="Hình ảnh">
              <Upload
                listType="picture-card"
                fileList={fileList}
                onChange={({ fileList }) => setFileList(fileList)}
                beforeUpload={() => false}
                multiple={false}
              >
                {fileList.length < 1 && <div><UploadOutlined /> Tải lên</div>}
              </Upload>
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title="Chi tiết Model xe"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalVisible(false)}>
            Đóng
          </Button>,
        ]}
        width={800}
      >
        {selectedModel && (
          <div>
            <Descriptions title="Thông tin Model" column={2} bordered className="mb-4">
              <Descriptions.Item label="Tên Model">
                {selectedModel.modelName}
              </Descriptions.Item>
              <Descriptions.Item label="Phân loại">
                {getCategoryTag(selectedModel.category)}
              </Descriptions.Item>
              <Descriptions.Item label="Dung lượng pin">
                {selectedModel.batteryCapacityKwh
                  ? `${selectedModel.batteryCapacityKwh} kWh`
                  : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Quãng đường tối đa">
                {selectedModel.maxRangeKm
                  ? `${selectedModel.maxRangeKm} km`
                  : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Tốc độ tối đa">
                {selectedModel.maxSpeedKmh
                  ? `${selectedModel.maxSpeedKmh} km/h`
                  : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Số lượng xe">
                {(() => {
                  const total = selectedModel.countTotal ?? 0;
                  const available = selectedModel.countAvailable ?? 0;
                  
                  // Nếu cả hai đều là 0, hiển thị "-"
                  if (total === 0 && available === 0) {
                    return <span className="text-gray-400">-</span>;
                  }
                  
                  // Nếu có giá trị, hiển thị
                  return (
                    <span>
                      <span className={available > 0 ? "text-green-600 font-medium" : ""}>
                        {available}
                      </span>
                      <span className="text-gray-400 mx-1">/</span>
                      <span>{total}</span>
                    </span>
                  );
                })()}
              </Descriptions.Item>
              {selectedModel.depositAmount && (
                <Descriptions.Item label="Tiền cọc">
                  {selectedModel.depositAmount.toLocaleString()} VNĐ
                </Descriptions.Item>
              )}
              {selectedModel.originalPrice && selectedModel.originalPrice > 0 && (
                <Descriptions.Item label="Giá gốc">
                  {selectedModel.originalPrice.toLocaleString()} VNĐ
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Mô tả" span={2}>
                {selectedModel.description || "-"}
              </Descriptions.Item>
            </Descriptions>

            {/* Thông tin giá thuê */}
            {selectedModel.rentalPricing && (
              <Descriptions title="Thông tin giá thuê" column={2} bordered className="mb-4">
                <Descriptions.Item label="Giá thuê">
                  {selectedModel.rentalPricing.rentalPrice
                    ? `${selectedModel.rentalPricing.rentalPrice.toLocaleString()} VNĐ`
                    : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Giá vượt km">
                  {selectedModel.rentalPricing.excessKmPrice
                    ? `${selectedModel.rentalPricing.excessKmPrice.toLocaleString()} VNĐ/km`
                    : "-"}
                </Descriptions.Item>
              </Descriptions>
            )}

            {/* Hình ảnh */}
            {(selectedModel.images && selectedModel.images.length > 0) || selectedModel.imageUrl ? (
              <div className="mt-4">
                <h4 className="mb-3 font-semibold">Hình ảnh Model:</h4>
                <Image.PreviewGroup>
                  <Space wrap>
                    {(selectedModel.images || (selectedModel.imageUrl ? [selectedModel.imageUrl] : [])).map((url, index) => (
                      <Image
                        key={index}
                        src={url}
                        alt={`${selectedModel.modelName} - Ảnh ${index + 1}`}
                        width={200}
                        height={200}
                        style={{ objectFit: "cover", borderRadius: "8px" }}
                        className="border border-gray-200"
                      />
                    ))}
                  </Space>
                </Image.PreviewGroup>
              </div>
            ) : (
              <div className="mt-4 text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500">Chưa có hình ảnh</p>
              </div>
            )}

            {/* Màu sắc có sẵn */}
            {selectedModel.availableColors && selectedModel.availableColors.length > 0 && (
              <div className="mt-4">
                <h4 className="mb-2 font-semibold">Màu sắc có sẵn:</h4>
                <Space wrap>
                  {selectedModel.availableColors.map((color, index) => (
                    <Tag key={index} color="blue">
                      {color.colorName}
                    </Tag>
                  ))}
                </Space>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

