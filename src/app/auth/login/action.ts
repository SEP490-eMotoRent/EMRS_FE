"use server";

export async function loginAdmin(email: string, password: string) {
  // Giả lập login thành công
  if (email === "admin@gmail.com" && password === "123456") {
    return {
      success: true,
      token: "mock_admin_token",
      user: { name: "Admin", role: "admin" },
    };
  }

  return {
    success: false,
    message: "Sai tài khoản hoặc mật khẩu",
  };
}
