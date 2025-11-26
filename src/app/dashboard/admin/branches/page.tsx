"use client";

import { useEffect, useState } from "react";
import { Table, Button, Input, Space, Tag, Modal, Form, message, Descriptions, InputNumber } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined, EyeOutlined } from "@ant-design/icons";
import { getBranches, getBranchById, createBranch, updateBranch, deleteBranch, Branch } from "./branch_service";
import type { ColumnsType } from "antd/es/table";

const { Search } = Input;

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    setLoading(true);
    try {
      const data = await getBranches();
      setBranches(data);
    } catch (error) {
      console.error("Error loading branches:", error);
      message.error("Không thể tải danh sách chi nhánh");
    } finally {
      setLoading(false);
    }
  };

  // Filter branches
  const filteredBranches = branches.filter((branch) => {
    return (
      !searchText ||
      branch.branchName?.toLowerCase().includes(searchText.toLowerCase()) ||
      branch.address?.toLowerCase().includes(searchText.toLowerCase()) ||
      branch.city?.toLowerCase().includes(searchText.toLowerCase()) ||
      branch.phone?.toLowerCase().includes(searchText.toLowerCase())
    );
  });

  const handleViewDetail = async (branch: Branch) => {
    try {
      const detail = await getBranchById(branch.id);
      setSelectedBranch(detail);
      setIsDetailModalVisible(true);
    } catch (error) {
      console.error("Error loading branch detail:", error);
      message.error("Không thể tải chi tiết chi nhánh");
    }
  };

  const handleCreate = () => {
    setEditingBranch(null);
    form.resetFields();
    form.setFieldsValue({
      openingTime: "06:00",
      closingTime: "22:00",
    });
    setIsModalVisible(true);
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    form.setFieldsValue({
      branchName: branch.branchName,
      address: branch.address,
      city: branch.city,
      phone: branch.phone,
      email: branch.email,
      latitude: branch.latitude,
      longitude: branch.longitude,
      openingTime: branch.openingTime,
      closingTime: branch.closingTime,
    });
    setIsModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingBranch) {
        await updateBranch(editingBranch.id, values);
        message.success("Cập nhật chi nhánh thành công");
      } else {
        await createBranch(values);
        message.success("Tạo chi nhánh thành công");
      }
      
      setIsModalVisible(false);
      setEditingBranch(null);
      form.resetFields();
      loadBranches();
    } catch (error: any) {
      console.error("Error saving branch:", error);
      if (error.errorFields) {
        return;
      }
      message.error(error.message || "Không thể lưu chi nhánh");
    }
  };

  const handleDelete = (branch: Branch) => {
    console.log("handleDelete called with branch:", branch);
    setBranchToDelete(branch);
    setIsDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!branchToDelete) return;
    
    const branchId = branchToDelete.id || branchToDelete.branchId;
    
    if (!branchId) {
      console.error("No branchId found:", branchToDelete);
      message.error("Không tìm thấy ID chi nhánh");
      setIsDeleteModalVisible(false);
      setBranchToDelete(null);
      return;
    }

    setIsDeleting(true);
    try {
      console.log("Delete confirmed. Deleting branch with ID:", branchId);
      await deleteBranch(branchId);
      console.log("Branch deleted successfully");
      message.success("Xóa chi nhánh thành công");
      setIsDeleteModalVisible(false);
      setBranchToDelete(null);
      loadBranches();
    } catch (error: any) {
      console.error("Error deleting branch:", error);
      message.error(error.message || "Không thể xóa chi nhánh");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: ColumnsType<Branch> = [
    {
      title: "Tên chi nhánh",
      dataIndex: "branchName",
      key: "branchName",
      width: 200,
    },
    {
      title: "Địa chỉ",
      dataIndex: "address",
      key: "address",
      width: 250,
    },
    {
      title: "Thành phố",
      dataIndex: "city",
      key: "city",
      width: 120,
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
      width: 150,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 200,
    },
    {
      title: "Giờ mở cửa",
      key: "openingHours",
      width: 150,
      render: (_, record) => {
        return record.openingTime && record.closingTime
          ? `${record.openingTime} - ${record.closingTime}`
          : "-";
      },
    },
    {
      title: "Số xe",
      dataIndex: "vehicleCount",
      key: "vehicleCount",
      width: 100,
      render: (count) => count ?? "-",
    },
    {
      title: "Hành động",
      key: "action",
      width: 200,
      fixed: "right",
      render: (_, record) => {
        return (
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
              onClick={() => handleEdit(record)}
            >
              Sửa
            </Button>
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Delete button clicked for branch:", record);
                handleDelete(record);
              }}
            >
              Xóa
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Quản lý chi nhánh</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
        >
          Tạo chi nhánh
        </Button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <Search
          placeholder="Tìm theo tên, địa chỉ, thành phố hoặc số điện thoại"
          allowClear
          style={{ width: 400 }}
          onSearch={(value) => setSearchText(value)}
          onChange={(e) => !e.target.value && setSearchText("")}
        />
      </div>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={filteredBranches}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1200 }}
        pagination={{
          pageSize: 12,
          showSizeChanger: true,
          showTotal: (total) => `Tổng: ${total} chi nhánh`,
          pageSizeOptions: ["12", "24", "48", "96"],
        }}
      />

      {/* Create/Edit Modal */}
      <Modal
        title={editingBranch ? "Cập nhật chi nhánh" : "Tạo chi nhánh mới"}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingBranch(null);
          form.resetFields();
        }}
        onOk={handleSubmit}
        okText={editingBranch ? "Cập nhật" : "Tạo"}
        cancelText="Hủy"
        width={600}
        destroyOnHidden={true}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="branchName"
            label="Tên chi nhánh"
            rules={[{ required: true, message: "Vui lòng nhập tên chi nhánh" }]}
          >
            <Input placeholder="Nhập tên chi nhánh" />
          </Form.Item>
          <Form.Item
            name="address"
            label="Địa chỉ"
            rules={[{ required: true, message: "Vui lòng nhập địa chỉ" }]}
          >
            <Input placeholder="Nhập địa chỉ" />
          </Form.Item>
          <Form.Item
            name="city"
            label="Thành phố"
            rules={[{ required: true, message: "Vui lòng nhập thành phố" }]}
          >
            <Input placeholder="Nhập thành phố" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[{ required: true, message: "Vui lòng nhập số điện thoại" }]}
          >
            <Input placeholder="Nhập số điện thoại" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Vui lòng nhập email" },
              { type: "email", message: "Email không hợp lệ" },
            ]}
          >
            <Input type="email" placeholder="Nhập email" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="latitude"
              label="Vĩ độ"
              rules={[{ required: true, message: "Vui lòng nhập vĩ độ" }]}
            >
              <InputNumber
                style={{ width: "100%" }}
                placeholder="Nhập vĩ độ"
                step={0.0001}
              />
            </Form.Item>
            <Form.Item
              name="longitude"
              label="Kinh độ"
              rules={[{ required: true, message: "Vui lòng nhập kinh độ" }]}
            >
              <InputNumber
                style={{ width: "100%" }}
                placeholder="Nhập kinh độ"
                step={0.0001}
              />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="openingTime"
              label="Giờ mở cửa"
              rules={[{ required: true, message: "Vui lòng nhập giờ mở cửa" }]}
            >
              <Input placeholder="VD: 06:00" />
            </Form.Item>
            <Form.Item
              name="closingTime"
              label="Giờ đóng cửa"
              rules={[{ required: true, message: "Vui lòng nhập giờ đóng cửa" }]}
            >
              <Input placeholder="VD: 22:00" />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title="Chi tiết chi nhánh"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalVisible(false)}>
            Đóng
          </Button>,
        ]}
        width={800}
      >
        {selectedBranch && (
          <Descriptions title="Thông tin chi nhánh" column={2} bordered>
            <Descriptions.Item label="ID">
              {selectedBranch.id}
            </Descriptions.Item>
            <Descriptions.Item label="Tên chi nhánh">
              {selectedBranch.branchName}
            </Descriptions.Item>
            <Descriptions.Item label="Địa chỉ" span={2}>
              {selectedBranch.address || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Thành phố">
              {selectedBranch.city || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">
              {selectedBranch.phone || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {selectedBranch.email || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Vĩ độ">
              {selectedBranch.latitude || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Kinh độ">
              {selectedBranch.longitude || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Giờ mở cửa">
              {selectedBranch.openingTime || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Giờ đóng cửa">
              {selectedBranch.closingTime || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Số xe">
              {selectedBranch.vehicleCount ?? "-"}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Xác nhận xóa"
        open={isDeleteModalVisible}
        onOk={confirmDelete}
        onCancel={() => {
          setIsDeleteModalVisible(false);
          setBranchToDelete(null);
        }}
        okText="Xóa"
        okButtonProps={{ danger: true, loading: isDeleting }}
        cancelText="Hủy"
      >
        <p>
          Bạn có chắc muốn xóa chi nhánh{" "}
          <strong>{branchToDelete?.branchName}</strong>?
        </p>
        {branchToDelete && (
          <p className="text-sm text-gray-500 mt-2">
            ID: {branchToDelete.id || branchToDelete.branchId}
          </p>
        )}
      </Modal>
    </div>
  );
}
