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
  hasTracking?: boolean;
}

// Danh sách vehicle IDs có tracking capability
const TRACKING_VEHICLE_IDS = [
  "072ea2b3-c69b-4607-85ff-ff5825ff8e2a",
];

export default function IoTRealtimePage() {
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<VehicleRealtimeInfo[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        const res = await fetch("/api/vehicle");
        
        if (!res.ok) {
          console.error("Vehicle API failed:", res.status, res.statusText);
          return;
        }

        const json = await res.json();
        console.log("Vehicle API response:", json);

        // Handle response structure: { success: true, data: [...] } or direct array
        let vehiclesList: any[] = [];
        
        if (json.success && Array.isArray(json.data)) {
          vehiclesList = json.data;
        } else if (Array.isArray(json.data)) {
          vehiclesList = json.data;
        } else if (Array.isArray(json)) {
          vehiclesList = json;
        } else if (json.success && json.data && typeof json.data === 'object') {
          // Nếu data là object (có thể là pagination object hoặc empty object)
          // Kiểm tra xem có items/vehicles property không
          if (Array.isArray(json.data.items)) {
            vehiclesList = json.data.items;
          } else if (Array.isArray(json.data.vehicles)) {
            vehiclesList = json.data.vehicles;
          } else if (Array.isArray(json.data.data)) {
            vehiclesList = json.data.data;
          }
        }

        console.log("Vehicles list:", vehiclesList);
        console.log("Tracking vehicle IDs:", TRACKING_VEHICLE_IDS);

        // Normalize IDs để so sánh (lowercase, trim)
        const normalizedTrackingIds = TRACKING_VEHICLE_IDS.map(id => id.toLowerCase().trim());

        let list: VehicleRealtimeInfo[] = [];

        // Nếu có vehicles từ API, map và filter
        if (vehiclesList.length > 0) {
          list = vehiclesList
            .map((v: any) => {
              const vehicleId = String(v.id || v.vehicleId || "").trim();
              const normalizedId = vehicleId.toLowerCase();
              const hasTracking = normalizedTrackingIds.includes(normalizedId);
              
              console.log(`Vehicle ID: ${vehicleId}, License: ${v.licensePlate}, Has tracking: ${hasTracking}`);
              
              return {
                id: vehicleId,
                licensePlate: v.licensePlate,
                status: v.status,
                batteryHealthPercentage: v.batteryHealthPercentage,
                color: v.color,
                hasTracking: hasTracking,
              };
            })
            // Chỉ hiển thị xe có tracking
            .filter((v: VehicleRealtimeInfo) => v.hasTracking);
        }

        // Nếu không có xe từ API nhưng có tracking IDs, tạo placeholder entries
        // để user vẫn có thể click vào xem tracking
        if (list.length === 0 && TRACKING_VEHICLE_IDS.length > 0) {
          console.warn("Không tìm thấy xe từ API. Tạo placeholder cho tracking vehicles:");
          list = TRACKING_VEHICLE_IDS.map((id) => ({
            id: id,
            licensePlate: `Vehicle ${id.substring(0, 8)}...`,
            status: "Unknown",
            batteryHealthPercentage: 0,
            color: "",
            hasTracking: true,
          }));
        }
        
        console.log("Filtered vehicles with tracking:", list);
        setVehicles(list);
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
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
}

