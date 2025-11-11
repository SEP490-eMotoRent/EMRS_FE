"use client";
import React from "react";
import { Table, Tag, Button } from "antd";
import dayjs from "dayjs";

interface Props {
  data: any[];
  onView: (id: string) => void;
}

const ClaimTable: React.FC<Props> = ({ data, onView }) => {
  // ✅ Map đổi trạng thái sang tiếng Việt
  const statusMap: Record<string, { text: string; color: string }> = {
    Reported: { text: "Đã báo cáo", color: "orange" },
    Processing: { text: "Đang xử lý", color: "blue" },
    Settled: { text: "Đã quyết toán", color: "green" },
    Rejected: { text: "Từ chối", color: "red" },
  };

  const columns = [
    {
      title: "Ngày sự cố",
      dataIndex: "incidentDate",
      key: "incidentDate",
      render: (d: string) => dayjs(d).format("HH:mm:ss DD/MM/YYYY"),
    },
    { title: "Người thuê", dataIndex: "renterName", key: "renterName" },
    { title: "Xe", dataIndex: "vehicleModelName", key: "vehicleModelName" },
    { title: "Biển số", dataIndex: "licensePlate", key: "licensePlate" },
    { title: "Chi nhánh giao", dataIndex: "handoverBranchName", key: "handoverBranchName" },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const s = statusMap[status] || { text: status, color: "default" };
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_: any, record: any) => (
        <Button onClick={() => onView(record.id)}>Xem chi tiết</Button>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="id"
      pagination={{ pageSize: 5 }}
    />
  );
};

export default ClaimTable;
