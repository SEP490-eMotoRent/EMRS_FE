"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Table, Tag, Input, message, Card } from "antd";
import type { ColumnsType } from "antd/es/table";
import { SearchOutlined } from "@ant-design/icons";

import {
  getBranchVehicleModels,
  ManagerVehicleModel,
} from "./vehicle_model_service";

export default function ManagerVehicleModelsPage() {
  const [models, setModels] = useState<ManagerVehicleModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [branchId, setBranchId] = useState<string>("");
  const [searchText, setSearchText] = useState("");
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

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
      }
    }
  }, []);

  useEffect(() => {
    if (branchId) {
      loadModels(pageNum, pageSize);
    }
  }, [branchId, pageNum, pageSize]);

  const loadModels = async (page: number, size: number) => {
    try {
      setLoading(true);
      const res = await getBranchVehicleModels({
        branchId,
        pageNum: page,
        pageSize: size,
      });
      setModels(res.items || []);
      setTotalItems(res.totalItems || 0);
    } catch (err) {
      console.error("Error loading branch vehicle models:", err);
      message.error("Không thể tải danh sách model xe");
      setModels([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredModels = models.filter((model) => {
    if (!searchText.trim()) return true;
    const q = searchText.toLowerCase();
    return (
      (model.modelName || "").toLowerCase().includes(q) ||
      (model.category || "").toLowerCase().includes(q) ||
      (model.id || "").toLowerCase().includes(q)
    );
  });

  const columns: ColumnsType<ManagerVehicleModel> = [
    {
      title: "Mã Model",
      dataIndex: "vehicleModelId",
      key: "vehicleModelId",
      width: 200,
      render: (text, record) => (
        <Link
          href={`/dashboard/manager/vehicle-models/${record.vehicleModelId || record.id}`}
          className="text-blue-600 hover:underline font-mono text-sm"
        >
          {text ? `${text.substring(0, 8)}...` : "N/A"}
        </Link>
      ),
    },
    {
      title: "Tên Model",
      dataIndex: "modelName",
      key: "modelName",
      width: 200,
      render: (name: string) => <span className="font-semibold">{name || "N/A"}</span>,
    },
    {
      title: "Phân loại",
      dataIndex: "category",
      key: "category",
      width: 120,
      render: (category?: string) => {
        if (!category) return "N/A";
        const upper = category.toUpperCase();
        const color =
          upper === "ECONOMY"
            ? "blue"
            : upper === "STANDARD"
            ? "green"
            : upper === "PREMIUM"
            ? "gold"
            : "default";
        return <Tag color={color}>{upper}</Tag>;
      },
    },
    {
      title: "Pin (kWh)",
      dataIndex: "batteryCapacityKwh",
      key: "batteryCapacityKwh",
      width: 100,
      align: "center",
      render: (v?: number) => (v != null ? `${v} kWh` : "N/A"),
    },
    {
      title: "Tầm hoạt động",
      dataIndex: "maxRangeKm",
      key: "maxRangeKm",
      width: 130,
      align: "center",
      render: (v?: number) => (v != null ? `${v} km` : "N/A"),
    },
    {
      title: "Giá thuê/ngày",
      dataIndex: "rentalPrice",
      key: "rentalPrice",
      width: 140,
      align: "right",
      render: (price?: number) => {
        if (!price) return "N/A";
        return <span className="font-semibold text-green-600">{price.toLocaleString("vi-VN")} ₫</span>;
      },
    },
    {
      title: "Màu sắc",
      dataIndex: "availableColors",
      key: "availableColors",
      width: 150,
      render: (colors?: Array<{ colorName: string }>) => {
        if (!colors || colors.length === 0) return "N/A";
        return (
          <div className="flex flex-wrap gap-1">
            {colors.slice(0, 2).map((color, idx) => (
              <Tag key={idx} color="cyan">{color.colorName}</Tag>
            ))}
            {colors.length > 2 && <Tag>+{colors.length - 2}</Tag>}
          </div>
        );
      },
    },
    {
      title: "Tổng xe",
      dataIndex: "countTotal",
      key: "countTotal",
      width: 100,
      align: "center",
      render: (v?: number) => <span className="font-medium">{v ?? 0}</span>,
    },
    {
      title: "Xe có sẵn",
      dataIndex: "countAvailable",
      key: "countAvailable",
      width: 120,
      align: "center",
      render: (value: number, record) => {
        const total = record.countTotal ?? 0;
        const available = value ?? 0;
        const color = available > 0 ? "green" : "red";
        return (
          <Tag color={color} className="font-medium">
            {available} / {total}
          </Tag>
        );
      },
    },
    {
      title: "Hành động",
      key: "action",
      width: 120,
      fixed: "right",
      render: (_: any, record: ManagerVehicleModel) => (
        <Link
          href={`/dashboard/manager/vehicle-models/${record.vehicleModelId || record.id}`}
          className="text-blue-600 hover:underline"
        >
          Xem chi tiết
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <h1 className="text-xl font-semibold text-gray-800">Model xe</h1>

      {/* Search */}
      <Card className="shadow-sm border-0">
        <Input
          placeholder="Tìm theo model / phân loại / mã model"
          allowClear
          prefix={<SearchOutlined className="text-gray-400" />}
          size="middle"
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            if (!e.target.value) setSearchText("");
          }}
          onPressEnter={() => setSearchText(searchText)}
          className="rounded-lg"
        />
      </Card>

      {/* Table */}
      <Card className="shadow-sm border-0">
        <Table
          rowKey={(record) => record.vehicleModelId || record.id || Math.random().toString()}
          loading={loading}
          columns={columns}
          dataSource={filteredModels}
          scroll={{ x: 1400 }}
          locale={{
            emptyText: branchId
              ? "Không có model nào cho chi nhánh này"
              : "Chưa xác định chi nhánh",
          }}
          pagination={{
            current: pageNum,
            pageSize,
            total: totalItems,
            showSizeChanger: true,
            pageSizeOptions: ["5", "10", "20", "50"],
            showTotal: (total) => `Tổng ${total} model`,
            onChange: (page, size) => {
              setPageNum(page);
              setPageSize(size);
            },
          }}
          size="middle"
        />
      </Card>
    </div>
  );
}


