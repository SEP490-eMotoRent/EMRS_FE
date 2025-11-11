"use client";
import React from "react";
import { Modal, Form, InputNumber, Upload, Button, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";

export default function ClaimSettlementModal({
  open,
  id,
  onClose,
  onSuccess,
}: any) {
  const [form] = Form.useForm();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const pdfFile = form.getFieldValue("InsuranceClaimPdfFile")?.fileList?.[0]?.originFileObj;

      const data = {
        VehicleDamageCost: values.VehicleDamageCost,
        PersonInjuryCost: values.PersonInjuryCost || 0,
        ThirdPartyCost: values.ThirdPartyCost || 0,
        InsuranceCoverageAmount: values.InsuranceCoverageAmount,
        InsuranceClaimPdfFile: pdfFile || null,
      };

      const { settleClaim } = await import("@/app/dashboard/manager/insurance/insurance_service");
      const result = await settleClaim(id, data);

      if (result.success) {
        message.success("Đã hoàn tất quyết toán bảo hiểm!");
        onClose();
        onSuccess();
      } else {
        message.warning(result.message || "Không thể hoàn tất!");
      }
    } catch (err: any) {
      console.error(err);
      message.error("Vui lòng nhập đầy đủ thông tin!");
    }
  };

  return (
    <Modal
      open={open}
      title="Nhập kết quả bồi thường"
      onCancel={onClose}
      onOk={handleOk}
      okText="Xác nhận quyết toán"
      cancelText="Hủy"
      width={600}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Chi phí sửa chữa xe (VNĐ)"
          name="VehicleDamageCost"
          rules={[{ required: true, message: "Nhập chi phí sửa xe!" }]}
        >
          <InputNumber
            min={0}
            style={{ width: "100%" }}
            formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
          />
        </Form.Item>

        <Form.Item label="Chi phí y tế (VNĐ)" name="PersonInjuryCost">
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item label="Chi phí bên thứ ba (VNĐ)" name="ThirdPartyCost">
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          label="Số tiền bảo hiểm chi trả (VNĐ)"
          name="InsuranceCoverageAmount"
          rules={[{ required: true, message: "Nhập số tiền bảo hiểm!" }]}
        >
          <InputNumber
            min={0}
            style={{ width: "100%" }}
            formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
          />
        </Form.Item>

        <Form.Item label="Tệp PDF từ bảo hiểm" name="InsuranceClaimPdfFile">
          <Upload accept=".pdf" beforeUpload={() => false}>
            <Button icon={<UploadOutlined />}>Tải tệp lên</Button>
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
}
