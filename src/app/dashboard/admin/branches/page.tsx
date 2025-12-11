"use client";

import { useEffect, useState, useRef } from "react";
import { Table, Button, Card, Input, Space, Tag, Modal, Form, message, Descriptions, InputNumber, AutoComplete } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined, EyeOutlined, SearchOutlined } from "@ant-design/icons";
import { getBranches, getBranchById, createBranch, updateBranch, deleteBranch, Branch } from "./branch_service";
import type { ColumnsType } from "antd/es/table";

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
}


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
  const [addressOptions, setAddressOptions] = useState<{ value: string; label: string; data: NominatimResult }[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadBranches();
  }, []);

  // Search address using Nominatim API
  const searchAddress = async (query: string) => {
    if (!query || query.length < 2) {
      setAddressOptions([]);
      return;
    }

    setIsSearchingAddress(true);
    try {
      // Debounce: Clear previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Wait 600ms before making request (rate limit: 1 request/second)
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          // Search only in Ho Chi Minh City
          // Try multiple query formats for better results
          const searchQueries = [
            // Strategy 1: Query with "Ho Chi Minh City" or "Hồ Chí Minh"
            `https://nominatim.openstreetmap.org/search?` +
            `q=${encodeURIComponent(query + ', Ho Chi Minh City, Vietnam')}&` +
            `format=json&` +
            `limit=10&` +
            `countrycodes=vn&` +
            `addressdetails=1&` +
            `extratags=1`,
            
            // Strategy 2: Alternative format with Vietnamese name
            `https://nominatim.openstreetmap.org/search?` +
            `q=${encodeURIComponent(query + ', Hồ Chí Minh, Việt Nam')}&` +
            `format=json&` +
            `limit=10&` +
            `countrycodes=vn&` +
            `addressdetails=1&` +
            `extratags=1`,
          ];

          // Try first query
          let response = await fetch(searchQueries[0], {
            headers: {
              'User-Agent': 'EMotoRent/1.0', // Required by Nominatim
              'Accept-Language': 'vi,en',
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch address');
          }

          let data: NominatimResult[] = await response.json();
          
          // Filter to only Ho Chi Minh City addresses
          data = data.filter((item) => {
            const address = item.address || {};
            const displayName = item.display_name.toLowerCase();
            // Check if address is in Ho Chi Minh City
            return (
              displayName.includes('ho chi minh') ||
              displayName.includes('hồ chí minh') ||
              displayName.includes('tp. hồ chí minh') ||
              displayName.includes('thành phố hồ chí minh') ||
              address.state === 'Ho Chi Minh City' ||
              address.city === 'Ho Chi Minh City' ||
              address.city === 'Hồ Chí Minh'
            );
          });
          
          // If we got few results, try alternative query
          if (data.length < 3) {
            response = await fetch(searchQueries[1], {
              headers: {
                'User-Agent': 'EMotoRent/1.0',
                'Accept-Language': 'vi,en',
              },
            });
            
            if (response.ok) {
              const additionalData: NominatimResult[] = await response.json();
              // Filter to only Ho Chi Minh City
              const filteredAdditional = additionalData.filter((item) => {
                const address = item.address || {};
                const displayName = item.display_name.toLowerCase();
                return (
                  displayName.includes('ho chi minh') ||
                  displayName.includes('hồ chí minh') ||
                  displayName.includes('tp. hồ chí minh') ||
                  displayName.includes('thành phố hồ chí minh') ||
                  address.state === 'Ho Chi Minh City' ||
                  address.city === 'Ho Chi Minh City' ||
                  address.city === 'Hồ Chí Minh'
                );
              });
              
              // Merge and deduplicate by place_id
              const existingIds = new Set(data.map(d => d.place_id));
              const newData = filteredAdditional.filter(d => !existingIds.has(d.place_id));
              data = [...data, ...newData].slice(0, 15); // Limit to 15 total
            }
          }

          // Format options with better display
          const options = data.map((item) => {
            // Extract key address parts for better display
            const addressParts = item.display_name.split(',');
            const mainAddress = addressParts.slice(0, 2).join(', '); // First 2 parts
            const detailAddress = addressParts.slice(2).join(', '); // Rest
            
            return {
              value: item.display_name,
              label: (
                <div className="py-1">
                  <div className="font-medium text-sm">{mainAddress}</div>
                  {detailAddress && (
                    <div className="text-xs text-gray-500 truncate">{detailAddress}</div>
                  )}
                  <div className="text-xs text-blue-500 mt-0.5">
                    📍 {parseFloat(item.lat).toFixed(6)}, {parseFloat(item.lon).toFixed(6)}
                  </div>
                </div>
              ),
              data: item,
            };
          });

          setAddressOptions(options);
        } catch (error) {
          console.error('Error searching address:', error);
          message.error('Không thể tìm kiếm địa chỉ. Vui lòng thử lại.');
        } finally {
          setIsSearchingAddress(false);
        }
      }, 600);
    } catch (error) {
      setIsSearchingAddress(false);
    }
  };

  // Handle address selection
  const handleAddressSelect = (value: string, option: any) => {
    const result = option.data as NominatimResult;
    
    if (result) {
      // Update form with coordinates
      form.setFieldsValue({
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        address: result.display_name,
      });

      // Try to extract city
      const city = result.address?.city || result.address?.town || result.address?.village;
      if (city && !form.getFieldValue('city')) {
        form.setFieldsValue({
          city: city,
        });
      }

      message.success('Đã lấy tọa độ từ địa chỉ');
    }
  };

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
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Quản lý chi nhánh
        </h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
          size="large"
          className="w-full sm:w-auto"
        >
          <span className="hidden sm:inline">Tạo chi nhánh</span>
          <span className="sm:hidden">Tạo mới</span>
        </Button>
      </div>

      {/* Search */}
      <Card className="shadow-sm">
        <Input
          placeholder="Tìm theo tên, địa chỉ, thành phố hoặc số điện thoại"
          allowClear
          prefix={<SearchOutlined />}
          className="w-full"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onPressEnter={() => setSearchText(searchText)}
        />
      </Card>

      {/* Table */}
      <Card className="shadow-sm">
        <div className="overflow-x-auto">
          <Table
            columns={columns}
            dataSource={filteredBranches}
            rowKey="id"
            loading={loading}
            scroll={{ x: 'max-content' }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng: ${total} chi nhánh`,
              pageSizeOptions: ["10", "20", "50", "100"],
              responsive: true,
              showLessItems: true,
            }}
            size="small"
            className="min-w-full"
          />
        </div>
      </Card>

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
        width="90%"
        style={{ maxWidth: 600 }}
        destroyOnClose={true}
        centered
      >
        <Form form={form} layout="vertical" className="mt-4">
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
            help="Nhập địa chỉ ở thành phố Hồ Chí Minh để tự động lấy tọa độ (chọn từ gợi ý - OpenStreetMap)"
          >
            <AutoComplete
              options={addressOptions}
              onSearch={searchAddress}
              onSelect={handleAddressSelect}
              placeholder="Nhập địa chỉ (sẽ tự động lấy tọa độ)"
              notFoundContent={isSearchingAddress ? "Đang tìm kiếm..." : addressOptions.length === 0 ? "Nhập ít nhất 2 ký tự để tìm kiếm" : "Không tìm thấy địa chỉ"}
              filterOption={false}
              style={{ width: '100%' }}
              dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
              allowClear
            />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Form.Item
              name="latitude"
              label="Vĩ độ"
              rules={[{ required: true, message: "Vui lòng nhập vĩ độ" }]}
              help="Sẽ tự động điền khi chọn địa chỉ (có thể chỉnh sửa)"
            >
              <InputNumber
                style={{ width: "100%" }}
                placeholder="Tự động điền khi chọn địa chỉ"
                step={0.0001}
              />
            </Form.Item>
            <Form.Item
              name="longitude"
              label="Kinh độ"
              rules={[{ required: true, message: "Vui lòng nhập kinh độ" }]}
              help="Sẽ tự động điền khi chọn địa chỉ (có thể chỉnh sửa)"
            >
              <InputNumber
                style={{ width: "100%" }}
                placeholder="Tự động điền khi chọn địa chỉ"
                step={0.0001}
              />
            </Form.Item>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        width="90%"
        style={{ maxWidth: 800 }}
        centered
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
