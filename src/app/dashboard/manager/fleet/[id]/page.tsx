"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Tag } from "lucide-react";
import { Button, Card, Descriptions, Spin, Tag as AntTag } from "antd";
import dayjs from "dayjs";

import { getVehicleModelById } from "../fleet_service";

const getStatusInfo = (status: string) => {
  const statusMap: Record<string, { label: string; color: string }> = {
    available: { label: "available", color: "green" },
    "in-use": { label: "in-use", color: "blue" },
    maintenance: { label: "maintenance", color: "red" },
    rented: { label: "rented", color: "blue" },
    Available: { label: "Available", color: "green" },
    "In-Use": { label: "In-Use", color: "blue" },
    Maintenance: { label: "Maintenance", color: "red" },
    Rented: { label: "Rented", color: "blue" },
  };

  return (
    statusMap[status] || { label: status || "N/A", color: "default" }
  );
};

export default function VehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [vehicle, setVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      loadVehicle();
    }
  }, [params.id]);

  const loadVehicle = async () => {
    try {
      setLoading(true);
      const data = await getVehicleModelById(params.id as string);
      setVehicle(data);
    } catch (err) {
      console.error("Error loading vehicle:", err);
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

  if (!vehicle) {
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
          Không tìm thấy thông tin xe
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(vehicle.status || "");

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
        Chi tiết xe: {vehicle.licensePlate || vehicle.vehicleId || "N/A"}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Thông tin cơ bản" className="shadow-sm">
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Mã xe">
              {vehicle.licensePlate || vehicle.vehicleId || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Model">
              {vehicle.vehicleModel?.modelName ||
                vehicle.modelName ||
                "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Màu sắc">
              {vehicle.color || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Năm sản xuất">
              {vehicle.yearOfManufacture
                ? dayjs(vehicle.yearOfManufacture).format("YYYY")
                : "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <AntTag color={statusInfo.color}>{statusInfo.label}</AntTag>
            </Descriptions.Item>
            <Descriptions.Item label="Chi nhánh">
              {vehicle.branch?.branchName || vehicle.branchName || "N/A"}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title="Thông tin kỹ thuật" className="shadow-sm">
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Số km hiện tại">
              {vehicle.currentOdometerKm
                ? `${vehicle.currentOdometerKm.toLocaleString()} km`
                : "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="% Pin">
              {vehicle.batteryHealthPercentage
                ? `${vehicle.batteryHealthPercentage}%`
                : "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="GPS Device ID">
              {vehicle.gpsDeviceIdent || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Flespi Device ID">
              {vehicle.flespiDeviceId || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày bảo trì cuối">
              {vehicle.lastMaintenanceDate
                ? dayjs(vehicle.lastMaintenanceDate).format(
                    "DD/MM/YYYY HH:mm"
                  )
                : "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày bảo trì tiếp theo">
              {vehicle.nextMaintenanceDue
                ? dayjs(vehicle.nextMaintenanceDue).format("DD/MM/YYYY")
                : "N/A"}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {vehicle.description && (
          <Card title="Mô tả" className="shadow-sm lg:col-span-2">
            <p className="text-gray-700">{vehicle.description}</p>
          </Card>
        )}
      </div>
    </div>
  );
}

