import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [
        {
          source: "/api/reviews/:path*",
          destination: `${process.env.API_INTERNAL_URL || "http://localhost:5000"}/api/reviews/:path*`,
        },
        {
          source: "/api/images/:path*",
          destination: `${process.env.API_INTERNAL_URL || "http://localhost:5000"}/api/images/:path*`,
        },
      ],
      fallback: [],
    };
  },
};

export default nextConfig;
