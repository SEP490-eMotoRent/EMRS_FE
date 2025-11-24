"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Table, Tag, Input } from "antd";

interface VehicleRealtimeInfo {
  id: string;
  licensePlate: string;
  status: string;
  batteryHealthPercentage: number;
  color: string;
  hasTracking: boolean;
}

// ID của xe có tracking
const TRACKING_VEHICLE_ID = "072ea2b3-c69b-4607-85ff-ff5825ff8e2a";

export default function IoTRealtimePage() {
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<VehicleRealtimeInfo[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Lấy danh sách vehicle models với vehicles từ API mới
        const res = await fetch("/api/vehicle-model/list?pageNum=1&pageSize=100&descendingOrder=false");
        
        if (!res.ok) {
          console.error("Vehicle model API failed:", res.status, res.statusText);
          return;
        }

        const json = await res.json();
        console.log("Vehicle model API response:", json);

        // Xử lý response structure mới: { success: true, data: { items: [...] } }
        let allVehicles: any[] = [];
        
        if (json.success && json.data) {
          if (json.data.items && Array.isArray(json.data.items)) {
            // Lấy tất cả vehicles từ các models
            json.data.items.forEach((model: any) => {
              if (model.vehicles && Array.isArray(model.vehicles)) {
                allVehicles = allVehicles.concat(model.vehicles);
              }
            });
          }
        }

        console.log("All vehicles from models:", allVehicles);

        // Chỉ lấy xe có ID tracking (không cần gọi API tracking nữa)
        const vehiclesWithTracking = allVehicles
          .filter((vehicle: any) => {
            const vehicleId = vehicle.id || vehicle.vehicleId;
            return vehicleId && vehicleId.toLowerCase() === TRACKING_VEHICLE_ID.toLowerCase();
          })
          .map((vehicle: any) => ({
            id: vehicle.id || vehicle.vehicleId,
            licensePlate: vehicle.licensePlate || "N/A",
            status: vehicle.status || "Unknown",
            batteryHealthPercentage: vehicle.batteryHealthPercentage || 0,
            color: vehicle.color || "",
            hasTracking: true,
          } as VehicleRealtimeInfo));

        console.log("Vehicles with tracking:", vehiclesWithTracking);
        setVehicles(vehiclesWithTracking);
      } catch (err) {
        console.error("Realtime list error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const columns = [
    {
      title: "Biển số",
      dataIndex: "licensePlate",
      render: (t: string) => <span className="font-medium">{t}</span>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (s: string) => {
        const color =
          s === "Available"
            ? "green"
            : s === "Rented"
            ? "blue"
            : s === "Maintenance"
            ? "orange"
            : "red";

        return <Tag color={color}>{s}</Tag>;
      },
    },
    {
      title: "Pin (%)",
      dataIndex: "batteryHealthPercentage",
      render: (n: number) => `${n}%`,
    },
    {
      title: "Tracking",
      render: (_: any, row: VehicleRealtimeInfo) => (
        <Tag color={row.hasTracking ? "green" : "default"}>
          {row.hasTracking ? "Có" : "Không"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      render: (_: any, row: any) => (
        <Link
          href={`/dashboard/manager/iot/${row.id}`}
          className="text-blue-600 hover:underline"
        >
          Xem realtime
        </Link>
      ),
    },
  ];

  const filtered = vehicles.filter((v) =>
    v.licensePlate.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">IoT Realtime</h1>

      <Input
        placeholder="Tìm biển số xe"
        className="max-w-sm"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <Table
        loading={loading}
        columns={columns}
        dataSource={filtered}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: false,
          showQuickJumper: false,
          hideOnSinglePage: false, // Luôn hiển thị pagination để người dùng biết đang ở trang nào
          showTotal: (total) => `Tổng ${total} xe có tracking`,
        }}
      />
    </div>
  );
}

