"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button, Card, Descriptions, Spin, Tag } from "antd";

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

  const categoryMap: Record<string, { label: string; color: string }> = {
    ECONOMY: { label: "ECONOMY", color: "blue" },
    STANDARD: { label: "STANDARD", color: "green" },
    PREMIUM: { label: "PREMIUM", color: "gold" },
  };
  const categoryInfo = categoryMap[model.category] || { label: model.category || "N/A", color: "default" };

  return (
    <div className="p-6">
      <Button
        icon={<ArrowLeft />}
        onClick={() => router.back()}
        className="mb-4"
      >
        Quay lại
      </Button>

      <h1 className="text-2xl font-semibold mb-6">
        Chi tiết Model: {model.modelName || "N/A"}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Thông tin cơ bản" className="shadow-sm">
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Mã Model">
              <span className="font-mono">{model.vehicleModelId || model.id || "N/A"}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Tên Model">
              {model.modelName || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Phân loại">
              <Tag color={categoryInfo.color}>{categoryInfo.label}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Dung lượng pin">
              {model.batteryCapacityKwh ? `${model.batteryCapacityKwh} kWh` : "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Tầm hoạt động">
              {model.maxRangeKm ? `${model.maxRangeKm} km` : "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Tốc độ tối đa">
              {model.maxSpeedKmh ? `${model.maxSpeedKmh} km/h` : "N/A"}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title="Thông tin giá và số lượng" className="shadow-sm">
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Giá thuê">
              {model.rentalPrice
                ? `${model.rentalPrice.toLocaleString("vi-VN")} đ`
                : "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Giá gốc">
              {model.originalRentalPrice
                ? `${model.originalRentalPrice.toLocaleString("vi-VN")} đ`
                : "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Tổng số xe">
              {model.countTotal ?? 0}
            </Descriptions.Item>
            <Descriptions.Item label="Xe có sẵn">
              <Tag color={model.countAvailable > 0 ? "green" : "red"}>
                {model.countAvailable ?? 0} / {model.countTotal ?? 0}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Xe đang thuê">
              {(model.countTotal ?? 0) - (model.countAvailable ?? 0)}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {model.availableColors && model.availableColors.length > 0 && (
          <Card title="Màu sắc có sẵn" className="shadow-sm lg:col-span-2">
            <div className="flex flex-wrap gap-2">
              {model.availableColors.map((color: any, index: number) => (
                <Tag key={index} color="blue">
                  {color.colorName || color}
                </Tag>
              ))}
            </div>
          </Card>
        )}

        {model.description && (
          <Card title="Mô tả" className="shadow-sm lg:col-span-2">
            <p className="text-gray-700">{model.description}</p>
          </Card>
        )}

        {model.imageUrl && (
          <Card title="Hình ảnh" className="shadow-sm lg:col-span-2">
            <img
              src={model.imageUrl}
              alt={model.modelName}
              className="max-w-full h-auto rounded-lg"
            />
          </Card>
        )}
      </div>
    </div>
  );
}

