"use client";
import React from "react";
import { Modal, Descriptions, Tag, Button, Image, Divider } from "antd";
import dayjs from "dayjs";

interface Props {
  open: boolean;
  data: any;
  onClose: () => void;
  onApprove: (id: string) => void;
  onSettlement: (id: string) => void;
  onEdit?: (data: any) => void;
}

const ClaimDetailModal: React.FC<Props> = ({
  open,
  data,
  onClose,
  onApprove,
  onSettlement,
  onEdit,
}) => {
  if (!data) return null;

  const statusMap: Record<string, { text: string; color: string }> = {
    Reported: { text: "Đã báo cáo", color: "orange" },
    Processing: { text: "Đang xử lý", color: "blue" },
    Settled: { text: "Đã quyết toán", color: "green" },
    Rejected: { text: "Từ chối", color: "red" },
  };

  const s = statusMap[data.status] || { text: data.status, color: "default" };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={<span className="text-lg font-semibold">🧾 Chi tiết hồ sơ bảo hiểm</span>}
      footer={null}
      width={900}
      bodyStyle={{ maxHeight: "80vh", overflowY: "auto" }}
    >
      {/* ====== 1️⃣ Thông tin người thuê ====== */}
      <Divider orientation="left">👤 Thông tin người thuê</Divider>
      <Descriptions bordered column={2} size="small" labelStyle={{ fontWeight: 600 }}>
        <Descriptions.Item label="Tên người thuê">{data.renterName}</Descriptions.Item>
        <Descriptions.Item label="Số điện thoại">{data.renterPhone}</Descriptions.Item>
        <Descriptions.Item label="Email">{data.renterEmail}</Descriptions.Item>
        <Descriptions.Item label="Địa chỉ">{data.address}</Descriptions.Item>
      </Descriptions>

      {/* ====== 2️⃣ Thông tin xe & hợp đồng ====== */}
      <Divider orientation="left">🚗 Thông tin xe & hợp đồng</Divider>
      <Descriptions bordered column={2} size="small" labelStyle={{ fontWeight: 600 }}>
        <Descriptions.Item label="Tên xe">{data.vehicleModelName}</Descriptions.Item>
        <Descriptions.Item label="Biển số">{data.licensePlate}</Descriptions.Item>
        <Descriptions.Item label="Mô tả xe" span={2}>
          {data.vehicleDescription}
        </Descriptions.Item>
        <Descriptions.Item label="Chi nhánh giao xe">{data.handoverBranchName}</Descriptions.Item>
        <Descriptions.Item label="Địa chỉ chi nhánh">{data.handoverBranchAddress}</Descriptions.Item>
        <Descriptions.Item label="Ngày thuê">
          {dayjs(data.bookingStartDate).format("DD/MM/YYYY HH:mm")}
        </Descriptions.Item>
        <Descriptions.Item label="Ngày trả dự kiến">
          {dayjs(data.bookingEndDate).format("DD/MM/YYYY HH:mm")}
        </Descriptions.Item>
      </Descriptions>

      {/* ====== 3️⃣ Thông tin bảo hiểm ====== */}
      <Divider orientation="left">🛡️ Gói bảo hiểm</Divider>
      <Descriptions bordered column={2} size="small" labelStyle={{ fontWeight: 600 }}>
        <Descriptions.Item label="Tên gói">{data.packageName}</Descriptions.Item>
        <Descriptions.Item label="Phí gói (VNĐ)">
          {data.packageFee?.toLocaleString("vi-VN")} đ
        </Descriptions.Item>
        <Descriptions.Item label="Bảo hiểm tai nạn cá nhân">
          {data.coveragePersonLimit?.toLocaleString("vi-VN")} đ
        </Descriptions.Item>
        <Descriptions.Item label="Bảo hiểm tài sản thiệt hại">
          {data.coveragePropertyLimit?.toLocaleString("vi-VN")} đ
        </Descriptions.Item>
        <Descriptions.Item label="Bảo hiểm vật chất xe (%)">
          {data.coverageVehiclePercentage}%
        </Descriptions.Item>
        <Descriptions.Item label="Bảo hiểm trộm cắp">
          {data.coverageTheft ? "Có" : "Không"}
        </Descriptions.Item>
        <Descriptions.Item label="Mức khấu trừ (VNĐ)">
          {data.deductibleAmount?.toLocaleString("vi-VN")} đ
        </Descriptions.Item>
        <Descriptions.Item label="Trạng thái hồ sơ">
          <Tag color={s.color}>{s.text}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Mô tả gói" span={2}>
          {data.insuranceDescription}
        </Descriptions.Item>
      </Descriptions>

      {/* ====== 4️⃣ Thông tin sự cố ====== */}
      <Divider orientation="left">⚠️ Chi tiết sự cố</Divider>
      <Descriptions bordered column={2} size="small" labelStyle={{ fontWeight: 600 }}>
        <Descriptions.Item label="Ngày sự cố">
          {dayjs(data.incidentDate).format("HH:mm:ss DD/MM/YYYY")}
        </Descriptions.Item>
        <Descriptions.Item label="Địa điểm">{data.incidentLocation}</Descriptions.Item>
        <Descriptions.Item label="Mô tả sự cố" span={2}>
          {data.description || "Không có mô tả"}
        </Descriptions.Item>
      </Descriptions>

      {/* ====== Ảnh minh chứng ====== */}
      {data.incidentImages?.length > 0 && (
        <div className="mt-4">
          <p className="font-semibold mb-2">📷 Hình ảnh minh chứng:</p>
          <div className="flex flex-wrap gap-3">
            {data.incidentImages.map((img: string, i: number) => (
              <Image
                key={i}
                src={img}
                alt={`incident_${i}`}
                width={180}
                height={120}
                className="rounded-md border shadow-sm object-cover"
              />
            ))}
          </div>
        </div>
      )}

      {/* ====== Hành động ====== */}
      <div className="flex justify-end mt-6 gap-3">
        <Button onClick={onClose}>Đóng</Button>
        {data.status === "Reported" && (
          <Button type="primary" onClick={() => onApprove(data.id)}>
            Duyệt hồ sơ
          </Button>
        )}
        {(data.status === "Reported" || data.status === "Processing") && (
          <Button danger onClick={() => onSettlement(data.id)}>
            Nhập kết quả bồi thường
          </Button>
        )}
<Button
  type="default"
  onClick={() => onEdit?.(data)} // ✅ dùng ?. để tránh lỗi
  style={{ marginLeft: 8 }}
>
  Chỉnh sửa hồ sơ
</Button>


      </div>
    </Modal>
  );
};

export default ClaimDetailModal;
