import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.minio.io",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "syrup.protoxzoan.xyz",
        pathname: "/**",
      },
    ],
  },
  // Suppress hydration warnings in dev (for Privy)
  reactStrictMode: true,
};

export default nextConfig;
