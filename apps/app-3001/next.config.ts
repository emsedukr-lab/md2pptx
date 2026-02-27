import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@md2pptx/ui"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8001/api/:path*",
      },
    ];
  },
};

export default nextConfig;
