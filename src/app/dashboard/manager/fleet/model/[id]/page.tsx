"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Battery,
  Gauge,
  Zap,
  DollarSign,
  Car,
  CheckCircle,
  Clock,
  Palette,
  Image as ImageIcon,
  FileText,
} from "lucide-react";
import { Button, Card, Descriptions, Spin, Tag, Table, Badge } from "antd";
import dayjs from "dayjs";

import { getVehicleModelById } from "../../fleet_service";

export default function VehicleModelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [model, setModel] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      loadVehicleModel();
    }
  }, [params.id]);

  const loadVehicleModel = async () => {
    try {
      setLoading(true);
      const data = await getVehicleModelById(params.id as string);
      console.log("Loaded vehicle model data:", data);
      console.log("Image URL:", data?.imageUrl);
      console.log("Media Responses:", data?.mediaResponses);
      setModel(data);
    } catch (err) {
      console.error("Error loading vehicle model:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spin size="large" />
      </div>
    );
  }

  if (!model) {
    return (
      <div className="p-6">
        <Button
          icon={<ArrowLeft />}
          onClick={() => router.back()}
          className="mb-4"
        >
          Quay lại
        </Button>
        <div className="text-center text-gray-500">
          Không tìm thấy thông tin model
        </div>
      </div>
    );
  }

  const categoryMap: Record<
    string,
    { label: string; color: string; bgColor: string }
  > = {
    ECONOMY: {
      label: "ECONOMY",
      color: "blue",
      bgColor: "bg-blue-50 border-blue-200",
    },
    STANDARD: {
      label: "STANDARD",
      color: "green",
      bgColor: "bg-green-50 border-green-200",
    },
    PREMIUM: {
      label: "PREMIUM",
      color: "gold",
      bgColor: "bg-yellow-50 border-yellow-200",
    },
  };
  const categoryInfo =
    categoryMap[model.category] ||
    categoryMap["ECONOMY"];

  // Lấy hình ảnh của MODEL (mẫu xe)
  const getModelImages = () => {
    const images: string[] = [];
    
    // Thêm imageUrl nếu có
    if (model.imageUrl) {
      images.push(model.imageUrl);
    }
    
    // Thêm tất cả hình ảnh từ mediaResponses của model
    if (model.mediaResponses && Array.isArray(model.mediaResponses)) {
      model.mediaResponses.forEach((media: any) => {
        if (media.fileUrl && !images.includes(media.fileUrl)) {
          images.push(media.fileUrl);
        }
      });
    }
    
    return images;
  };

  // Lấy hình ảnh của từng XE (vehicles)
  const getVehicleImages = () => {
    const vehicleImages: Array<{ vehicleId: string; licensePlate: string; images: string[] }> = [];
    
    if (model.vehicles && Array.isArray(model.vehicles)) {
      model.vehicles.forEach((vehicle: any) => {
        const images: string[] = [];
        
        if (vehicle.mediaResponses && Array.isArray(vehicle.mediaResponses)) {
          vehicle.mediaResponses.forEach((media: any) => {
            if (media.fileUrl) {
              images.push(media.fileUrl);
            }
          });
        }
        
        if (images.length > 0) {
          vehicleImages.push({
            vehicleId: vehicle.id || '',
            licensePlate: vehicle.licensePlate || 'N/A',
            images: images
          });
        }
      });
    }
    
    return vehicleImages;
  };

  const modelImages = model ? getModelImages() : [];
  const vehicleImages = model ? getVehicleImages() : [];
  const mainImage = modelImages.length > 0 ? modelImages[0] : null;
  
  console.log("Model images:", modelImages);
  console.log("Vehicle images:", vehicleImages);
  console.log("Main image:", mainImage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              icon={<ArrowLeft />}
              onClick={() => router.back()}
              className="hover:bg-blue-50"
              type="text"
            >
              Quay lại
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {model.modelName || "N/A"}
              </h1>
              <div className="flex items-center gap-3">
                <Badge
                  count={categoryInfo.label}
                  style={{
                    backgroundColor:
                      categoryInfo.color === "blue"
                        ? "#3b82f6"
                        : categoryInfo.color === "green"
                        ? "#10b981"
                        : "#f59e0b",
                  }}
                />
                <span className="text-sm text-gray-500 font-mono">
                  {model.vehicleModelId || model.id || "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section with Image */}
        {mainImage ? (
          <Card className="mb-8 shadow-lg border-0 overflow-hidden">
            <div className="relative h-96 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg overflow-hidden">
              <img
                src={mainImage}
                alt={model.modelName}
                className="w-full h-full object-contain p-8 bg-white"
                onError={(e) => {
                  console.error("Error loading main image:", mainImage);
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = '<div class="flex items-center justify-center h-full text-white text-lg">Không thể tải hình ảnh</div>';
                  }
                }}
                onLoad={() => {
                  console.log("Main image loaded successfully:", mainImage);
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
            </div>
          </Card>
        ) : (
          <Card className="mb-8 shadow-lg border-0 overflow-hidden">
            <div className="relative h-96 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg overflow-hidden flex items-center justify-center">
              <div className="text-center text-white">
                <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg opacity-75">Chưa có hình ảnh</p>
              </div>
            </div>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Giá thuê</p>
                <p className="text-2xl font-bold text-gray-900">
                  {model.rentalPrice
                    ? `${model.rentalPrice.toLocaleString("vi-VN")} đ`
                    : "N/A"}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Xe có sẵn</p>
                <p className="text-2xl font-bold text-gray-900">
                  {model.countAvailable ?? 0} / {model.countTotal ?? 0}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Dung lượng pin</p>
                <p className="text-2xl font-bold text-gray-900">
                  {model.batteryCapacityKwh
                    ? `${model.batteryCapacityKwh} kWh`
                    : "N/A"}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Battery className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Tầm hoạt động</p>
                <p className="text-2xl font-bold text-gray-900">
                  {model.maxRangeKm ? `${model.maxRangeKm} km` : "N/A"}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Gauge className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content - Full Width */}
        <div className="space-y-6 mb-8">
          {/* Available Colors */}
          {model.availableColors && model.availableColors.length > 0 && (
            <Card
              title={
                <div className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-pink-600" />
                  <span className="text-lg font-semibold">Màu sắc có sẵn</span>
                </div>
              }
              className="shadow-md"
            >
              <div className="flex flex-wrap gap-3">
                {model.availableColors.map((color: any, index: number) => (
                  <div
                    key={index}
                    className="px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 hover:shadow-md transition-shadow"
                  >
                    <span className="text-sm font-medium text-gray-700">
                      {color.colorName || color}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Model Images Gallery */}
          <Card
            title={
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-blue-600" />
                <span className="text-lg font-semibold">
                  Hình ảnh Model {modelImages.length > 0 ? `(${modelImages.length} ảnh)` : '(Chưa có ảnh)'}
                </span>
              </div>
            }
            className="shadow-md"
          >
            {modelImages.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {modelImages.map((imageUrl: string, index: number) => (
                  <div
                    key={index}
                    className="relative group overflow-hidden rounded-lg border border-gray-200 hover:shadow-xl transition-all duration-300 cursor-pointer"
                    onClick={() => window.open(imageUrl, '_blank')}
                  >
                    <div className="aspect-square bg-gray-100">
                      <img
                        src={imageUrl}
                        alt={`${model.modelName} - Model ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          console.error("Error loading model image:", imageUrl);
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = '<div class="flex items-center justify-center h-full text-gray-400 text-sm">Lỗi tải ảnh</div>';
                          }
                        }}
                        onLoad={() => {
                          console.log("Model image loaded:", imageUrl);
                        }}
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center pointer-events-none">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-white/90 rounded-full p-2">
                          <ImageIcon className="w-5 h-5 text-gray-700" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Chưa có hình ảnh cho model này</p>
              </div>
            )}
          </Card>

          {/* Vehicle Images Gallery */}
          {vehicleImages.length > 0 && (
            <Card
              title={
                <div className="flex items-center gap-2">
                  <Car className="w-5 h-5 text-green-600" />
                  <span className="text-lg font-semibold">
                    Hình ảnh từng xe ({vehicleImages.length} xe có ảnh)
                  </span>
                </div>
              }
              className="shadow-md"
            >
              <div className="space-y-6">
                {vehicleImages.map((vehicle, vehicleIndex) => (
                  <div key={vehicleIndex} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-semibold text-gray-700">Biển số:</span>
                      <span className="font-mono text-blue-600 font-bold">{vehicle.licensePlate}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {vehicle.images.map((imageUrl: string, imgIndex: number) => (
                        <div
                          key={imgIndex}
                          className="relative group overflow-hidden rounded-lg border border-gray-200 hover:shadow-lg transition-all duration-300 cursor-pointer"
                          onClick={() => window.open(imageUrl, '_blank')}
                        >
                          <div className="aspect-square bg-gray-100">
                            <img
                              src={imageUrl}
                              alt={`${vehicle.licensePlate} - ${imgIndex + 1}`}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              onError={(e) => {
                                console.error("Error loading vehicle image:", imageUrl);
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = '<div class="flex items-center justify-center h-full text-gray-400 text-xs">Lỗi</div>';
                                }
                              }}
                            />
                          </div>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center pointer-events-none">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <div className="bg-white/90 rounded-full p-1.5">
                                <ImageIcon className="w-4 h-4 text-gray-700" />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Vehicle List */}
        {model.vehicles && model.vehicles.length > 0 && (
          <Card
            title={
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-indigo-600" />
                <span className="text-lg font-semibold">Danh sách xe</span>
                <Badge
                  count={model.vehicles.length}
                  style={{ backgroundColor: "#6366f1" }}
                />
              </div>
            }
            className="shadow-md"
          >
            <Table
              rowKey={(record) => record.id || Math.random()}
              dataSource={model.vehicles}
              pagination={{
                pageSize: 10,
                showSizeChanger: false,
                showQuickJumper: false,
                hideOnSinglePage: false, // Luôn hiển thị pagination để người dùng biết đang ở trang nào
                showTotal: (total) => (
                  <span className="text-gray-600 font-medium">
                    Tổng <span className="font-bold text-indigo-600">{total}</span> xe
                  </span>
                ),
              }}
              className="custom-table"
              columns={[
                {
                  title: "Biển số",
                  dataIndex: "licensePlate",
                  key: "licensePlate",
                  width: 150,
                  render: (text: string) => (
                    <span className="font-mono font-bold text-blue-600 text-base">
                      {text || "N/A"}
                    </span>
                  ),
                },
                {
                  title: "Màu sắc",
                  dataIndex: "color",
                  key: "color",
                  width: 120,
                  render: (color: string) => (
                    <Tag
                      color="blue"
                      className="px-3 py-1 text-sm font-medium"
                    >
                      {color || "N/A"}
                    </Tag>
                  ),
                },
                {
                  title: "Năm sản xuất",
                  dataIndex: "yearOfManufacture",
                  key: "yearOfManufacture",
                  width: 130,
                  render: (date: string) => (
                    <span className="text-gray-700">
                      {date ? dayjs(date).format("DD/MM/YYYY") : "N/A"}
                    </span>
                  ),
                },
                {
                  title: "Số km",
                  dataIndex: "currentOdometerKm",
                  key: "currentOdometerKm",
                  width: 120,
                  render: (km: number) => (
                    <span className="font-medium text-gray-700">
                      {km ? `${km.toLocaleString("vi-VN")} km` : "N/A"}
                    </span>
                  ),
                },
                {
                  title: "Pin (%)",
                  dataIndex: "batteryHealthPercentage",
                  key: "batteryHealthPercentage",
                  width: 100,
                  render: (percent: number) => {
                    const color =
                      percent >= 90
                        ? "green"
                        : percent >= 70
                        ? "orange"
                        : "red";
                    return (
                      <Tag
                        color={color}
                        className="px-3 py-1 font-semibold"
                      >
                        {percent ? `${percent}%` : "N/A"}
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
                    const statusMap: Record<
                      string,
                      { label: string; color: string }
                    > = {
                      Available: { label: "Có sẵn", color: "green" },
                      Rented: { label: "Đang thuê", color: "blue" },
                      Maintenance: { label: "Bảo trì", color: "red" },
                      "In-Use": { label: "Đang sử dụng", color: "blue" },
                    };
                    const info = statusMap[status] || {
                      label: status || "N/A",
                      color: "default",
                    };
                    return (
                      <Tag color={info.color} className="px-3 py-1 font-medium">
                        {info.label}
                      </Tag>
                    );
                  },
                },
                {
                  title: "Mô tả",
                  dataIndex: "description",
                  key: "description",
                  ellipsis: true,
                  render: (text: string) => (
                    <span className="text-sm text-gray-600" title={text}>
                      {text || "N/A"}
                    </span>
                  ),
                },
              ]}
            />
          </Card>
        )}
      </div>
    </div>
  );
}

