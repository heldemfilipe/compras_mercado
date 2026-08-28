import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Server Actions body limit — recibos/listas grandes
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
