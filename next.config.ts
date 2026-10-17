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
  experimental: {
    // Tắt MCP server của `next dev`: nó ghi mọi request vào .next/dev/logs/next-development.log,
    // trên Windows file này bị watcher bắt được → "Compiled" → trang tự tải lại → lại ghi log → lặp vô hạn.
    mcpServer: false,
    // Cache biên dịch của Turbopack không làm mới kết quả loader Tailwind khi globals.css đổi,
    // nên Railway (giữ .next/cache giữa các lần build) và dev server cứ dùng CSS cũ. Tắt để luôn build CSS mới.
    turbopackFileSystemCacheForBuild: false,
    turbopackFileSystemCacheForDev: false,
  },
};

export default nextConfig;
