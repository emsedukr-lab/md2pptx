import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@md2pptx/ui"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `http://${process.env.PPTX_HOST || "localhost"}:${process.env.PPTX_PORT || "8001"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
