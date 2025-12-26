"use client";

import { useEffect, useState } from "react";
import { Card, Descriptions, Avatar, Tag, message, Spin } from "antd";
import { UserOutlined, MailOutlined, PhoneOutlined, ShopOutlined } from "@ant-design/icons";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [accountData, setAccountData] = useState<any>(null);
  const [branchData, setBranchData] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Lấy username từ cookie để tìm account
      let username: string | null = null;
      if (typeof document !== "undefined") {
        const cookieStr = document.cookie || "";
        const cookies: Record<string, string> = {};
        cookieStr.split(";").forEach((c) => {
          const [key, value] = c.trim().split("=");
          if (key && value) {
            cookies[key] = decodeURIComponent(value);
          }
        });
        username = cookies.username || null;
      }
      
      // Bước 1: Gọi GET /api/account để lấy tất cả accounts
      try {
        const { fetchBackend } = await import("@/utils/helpers");
        const allAccountsRes = await fetchBackend("/account");
        if (!allAccountsRes.ok) {
          throw new Error(`Failed to fetch accounts: ${allAccountsRes.status}`);
        }
        
        const allAccountsJson = await allAccountsRes.json();
        const accountsData = allAccountsJson.data || [];
        // Bước 2: Tìm account theo username (hoặc role MANAGER nếu không tìm thấy)
        let targetAccount = null;
        if (username) {
          targetAccount = Array.isArray(accountsData) 
            ? accountsData.find((acc: any) => acc.username === username)
            : null;
        }
        
        // Nếu không tìm thấy theo username, tìm theo role MANAGER
        if (!targetAccount && Array.isArray(accountsData)) {
          targetAccount = accountsData.find((acc: any) => acc.role === "MANAGER");
        }
        
        if (!targetAccount) {
          console.warn("No account found, using first account or cookie data");
          // Fallback: dùng cookie data
          if (typeof document !== "undefined") {
            const cookieStr = document.cookie || "";
            const cookies: Record<string, string> = {};
            cookieStr.split(";").forEach((c) => {
              const [key, value] = c.trim().split("=");
              if (key && value) {
                cookies[key] = decodeURIComponent(value);
              }
            });
            
            const accountFromCookie = {
              fullname: cookies.fullName || "",
              username: cookies.username || "",
              role: cookies.role || "MANAGER",
              id: cookies.userId || "",
            };
            
            if (accountFromCookie.fullname || accountFromCookie.username) {
              setAccountData(accountFromCookie);
            }
          }
          return;
        }
        // Bước 3: Lấy account.id (KHÔNG phải staff.id)
        const accountId = targetAccount.id;
        if (!accountId) {
          console.error("Account ID not found in target account");
          message.error("Không tìm thấy ID tài khoản");
          return;
        }
        // Bước 4: Gọi GET /account/{accountId} để lấy đầy đủ thông tin
        const accountRes = await fetchBackend(`/account/${accountId}`);
        
        if (accountRes.ok) {
          const accountJson = await accountRes.json();
          const accountDataFromApi = accountJson.data || accountJson;
          // Set account data
          setAccountData(accountDataFromApi);
          
          // Lấy branch data từ staff.branch (theo cấu trúc response: data.staff.branch)
          const staff = accountDataFromApi.staff;
          if (staff && staff.branch) {
            setBranchData(staff.branch);
          } else {
            console.warn("No branch data found in staff:", staff);
          }
        } else {
          const errorText = await accountRes.text();
          let errorJson;
          try {
            errorJson = JSON.parse(errorText);
          } catch {
            errorJson = { message: errorText };
          }
          console.error("Failed to fetch account by ID:", {
            status: accountRes.status,
            statusText: accountRes.statusText,
            error: errorJson
          });
          message.error(`Không thể tải thông tin tài khoản: ${errorJson.message || accountRes.statusText || accountRes.status}`);
        }
      } catch (err) {
        console.error("Error fetching account data:", err);
        message.error("Không thể tải thông tin tài khoản");
      }
    } catch (err) {
      console.error("Error loading settings data:", err);
      message.error("Không thể tải thông tin cài đặt");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spin size="large" />
      </div>
    );
  }

  const staff = Array.isArray(accountData?.staff) ? accountData.staff[0] : accountData?.staff;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-800">Cài đặt</h1>

      {/* Thông tin tài khoản */}
      <Card title="Thông tin tài khoản" className="shadow-sm">
        <div className="flex items-start gap-6 mb-6">
          <Avatar
            size={80}
            icon={<UserOutlined />}
            className="bg-indigo-500"
          >
            {(accountData?.fullname || accountData?.fullName)?.charAt(0)?.toUpperCase() || "M"}
          </Avatar>
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-2">
              {accountData?.fullname || accountData?.fullName || "Manager"}
            </h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-600">
                <MailOutlined />
                <span>{accountData?.username || accountData?.email || "-"}</span>
              </div>
              {accountData?.phoneNumber && (
                <div className="flex items-center gap-2 text-gray-600">
                  <PhoneOutlined />
                  <span>{accountData.phoneNumber}</span>
                </div>
              )}
              <div className="mt-2">
                <Tag color="purple">MANAGER</Tag>
              </div>
            </div>
          </div>
        </div>

        <Descriptions bordered column={2}>
          <Descriptions.Item label="Tên đăng nhập">
            <span className="font-mono">{accountData?.username || "-"}</span>
          </Descriptions.Item>
          <Descriptions.Item label="Email">
            {accountData?.email || accountData?.username || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Họ và tên">
            {accountData?.fullname || accountData?.fullName || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Số điện thoại">
            {accountData?.phoneNumber || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Vai trò">
            <Tag color="purple">{accountData?.role || "MANAGER"}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag color="green">Hoạt động</Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Thông tin chi nhánh */}
      {branchData && (
        <Card title="Thông tin chi nhánh" className="shadow-sm">
          <div className="flex items-start gap-4 mb-6">
            <ShopOutlined className="text-4xl text-indigo-500" />
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-2">
                {branchData.branchName || branchData.name || "Chi nhánh"}
              </h2>
            </div>
          </div>

          <Descriptions bordered column={2}>
            <Descriptions.Item label="Tên chi nhánh">
              {branchData.branchName || branchData.name || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Địa chỉ">
              {branchData.address || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Thành phố">
              {branchData.city || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">
              {branchData.phone || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {branchData.email || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Giờ mở cửa">
              {branchData.openingTime || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Giờ đóng cửa">
              {branchData.closingTime || "-"}
            </Descriptions.Item>
            {(branchData.latitude && branchData.longitude) && (
              <Descriptions.Item label="Tọa độ">
                {branchData.latitude}, {branchData.longitude}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      )}

      {/* Thông tin nhân viên (nếu có) */}
      {staff && (
        <Card title="Thông tin nhân viên" className="shadow-sm">
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Mã nhân viên">
              {staff.id || staff.staffId || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Chức vụ">
              {staff.position || staff.role || "Manager"}
            </Descriptions.Item>
            {staff.hireDate && (
              <Descriptions.Item label="Ngày vào làm">
                {new Date(staff.hireDate).toLocaleDateString("vi-VN")}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      )}

      {/* Thông tin hệ thống */}
      <Card title="Thông tin hệ thống" className="shadow-sm">
        <Descriptions bordered column={1}>
          <Descriptions.Item label="Phiên bản">
            eMotoRent Manager v1.0
          </Descriptions.Item>
          <Descriptions.Item label="Môi trường">
            <Tag color="blue">Production</Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
}

