"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  Button,
  Card,
  Col,
  Descriptions,
  Row,
  Spin,
  Tag,
  Typography,
  Space,
} from "antd";
import dayjs from "dayjs";

import { getBookingById } from "../booking_service";

const statusMap: Record<string, { label: string; color: string }> = {
  active: { label: "Đang hoạt động", color: "green" },
  "handover-pending": { label: "Chờ giao xe", color: "orange" },
  "return-inspection": { label: "Kiểm tra trả xe", color: "blue" },
  completed: { label: "Hoàn thành", color: "default" },
  cancelled: { label: "Đã hủy", color: "red" },
  pending: { label: "Chờ xử lý", color: "orange" },
  Active: { label: "Đang hoạt động", color: "green" },
  "Handover-Pending": { label: "Chờ giao xe", color: "orange" },
  "Return-Inspection": { label: "Kiểm tra trả xe", color: "blue" },
  Completed: { label: "Hoàn thành", color: "default" },
  Cancelled: { label: "Đã hủy", color: "red" },
  Pending: { label: "Chờ xử lý", color: "orange" },
};

const { Title, Text } = Typography;

const formatCurrency = (amount?: number | null) => {
  if (!amount) return "0 đ";
  return `${amount.toLocaleString("vi-VN")} đ`;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "N/A";
  return dayjs(value).format("DD/MM/YYYY HH:mm");
};

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      loadBooking();
    }
  }, [params.id]);

  const loadBooking = async () => {
    try {
      setLoading(true);
      const data = await getBookingById(params.id as string);
      setBooking(data);
    } catch (err) {
      console.error("Error loading booking detail:", err);
      setBooking(null);
    } finally {
      setLoading(false);
    }
  };

  const statusInfo = useMemo(() => {
    if (!booking) {
      return { label: "N/A", color: "default" };
    }
    return (
      statusMap[booking.bookingStatus || booking.status || ""] || {
        label: booking.bookingStatus || booking.status || "N/A",
        color: "default",
      }
    );
  }, [booking]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spin size="large" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="p-6">
        <Button
          icon={<ArrowLeft />}
          onClick={() => router.back()}
          className="mb-4"
        >
          Quay lại
        </Button>
        <div className="text-center text-gray-500">
          Không tìm thấy thông tin booking
        </div>
      </div>
    );
  }

  const descriptionProps = {
    column: 1 as const,
    bordered: true,
    size: "middle" as const,
    labelStyle: { width: 170, fontWeight: 500, background: "#fafafa" },
    contentStyle: { fontWeight: 600 },
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Button
          shape="circle"
          icon={<ArrowLeft />}
          onClick={() => router.back()}
        />
        <div className="flex-1 min-w-[220px]">
          <Title level={3} className="!mb-1">
            Booking {booking.bookingCode || booking.id}
          </Title>
          <Space size="middle" wrap>
            <Tag color={statusInfo.color} className="px-4 py-1 text-base">
              {statusInfo.label}
            </Tag>
            <Text type="secondary">
              Mã tham chiếu:{" "}
              <span className="font-mono">
                {booking.id || booking.bookingCode}
              </span>
            </Text>
          </Space>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title="Thông tin chung"
            className="shadow-sm h-full"
            bodyStyle={{ padding: 0 }}
          >
            <Descriptions {...descriptionProps}>
              <Descriptions.Item label="Mã Booking">
                <span className="font-mono">
                  {booking.bookingCode || booking.id || "N/A"}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày bắt đầu">
                {formatDateTime(booking.startDatetime)}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày kết thúc">
                {formatDateTime(booking.endDatetime)}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày trả thực tế">
                {formatDateTime(booking.actualReturnDatetime)}
              </Descriptions.Item>
              <Descriptions.Item label="Gói thuê">
                {booking.rentalDays
                  ? `${booking.rentalDays} ngày`
                  : booking.rentalHours
                  ? `${booking.rentalHours} giờ`
                  : "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Tiền cọc">
                {formatCurrency(booking.depositAmount)}
              </Descriptions.Item>
              <Descriptions.Item label="Tổng phí thuê">
                {formatCurrency(booking.totalRentalFee || booking.baseRentalFee)}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title="Thông tin khách thuê"
            className="shadow-sm h-full"
            bodyStyle={{ padding: 0 }}
          >
            <Descriptions {...descriptionProps}>
              <Descriptions.Item label="Họ tên">
                {booking.renter?.account?.fullname ||
                  booking.renter?.fullName ||
                  "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {booking.renter?.email || booking.renter?.account?.username || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">
                {booking.renter?.phone || booking.renter?.phoneNumber || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ">
                {booking.renter?.address || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày sinh">
                {booking.renter?.dateOfBirth
                  ? dayjs(booking.renter.dateOfBirth).format("DD/MM/YYYY")
                  : "N/A"}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title="Xe & Model"
            className="shadow-sm h-full"
            bodyStyle={{ padding: 0 }}
          >
            <Descriptions {...descriptionProps}>
              <Descriptions.Item label="Model">
                {booking.vehicleModel?.modelName || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Phân loại">
                {booking.vehicleModel?.category || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Xe được gán">
                {booking.vehicle?.licensePlate ||
                  booking.vehicle?.vehicleId ||
                  "Chưa gán"}
              </Descriptions.Item>
              <Descriptions.Item label="Chi nhánh giao">
                {booking.handoverBranch?.branchName || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ chi nhánh">
                {booking.handoverBranch?.address || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Chi nhánh trả">
                {booking.returnBranch?.branchName || "Chưa xác định"}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title="Bảo hiểm & thanh toán"
            className="shadow-sm h-full"
            bodyStyle={{ padding: 0 }}
          >
            <Descriptions {...descriptionProps}>
              <Descriptions.Item label="Gói bảo hiểm">
                {booking.insurancePackage?.packageName || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Phí bảo hiểm">
                {formatCurrency(booking.insurancePackage?.packageFee)}
              </Descriptions.Item>
              <Descriptions.Item label="Tiền phải thu">
                {formatCurrency(booking.totalAmount || booking.totalRentalFee)}
              </Descriptions.Item>
              <Descriptions.Item label="Biên lai">
                {Array.isArray(booking.rentalReceipt) &&
                booking.rentalReceipt.length > 0
                  ? `${booking.rentalReceipt.length} biên lai`
                  : "Chưa có"}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </div>
  );
}


