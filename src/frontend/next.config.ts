import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' blob: data: http://localhost:10000 https://*.blob.core.windows.net",
              "font-src 'self'",
              "connect-src 'self' http://localhost:* https://*.blob.core.windows.net",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
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

export default withNextIntl(nextConfig);
