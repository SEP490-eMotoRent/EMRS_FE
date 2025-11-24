import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // Dùng khi muốn gọi trực tiếp xuống BE (bỏ qua BFF internal routes)
        // Ví dụ: fetch("/api/raw/Vehicle/...")
        source: "/api/raw/:path*",
        destination:
          "https://emrssep490-haevbjfhdkbzhaaj.southeastasia-01.azurewebsites.net/api/:path*",
      },
    ];
  },
};

export default nextConfig;
