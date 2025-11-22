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
      
      // Ưu tiên đọc từ cookie (đã set khi login)
      if (typeof document !== "undefined") {
        const cookieStr = document.cookie || "";
        const cookies: Record<string, string> = {};
        cookieStr.split(";").forEach((c) => {
          const [key, value] = c.trim().split("=");
          if (key && value) {
            cookies[key] = decodeURIComponent(value);
          }
        });

        // Tạo account data từ cookie (ưu tiên cookie vì đây là dữ liệu từ login)
        const accountFromCookie = {
          fullName: cookies.fullName || "",
          username: cookies.username || "",
          role: cookies.role || "MANAGER",
          id: cookies.userId || "",
        };
        
        console.log("Account from cookie:", accountFromCookie);
        
        if (accountFromCookie.fullName || accountFromCookie.username) {
          setAccountData(accountFromCookie);
        }
      }
      
      // Lấy thông tin tài khoản từ API để bổ sung (nhưng không override username từ cookie)
      try {
        const accountRes = await fetch("/api/account", { cache: "no-store" });
        if (accountRes.ok) {
          const accountJson = await accountRes.json();
          const raw = accountJson.data ?? accountJson;
          const accArray = Array.isArray(raw) ? raw : [raw];
          const managerAcc = accArray.find((a: any) => a.role === "MANAGER") || accArray[0] || {};
          
          // Merge với dữ liệu từ cookie, nhưng ưu tiên username và fullName từ cookie (từ login)
          setAccountData((prev: any) => {
            // Ưu tiên cookie (từ login response) cho username và fullName
            // Chỉ dùng API data nếu cookie không có
            const merged = {
              ...prev,
              ...managerAcc,
              // Luôn ưu tiên cookie trước (từ login response) - không override nếu đã có
              username: (prev?.username && prev.username !== "") ? prev.username : (managerAcc.username || ""),
              fullName: (prev?.fullName && prev.fullName !== "") ? prev.fullName : (managerAcc.fullName || ""),
              // Các field khác lấy từ API
              phoneNumber: managerAcc.phoneNumber || prev?.phoneNumber,
              email: managerAcc.email || managerAcc.username || prev?.email || prev?.username,
            };
            console.log("Merged account data:", merged);
            return merged;
          });
        }
      } catch (err) {
        console.warn("Could not fetch account from API:", err);
      }

      // Lấy thông tin chi nhánh
      const branchRes = await fetch("/api/manager/dashboard", { cache: "no-store" });
      if (branchRes.ok) {
        const branchJson = await branchRes.json();
        if (branchJson.success && branchJson.data?.branch) {
          setBranchData(branchJson.data.branch);
        }
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
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Cài đặt</h1>

      {/* Thông tin tài khoản */}
      <Card title="Thông tin tài khoản" className="shadow-sm">
        <div className="flex items-start gap-6 mb-6">
          <Avatar
            size={80}
            icon={<UserOutlined />}
            className="bg-indigo-500"
          >
            {accountData?.fullName?.charAt(0)?.toUpperCase() || "M"}
          </Avatar>
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-2">
              {accountData?.fullName || "Manager"}
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
            {accountData?.fullName || "-"}
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

