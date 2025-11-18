"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Form, Input, DatePicker, Upload, Button, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

export default function InsuranceCreatePage() {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

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
          label="BookingId"
          name="BookingId"
          rules={[{ required: true, message: "Vui lòng nhập BookingId" }]}
        >
          <Input placeholder="Nhập BookingId liên quan đến sự cố" />
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


