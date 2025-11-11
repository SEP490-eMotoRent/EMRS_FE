"use client";
import React, { useState } from "react";
import { Modal, Form, Input, Select, Upload, Button, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";

export default function ClaimUpdateForm({ open, onClose, onSubmit, data }: any) {
  const [form] = Form.useForm();
  const [status, setStatus] = useState(data?.status ?? "Reported");

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const files =
        form
          .getFieldValue("AdditionalImageFiles")
          ?.fileList?.map((f: any) => f.originFileObj) || [];

      // ⚠️ Nếu chọn Rejected mà không có lý do => chặn
      if (values.Status === "Rejected" && !values.RejectionReason) {
        return message.warning("Vui lòng nhập lý do từ chối!");
      }

      await onSubmit({
        id: data?.id,
        Description: values.Description,
        IncidentLocation: values.IncidentLocation,
        Severity: values.Severity,
        Status: values.Status,
        Notes: values.Notes,
        RejectionReason: values.RejectionReason || "",
        AdditionalImageFiles: files,
      });

      form.resetFields();
    } catch {
      message.error("Vui lòng điền đầy đủ thông tin!");
    }
  };

  return (
    <Modal
      title="Chỉnh sửa hồ sơ bảo hiểm"
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okText="Lưu thay đổi"
      cancelText="Hủy"
      width={700}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          Description: data?.description,
          IncidentLocation: data?.incidentLocation,
          Severity: "Moderate",
          Status: data?.status,
          Notes: "",
        }}
      >
        <Form.Item label="Mô tả sự cố" name="Description">
          <Input.TextArea rows={3} />
        </Form.Item>

        <Form.Item label="Địa điểm" name="IncidentLocation">
          <Input />
        </Form.Item>

        <Form.Item label="Mức độ nghiêm trọng" name="Severity">
          <Select>
            <Select.Option value="Minor">Nhẹ</Select.Option>
            <Select.Option value="Moderate">Trung bình</Select.Option>
            <Select.Option value="Severe">Nghiêm trọng</Select.Option>
            <Select.Option value="Critical">Rất nghiêm trọng</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item label="Trạng thái hồ sơ" name="Status">
          <Select onChange={(v) => setStatus(v)}>
            <Select.Option value="Reported">Đã báo cáo</Select.Option>
            <Select.Option value="Processing">Đang xử lý</Select.Option>
            <Select.Option value="Rejected">Từ chối</Select.Option>
          </Select>
        </Form.Item>

        {/* 🔸 Chỉ hiện khi chọn “Rejected” */}
        {status === "Rejected" && (
          <Form.Item label="Lý do từ chối" name="RejectionReason">
            <Input.TextArea rows={2} placeholder="Nhập lý do từ chối..." />
          </Form.Item>
        )}

        <Form.Item label="Ghi chú" name="Notes">
          <Input.TextArea rows={2} />
        </Form.Item>

        <Form.Item label="Ảnh minh chứng" name="AdditionalImageFiles">
          <Upload multiple beforeUpload={() => false}>
            <Button icon={<UploadOutlined />}>Tải ảnh lên</Button>
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
}
