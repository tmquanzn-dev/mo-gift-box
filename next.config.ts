import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    // Ảnh QR chuyển khoản lấy từ dịch vụ VietQR
    remotePatterns: [{ protocol: "https", hostname: "img.vietqr.io" }],
  },
  poweredByHeader: false,
};

export default nextConfig;
