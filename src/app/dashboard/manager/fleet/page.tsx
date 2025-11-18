"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Table, Input, Tag } from "antd";
import { Search } from "lucide-react";
import dayjs from "dayjs";

import { getVehicles, VehicleFilters } from "./fleet_service";

const { Search: AntSearch } = Input;

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

export default function FleetPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState<VehicleFilters>({});

  useEffect(() => {
    loadVehicles();
  }, [filters]);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const data = await getVehicles(filters);
      setVehicles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading vehicles:", err);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    // Search by license plate, model name, or status
    if (value.trim()) {
      // We'll filter on the client side for now, or you can implement server-side search
      // For now, let's filter client-side
    } else {
      setFilters({});
    }
  };

  // Filter vehicles based on search text
  const filteredVehicles = vehicles.filter((vehicle) => {
    if (!searchText.trim()) return true;
    const searchLower = searchText.toLowerCase();
    return (
      (vehicle.licensePlate || "")
        .toLowerCase()
        .includes(searchLower) ||
      (vehicle.vehicleModel?.modelName || vehicle.modelName || "")
        .toLowerCase()
        .includes(searchLower) ||
      (vehicle.status || "").toLowerCase().includes(searchLower)
    );
  });

  const columns = [
    {
      title: "MÃ XE",
      dataIndex: "licensePlate",
      key: "licensePlate",
      render: (text: string, record: any) => (
        <Link
          href={`/dashboard/manager/fleet/${record.vehicleId || record.id}`}
          className="text-blue-600 hover:underline"
        >
          {text || record.vehicleId || record.id || "N/A"}
        </Link>
      ),
    },
    {
      title: "MODEL",
      dataIndex: "modelName",
      key: "modelName",
      render: (_: any, record: any) =>
        record.vehicleModel?.modelName ||
        record.modelName ||
        record.vehicleModelName ||
        "N/A",
    },
    {
      title: "% PIN",
      dataIndex: "batteryHealthPercentage",
      key: "batteryHealthPercentage",
      render: (value: number) => `${value || 0}%`,
    },
    {
      title: "TRẠNG THÁI",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const statusInfo = getStatusInfo(status || "");
        return (
          <Tag color={statusInfo.color}>{statusInfo.label}</Tag>
        );
      },
    },
    {
      title: "CHI NHÁNH",
      dataIndex: "branchName",
      key: "branchName",
      render: (_: any, record: any) =>
        record.branch?.branchName ||
        record.branchName ||
        "N/A",
    },
    {
      title: "LẦN CUỐI",
      dataIndex: "lastUpdatedAt",
      key: "lastUpdatedAt",
      render: (date: string, record: any) => {
        const dateValue =
          date ||
          record.updatedAt ||
          record.lastMaintenanceDate ||
          record.createdAt;
        return dateValue
          ? dayjs(dateValue).format("YYYY-MM-DD HH:mm")
          : "N/A";
      },
    },
    {
      title: "HÀNH ĐỘNG",
      key: "action",
      render: (_: any, record: any) => (
        <Link
          href={`/dashboard/manager/fleet/${record.vehicleId || record.id}`}
          className="text-blue-600 hover:underline"
        >
          Xem chi tiết
        </Link>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-blue-600 mb-4">
          Quản lý Fleet (xe, pin, trạng thái)
        </h1>

        <div className="mb-4">
          <AntSearch
            placeholder="Tìm xe theo mã / model / trạng thái"
            allowClear
            enterButton={<Search className="w-4 h-4" />}
            size="large"
            onSearch={handleSearch}
            onChange={(e) => {
              if (!e.target.value) {
                handleSearch("");
              }
            }}
          />
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-4">
        <Table
          rowKey={(record) => record.vehicleId || record.id || Math.random()}
          loading={loading}
          columns={columns}
          dataSource={filteredVehicles}
          locale={{ emptyText: "Không có xe nào" }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} xe`,
          }}
        />
      </div>
    </div>
  );
}

