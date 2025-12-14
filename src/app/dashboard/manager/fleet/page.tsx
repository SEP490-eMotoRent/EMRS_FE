"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Table, Input, Tag, message, Button, Space, Tooltip, Card } from "antd";
import { RadarChartOutlined, SearchOutlined } from "@ant-design/icons";

import {
  getVehiclesByBranch,
  getVehicleById,
  ManagerVehicle,
} from "./fleet_service";


// Map status to Vietnamese and color
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

interface TrackingInfo {
  gpsDeviceIdent?: string;
  flespiDeviceId?: number;
}

export default function FleetPage() {
  const [vehicles, setVehicles] = useState<ManagerVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [branchId, setBranchId] = useState<string>("");
  const [trackingCache, setTrackingCache] = useState<
    Record<string, TrackingInfo>
  >({});
  const router = useRouter();

  useEffect(() => {
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
        message.warning("Không tìm thấy chi nhánh. Vui lòng đăng nhập lại.");
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (branchId) {
      loadBranchVehicles(branchId);
    }
  }, [branchId]);

  const loadBranchVehicles = async (branch: string) => {
    try {
      setLoading(true);
      const response = await getVehiclesByBranch({
        branchId: branch,
        pageSize: 200,
      });
      const trackingUpdates: Record<string, TrackingInfo> = {};
      const vehiclesWithTracking = await Promise.all(
        (response.items || []).map(async (vehicle) => {
          const vehicleId = vehicle.id || vehicle.vehicleId;
          if (!vehicleId) {
            return vehicle;
          }

          const cached = trackingCache[vehicleId];
          if (cached) {
            return {
              ...vehicle,
              ...cached,
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
            const detailVehicle = await getVehicleById(vehicleId);
            const trackingData: TrackingInfo = {
              gpsDeviceIdent: detailVehicle.gpsDeviceIdent || undefined,
              flespiDeviceId: detailVehicle.flespiDeviceId || undefined,
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
    } catch (err) {
      console.error("Error loading branch vehicles:", err);
      message.error("Không thể tải danh sách xe chi nhánh");
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  // Filter vehicle models based on search text
  const filteredVehicles = vehicles.filter((vehicle) => {
    if (!searchText.trim()) return true;
    const searchLower = searchText.toLowerCase();
    return (
      (vehicle.licensePlate || "").toLowerCase().includes(searchLower) ||
      (vehicle.vehicleModel?.modelName || "")
        .toLowerCase()
        .includes(searchLower) ||
      (vehicle.color || "").toLowerCase().includes(searchLower)
    );
  });

  const handleTrackVehicle = (vehicleId?: string) => {
    if (!vehicleId) {
      message.error("Không tìm thấy ID xe");
      return;
    }
    router.push(`/dashboard/manager/fleet/${vehicleId}/tracking`);
  };

  const columns = [
    {
      title: "BIỂN SỐ",
      dataIndex: "licensePlate",
      key: "licensePlate",
      render: (text: string, record: any) => (
        <Link
          href={`/dashboard/manager/fleet/${record.id || record.vehicleId}`}
          className="text-blue-600 hover:underline font-mono"
        >
          {text || "N/A"}
        </Link>
      ),
    },
    {
      title: "MODEL",
      key: "modelName",
      render: (_: any, record: ManagerVehicle) =>
        record.vehicleModel?.modelName || "N/A",
    },
    {
      title: "MÀU SẮC",
      dataIndex: "color",
      key: "color",
      render: (text: string) => text || "N/A",
    },
    {
      title: "SỐ KM",
      dataIndex: "currentOdometerKm",
      key: "currentOdometerKm",
      render: (value: number) =>
        value ? `${value.toLocaleString()} km` : "N/A",
    },
    {
      title: "% PIN",
      dataIndex: "batteryHealthPercentage",
      key: "batteryHealthPercentage",
      render: (value: number) => (value !== undefined ? `${value}%` : "N/A"),
    },
    {
      title: "TRẠNG THÁI",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const info = getStatusInfo(status);
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: "TRACKING",
      key: "tracking",
      render: (_: any, record: ManagerVehicle) => {
        const hasTracking = Boolean(
          record.gpsDeviceIdent || record.flespiDeviceId
        );
        return (
          <Tag color={hasTracking ? "green" : "default"}>
            {hasTracking ? "Có" : "Không"}
          </Tag>
        );
      },
    },
    {
      title: "HÀNH ĐỘNG",
      key: "action",
      render: (_: any, record: ManagerVehicle) => {
        const vehicleId = record.id || record.vehicleId;
        const hasTracking = Boolean(
          record.gpsDeviceIdent || record.flespiDeviceId
        );
        const trackButton = (
          <Button
            type="link"
            icon={<RadarChartOutlined />}
            onClick={() => handleTrackVehicle(vehicleId)}
            disabled={!vehicleId || !hasTracking}
          >
            Theo dõi
          </Button>
        );

        return (
          <Space>
            <Link
              href={`/dashboard/manager/fleet/${vehicleId}`}
              className="text-blue-600 hover:underline"
            >
              Xem chi tiết
            </Link>
            {hasTracking ? (
              trackButton
            ) : (
              <Tooltip title="Xe này chưa được cấu hình tracking.">
                {trackButton}
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <h1 className="text-xl font-semibold text-gray-800">Quản lý Fleet</h1>

      {/* Search */}
      <Card className="shadow-sm border-0">
        <Input
          placeholder="Tìm theo biển số / model / màu"
          allowClear
          prefix={<SearchOutlined className="text-gray-400" />}
          size="middle"
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            if (!e.target.value) {
              handleSearch("");
            }
          }}
          onPressEnter={() => handleSearch(searchText)}
          className="rounded-lg"
        />
      </Card>

      {/* Table */}
      <Card className="shadow-sm border-0">
        <Table
          rowKey={(record) => record.vehicleModelId || record.id || Math.random()}
          loading={loading}
          columns={columns}
          dataSource={filteredVehicles}
          locale={{ emptyText: branchId ? "Không có xe nào" : "Chưa xác định chi nhánh" }}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showQuickJumper: false,
            hideOnSinglePage: false,
            showTotal: (total) => `Tổng ${total} xe`,
          }}
          size="middle"
        />
      </Card>
    </div>
  );
}

