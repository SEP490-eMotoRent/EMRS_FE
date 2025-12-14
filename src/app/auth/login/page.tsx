"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Lock, Loader2 } from "lucide-react";

// Hàm chuyển đổi thông báo lỗi từ BE sang tiếng Việt
function translateErrorMessage(message: string): string {
  if (!message) return "Đã xảy ra lỗi";
  
  const messageLower = message.toLowerCase();
  
  // Map các thông báo lỗi phổ biến
  const errorMap: Record<string, string> = {
    "invalid username or password": "Sai tên đăng nhập hoặc mật khẩu",
    "invalid username": "Sai tên đăng nhập",
    "invalid password": "Sai mật khẩu",
    "username or password is incorrect": "Tên đăng nhập hoặc mật khẩu không đúng",
    "username not found": "Không tìm thấy tên đăng nhập",
    "password incorrect": "Mật khẩu không đúng",
    "account is locked": "Tài khoản đã bị khóa",
    "account is disabled": "Tài khoản đã bị vô hiệu hóa",
    "unauthorized": "Không có quyền truy cập",
    "forbidden": "Bị cấm truy cập",
    "internal server error": "Lỗi máy chủ, vui lòng thử lại sau",
    "network error": "Lỗi kết nối, vui lòng kiểm tra mạng",
    "timeout": "Hết thời gian chờ, vui lòng thử lại",
  };
  
  // Tìm trong map
  for (const [key, value] of Object.entries(errorMap)) {
    if (messageLower.includes(key)) {
      return value;
    }
  }
  
  // Nếu không tìm thấy, trả về message gốc (có thể đã là tiếng Việt)
  return message;
}

export default function LoginPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Chặn quay lại sau khi đăng xuất
  useEffect(() => {
    // Xóa tất cả cookies và session storage khi vào trang login
    // Đảm bảo không còn dữ liệu từ session trước
    if (typeof window !== "undefined") {
      // Clear session storage
      sessionStorage.clear();
      
      // Đảm bảo không có token trong cookies
      document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "emoto_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      
      // Thay thế history entry để không cho phép quay lại
      window.history.replaceState(null, "", window.location.href);
    }
  }, []);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);
    const username = formData.get("username");
    const password = formData.get("password");

    if (!username || !password) {
      setErrorMsg("Vui lòng nhập đầy đủ thông tin đăng nhập");
      setLoading(false);
      return;
    }

    try {
      // Gọi thẳng vào BE (giống Swagger)
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "https://emrssep490-haevbjfhdkbzhaaj.southeastasia-01.azurewebsites.net/api";

      const res = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        const errorMessage = json.message || "Sai tài khoản hoặc mật khẩu";
        setErrorMsg(translateErrorMessage(errorMessage));
        setLoading(false);
        return;
      }

      const { accessToken, user } = json.data;

      // Log user info để debug
      console.log("Login user data:", user);
      console.log("BranchId:", user.branchId);
      console.log("BranchName:", user.branchName);

      // Tự set cookie phía client để middleware đọc được
      const expires = new Date();
      expires.setDate(expires.getDate() + 7); // 7 ngày
      
      // Lấy branchId từ nhiều nguồn có thể
      const branchId = user.branchId || user.staff?.branchId || user.staff?.branch?.id || "";
      const branchName = user.branchName || user.staff?.branchName || user.staff?.branch?.branchName || "";
      const staffId = user.staffId || user.staff?.id || "";
      
      document.cookie = `token=${accessToken}; path=/; expires=${expires.toUTCString()}`;
      document.cookie = `role=${user.role ?? ""}; path=/; expires=${expires.toUTCString()}`;
      document.cookie = `fullName=${encodeURIComponent(
        user.fullName ?? ""
      )}; path=/; expires=${expires.toUTCString()}`;
      document.cookie = `username=${encodeURIComponent(
        user.username ?? ""
      )}; path=/; expires=${expires.toUTCString()}`;
      document.cookie = `userId=${user.id ?? ""}; path=/; expires=${expires.toUTCString()}`;
      document.cookie = `branchId=${branchId}; path=/; expires=${expires.toUTCString()}`;
      document.cookie = `branchName=${encodeURIComponent(
        branchName
      )}; path=/; expires=${expires.toUTCString()}`;
      document.cookie = `staffId=${staffId}; path=/; expires=${expires.toUTCString()}`;
      
      console.log("Cookies set - branchId:", branchId, "branchName:", branchName);

      const role = (user.role ?? "").toUpperCase();

      switch (role) {
        case "ADMIN":
          router.push("/dashboard/admin");
          break;
        case "MANAGER":
          router.push("/dashboard/manager");
          break;
        case "TECHNICIAN":
          router.push("/dashboard/technician");
          break;
        default:
          setErrorMsg("Tài khoản không có quyền truy cập");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Đã xảy ra lỗi, thử lại sau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Electric Bike Background - Multiple positions */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.08]">
          <img 
            src="/electric-bike.svg" 
            alt="Electric Bike" 
            className="w-full h-full object-contain max-w-5xl"
            style={{ filter: 'blur(2px)' }}
          />
        </div>
        
        {/* Additional bike silhouettes for pattern */}
        <div className="absolute top-20 left-10 opacity-[0.05] transform -rotate-12">
          <img 
            src="/electric-bike.svg" 
            alt="Electric Bike" 
            className="w-64 h-48"
            style={{ filter: 'blur(1px)' }}
          />
        </div>
        <div className="absolute bottom-20 right-10 opacity-[0.05] transform rotate-12">
          <img 
            src="/electric-bike.svg" 
            alt="Electric Bike" 
            className="w-64 h-48"
            style={{ filter: 'blur(1px)' }}
          />
        </div>
        
        {/* Animated blobs */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 w-full max-w-md px-4 sm:px-6">
        <form
          onSubmit={handleLogin}
          className="bg-white/80 backdrop-blur-lg shadow-2xl p-6 sm:p-8 rounded-2xl border border-white/20 flex flex-col gap-4 sm:gap-6"
        >
          {/* Logo/Title Section */}
          <div className="text-center mb-2">
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl mb-3 sm:mb-4 shadow-lg">
              <span className="text-white text-xl sm:text-2xl font-bold">eM</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
              eMotoRent
            </h1>
            <p className="text-gray-500 text-xs sm:text-sm mt-2">Hệ thống quản lý cho thuê xe điện</p>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">Đăng nhập</h2>
            <p className="text-xs sm:text-sm text-gray-500">Vui lòng nhập thông tin để tiếp tục</p>
          </div>

          {/* Username Input */}
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium text-gray-700">
              Tên đăng nhập
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="username"
                name="username"
                type="text"
                placeholder="Nhập tên đăng nhập"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 bg-white"
                autoComplete="username"
                disabled={loading}
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              Mật khẩu
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Nhập mật khẩu"
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 bg-white"
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                disabled={loading}
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0L3 3m3.29 3.29L12 12m0 0l5.71 5.71M12 12l-5.71-5.71M12 12l5.71 5.71" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            disabled={loading}
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Đang đăng nhập...</span>
              </>
            ) : (
              <span>Đăng nhập</span>
            )}
          </button>

          {/* Footer */}
          <p className="text-center text-xs text-gray-500 mt-2">
            © 2025 eMotoRent. All rights reserved.
          </p>
        </form>
      </div>
    </div>
  );
}
