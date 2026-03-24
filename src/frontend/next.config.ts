import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=()" },
        ],
      },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [
        {
          source: "/api/reviews/:path*",
          destination: `${process.env.API_INTERNAL_URL || "http://localhost:5000"}/api/reviews/:path*`,
        },
        {
          source: "/api/moderation/:path*",
          destination: `${process.env.API_INTERNAL_URL || "http://localhost:5000"}/api/moderation/:path*`,
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
