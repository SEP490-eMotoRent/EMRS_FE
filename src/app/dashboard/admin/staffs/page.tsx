"use client";

import { useEffect, useState } from "react";
import { Table, Button, Card, Input, Select, Space, Tag, Modal, Form, message, Descriptions, DatePicker } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined, EyeOutlined, SearchOutlined } from "@ant-design/icons";
import { getStaffs, getAccountById, updateAccountRole, deleteAccount, createAccount, Account } from "./staff_service";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { fetchBackend } from "@/utils/helpers";

const { Option } = Select;

interface Branch {
  id: string;
  branchId: string;
  branchName: string;
}

export default function StaffPage() {
  const [staffs, setStaffs] = useState<Account[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [form] = Form.useForm();
  const [createForm] = Form.useForm();
  const [searchText, setSearchText] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [isAdminUser, setIsAdminUser] = useState<boolean>(false);
  const [currentUsername, setCurrentUsername] = useState<string>("");
  const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedCreateRole, setSelectedCreateRole] = useState<string>("");

  const getCookieValue = (name: string) => {
    if (typeof document === "undefined") return "";
    const cookieStr = document.cookie || "";
    const target = cookieStr
      .split(";")
      .map((c) => c.trim())
      .find((cookie) => cookie.startsWith(`${name}=`));
    if (!target) return "";
    const [, value] = target.split("=");
    return value ? decodeURIComponent(value) : "";
  };

  useEffect(() => {
    loadBranches();
    loadStaffs();
    detectCurrentUserRole();
  }, []);

  const detectCurrentUserRole = () => {
    const roleValue = getCookieValue("role");
    const userIdValue = getCookieValue("userId");
    const usernameValue = getCookieValue("username");
    if (roleValue) {
      setCurrentUserRole(roleValue);
      setIsAdminUser(roleValue.toUpperCase() === "ADMIN");
    }
    if (userIdValue) {
      setCurrentUserId(userIdValue);
    }
    if (usernameValue) {
      setCurrentUsername(usernameValue);
    }
  };

  const loadBranches = async () => {
    setLoadingBranches(true);
    try {
      const res = await fetchBackend("/Branch");
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Failed to fetch branches:", res.status, errorText);
        throw new Error(`Failed to fetch branches: ${res.statusText}`);
      }
      
      const text = await res.text();
      let json: any = {};
      try {
        json = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error("Failed to parse branch response as JSON:", text);
        throw new Error("Invalid JSON response from branch API");
      }
      // Handle different response structures
      let branchesData: any[] = [];
      
      // Case 1: { success: true, data: [...] }
      if (json.success && json.data) {
        if (Array.isArray(json.data)) {
          branchesData = json.data;
        } else if (json.data.items && Array.isArray(json.data.items)) {
          branchesData = json.data.items;
        } else if (json.data.data && Array.isArray(json.data.data)) {
          branchesData = json.data.data;
        }
      }
      // Case 2: Direct array
      else if (Array.isArray(json)) {
        branchesData = json;
      }
      // Case 3: { data: [...] }
      else if (json.data && Array.isArray(json.data)) {
        branchesData = json.data;
      }
      // Case 4: { data: { items: [...] } }
      else if (json.data && json.data.items && Array.isArray(json.data.items)) {
        branchesData = json.data.items;
      }
      // Normalize branch data: API trả về { id, branchName }
      const normalizedBranches = branchesData
        .map((branch: any) => {
          // API trả về 'id' chứ không phải 'branchId'
          const branchId = branch.id || branch.branchId;
          const branchName = branch.branchName || branch.name || "";
          
          if (!branchId) {
            console.warn("Branch missing ID:", branch);
            return null;
          }
          
          return {
            id: branchId,
            branchId: branchId, // Dùng id làm branchId để tương thích
            branchName: branchName,
          };
        })
        .filter((b: Branch | null): b is Branch => b !== null);
      if (normalizedBranches.length === 0) {
        console.warn("No branches found after normalization");
        message.warning("Không tìm thấy chi nhánh nào");
      }
      
      setBranches(normalizedBranches);
    } catch (error: any) {
      console.error("Error loading branches:", error);
      message.error(error.message || "Không thể tải danh sách chi nhánh");
    } finally {
      setLoadingBranches(false);
    }
  };

  const loadStaffs = async () => {
    setLoading(true);
    try {
      const data = await getStaffs();
      setStaffs(data);
      => ({ id: acc.id, username: acc.username, role: acc.role })));
      const resolvedUserId = currentUserId || getCookieValue("userId");
      const resolvedUsername = currentUsername || getCookieValue("username");
      let matched: Account | undefined;
      if (resolvedUserId) {
        matched = data.find((acc) => acc.id === resolvedUserId);
      }
      // Một số phiên đăng nhập cũ lưu nhầm staffId => fallback tìm theo staff.id
      if (!matched && resolvedUserId) {
        matched = data.find((acc) => acc.staff?.id === resolvedUserId);
        if (matched?.id && typeof document !== "undefined") {
          // Ghi đè cookie userId bằng accountId để lần sau khớp ngay
          document.cookie = `userId=${matched.id}; path=/;`;
          setCurrentUserId(matched.id);
        }
      }
      if (!matched && resolvedUsername) {
        matched = data.find((acc) => acc.username?.toLowerCase() === resolvedUsername.toLowerCase());
      }
      if (matched?.role) {
        setCurrentUserRole(matched.role);
        setIsAdminUser(matched.role.toUpperCase() === "ADMIN");
      }
    } catch (error) {
      console.error("Error loading staffs:", error);
      message.error("Không thể tải danh sách nhân sự");
    } finally {
      setLoading(false);
    }
  };

  // Filter staffs
  const filteredStaffs = staffs.filter((staff) => {
    const matchesSearch =
      !searchText ||
      staff.fullname?.toLowerCase().includes(searchText.toLowerCase()) ||
      staff.username?.toLowerCase().includes(searchText.toLowerCase()) ||
      staff.staff?.branch?.branchName?.toLowerCase().includes(searchText.toLowerCase()) ||
      staff.staff?.branch?.city?.toLowerCase().includes(searchText.toLowerCase()) ||
      staff.email?.toLowerCase().includes(searchText.toLowerCase()) ||
      staff.phone?.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesRole = selectedRole === "all" || staff.role?.toUpperCase() === selectedRole.toUpperCase();
    
    return matchesSearch && matchesRole;
  });

  const handleViewDetail = async (account: Account) => {
    try {
      const detail = await getAccountById(account.id);
      setSelectedAccount(detail);
      setIsDetailModalVisible(true);
    } catch (error) {
      console.error("Error loading account detail:", error);
      message.error("Không thể tải chi tiết tài khoản");
    }
  };

  const handleCreate = () => {
    // Reset form completely before opening modal
    createForm.resetFields();
    createForm.setFieldsValue({});
    setSelectedCreateRole("");
    setIsCreateModalVisible(true);
  };

  const handleCreateAccount = async () => {
    try {
      const values = await createForm.validateFields();
      
      // Format dateOfBirth if provided
      const accountData: any = {
        username: values.username,
        password: values.password,
        role: values.role,
        fullname: values.fullname || undefined,
        email: values.email || undefined,
        phone: values.phone || undefined,
        address: values.address || undefined,
      };

      // Technician không cần branchId (không thuộc quản lý của branch)
      // Manager và Staff cần branchId
      if (values.role !== "TECHNICIAN" && values.branchId) {
        accountData.branchId = values.branchId;
      }

      if (values.dateOfBirth) {
        accountData.dateOfBirth = dayjs(values.dateOfBirth).format("YYYY-MM-DD");
      }

      await createAccount(accountData);
      message.success("Tạo tài khoản thành công");
      setIsCreateModalVisible(false);
      // Reset form after successful creation
      setTimeout(() => {
        createForm.resetFields();
        createForm.setFieldsValue({});
        setSelectedCreateRole("");
      }, 100);
      loadStaffs();
    } catch (error: any) {
      console.error("Error creating account:", error);
      if (error.errorFields) {
        return;
      }
      message.error(error.message || "Không thể tạo tài khoản");
    }
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    form.setFieldsValue({
      role: account.role,
    });
    setIsModalVisible(true);
  };

  const handleUpdateRole = async () => {
    try {
      setIsUpdating(true);
      const values = await form.validateFields();
      if (!editingAccount) {
        setIsUpdating(false);
        return;
      }

      await updateAccountRole(editingAccount.id, values.role);
      
      // Hiển thị message trước khi đóng modal
      message.success("Cập nhật nhân sự thành công");
      
      // Đóng modal và reset sau một chút để message có thời gian hiển thị
      setTimeout(() => {
        setIsModalVisible(false);
        setEditingAccount(null);
        form.resetFields();
        loadStaffs();
        setIsUpdating(false);
      }, 300);
    } catch (error: any) {
      setIsUpdating(false);
      console.error("Error updating role:", error);
      if (error.errorFields) {
        return;
      }
      message.error(error.message || "Không thể cập nhật role");
    }
  };

  const handleDelete = (account: Account) => {
    setAccountToDelete(account);
    setIsDeleteConfirmVisible(true);
  };

  const confirmDeleteAccount = async () => {
    if (!accountToDelete) return;
    setIsDeleting(true);
    try {
      await deleteAccount(accountToDelete.id);
      message.success("Xóa nhân sự thành công");
      setIsDeleteConfirmVisible(false);
      setAccountToDelete(null);
      loadStaffs();
    } catch (error: any) {
      console.error("Error deleting account:", error);
      message.error(error.message || "Không thể xóa tài khoản");
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleTag = (role?: string) => {
    const roleMap: Record<string, { color: string; text: string }> = {
      ADMIN: { color: "red", text: "Admin" },
      MANAGER: { color: "blue", text: "Manager" },
      STAFF: { color: "green", text: "Nhân viên" },
      TECHNICIAN: { color: "orange", text: "Kỹ thuật viên" },
      RENTER: { color: "default", text: "Khách thuê" },
    };
    const roleInfo = roleMap[role?.toUpperCase() || ""] || { color: "default", text: role || "N/A" };
    return <Tag color={roleInfo.color}>{roleInfo.text}</Tag>;
  };

  const columns: ColumnsType<Account> = [
    {
      title: "Họ tên",
      dataIndex: "fullname",
      key: "fullname",
      width: 200,
    },
    {
      title: "Họ và tên",
      key: "displayName",
      width: 200,
      render: (_, record) => record.fullname || record.username || "-",
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      width: 120,
      render: (role) => getRoleTag(role),
    },
    {
      title: "Chi nhánh",
      key: "branch",
      width: 200,
      render: (_, record) => {
        return record.staff?.branch?.branchName || "-";
      },
    },
    {
      title: "Staff ID",
      key: "staffId",
      width: 260,
      render: (_, record) => (
        <span className="font-mono text-xs">
          {record.staff?.id || "N/A"}
        </span>
      ),
    },
    {
      title: "Thành phố",
      key: "city",
      width: 160,
      render: (_, record) => {
        return record.staff?.branch?.city || "-";
      },
    },
    {
      title: "Địa chỉ chi nhánh",
      key: "branchAddress",
      width: 250,
      ellipsis: true,
      render: (_, record) => {
        return record.staff?.branch?.address || "-";
      },
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
              Xem chi tiết
            </Button>
            {isAdminUser && (
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              >
                Sửa
              </Button>
            )}
            {isAdminUser && (
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record)}
              >
                Xóa
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-800">
          Quản lý nhân sự
        </h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
          size="large"
        >
          Tạo tài khoản
        </Button>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <div className="flex gap-4 flex-wrap">
          <Input
            placeholder="Tìm theo tên, username hoặc chi nhánh"
            allowClear
            prefix={<SearchOutlined />}
            style={{ maxWidth: 400, flex: 1, minWidth: 250 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={() => setSearchText(searchText)}
          />
        <Select
          placeholder="Role"
          style={{ width: 150 }}
          value={selectedRole}
          onChange={setSelectedRole}
        >
          <Option value="all">Tất cả</Option>
          <Option value="ADMIN">Admin</Option>
          <Option value="MANAGER">Manager</Option>
          <Option value="STAFF">Nhân viên</Option>
          <Option value="TECHNICIAN">Kỹ thuật viên</Option>
        </Select>
        </div>
      </Card>

      {/* Table */}
      <Card className="shadow-sm">
        <Table
        columns={columns}
        dataSource={filteredStaffs}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1200 }}
        pagination={{
          pageSize: 12,
          showSizeChanger: true,
          showTotal: (total) => `Tổng: ${total} nhân sự`,
          pageSizeOptions: ["12", "24", "48", "96"],
        }}
        locale={{ emptyText: "Chưa có nhân sự" }}
      />
      </Card>

      {/* Create Account Modal */}
      <Modal
        title="Tạo tài khoản mới"
        open={isCreateModalVisible}
        onCancel={() => {
          setIsCreateModalVisible(false);
          // Reset form completely
          setTimeout(() => {
            createForm.resetFields();
            createForm.setFieldsValue({});
            setSelectedCreateRole("");
          }, 100);
        }}
        onOk={handleCreateAccount}
        okText="Tạo"
        cancelText="Hủy"
        width={600}
        destroyOnHidden={true}
        afterClose={() => {
          // Ensure form is completely cleared after modal closes
          createForm.resetFields();
          createForm.setFieldsValue({});
          setSelectedCreateRole("");
        }}
      >
        <Form form={createForm} layout="vertical" autoComplete="off">
          <Form.Item
            name="username"
            label="Username"
            rules={[
              { required: true, message: "Vui lòng nhập username" },
              { min: 3, message: "Username phải có ít nhất 3 ký tự" },
            ]}
          >
            <Input 
              placeholder="Nhập username" 
              autoComplete="off"
              autoFocus={false}
            />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: "Vui lòng nhập password" },
              { min: 6, message: "Password phải có ít nhất 6 ký tự" },
            ]}
          >
            <Input.Password 
              placeholder="Nhập password" 
              autoComplete="new-password"
            />
          </Form.Item>
          <Form.Item
            name="role"
            label="Vai trò"
            rules={[{ required: true, message: "Vui lòng chọn vai trò" }]}
          >
            <Select 
              placeholder="Chọn vai trò"
              onChange={(value) => {
                setSelectedCreateRole(value);
                // Reset branchId khi đổi role
                createForm.setFieldsValue({ branchId: undefined });
              }}
            >
              <Option value="MANAGER">Manager</Option>
              <Option value="STAFF">Nhân viên</Option>
              <Option value="TECHNICIAN">Kỹ thuật viên</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="fullname"
            label="Họ tên"
          >
            <Input placeholder="Nhập họ tên" autoComplete="off" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
          >
            <Input type="email" placeholder="Nhập email" autoComplete="off" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Số điện thoại"
          >
            <Input placeholder="Nhập số điện thoại" autoComplete="off" />
          </Form.Item>
          <Form.Item
            name="address"
            label="Địa chỉ"
          >
            <Input placeholder="Nhập địa chỉ" autoComplete="off" />
          </Form.Item>
          <Form.Item
            name="dateOfBirth"
            label="Ngày sinh"
          >
            <DatePicker
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
              placeholder="Chọn ngày sinh"
            />
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.role !== currentValues.role}
          >
            {({ getFieldValue }) => {
              const role = getFieldValue("role");
              // Ẩn field branchId nếu role là TECHNICIAN
              if (role === "TECHNICIAN") {
                return null;
              }
              return (
                <Form.Item
                  name="branchId"
                  label="Chi nhánh"
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng chọn chi nhánh",
                    },
                  ]}
                >
                  <Select
                    placeholder="Chọn chi nhánh"
                    loading={loadingBranches}
                    showSearch
                    allowClear
                    filterOption={(input, option) =>
                      (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                    }
                    options={branches.map((branch) => ({
                      value: branch.branchId,
                      label: branch.branchName,
                    }))}
                  />
                </Form.Item>
              );
            }}
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Role Modal */}
      <Modal
        title="Đổi vai trò"
        open={isModalVisible}
        onCancel={() => {
          if (!isUpdating) {
            setIsModalVisible(false);
            setEditingAccount(null);
            form.resetFields();
          }
        }}
        onOk={handleUpdateRole}
        okText="Lưu"
        cancelText="Hủy"
        confirmLoading={isUpdating}
        okButtonProps={{ loading: isUpdating }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="role"
            label="Vai trò"
            rules={[{ required: true, message: "Vui lòng chọn vai trò" }]}
          >
            <Select placeholder="Chọn vai trò">
              <Option value="MANAGER">Manager</Option>
              <Option value="STAFF">Nhân viên</Option>
              <Option value="TECHNICIAN">Kỹ thuật viên</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title="Chi tiết tài khoản"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalVisible(false)}>
            Đóng
          </Button>,
        ]}
        width={800}
      >
        {selectedAccount && (
          <div>
            <Descriptions title="Thông tin tài khoản" column={2} bordered className="mb-4">
              <Descriptions.Item label="ID">
                {selectedAccount.id}
              </Descriptions.Item>
              <Descriptions.Item label="Username">
                {selectedAccount.username}
              </Descriptions.Item>
              <Descriptions.Item label="Họ tên">
                {selectedAccount.fullname}
              </Descriptions.Item>
              <Descriptions.Item label="Role">
                {getRoleTag(selectedAccount.role)}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {selectedAccount.email || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">
                {selectedAccount.phone || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ" span={2}>
                {selectedAccount.address || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày sinh">
                {selectedAccount.dateOfBirth
                  ? dayjs(selectedAccount.dateOfBirth).format("DD/MM/YYYY")
                  : "-"}
              </Descriptions.Item>
            </Descriptions>

            {/* Thông tin Staff */}
            {selectedAccount.staff && (
              <Descriptions title="Thông tin nhân sự" column={2} bordered className="mb-4">
                <Descriptions.Item label="Staff ID">
                  {selectedAccount.staff.id}
                </Descriptions.Item>
                {selectedAccount.staff.branch && (
                  <>
                    <Descriptions.Item label="Chi nhánh">
                      {selectedAccount.staff.branch.branchName}
                    </Descriptions.Item>
                    <Descriptions.Item label="Thành phố">
                      {selectedAccount.staff.branch.city || "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Địa chỉ" span={2}>
                      {selectedAccount.staff.branch.address || "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Số điện thoại">
                      {selectedAccount.staff.branch.phone || "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Email">
                      {selectedAccount.staff.branch.email || "-"}
                    </Descriptions.Item>
                  </>
                )}
              </Descriptions>
            )}

            {/* Thông tin Renter (nếu có) */}
            {selectedAccount.renter && (
              <Descriptions title="Thông tin khách thuê" column={2} bordered className="mb-4">
                <Descriptions.Item label="Renter ID">
                  {selectedAccount.renter.id}
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  {selectedAccount.renter.email || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Số điện thoại">
                  {selectedAccount.renter.phone || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Địa chỉ">
                  {selectedAccount.renter.address || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày sinh">
                  {selectedAccount.renter.dateOfBirth || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Đã xác thực">
                  {selectedAccount.renter.isVerified ? (
                    <Tag color="green">Đã xác thực</Tag>
                  ) : (
                    <Tag color="red">Chưa xác thực</Tag>
                  )}
                </Descriptions.Item>
              </Descriptions>
            )}
          </div>
        )}
      </Modal>

      {/* Delete confirmation Modal */}
      <Modal
        title="Xác nhận xóa nhân sự"
        open={isDeleteConfirmVisible}
        okText="Xóa"
        okButtonProps={{ danger: true, loading: isDeleting }}
        cancelText="Hủy"
        onOk={confirmDeleteAccount}
        onCancel={() => {
          setIsDeleteConfirmVisible(false);
          setAccountToDelete(null);
        }}
        width={480}
        centered
      >
        {accountToDelete && (
          <div className="space-y-4">
            <p className="text-base">
              Bạn có chắc chắn muốn xóa nhân sự này không?
            </p>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="font-semibold text-gray-900 mb-2">
                Tên: <span className="text-blue-600">{accountToDelete.fullname || accountToDelete.username}</span>
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Username: <span className="font-medium">{accountToDelete.username}</span>
              </p>
              <p className="text-sm text-gray-600">
                ID: <span className="font-mono text-xs">{accountToDelete.id}</span>
              </p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 font-semibold flex items-center gap-2">
                <span>⚠️</span>
                <span>Hành động này không thể hoàn tác!</span>
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
