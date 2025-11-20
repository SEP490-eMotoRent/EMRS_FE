"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Table, Button } from "antd";
import dayjs from "dayjs";

import { getBranchClaims } from "./insurance_service";

export default function InsurancePage() {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getBranchClaims();
        setClaims(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const columns = [
    {
      title: "Tên khách",
      dataIndex: "renterName",
      key: "renterName",
    },
    {
      title: "Ngày xảy ra",
      dataIndex: "incidentDate",
      key: "incidentDate",
      render: (d: string) => dayjs(d).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Biển số",
      dataIndex: "licensePlate",
      key: "licensePlate",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_: any, record: any) => (
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
        <h1 className="text-2xl font-semibold">Danh sách sự cố bảo hiểm</h1>
        <Link href="/dashboard/manager/insurance/create">
          <Button type="primary">Báo cáo sự cố mới</Button>
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg p-4">
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={claims}
          locale={{ emptyText: "Không có sự cố nào" }}
        />
      </div>
    </div>
  );
}
