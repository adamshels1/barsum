import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3011"],
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [{ key: "ngrok-skip-browser-warning", value: "true" }],
      },
    ];
  },
};

export default nextConfig;
