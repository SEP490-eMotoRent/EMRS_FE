"use client";

import React, { useEffect, useState } from "react";
import { Table, Tag, Button, Select, Space, Modal, Descriptions, Image } from "antd";
import { getInsuranceClaims, getInsuranceClaimById } from "./insurance_service";
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
    { title: "Người thuê", dataIndex: "renterName", key: "renterName" },
    { title: "Xe", dataIndex: "vehicleModelName", key: "vehicleModelName" },
    { title: "Chi nhánh", dataIndex: "handoverBranchName", key: "handoverBranchName" },
    {
      title: "Ngày xảy ra",
      dataIndex: "incidentDate",
      key: "incidentDate",
      render: (d: string) => d ? dayjs(d).format("DD/MM/YYYY HH:mm") : "-",
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_: any, record: any) => (
        <Button 
          type="link" 
          onClick={async () => {
            try {
              // Fetch full details when clicking
              const detail = await getInsuranceClaimById(record.id);
              setSelectedClaim(detail);
              setModalOpen(true);
            } catch (err) {
              console.error("Error loading claim details:", err);
              // Fallback to list data if detail fetch fails
              setSelectedClaim(record);
              setModalOpen(true);
            }
          }}
        >
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
        <td className="p-3">{selectedClaim.severity || "-"}</td>
      </tr>

      {/* Hàng 2 */}
      <tr className="border-b hover:bg-gray-50 transition">
        <td className="font-semibold bg-gray-50 p-3 text-gray-600">Ngày xảy ra</td>
        <td className="p-3">
          {selectedClaim.incidentDate ? dayjs(selectedClaim.incidentDate).format("DD/MM/YYYY HH:mm") : "-"}
        </td>
        <td className="font-semibold bg-gray-50 p-3 text-gray-600">Địa điểm</td>
        <td className="p-3">{selectedClaim.incidentLocation || "-"}</td>
      </tr>

    
      {/* Người thuê */}
      <tr className="border-b hover:bg-gray-50 transition">
        <td className="font-semibold bg-gray-50 p-3 text-gray-600">Người thuê</td>
        <td className="p-3">{selectedClaim.renterName || "-"}</td>
        <td className="font-semibold bg-gray-50 p-3 text-gray-600">SĐT</td>
        <td className="p-3">{selectedClaim.renterPhone || "-"}</td>
      </tr>

      {/* Xe */}
      <tr className="border-b hover:bg-gray-50 transition">
        <td className="font-semibold bg-gray-50 p-3 text-gray-600">Xe</td>
        <td className="p-3">{selectedClaim.vehicleModelName || "-"}</td>
        <td className="font-semibold bg-gray-50 p-3 text-gray-600">Biển số</td>
        <td className="p-3">{selectedClaim.licensePlate || "-"}</td>
      </tr>

      {/* Chi nhánh / Gói */}
      <tr className="border-b hover:bg-gray-50 transition">
        <td className="font-semibold bg-gray-50 p-3 text-gray-600">Chi nhánh giao</td>
        <td className="p-3">{selectedClaim.handoverBranchName || "-"}</td>
        <td className="font-semibold bg-gray-50 p-3 text-gray-600">Gói bảo hiểm</td>
        <td className="p-3">{selectedClaim.packageName || "-"}</td>
      </tr>

      {/* Phí / Thiệt hại */}
      <tr className="border-b hover:bg-gray-50 transition">
        <td className="font-semibold bg-gray-50 p-3 text-gray-600">Phí gói</td>
        <td className="p-3">
          {selectedClaim.packageFee != null && typeof selectedClaim.packageFee === 'number'
            ? selectedClaim.packageFee.toLocaleString()
            : "-"}
          ₫
        </td>
        <td className="font-semibold bg-gray-50 p-3 text-gray-600">Tổng thiệt hại</td>
        <td className="p-3">
          {selectedClaim.totalCost != null && typeof selectedClaim.totalCost === 'number'
            ? selectedClaim.totalCost.toLocaleString()
            : "-"}
          ₫
        </td>
      </tr>

      {/* Bảo hiểm / Khách chịu */}
      <tr>
        <td className="font-semibold bg-gray-50 p-3 text-gray-600">Bảo hiểm chi trả</td>
        <td className="p-3">
          {selectedClaim.insuranceCoverageAmount != null && typeof selectedClaim.insuranceCoverageAmount === 'number'
            ? selectedClaim.insuranceCoverageAmount.toLocaleString()
            : "-"}
          ₫
        </td>
        <td className="font-semibold bg-gray-50 p-3 text-gray-600">Khách chịu</td>
        <td className="p-3">
          {selectedClaim.renterLiabilityAmount != null && typeof selectedClaim.renterLiabilityAmount === 'number'
            ? selectedClaim.renterLiabilityAmount.toLocaleString()
            : "-"}
          ₫
        </td>
      </tr>
      {/* Mô tả */}
      <tr className="border-b hover:bg-gray-50 transition">
        <td className="font-semibold bg-gray-50 p-3 text-gray-600">Mô tả</td>
        <td className="p-3" colSpan={3}>
          {selectedClaim.description || "-"}
        </td>
      </tr>
    </tbody>
  </table>
</div>

{/* Hình ảnh */}
<div className="mt-5">
  <h4 className="font-semibold mb-2 text-gray-700">Hình ảnh hiện trường:</h4>
  <div className="flex gap-3 flex-wrap">
    {selectedClaim.incidentImages && selectedClaim.incidentImages.length > 0 ? (
      selectedClaim.incidentImages.map((url: string, idx: number) => (
        <div
          key={idx}
          className="border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition"
        >
          <Image width={130} src={url} alt={`Incident image ${idx + 1}`} />
        </div>
      ))
    ) : (
      <p className="text-gray-500">Không có hình ảnh</p>
    )}
  </div>
</div>

  </Modal>
)}

    </div>
  );
}
