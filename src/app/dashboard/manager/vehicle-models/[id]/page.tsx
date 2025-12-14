"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Card, Descriptions, Spin, Tag, Table } from "antd";
import { ArrowLeft, CheckCircle, Info } from "lucide-react";

import { getManagerVehicleModelDetail, getBranchVehicleModels, ManagerVehicleModel } from "../vehicle_model_service";

export default function ManagerVehicleModelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [model, setModel] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      loadModelDetail();
    }
  }, [params.id]);

  const loadModelDetail = async () => {
    try {
      setLoading(true);
      
      // Lấy branchId từ cookie
      let branchId = "";
      if (typeof document !== "undefined") {
        const cookieStr = document.cookie || "";
        const cookies: Record<string, string> = {};
        cookieStr.split(";").forEach((c) => {
          const [key, value] = c.trim().split("=");
          if (key && value) {
            cookies[key] = decodeURIComponent(value);
          }
        });
        branchId = cookies.branchId || "";
      }

      if (branchId) {
        // Load từ list API với pageSize lớn để tìm model
        const response = await getBranchVehicleModels({
          branchId,
          pageNum: 1,
          pageSize: 100,
        });
        
        // Tìm model theo ID
        const foundModel = response.items.find(
          (m: ManagerVehicleModel) => 
            (m.vehicleModelId || m.id) === params.id
        );
        
        if (foundModel) {
          setModel(foundModel);
        } else {
          // Fallback: thử dùng detail API cũ
          try {
            const data = await getManagerVehicleModelDetail(params.id as string);
            setModel(data);
          } catch (detailError) {
            console.error("Error loading from detail API:", detailError);
            setModel(null);
          }
        }
      } else {
        // Fallback: dùng detail API cũ
        const data = await getManagerVehicleModelDetail(params.id as string);
        setModel(data);
      }
    } catch (error) {
      console.error("Error loading model detail:", error);
      setModel(null);
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
        <Button icon={<ArrowLeft />} onClick={() => router.back()} className="mb-4">
          Quay lại
        </Button>
        <div className="text-center text-gray-500">Không tìm thấy thông tin model</div>
      </div>
    );
  }

  const categoryColor =
    model.category === "PREMIUM"
      ? "gold"
      : model.category === "STANDARD"
      ? "green"
      : "blue";

  return (
    <div className="p-6 space-y-6">
      <Button icon={<ArrowLeft />} onClick={() => router.back()}>
        Quay lại
      </Button>

      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold mb-1">{model.modelName || "Model"}</h1>
          <div className="flex items-center gap-3 text-gray-500 text-sm">
            <span>Mã model: {model.vehicleModelId || model.id}</span>
            {model.category && <Tag color={categoryColor}>{model.category}</Tag>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-green-500" />
            <div>
              <p className="text-sm text-gray-500">Xe đang có</p>
              <p className="text-2xl font-semibold">
                {model.countAvailable ?? 0} / {model.countTotal ?? 0}
              </p>
            </div>
          </div>
        </Card>
        <Card className="shadow-sm">
          <div className="flex items-center gap-3">
            <Info className="text-indigo-500" />
            <div>
              <p className="text-sm text-gray-500">Pin (kWh)</p>
              <p className="text-2xl font-semibold">
                {model.batteryCapacityKwh != null ? `${model.batteryCapacityKwh} kWh` : "N/A"}
              </p>
            </div>
          </div>
        </Card>
        <Card className="shadow-sm">
          <div className="flex items-center gap-3">
            <Info className="text-indigo-500" />
            <div>
              <p className="text-sm text-gray-500">Tầm hoạt động</p>
              <p className="text-2xl font-semibold">
                {model.maxRangeKm != null ? `${model.maxRangeKm} km` : "N/A"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Thông tin chi tiết" className="shadow-sm">
        <Descriptions column={2} bordered>
          <Descriptions.Item label="Tên model">
            <span className="font-semibold">{model.modelName || "N/A"}</span>
          </Descriptions.Item>
          <Descriptions.Item label="Phân loại">
            {model.category ? <Tag color={categoryColor}>{model.category}</Tag> : "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Dung lượng pin">
            {model.batteryCapacityKwh != null ? `${model.batteryCapacityKwh} kWh` : "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Tầm hoạt động tối đa">
            {model.maxRangeKm != null ? `${model.maxRangeKm} km` : "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Tốc độ tối đa">
            {model.maxSpeedKmh != null ? `${model.maxSpeedKmh} km/h` : "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Giá thuê/ngày">
            {model.rentalPrice ? (
              <span className="font-semibold text-green-600">
                {model.rentalPrice.toLocaleString("vi-VN")} ₫
              </span>
            ) : "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Màu sắc có sẵn" span={2}>
            {model.availableColors && model.availableColors.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {model.availableColors.map((color: any, idx: number) => (
                  <Tag key={idx} color="cyan">{color.colorName}</Tag>
                ))}
              </div>
            ) : "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Mô tả" span={2}>
            {model.description || "N/A"}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Danh sách xe */}
      {model.vehicles && model.vehicles.length > 0 && (
        <Card title={`Danh sách xe (${model.vehicles.length})`} className="shadow-sm">
          <Table
            dataSource={model.vehicles}
            rowKey="id"
            pagination={false}
            columns={[
              {
                title: "Biển số",
                dataIndex: "licensePlate",
                key: "licensePlate",
                render: (text: string) => <span className="font-semibold">{text}</span>,
              },
              {
                title: "Màu sắc",
                dataIndex: "color",
                key: "color",
                render: (color: string) => <Tag color="cyan">{color}</Tag>,
              },
              {
                title: "Số km",
                dataIndex: "currentOdometerKm",
                key: "currentOdometerKm",
                align: "right",
                render: (km?: number) => km ? `${km.toLocaleString("vi-VN")} km` : "N/A",
              },
              {
                title: "Pin %",
                dataIndex: "batteryHealthPercentage",
                key: "batteryHealthPercentage",
                align: "center",
                render: (percent?: number) => {
                  if (!percent) return "N/A";
                  const color = percent >= 80 ? "green" : percent >= 50 ? "orange" : "red";
                  return <Tag color={color}>{percent}%</Tag>;
                },
              },
              {
                title: "Trạng thái",
                dataIndex: "status",
                key: "status",
                render: (status?: string) => {
                  if (!status) return "N/A";
                  const statusMap: Record<string, { color: string; text: string }> = {
                    Available: { color: "green", text: "Sẵn sàng" },
                    Rented: { color: "blue", text: "Đang thuê" },
                    Transfering: { color: "orange", text: "Đang điều chuyển" },
                    Maintenance: { color: "red", text: "Bảo trì" },
                  };
                  const info = statusMap[status] || { color: "default", text: status };
                  return <Tag color={info.color}>{info.text}</Tag>;
                },
              },
            ]}
          />
        </Card>
      )}
    </div>
  );
}


