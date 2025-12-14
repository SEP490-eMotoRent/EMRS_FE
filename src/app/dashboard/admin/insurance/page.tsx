"use client";

import React, { useEffect, useState } from "react";
import { Table, Tag, Button, Select, Space, Modal, Descriptions, Image, message } from "antd";
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
  const [detailLoading, setDetailLoading] = useState(false);

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

  const handleViewDetail = async (claim: any) => {
    setDetailLoading(true);
    setModalOpen(true);
    try {
      const detail = await getInsuranceClaimById(claim.id);
      setSelectedClaim(detail);
    } catch (err: any) {
      message.error("Không thể tải chi tiết sự cố: " + (err.message || "Lỗi không xác định"));
      setSelectedClaim(claim); // Fallback to list data
    } finally {
      setDetailLoading(false);
    }
  };

  const columns = [
    { 
      title: "Mã sự cố", 
      dataIndex: "id", 
      key: "id",
      render: (id: string) => id?.substring(0, 8) + "..." || id
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (s: string) => (
        <Tag color={statusMap[s]?.color}>{statusMap[s]?.label || s}</Tag>
      ),
    },
    { 
      title: "Người thuê", 
      dataIndex: "renterName", 
      key: "renterName" 
    },
    { 
      title: "Xe", 
      dataIndex: "vehicleModelName", 
      key: "vehicleModelName" 
    },
    { 
      title: "Biển số", 
      dataIndex: "licensePlate", 
      key: "licensePlate" 
    },
    { 
      title: "Chi nhánh", 
      dataIndex: "handoverBranchName", 
      key: "handoverBranchName" 
    },
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
        <Button type="link" onClick={() => handleViewDetail(record)}>
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
    title={`Chi tiết sự cố - ${selectedClaim.id?.substring(0, 8)}...`}
    open={modalOpen}
    onCancel={() => {
      setModalOpen(false);
      setSelectedClaim(null);
    }}
    footer={null}
    width={900}
    confirmLoading={detailLoading}
  >
    {detailLoading ? (
      <div className="text-center py-8">Đang tải...</div>
    ) : (
      <>
   <div className="overflow-x-auto">
  <table className="min-w-full border border-gray-200 rounded-xl text-sm shadow-sm">
    <tbody>
      {/* Hàng 1 - Trạng thái và Ngày xảy ra */}
      <tr className="border-b hover:bg-gray-50 transition">
        <td className="font-semibold bg-gray-50 p-3 w-1/4 text-gray-600">Trạng thái</td>
        <td className="p-3 w-1/4">
          <Tag color={statusMap[selectedClaim.status]?.color}>
            {statusMap[selectedClaim.status]?.label || selectedClaim.status}
          </Tag>
        </td>
        <td className="font-semibold bg-gray-50 p-3 w-1/4 text-gray-600">Ngày xảy ra</td>
        <td className="p-3">
          {selectedClaim.incidentDate 
            ? dayjs(selectedClaim.incidentDate).format("DD/MM/YYYY HH:mm")
            : "-"}
        </td>
      </tr>

      {/* Hàng 2 - Địa điểm và Ngày tạo */}
      <tr className="border-b hover:bg-gray-50 transition">
        <td className="font-semibold bg-gray-50 p-3 text-gray-600">Địa điểm xảy ra</td>
        <td className="p-3" colSpan={3}>{selectedClaim.incidentLocation || "-"}</td>
      </tr>

      {/* Mô tả */}
      {selectedClaim.description && (
        <tr className="border-b hover:bg-gray-50 transition">
          <td className="font-semibold bg-gray-50 p-3 text-gray-600">Mô tả sự cố</td>
          <td className="p-3" colSpan={3}>{selectedClaim.description}</td>
        </tr>
      )}

      {/* Người thuê */}
      <tr className="border-b hover:bg-gray-50 transition">
        <td className="font-semibold bg-gray-50 p-3 text-gray-600">Người thuê</td>
        <td className="p-3">{selectedClaim.renterName || "-"}</td>
        <td className="font-semibold bg-gray-50 p-3 text-gray-600">SĐT</td>
        <td className="p-3">{selectedClaim.renterPhone || "-"}</td>
      </tr>

      {/* Email và Địa chỉ */}
      {(selectedClaim.renterEmail || selectedClaim.address) && (
        <tr className="border-b hover:bg-gray-50 transition">
          <td className="font-semibold bg-gray-50 p-3 text-gray-600">Email</td>
          <td className="p-3">{selectedClaim.renterEmail || "-"}</td>
          <td className="font-semibold bg-gray-50 p-3 text-gray-600">Địa chỉ</td>
          <td className="p-3">{selectedClaim.address || "-"}</td>
        </tr>
      )}

      {/* Xe */}
      <tr className="border-b hover:bg-gray-50 transition">
        <td className="font-semibold bg-gray-50 p-3 text-gray-600">Model xe</td>
        <td className="p-3">{selectedClaim.vehicleModelName || "-"}</td>
        <td className="font-semibold bg-gray-50 p-3 text-gray-600">Biển số</td>
        <td className="p-3">{selectedClaim.licensePlate || "-"}</td>
      </tr>

      {/* Mô tả xe */}
      {selectedClaim.vehicleDescription && (
        <tr className="border-b hover:bg-gray-50 transition">
          <td className="font-semibold bg-gray-50 p-3 text-gray-600">Mô tả xe</td>
          <td className="p-3" colSpan={3}>{selectedClaim.vehicleDescription}</td>
        </tr>
      )}

      {/* Chi nhánh */}
      <tr className="border-b hover:bg-gray-50 transition">
        <td className="font-semibold bg-gray-50 p-3 text-gray-600">Chi nhánh giao</td>
        <td className="p-3">{selectedClaim.handoverBranchName || "-"}</td>
        <td className="font-semibold bg-gray-50 p-3 text-gray-600">Địa chỉ chi nhánh</td>
        <td className="p-3">{selectedClaim.handoverBranchAddress || "-"}</td>
      </tr>

      {/* Booking */}
      {selectedClaim.bookingId && (
        <tr className="border-b hover:bg-gray-50 transition">
          <td className="font-semibold bg-gray-50 p-3 text-gray-600">Mã booking</td>
          <td className="p-3">{selectedClaim.bookingId}</td>
          <td className="font-semibold bg-gray-50 p-3 text-gray-600">Ngày tạo</td>
          <td className="p-3">
            {selectedClaim.createdAt 
              ? dayjs(selectedClaim.createdAt).format("DD/MM/YYYY HH:mm")
              : "-"}
          </td>
        </tr>
      )}

      {/* Thời gian booking */}
      {(selectedClaim.bookingStartDate || selectedClaim.bookingEndDate) && (
        <tr className="border-b hover:bg-gray-50 transition">
          <td className="font-semibold bg-gray-50 p-3 text-gray-600">Ngày bắt đầu thuê</td>
          <td className="p-3">
            {selectedClaim.bookingStartDate 
              ? dayjs(selectedClaim.bookingStartDate).format("DD/MM/YYYY HH:mm")
              : "-"}
          </td>
          <td className="font-semibold bg-gray-50 p-3 text-gray-600">Ngày kết thúc thuê</td>
          <td className="p-3">
            {selectedClaim.bookingEndDate 
              ? dayjs(selectedClaim.bookingEndDate).format("DD/MM/YYYY HH:mm")
              : "-"}
          </td>
        </tr>
      )}

      {/* Gói bảo hiểm */}
      {selectedClaim.packageName && (
        <tr className="border-b hover:bg-gray-50 transition">
          <td className="font-semibold bg-gray-50 p-3 text-gray-600">Gói bảo hiểm</td>
          <td className="p-3">{selectedClaim.packageName}</td>
          <td className="font-semibold bg-gray-50 p-3 text-gray-600">Phí gói</td>
          <td className="p-3">
            {selectedClaim.packageFee 
              ? selectedClaim.packageFee.toLocaleString("vi-VN") + "₫"
              : "-"}
          </td>
        </tr>
      )}

      {/* Chi tiết bảo hiểm */}
      {(selectedClaim.coveragePersonLimit || selectedClaim.coveragePropertyLimit || selectedClaim.coverageVehiclePercentage) && (
        <tr className="border-b hover:bg-gray-50 transition">
          <td className="font-semibold bg-gray-50 p-3 text-gray-600">Giới hạn bảo hiểm người</td>
          <td className="p-3">
            {selectedClaim.coveragePersonLimit 
              ? selectedClaim.coveragePersonLimit.toLocaleString("vi-VN") + "₫"
              : "-"}
          </td>
          <td className="font-semibold bg-gray-50 p-3 text-gray-600">Giới hạn bảo hiểm tài sản</td>
          <td className="p-3">
            {selectedClaim.coveragePropertyLimit 
              ? selectedClaim.coveragePropertyLimit.toLocaleString("vi-VN") + "₫"
              : "-"}
          </td>
        </tr>
      )}

      {/* Tỷ lệ bảo hiểm xe và Khấu trừ */}
      {(selectedClaim.coverageVehiclePercentage || selectedClaim.deductibleAmount) && (
        <tr className="border-b hover:bg-gray-50 transition">
          <td className="font-semibold bg-gray-50 p-3 text-gray-600">Tỷ lệ bảo hiểm xe</td>
          <td className="p-3">
            {selectedClaim.coverageVehiclePercentage 
              ? selectedClaim.coverageVehiclePercentage + "%"
              : "-"}
          </td>
          <td className="font-semibold bg-gray-50 p-3 text-gray-600">Số tiền khấu trừ</td>
          <td className="p-3">
            {selectedClaim.deductibleAmount 
              ? selectedClaim.deductibleAmount.toLocaleString("vi-VN") + "₫"
              : "-"}
          </td>
        </tr>
      )}

      {/* Bảo hiểm trộm cắp */}
      {selectedClaim.coverageTheft !== undefined && (
        <tr className="border-b hover:bg-gray-50 transition">
          <td className="font-semibold bg-gray-50 p-3 text-gray-600">Bảo hiểm trộm cắp</td>
          <td className="p-3" colSpan={3}>
            {selectedClaim.coverageTheft === 1 ? "Có" : "Không"}
          </td>
        </tr>
      )}

      {/* Mô tả bảo hiểm */}
      {selectedClaim.insuranceDescription && (
        <tr className="border-b hover:bg-gray-50 transition">
          <td className="font-semibold bg-gray-50 p-3 text-gray-600">Mô tả gói bảo hiểm</td>
          <td className="p-3" colSpan={3}>{selectedClaim.insuranceDescription}</td>
        </tr>
      )}
    </tbody>
  </table>
</div>

{/* Hình ảnh */}
{selectedClaim.incidentImages && selectedClaim.incidentImages.length > 0 && (
  <div className="mt-5">
    <h4 className="font-semibold mb-2 text-gray-700">Hình ảnh hiện trường:</h4>
    <div className="flex gap-3 flex-wrap">
      {selectedClaim.incidentImages.map((url: string, idx: number) => (
        <div
          key={idx}
          className="border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition"
        >
          <Image width={150} src={url} alt={`Hình ảnh ${idx + 1}`} />
        </div>
      ))}
    </div>
  </div>
)}
      </>
    )}
  </Modal>
)}

    </div>
  );
}
