"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Table, Tag, message } from "antd";
import dayjs from "dayjs";
import type { ColumnsType } from "antd/es/table";

import { getBranchClaims } from "./insurance_service";

type ClaimStatus = "Reported" | "Processing" | "Rejected" | "Completed";

interface ClaimItem {
  id: string;
  status: ClaimStatus;
  incidentDate: string;
  incidentLocation: string;
  renterName: string;
  renterPhone: string;
  vehicleModelName: string;
  licensePlate: string;
  bookingId: string;
  handoverBranchName: string;
  createdAt: string;
}

export default function InsurancePage() {
  const [claims, setClaims] = useState<ClaimItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClaims();
  }, []);

  const loadClaims = async () => {
    try {
      setLoading(true);
      const data = await getBranchClaims();
      setClaims(data);
    } catch (err: any) {
      console.error(err);
      message.error(err.message || "Không thể tải danh sách claims");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: ClaimStatus) => {
    switch (status) {
      case "Reported":
        return "orange";
      case "Processing":
        return "blue";
      case "Rejected":
        return "red";
      case "Completed":
        return "green";
      default:
        return "default";
    }
  };

  const getStatusText = (status: ClaimStatus) => {
    switch (status) {
      case "Reported":
        return "Đã báo cáo";
      case "Processing":
        return "Đang xử lý";
      case "Rejected":
        return "Đã từ chối";
      case "Completed":
        return "Hoàn tất";
      default:
        return status;
    }
  };

  const columns: ColumnsType<ClaimItem> = [
    {
      title: "Tên khách hàng",
      dataIndex: "renterName",
      key: "renterName",
      width: 150,
    },
    {
      title: "Số điện thoại",
      dataIndex: "renterPhone",
      key: "renterPhone",
      width: 120,
    },
    {
      title: "Ngày xảy ra",
      dataIndex: "incidentDate",
      key: "incidentDate",
      width: 150,
      render: (d: string) => dayjs(d).format("DD/MM/YYYY HH:mm"),
      sorter: (a, b) =>
        dayjs(a.incidentDate).unix() - dayjs(b.incidentDate).unix(),
    },
    {
      title: "Địa điểm",
      dataIndex: "incidentLocation",
      key: "incidentLocation",
      ellipsis: true,
    },
    {
      title: "Mẫu xe",
      dataIndex: "vehicleModelName",
      key: "vehicleModelName",
      width: 150,
    },
    {
      title: "Biển số",
      dataIndex: "licensePlate",
      key: "licensePlate",
      width: 120,
    },
    {
      title: "Chi nhánh",
      dataIndex: "handoverBranchName",
      key: "handoverBranchName",
      width: 180,
      ellipsis: false,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: ClaimStatus) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
      filters: [
        { text: "Đã báo cáo", value: "Reported" },
        { text: "Đang xử lý", value: "Processing" },
        { text: "Đã từ chối", value: "Rejected" },
        { text: "Hoàn tất", value: "Completed" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (d: string) => dayjs(d).format("DD/MM/YYYY HH:mm"),
      sorter: (a, b) =>
        dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 120,
      fixed: "right",
      render: (_: any, record: ClaimItem) => (
        <Link
          href={`/dashboard/manager/insurance/${record.id}`}
          className="text-blue-600 hover:underline"
        >
          Xem chi tiết
        </Link>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Danh sách yêu cầu bảo hiểm</h1>
      </div>

      <div className="bg-white shadow rounded-lg p-4">
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={claims}
          locale={{ emptyText: "Không có yêu cầu bảo hiểm nào" }}
          scroll={{ x: 1400 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} yêu cầu`,
          }}
        />
      </div>
    </div>
  );
}
