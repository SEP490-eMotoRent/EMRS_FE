"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Form,
  Input,
  DatePicker,
  Upload,
  Button,
  message,
  Select,
  Spin,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

import {
  getBookingsByBranch,
  getBookingById,
} from "../../bookings/booking_service";

export default function InsuranceCreatePage() {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoadingBookings(true);
      const list = await getBookingsByBranch(undefined, {
        PageSize: 100,
        orderByDescending: true,
      });
      const withDetail = await Promise.all(
        list.map(async (booking: any) => {
          const id = booking.id || booking.bookingId || booking.bookingCode;
          if (!id) return booking;
          try {
            const detail = await getBookingById(id);
            return { ...booking, ...detail };
          } catch (err) {
            console.warn("Không thể lấy chi tiết booking", id, err);
            return booking;
          }
        })
      );
      const allowedStatuses = new Set(["pending", "rending"]);
      const filtered = withDetail.filter((item) => {
        const status = (item.bookingStatus || item.status || "").toLowerCase();
        return allowedStatuses.has(status);
      });

      setBookings(filtered);
    } catch (err) {
      console.error("Không thể tải bookings cho bảo hiểm:", err);
      message.error("Không thể tải danh sách booking");
    } finally {
      setLoadingBookings(false);
    }
  };

  const bookingOptions = useMemo(
    () =>
      bookings.map((b) => {
        const name =
          b.renter?.account?.fullname ||
          b.renter?.fullName ||
          b.renterName ||
          "Khách";
        const status = b.bookingStatus || b.status || "";
        const model =
          b.vehicleModel?.modelName || b.vehicleModelName || "N/A";
        return {
          label: `${b.bookingCode || b.id} • ${name} • ${model}`,
          value: b.id || b.bookingId || b.bookingCode,
          status,
          name,
          model,
          start: b.startDatetime,
        };
      }),
    [bookings]
  );

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const formData = new FormData();
      formData.append("BookingId", values.BookingId);
      formData.append(
        "IncidentDate",
        values.IncidentDate
          ? (values.IncidentDate as dayjs.Dayjs).toISOString()
          : ""
      );
      formData.append("IncidentLocation", values.IncidentLocation || "");
      formData.append("Description", values.Description || "");

      const files =
        form
          .getFieldValue("IncidentImageFiles")
          ?.fileList?.map((f: any) => f.originFileObj) || [];

      files.forEach((file: File) => {
        formData.append("IncidentImageFiles", file);
      });

      const res = await fetch("/api/insurance-claim/create", {
        method: "POST",
        body: formData,
      });

      const text = await res.text();
      let json: any = null;
      try {
        json = JSON.parse(text);
      } catch {
        // ignore, BE có thể trả plain text
      }

      if (!res.ok || json?.success === false) {
        message.error(json?.message || "Tạo hồ sơ bảo hiểm thất bại");
        return;
      }

      message.success("Đã tạo hồ sơ bảo hiểm thành công");
      router.push("/dashboard/manager/insurance");
    } catch (err: any) {
      if (err?.errorFields) {
        message.warning("Vui lòng điền đầy đủ thông tin bắt buộc");
      } else {
        console.error(err);
        message.error("Có lỗi xảy ra, vui lòng thử lại");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
      <h1 className="text-2xl font-semibold mb-4">
        Báo cáo sự cố bảo hiểm mới
      </h1>

      <Form form={form} layout="vertical">
        <Form.Item
          label="Booking"
          name="BookingId"
          rules={[{ required: true, message: "Vui lòng chọn Booking" }]}
        >
          <Select
            showSearch
            placeholder="Chọn booking liên quan"
            loading={loadingBookings}
            optionFilterProp="label"
            filterOption={(input, option) =>
              (option?.label as string)
                ?.toLowerCase()
                .includes(input.toLowerCase())
            }
            notFoundContent={
              loadingBookings ? <Spin size="small" /> : "Không có booking"
            }
          >
            {bookingOptions.map((opt) => (
              <Select.Option key={opt.value} value={opt.value} label={opt.label}>
                <div className="flex flex-col">
                  <span className="font-semibold">
                    {opt.label.split("•")[0]}
                  </span>
                  <span className="text-sm text-gray-500">
                    {opt.name} • {opt.model}
                  </span>
                  <span className="text-xs text-gray-400">
                    {opt.start
                      ? dayjs(opt.start).format("DD/MM/YYYY HH:mm")
                      : ""}
                  </span>
                </div>
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Ngày xảy ra sự cố"
          name="IncidentDate"
          rules={[{ required: true, message: "Vui lòng chọn ngày sự cố" }]}
        >
          <DatePicker
            showTime
            format="DD/MM/YYYY HH:mm"
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Form.Item
          label="Địa điểm xảy ra"
          name="IncidentLocation"
          rules={[{ required: true, message: "Vui lòng nhập địa điểm" }]}
        >
          <Input placeholder="Ví dụ: Quận 1, TP.HCM" />
        </Form.Item>

        <Form.Item
          label="Mô tả sự cố"
          name="Description"
          rules={[{ required: true, message: "Vui lòng mô tả sự cố" }]}
        >
          <Input.TextArea rows={4} />
        </Form.Item>

        <Form.Item label="Hình ảnh hiện trường" name="IncidentImageFiles">
          <Upload multiple beforeUpload={() => false}>
            <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
          </Upload>
        </Form.Item>

        <div className="flex justify-end gap-3 mt-4">
          <Button onClick={() => router.push("/dashboard/manager/insurance")}>
            Hủy
          </Button>
          <Button
            type="primary"
            loading={submitting}
            onClick={handleSubmit}
          >
            Tạo hồ sơ
          </Button>
        </div>
      </Form>
    </div>
  );
}


