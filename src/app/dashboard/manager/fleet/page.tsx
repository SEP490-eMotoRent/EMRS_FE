"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Table, Input, Tag } from "antd";
import { Search } from "lucide-react";
import dayjs from "dayjs";

import { getVehicleModels } from "./fleet_service";

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
  const [vehicleModels, setVehicleModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    loadVehicleModels();
  }, []);

  const loadVehicleModels = async () => {
    try {
      setLoading(true);
      const response = await getVehicleModels();
      console.log("Loaded vehicle models data:", response);
      
      // Xử lý response mới có pagination
      if (response && typeof response === 'object' && 'items' in response) {
        console.log("Number of models:", response.items?.length || 0);
        setVehicleModels(Array.isArray(response.items) ? response.items : []);
      } else if (Array.isArray(response)) {
        // Fallback cho structure cũ
        console.log("Number of models:", response.length);
        setVehicleModels(response);
      } else {
        setVehicleModels([]);
      }
    } catch (err) {
      console.error("Error loading vehicle models:", err);
      setVehicleModels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  // Filter vehicle models based on search text
  const filteredModels = vehicleModels.filter((model) => {
    if (!searchText.trim()) return true;
    const searchLower = searchText.toLowerCase();
    return (
      (model.modelName || "")
        .toLowerCase()
        .includes(searchLower) ||
      (model.category || "")
        .toLowerCase()
        .includes(searchLower) ||
      (model.vehicleModelId || "")
        .toLowerCase()
        .includes(searchLower)
    );
  });

  const columns = [
    {
      title: "MÃ MODEL",
      dataIndex: "vehicleModelId",
      key: "vehicleModelId",
      render: (text: string, record: any) => (
        <Link
          href={`/dashboard/manager/fleet/model/${record.vehicleModelId || record.id}`}
          className="text-blue-600 hover:underline font-mono"
        >
          {text || record.id || "N/A"}
        </Link>
      ),
    },
    {
      title: "MODEL",
      dataIndex: "modelName",
      key: "modelName",
      render: (text: string) => text || "N/A",
    },
    {
      title: "PHÂN LOẠI",
      dataIndex: "category",
      key: "category",
      render: (category: string) => {
        const categoryMap: Record<string, { label: string; color: string }> = {
          ECONOMY: { label: "ECONOMY", color: "blue" },
          STANDARD: { label: "STANDARD", color: "green" },
          PREMIUM: { label: "PREMIUM", color: "gold" },
        };
        const info = categoryMap[category] || { label: category || "N/A", color: "default" };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: "DUNG LƯỢNG PIN",
      dataIndex: "batteryCapacityKwh",
      key: "batteryCapacityKwh",
      render: (value: number) => `${value || 0} kWh`,
    },
    {
      title: "TẦM HOẠT ĐỘNG",
      dataIndex: "maxRangeKm",
      key: "maxRangeKm",
      render: (value: number) => `${value || 0} km`,
    },
    {
      title: "GIÁ THUÊ",
      dataIndex: "rentalPrice",
      key: "rentalPrice",
      render: (value: number) => {
        if (!value) return "N/A";
        return `${value.toLocaleString("vi-VN")} đ`;
      },
    },
    {
      title: "TỔNG SỐ XE",
      dataIndex: "countTotal",
      key: "countTotal",
      render: (value: number) => value || 0,
    },
    {
      title: "XE CÓ SẴN",
      dataIndex: "countAvailable",
      key: "countAvailable",
      render: (value: number, record: any) => {
        const available = value || 0;
        const total = record.countTotal || 0;
        const color = available > 0 ? "green" : "red";
        return <Tag color={color}>{available} / {total}</Tag>;
      },
    },
    {
      title: "HÀNH ĐỘNG",
      key: "action",
      render: (_: any, record: any) => (
        <Link
          href={`/dashboard/manager/fleet/model/${record.vehicleModelId || record.id}`}
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
            placeholder="Tìm model theo tên / phân loại / mã model"
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
          rowKey={(record) => record.vehicleModelId || record.id || Math.random()}
          loading={loading}
          columns={columns}
          dataSource={filteredModels}
          locale={{ emptyText: "Không có model nào" }}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showQuickJumper: false,
            hideOnSinglePage: false, // Luôn hiển thị pagination để người dùng biết đang ở trang nào
            showTotal: (total) => `Tổng ${total} model`,
          }}
        />
      </div>
    </div>
  );
}

