"use client";

import React, { useEffect, useState } from "react";
import { Table, Tag, Button, Select, Space, Modal, Descriptions, Image } from "antd";
import { getInsuranceClaims } from "./insurance_service";
import dayjs from "dayjs";

// 🔹 Map trạng thái sang tiếng Việt + màu
const statusMap: Record<
  string,
  { label: string; color: string }
> = {
  Reported: { label: "Đã báo cáo", color: "blue" },
  Processing: { label: "Đang xử lý", color: "orange" },
  Completed: { label: "Hoàn tất", color: "green" },
  Rejected: { label: "Từ chối", color: "red" },
};

export default function InsurancePage() {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    async function fetchClaims() {
      try {
        const data = await getInsuranceClaims();
        setClaims(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchClaims();
  }, []);

  const filteredClaims =
    filterStatus === "all" ? claims : claims.filter((c) => c.status === filterStatus);

  const columns = [
    { title: "Mã sự cố", dataIndex: "id", key: "id" },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (s: string) => (
        <Tag color={statusMap[s]?.color}>{statusMap[s]?.label || s}</Tag>
      ),
    },
    { title: "Người thuê", dataIndex: "renter_name", key: "renter_name" },
    { title: "Xe", dataIndex: "vehicle_model_name", key: "vehicle_model_name" },
    { title: "Chi nhánh", dataIndex: "handover_branch_name", key: "handover_branch_name" },
    {
      title: "Ngày xảy ra",
      dataIndex: "incident_date",
      key: "incident_date",
      render: (d: string) => dayjs(d).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_: any, record: any) => (
        <Button type="link" onClick={() => { setSelectedClaim(record); setModalOpen(true); }}>
          Xem chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Sự cố & Bảo hiểm</h2>

      <Space className="mb-4">
        <Select
          value={filterStatus}
          onChange={setFilterStatus}
          style={{ width: 180 }}
          options={[
            { label: "Tất cả trạng thái", value: "all" },
            { label: "Đã báo cáo", value: "Reported" },
            { label: "Đang xử lý", value: "Processing" },
            { label: "Hoàn tất", value: "Completed" },
            { label: "Từ chối", value: "Rejected" },
          ]}
        />
      </Space>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={filteredClaims}
        loading={loading}
        pagination={{ pageSize: 6 }}
      />

     {selectedClaim && (
  <Modal
    title={`Chi tiết sự cố - ${selectedClaim.id}`}
    open={modalOpen}
    onCancel={() => setModalOpen(false)}
    footer={null}
    width={850}
  >
   <div className="overflow-x-auto">
  <table className="min-w-full border border-gray-200 rounded-xl text-sm shadow-sm">
    <tbody>
      {/* Hàng 1 */}
      <tr className="border-b hover:bg-gray-50 transition">
        <td className="font-semibold bg-gray-50 p-3 w-1/4 text-gray-600">Trạng thái</td>
        <td className="p-3 w-1/4">
          <Tag color={statusMap[selectedClaim.status]?.color}>
            {statusMap[selectedClaim.status]?.label}
          </Tag>
        </td>
        <td className="font-semibold bg-gray-50 p-3 w-1/4 text-gray-600">Mức độ</td>
        <td className="p-3">{selectedClaim.severity}</td>
      </tr>

      {/* Hàng 2 */}
      <tr className="border-b hover:bg-gray-50 transition">
        <td className="font-semibold bg-gray-50 p-3 text-gray-600">Ngày xảy ra</td>
        <td className="p-3">
          {dayjs(selectedClaim.incident_date).format("DD/MM/YYYY HH:mm")}
        </td>
        <td className="font-semibold bg-gray-50 p-3 text-gray-600">Địa điểm</td>
        <td className="p-3">{selectedClaim.incident_location}</td>
      </tr>

    
      {/* Người thuê */}
      <tr className="border-b hover:bg-gray-50 transition">
        <td className="font-semibold bg-gray-50 p-3 text-gray-600">Người thuê</td>
        <td className="p-3">{selectedClaim.renter_name}</td>
        <td className="font-semibold bg-gray-50 p-3 text-gray-600">SĐT</td>
        <td className="p-3">{selectedClaim.renter_phone}</td>
      </tr>

      {/* Xe */}
      <tr className="border-b hover:bg-gray-50 transition">
        <td className="font-semibold bg-gray-50 p-3 text-gray-600">Xe</td>
        <td className="p-3">{selectedClaim.vehicle_model_name}</td>
        <td className="font-semibold bg-gray-50 p-3 text-gray-600">Biển số</td>
        <td className="p-3">{selectedClaim.license_plate}</td>
      </tr>

      {/* Chi nhánh / Gói */}
      <tr className="border-b hover:bg-gray-50 transition">
        <td className="font-semibold bg-gray-50 p-3 text-gray-600">Chi nhánh giao</td>
        <td className="p-3">{selectedClaim.handover_branch_name}</td>
        <td className="font-semibold bg-gray-50 p-3 text-gray-600">Gói bảo hiểm</td>
        <td className="p-3">{selectedClaim.package_name}</td>
      </tr>

      {/* Phí / Thiệt hại */}
      <tr className="border-b hover:bg-gray-50 transition">
        <td className="font-semibold bg-gray-50 p-3 text-gray-600">Phí gói</td>
        <td className="p-3">{selectedClaim.package_fee.toLocaleString()}₫</td>
        <td className="font-semibold bg-gray-50 p-3 text-gray-600">Tổng thiệt hại</td>
        <td className="p-3">
          {selectedClaim.settlement?.total_cost
            ? selectedClaim.settlement.total_cost.toLocaleString()
            : "-"}
          ₫
        </td>
      </tr>

      {/* Bảo hiểm / Khách chịu */}
      <tr>
        <td className="font-semibold bg-gray-50 p-3 text-gray-600">Bảo hiểm chi trả</td>
        <td className="p-3">
          {selectedClaim.settlement?.insurance_coverage_amount
            ? selectedClaim.settlement.insurance_coverage_amount.toLocaleString()
            : "-"}
          ₫
        </td>
        <td className="font-semibold bg-gray-50 p-3 text-gray-600">Khách chịu</td>
        <td className="p-3">
          {selectedClaim.settlement?.renter_liability_amount
            ? selectedClaim.settlement.renter_liability_amount.toLocaleString()
            : "-"}
          ₫
        </td>
      </tr>
      {/* Mô tả */}
      <tr className="border-b hover:bg-gray-50 transition">
        <td className="font-semibold bg-gray-50 p-3 text-gray-600">Mô tả</td>
        <td className="p-3" colSpan={3}>
          {selectedClaim.description}
        </td>
      </tr>
    </tbody>
  </table>
</div>

{/* Hình ảnh */}
<div className="mt-5">
  <h4 className="font-semibold mb-2 text-gray-700">Hình ảnh hiện trường:</h4>
  <div className="flex gap-3 flex-wrap">
    {selectedClaim.incident_images?.map((url: string, idx: number) => (
      <div
        key={idx}
        className="border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition"
      >
        <Image width={130} src={url} />
      </div>
    ))}
  </div>
</div>

  </Modal>
)}

    </div>
  );
}
