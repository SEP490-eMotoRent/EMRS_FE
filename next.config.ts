import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*", // pattern cho route local
        destination:
          "https://emrssep490-haevbjfhdkbzhaaj.southeastasia-01.azurewebsites.net/api/:path*", // backend thật
      },
    ];
  },
};

export default nextConfig;
