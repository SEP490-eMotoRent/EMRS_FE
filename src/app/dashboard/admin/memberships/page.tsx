"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Descriptions,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Space,
  Table,
  Tag,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  createMembership,
  deleteMembership,
  getMembershipById,
  getMemberships,
  updateMembership,
  Membership,
} from "./membership_service";

const { TextArea } = Input;

export default function MembershipManagementPage() {
  const [form] = Form.useForm();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingMembership, setEditingMembership] = useState<Membership | null>(
    null
  );
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedMembership, setSelectedMembership] =
    useState<Membership | null>(null);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [membershipToDelete, setMembershipToDelete] =
    useState<Membership | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadMemberships();
  }, []);

  const loadMemberships = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMemberships();
      setMemberships(data);
    } catch (error) {
      console.error(error);
      message.error("Không thể tải danh sách hạng thành viên");
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredMemberships = useMemo(() => {
    if (!searchKeyword.trim()) {
      return memberships;
    }
    const keyword = searchKeyword.toLowerCase();
    return memberships.filter((membership) => {
      return (
        membership.tierName?.toLowerCase().includes(keyword) ||
        membership.description?.toLowerCase().includes(keyword)
      );
    });
  }, [memberships, searchKeyword]);

  const handleOpenModal = (membership?: Membership) => {
    if (membership) {
      setEditingMembership(membership);
      form.setFieldsValue({
        tierName: membership.tierName,
        minBookings: membership.minBookings,
        discountPercentage: membership.discountPercentage,
        freeChargingPerMonth: membership.freeChargingPerMonth ?? 0,
        description: membership.description,
      });
    } else {
      setEditingMembership(null);
      form.resetFields();
      form.setFieldsValue({
        minBookings: 0,
        discountPercentage: 0,
        freeChargingPerMonth: 0,
      });
    }
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setEditingMembership(null);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setIsSubmitting(true);

      if (editingMembership) {
        await updateMembership(editingMembership.id, values);
        message.success("Cập nhật hạng thành viên thành công");
      } else {
        await createMembership(values);
        message.success("Thêm hạng thành viên thành công");
      }

      handleCloseModal();
      loadMemberships();
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }
      console.error("Saving membership failed:", error);
      message.error(error?.message || "Không thể lưu hạng thành viên");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDetail = async (membership: Membership) => {
    try {
      const detail = await getMembershipById(membership.id);
      setSelectedMembership(detail);
      setIsDetailModalVisible(true);
    } catch (error) {
      console.error("Failed to load membership detail:", error);
      message.error("Không thể tải chi tiết hạng thành viên");
    }
  };

  const handleDelete = (membership: Membership) => {
    setMembershipToDelete(membership);
    setIsDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!membershipToDelete) return;
    setIsDeleting(true);
    try {
      await deleteMembership(membershipToDelete.id);
      message.success("Đã xóa hạng thành viên");
      setIsDeleteModalVisible(false);
      setMembershipToDelete(null);
      loadMemberships();
    } catch (error) {
      console.error("Delete membership failed:", error);
      message.error("Không thể xóa hạng thành viên");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "-";
    }
    return date.toLocaleString("vi-VN");
  };

  const columns: ColumnsType<Membership> = [
    {
      title: "Tên hạng",
      dataIndex: "tierName",
      key: "tierName",
      width: 160,
      render: (text: string) => (
        <span className="font-semibold text-gray-900">{text}</span>
      ),
    },
    {
      title: "Số booking tối thiểu",
      dataIndex: "minBookings",
      key: "minBookings",
      width: 170,
      render: (value: number) => value?.toLocaleString("vi-VN") ?? "0",
    },
    {
      title: "Giảm giá",
      dataIndex: "discountPercentage",
      key: "discountPercentage",
      width: 140,
      render: (value: number) => (
        <Tag color="green" className="font-semibold">
          -{value ?? 0}%
        </Tag>
      ),
    },
    {
      title: "Sạc miễn phí / tháng",
      dataIndex: "freeChargingPerMonth",
      key: "freeChargingPerMonth",
      width: 180,
      render: (value?: number) =>
        value && value > 0 ? `${value} lần` : <span className="text-gray-400">Không</span>,
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (value?: string) => value || "-",
    },
    {
      title: "Cập nhật",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 180,
      render: (value?: string) => formatDate(value),
    },
    {
      title: "Hành động",
      key: "action",
      fixed: "right",
      width: 220,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            Xem
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
          >
            Sửa
          </Button>
          <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDelete(record)}
        >
          Xóa
        </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Quản lý hạng thành viên
          </h2>
          <p className="text-gray-500">
            Tạo và cập nhật các hạng thành viên cùng quyền lợi ưu đãi cho khách hàng.
          </p>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadMemberships}>
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
          >
            Thêm hạng mới
          </Button>
        </Space>
      </div>

      <div className="bg-white p-4 rounded-xl shadow">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-4">
          <Input
            prefix={<SearchOutlined className="text-gray-400" />}
            placeholder="Tìm kiếm theo tên hạng hoặc mô tả..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            allowClear
            className="md:w-96"
          />
          <div className="text-sm text-gray-500">
            Tổng cộng{" "}
            <span className="font-semibold text-gray-900">
              {filteredMemberships.length}
            </span>{" "}
            hạng
          </div>
        </div>

        <Table
          rowKey={(record) => record.id || record.tierName}
          columns={columns}
          dataSource={filteredMemberships}
          loading={loading}
          scroll={{ x: 900 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
          }}
        />
      </div>

      <Modal
        title={editingMembership ? "Cập nhật hạng thành viên" : "Thêm hạng thành viên"}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={handleCloseModal}
        confirmLoading={isSubmitting}
        okText={editingMembership ? "Cập nhật" : "Tạo mới"}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            label="Tên hạng"
            name="tierName"
            rules={[{ required: true, message: "Vui lòng nhập tên hạng" }]}
          >
            <Input placeholder="Ví dụ: SILVER, GOLD, PLATINUM" />
          </Form.Item>
          <Form.Item
            label="Số booking tối thiểu"
            name="minBookings"
            rules={[{ required: true, message: "Vui lòng nhập số booking tối thiểu" }]}
          >
            <InputNumber min={0} className="w-full" />
          </Form.Item>
          <Form.Item
            label="Giảm giá (%)"
            name="discountPercentage"
            rules={[{ required: true, message: "Vui lòng nhập mức giảm giá" }]}
          >
            <InputNumber min={0} max={100} className="w-full" />
          </Form.Item>
          <Form.Item
            label="Số lần sạc miễn phí mỗi tháng"
            name="freeChargingPerMonth"
            tooltip="Số lượt sạc miễn phí khách nhận được mỗi tháng"
          >
            <InputNumber min={0} className="w-full" />
          </Form.Item>
          <Form.Item label="Mô tả" name="description">
            <TextArea rows={3} maxLength={250} showCount />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Chi tiết hạng thành viên"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={null}
        destroyOnHidden
      >
        {selectedMembership ? (
          <Descriptions column={1} layout="vertical" bordered size="small">
            <Descriptions.Item label="Tên hạng">
              {selectedMembership.tierName}
            </Descriptions.Item>
            <Descriptions.Item label="Số booking tối thiểu">
              {selectedMembership.minBookings?.toLocaleString("vi-VN") || 0}
            </Descriptions.Item>
            <Descriptions.Item label="Giảm giá">
              -{selectedMembership.discountPercentage ?? 0}%
            </Descriptions.Item>
            <Descriptions.Item label="Sạc miễn phí / tháng">
              {selectedMembership.freeChargingPerMonth
                ? `${selectedMembership.freeChargingPerMonth} lần`
                : "Không"}
            </Descriptions.Item>
            <Descriptions.Item label="Mô tả">
              {selectedMembership.description || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">
              {formatDate(selectedMembership.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label="Cập nhật lần cuối">
              {formatDate(selectedMembership.updatedAt)}
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <div className="text-center text-gray-500 py-6">
            Không có dữ liệu
          </div>
        )}
      </Modal>

      <Modal
        title="Xóa hạng thành viên"
        open={isDeleteModalVisible}
        onCancel={() => {
          setIsDeleteModalVisible(false);
          setMembershipToDelete(null);
        }}
        onOk={confirmDelete}
        okButtonProps={{ danger: true, loading: isDeleting }}
        okText="Xóa"
        cancelText="Hủy"
      >
        <p>
          Bạn có chắc chắn muốn xóa hạng{" "}
          <strong>{membershipToDelete?.tierName}</strong>? Hành động này
          không thể hoàn tác.
        </p>
      </Modal>
    </div>
  );
}

