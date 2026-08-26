import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/**": ["./prisma/dev.db"],
  },
  experimental: {
    serverActions: {
      // Uploads de logo/capa/PDF via FormData (default 1mb → 500/413)
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
