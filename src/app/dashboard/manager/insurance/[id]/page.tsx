"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Card,
  Descriptions,
  Button,
  message,
  Modal,
  Form,
  Input,
  Select,
  Upload,
  InputNumber,
  Space,
  Tag,
  Image,
  Divider,
  Spin,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  UploadOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getClaimById,
  updateClaim,
  settleClaim,
} from "../insurance_service";

const { TextArea } = Input;
const { Option } = Select;

type ClaimStatus = "Reported" | "Processing" | "Rejected" | "Completed";

export default function InsuranceClaimDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [form] = Form.useForm();
  const [settlementForm] = Form.useForm();
  const [claim, setClaim] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [settling, setSettling] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [settlementModalVisible, setSettlementModalVisible] = useState(false);

  const claimId = params?.id as string;

  useEffect(() => {
    if (claimId) {
      loadClaim();
    }
  }, [claimId]);

  const loadClaim = async () => {
    try {
      setLoading(true);
      const data = await getClaimById(claimId);
      setClaim(data);
      form.setFieldsValue({
        description: data.description,
        incidentLocation: data.incidentLocation,
        incidentDate: data.incidentDate ? dayjs(data.incidentDate) : null,
        severity: data.severity,
        notes: data.notes,
      });
    } catch (err: any) {
      console.error(err);
      message.error(err.message || "Không thể tải thông tin claim");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (values: any) => {
    try {
      setUpdating(true);
      const formData = new FormData();

      if (values.description) {
        formData.append("description", values.description);
      }
      if (values.incidentLocation) {
        formData.append("incidentLocation", values.incidentLocation);
      }
      if (values.incidentDate) {
        formData.append(
          "incidentDate",
          dayjs(values.incidentDate).toISOString()
        );
      }
      if (values.severity) {
        formData.append("severity", values.severity);
      }
      if (values.notes) {
        formData.append("notes", values.notes);
      }
      if (values.status) {
        formData.append("status", values.status);
        if (values.status === "Rejected" && !values.rejectionReason) {
          message.error("Vui lòng nhập lý do từ chối");
          return;
        }
      }
      if (values.rejectionReason) {
        formData.append("rejectionReason", values.rejectionReason);
      }

      // Thêm ảnh bổ sung
      const additionalImages =
        values.additionalImageFiles?.fileList?.map(
          (f: any) => f.originFileObj
        ) || [];
      additionalImages.forEach((file: File) => {
        formData.append("additionalImageFiles", file);
      });

      const result = await updateClaim(claimId, formData);
      message.success(
        result.message || "Cập nhật claim thành công"
      );
      setEditModalVisible(false);
      await loadClaim();
    } catch (err: any) {
      console.error(err);
      message.error(err.message || "Cập nhật claim thất bại");
    } finally {
      setUpdating(false);
    }
  };

  const handleApprove = () => {
    form.setFieldsValue({ status: "Processing" });
    Modal.confirm({
      title: "Xác nhận duyệt claim",
      content: "Bạn có chắc chắn muốn duyệt yêu cầu bảo hiểm này và chuyển sang trạng thái Đang xử lý?",
      onOk: () => {
        form.submit();
      },
    });
  };

  const handleReject = () => {
    form.setFieldsValue({ status: "Rejected" });
    setEditModalVisible(true);
  };

  const handleSettle = async (values: any) => {
    try {
      setSettling(true);
      const formData = new FormData();

      formData.append("vehicleDamageCost", values.vehicleDamageCost.toString());
      formData.append("personInjuryCost", (values.personInjuryCost || 0).toString());
      formData.append("thirdPartyCost", (values.thirdPartyCost || 0).toString());
      formData.append(
        "insuranceCoverageAmount",
        values.insuranceCoverageAmount.toString()
      );

      if (values.insuranceClaimPdfFile?.fileList?.[0]?.originFileObj) {
        formData.append(
        "insuranceClaimPdfFile",
        values.insuranceClaimPdfFile.fileList[0].originFileObj
      );
      }

      const result = await settleClaim(claimId, formData);
      message.success(
        result.message || "Hoàn tất quyết toán thành công"
      );
      setSettlementModalVisible(false);
      await loadClaim();
    } catch (err: any) {
      console.error(err);
      message.error(err.message || "Quyết toán thất bại");
    } finally {
      setSettling(false);
    }
  };

  const getStatusColor = (status: ClaimStatus) => {
    switch (status) {
      case "Reported":
        return "orange";
      case "Processing":
        return "blue";
      case "Rejected":
        return "red";
      case "Completed":
        return "green";
      default:
        return "default";
    }
  };

  const getStatusText = (status: ClaimStatus) => {
    switch (status) {
      case "Reported":
        return "Đã báo cáo";
      case "Processing":
        return "Đang xử lý";
      case "Rejected":
        return "Đã từ chối";
      case "Completed":
        return "Hoàn tất";
      default:
        return status;
    }
  };

  const canEdit = claim?.status === "Reported";
  const canSettle = claim?.status === "Processing";
  const isLocked = claim?.status === "Processing" || claim?.status === "Completed";

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="p-6">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.back()}
          className="mb-4"
        >
          Quay lại
        </Button>
        <Card>
          <p>Không tìm thấy thông tin claim</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push("/dashboard/manager/insurance")}
        >
          Quay lại
        </Button>
        <Space>
          <Tag color={getStatusColor(claim.status as ClaimStatus)}>
            {getStatusText(claim.status as ClaimStatus)}
          </Tag>
          {canEdit && (
            <>
              <Button
                icon={<EditOutlined />}
                onClick={() => setEditModalVisible(true)}
              >
                Chỉnh sửa
              </Button>
              <Button
                danger
                icon={<CloseOutlined />}
                onClick={handleReject}
              >
                Từ chối
              </Button>
            </>
          )}
          {canSettle && (
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => setSettlementModalVisible(true)}
            >
              Hoàn tất quyết toán
            </Button>
          )}
        </Space>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Thông tin cơ bản */}
        <Card title="Thông tin sự cố" className="mb-6">
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Ngày xảy ra">
              {dayjs(claim.incidentDate).format("DD/MM/YYYY HH:mm")}
            </Descriptions.Item>
            <Descriptions.Item label="Địa điểm">
              {claim.incidentLocation}
            </Descriptions.Item>
            <Descriptions.Item label="Mô tả">
              {claim.description}
            </Descriptions.Item>
            {claim.severity && (
              <Descriptions.Item label="Mức độ">
                <Tag>
                  {claim.severity === "Minor" && "Nhẹ"}
                  {claim.severity === "Moderate" && "Trung bình"}
                  {claim.severity === "Severe" && "Nghiêm trọng"}
                  {claim.severity === "Critical" && "Rất nghiêm trọng"}
                  {!["Minor", "Moderate", "Severe", "Critical"].includes(claim.severity) && claim.severity}
                </Tag>
              </Descriptions.Item>
            )}
            {claim.notes && (
              <Descriptions.Item label="Ghi chú">
                {claim.notes}
              </Descriptions.Item>
            )}
            {claim.rejectionReason && (
              <Descriptions.Item label="Lý do từ chối">
                <span className="text-red-600">{claim.rejectionReason}</span>
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        {/* Thông tin khách hàng */}
        <Card title="Thông tin khách hàng" className="mb-6">
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Tên">
              {claim.renterName}
            </Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">
              {claim.renterPhone}
            </Descriptions.Item>
            {claim.renterEmail && (
              <Descriptions.Item label="Email">
                {claim.renterEmail}
              </Descriptions.Item>
            )}
            {claim.address && (
              <Descriptions.Item label="Địa chỉ">
                {claim.address}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        {/* Thông tin xe */}
        <Card title="Thông tin xe" className="mb-6">
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Mẫu xe">
              {claim.vehicleModelName}
            </Descriptions.Item>
            <Descriptions.Item label="Biển số">
              {claim.licensePlate}
            </Descriptions.Item>
            {claim.vehicleDescription && (
              <Descriptions.Item label="Mô tả">
                {claim.vehicleDescription}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        {/* Thông tin booking */}
        <Card title="Thông tin booking" className="mb-6">
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Mã booking">
              {claim.bookingId}
            </Descriptions.Item>
            <Descriptions.Item label="Chi nhánh">
              {claim.handoverBranchName}
            </Descriptions.Item>
            {claim.handoverBranchAddress && (
              <Descriptions.Item label="Địa chỉ chi nhánh">
                {claim.handoverBranchAddress}
              </Descriptions.Item>
            )}
            {claim.bookingStartDate && (
              <Descriptions.Item label="Ngày bắt đầu">
                {dayjs(claim.bookingStartDate).format("DD/MM/YYYY HH:mm")}
              </Descriptions.Item>
            )}
            {claim.bookingEndDate && (
              <Descriptions.Item label="Ngày kết thúc">
                {dayjs(claim.bookingEndDate).format("DD/MM/YYYY HH:mm")}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        {/* Thông tin gói bảo hiểm */}
        <Card title="Gói bảo hiểm" className="mb-6">
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Tên gói">
              {claim.packageName}
            </Descriptions.Item>
            <Descriptions.Item label="Phí bảo hiểm">
              {claim.packageFee?.toLocaleString("vi-VN")} VND
            </Descriptions.Item>
            <Descriptions.Item label="Giới hạn bồi thường người">
              {claim.coveragePersonLimit?.toLocaleString("vi-VN")} VND
            </Descriptions.Item>
            <Descriptions.Item label="Giới hạn bồi thường tài sản">
              {claim.coveragePropertyLimit?.toLocaleString("vi-VN")} VND
            </Descriptions.Item>
            <Descriptions.Item label="Tỷ lệ bồi thường xe">
              {claim.coverageVehiclePercentage}%
            </Descriptions.Item>
            <Descriptions.Item label="Bồi thường trộm cắp">
              {claim.coverageTheft?.toLocaleString("vi-VN")} VND
            </Descriptions.Item>
            <Descriptions.Item label="Số tiền khấu trừ">
              {claim.deductibleAmount?.toLocaleString("vi-VN")} VND
            </Descriptions.Item>
            {claim.insuranceDescription && (
              <Descriptions.Item label="Mô tả">
                {claim.insuranceDescription}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        {/* Thông tin quyết toán (nếu đã hoàn tất) */}
        {claim.status === "Completed" && (
          <Card title="Thông tin quyết toán" className="mb-6 col-span-2">
            <Descriptions column={2} bordered>
              <Descriptions.Item label="Chi phí sửa chữa xe">
                {claim.vehicleDamageCost?.toLocaleString("vi-VN")} VND
              </Descriptions.Item>
              <Descriptions.Item label="Chi phí y tế">
                {claim.personInjuryCost?.toLocaleString("vi-VN")} VND
              </Descriptions.Item>
              <Descriptions.Item label="Chi phí bên thứ ba">
                {claim.thirdPartyCost?.toLocaleString("vi-VN")} VND
              </Descriptions.Item>
              <Descriptions.Item label="Tổng chi phí">
                <strong>
                  {claim.totalCost?.toLocaleString("vi-VN")} VND
                </strong>
              </Descriptions.Item>
              <Descriptions.Item label="Số tiền bảo hiểm bồi thường">
                <span className="text-green-600">
                  {claim.insuranceCoverageAmount?.toLocaleString("vi-VN")} VND
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Số tiền khách hàng phải trả">
                <span className="text-red-600">
                  <strong>
                    {claim.renterLiabilityAmount?.toLocaleString("vi-VN")} VND
                  </strong>
                </span>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}
      </div>

      {/* Hình ảnh sự cố */}
      {claim.incidentImages && claim.incidentImages.length > 0 && (
        <Card title="Hình ảnh sự cố" className="mt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {claim.incidentImages.map((img: string, idx: number) => (
              <div key={idx} className="relative">
                <Image
                  src={img}
                  alt={`Hình ảnh ${idx + 1}`}
                  className="w-full h-48 object-cover rounded"
                  preview={{
                    mask: <EyeOutlined />,
                  }}
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Modal chỉnh sửa */}
      <Modal
        title="Chỉnh sửa claim"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdate}
          initialValues={{
            status: claim.status,
          }}
        >
          <Form.Item
            label="Mô tả"
            name="description"
          >
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item
            label="Địa điểm"
            name="incidentLocation"
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Mức độ"
            name="severity"
          >
            <Select placeholder="Chọn mức độ">
              <Option value="Minor">Nhẹ</Option>
              <Option value="Moderate">Trung bình</Option>
              <Option value="Severe">Nghiêm trọng</Option>
              <Option value="Critical">Rất nghiêm trọng</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Ghi chú"
            name="notes"
          >
            <TextArea rows={3} />
          </Form.Item>

          <Form.Item
            label="Trạng thái"
            name="status"
          >
            <Select>
              <Option value="Reported">Đã báo cáo</Option>
              <Option value="Processing">Đang xử lý</Option>
              <Option value="Rejected">Đã từ chối</Option>
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.status !== currentValues.status
            }
          >
            {({ getFieldValue }) =>
              getFieldValue("status") === "Rejected" ? (
                <Form.Item
                  label="Lý do từ chối"
                  name="rejectionReason"
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng nhập lý do từ chối",
                    },
                  ]}
                >
                  <TextArea rows={3} />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <Form.Item label="Thêm ảnh bổ sung" name="additionalImageFiles">
            <Upload multiple beforeUpload={() => false}>
              <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
            </Upload>
          </Form.Item>

          <div className="flex justify-end gap-3 mt-4">
            <Button onClick={() => setEditModalVisible(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={updating}>
              Cập nhật
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Modal quyết toán */}
      <Modal
        title="Hoàn tất quyết toán"
        open={settlementModalVisible}
        onCancel={() => setSettlementModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={settlementForm}
          layout="vertical"
          onFinish={handleSettle}
        >
          <Form.Item
            label="Chi phí sửa chữa xe (VND)"
            name="vehicleDamageCost"
            rules={[
              { required: true, message: "Vui lòng nhập chi phí sửa chữa xe" },
              { type: "number", min: 0, message: "Chi phí phải >= 0" },
            ]}
          >
            <InputNumber
              style={{ width: "100%" }}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
            />
          </Form.Item>

          <Form.Item
            label="Chi phí y tế (VND)"
            name="personInjuryCost"
            rules={[{ type: "number", min: 0, message: "Chi phí phải >= 0" }]}
          >
            <InputNumber
              style={{ width: "100%" }}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
            />
          </Form.Item>

          <Form.Item
            label="Chi phí bên thứ ba (VND)"
            name="thirdPartyCost"
            rules={[{ type: "number", min: 0, message: "Chi phí phải >= 0" }]}
          >
            <InputNumber
              style={{ width: "100%" }}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
            />
          </Form.Item>

          <Form.Item
            label="Số tiền bảo hiểm bồi thường (VND)"
            name="insuranceCoverageAmount"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập số tiền bảo hiểm bồi thường",
              },
              { type: "number", min: 0, message: "Số tiền phải >= 0" },
            ]}
          >
            <InputNumber
              style={{ width: "100%" }}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
            />
          </Form.Item>

          <Form.Item
            label="File PDF từ bảo hiểm (tùy chọn)"
            name="insuranceClaimPdfFile"
          >
            <Upload
              beforeUpload={() => false}
              accept=".pdf"
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>Chọn file PDF</Button>
            </Upload>
          </Form.Item>

          <div className="bg-blue-50 p-4 rounded mb-4">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Lưu ý:</strong> Hệ thống sẽ tự động tính toán:
            </p>
            <ul className="text-sm text-gray-600 list-disc list-inside">
              <li>Tổng chi phí = Chi phí sửa chữa xe + Chi phí y tế + Chi phí bên thứ ba</li>
              <li>Số tiền khách hàng phải trả = Tổng chi phí - Số tiền bảo hiểm bồi thường</li>
              <li>Hệ thống sẽ tự động trừ tiền từ cọc và ví của khách hàng</li>
            </ul>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button onClick={() => setSettlementModalVisible(false)}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" loading={settling}>
              Hoàn tất quyết toán
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}

